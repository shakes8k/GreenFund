// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MilestoneVault
 * @notice Holds investor funds in escrow and releases them when IoT oracles
 *         confirm physical milestone completion (satellite imagery, sensor data).
 *         The ORACLE_ROLE is granted to Chainlink oracle contracts that push
 *         verified off-chain data on-chain.
 */
contract MilestoneVault is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant ORACLE_ROLE  = keccak256("ORACLE_ROLE");
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    IERC20 public immutable usdc;

    enum MilestoneStatus { Pending, InProgress, OracleVerifying, Completed, Failed, Disputed }

    struct Milestone {
        bytes32   startupId;      // off-chain cuid hash
        address   startupWallet;  // recipient on completion
        uint256   fundAmount;     // USDC (6 decimals)
        uint256   targetDeadline;
        MilestoneStatus status;
        string    verificationCID; // IPFS CID of oracle evidence
        uint256   completedAt;
    }

    mapping(bytes32 => Milestone) public milestones;   // milestoneId => Milestone
    mapping(bytes32 => uint256)   public startupEscrow; // startupId => total USDC locked

    event MilestoneCreated(bytes32 indexed milestoneId, bytes32 indexed startupId, uint256 amount);
    event MilestoneStarted(bytes32 indexed milestoneId);
    event OracleVerificationRequested(bytes32 indexed milestoneId);
    event MilestoneCompleted(bytes32 indexed milestoneId, uint256 releasedAmount);
    event MilestoneFailed(bytes32 indexed milestoneId);
    event MilestoneDisputed(bytes32 indexed milestoneId);
    event FundsDeposited(bytes32 indexed startupId, uint256 amount);

    constructor(address _usdc, address admin) {
        usdc = IERC20(_usdc);
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MANAGER_ROLE, admin);
    }

    // ─── Funding ──────────────────────────────────────────────────────────────

    /**
     * @notice Investors deposit USDC which is locked until milestones complete.
     */
    function depositForStartup(bytes32 startupId, uint256 amount) external nonReentrant {
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        startupEscrow[startupId] += amount;
        emit FundsDeposited(startupId, amount);
    }

    // ─── Milestone Lifecycle ──────────────────────────────────────────────────

    function createMilestone(
        bytes32 milestoneId,
        bytes32 startupId,
        address startupWallet,
        uint256 fundAmount,
        uint256 targetDeadline
    ) external onlyRole(MANAGER_ROLE) {
        require(milestones[milestoneId].startupWallet == address(0), "Vault: milestone exists");
        require(startupEscrow[startupId] >= fundAmount, "Vault: insufficient escrow");

        startupEscrow[startupId] -= fundAmount;

        milestones[milestoneId] = Milestone({
            startupId: startupId,
            startupWallet: startupWallet,
            fundAmount: fundAmount,
            targetDeadline: targetDeadline,
            status: MilestoneStatus.Pending,
            verificationCID: "",
            completedAt: 0
        });

        emit MilestoneCreated(milestoneId, startupId, fundAmount);
    }

    function startMilestone(bytes32 milestoneId) external onlyRole(MANAGER_ROLE) {
        Milestone storage m = milestones[milestoneId];
        require(m.status == MilestoneStatus.Pending, "Vault: not pending");
        m.status = MilestoneStatus.InProgress;
        emit MilestoneStarted(milestoneId);
    }

    function requestOracleVerification(bytes32 milestoneId) external onlyRole(MANAGER_ROLE) {
        Milestone storage m = milestones[milestoneId];
        require(m.status == MilestoneStatus.InProgress, "Vault: not in progress");
        m.status = MilestoneStatus.OracleVerifying;
        emit OracleVerificationRequested(milestoneId);
    }

    /**
     * @notice Called by the Chainlink oracle contract after off-chain verification.
     * @param milestoneId  The milestone being verified.
     * @param verified     Whether physical conditions are met.
     * @param evidenceCID  IPFS CID of verification evidence bundle.
     */
    function oracleCallback(
        bytes32 milestoneId,
        bool    verified,
        string calldata evidenceCID
    ) external onlyRole(ORACLE_ROLE) nonReentrant {
        Milestone storage m = milestones[milestoneId];
        require(m.status == MilestoneStatus.OracleVerifying, "Vault: not awaiting oracle");

        m.verificationCID = evidenceCID;

        if (verified) {
            m.status = MilestoneStatus.Completed;
            m.completedAt = block.timestamp;
            usdc.safeTransfer(m.startupWallet, m.fundAmount);
            emit MilestoneCompleted(milestoneId, m.fundAmount);
        } else {
            m.status = MilestoneStatus.Failed;
            // Return funds to escrow for re-allocation
            startupEscrow[m.startupId] += m.fundAmount;
            emit MilestoneFailed(milestoneId);
        }
    }

    function disputeMilestone(bytes32 milestoneId) external onlyRole(MANAGER_ROLE) {
        Milestone storage m = milestones[milestoneId];
        require(
            m.status == MilestoneStatus.OracleVerifying || m.status == MilestoneStatus.Failed,
            "Vault: not disputable"
        );
        m.status = MilestoneStatus.Disputed;
        emit MilestoneDisputed(milestoneId);
    }
}
