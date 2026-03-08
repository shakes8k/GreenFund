// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title RiskPoolManager
 * @notice On-chain representation of risk pools. Investors deposit USDC into a pool;
 *         the AI rebalancer (REBALANCER_ROLE) adjusts allocation weights and the
 *         manager routes funds to startup MilestoneVaults accordingly.
 */
contract RiskPoolManager is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant REBALANCER_ROLE = keccak256("REBALANCER_ROLE");
    bytes32 public constant MANAGER_ROLE    = keccak256("MANAGER_ROLE");

    IERC20 public immutable usdc;

    struct Pool {
        string  name;
        uint256 totalValueLocked;
        uint256 minInvestment;
        bool    active;
        bytes32[] startupIds;
        mapping(bytes32 => uint256) weights; // startupId => weight in basis points (10000 = 100%)
    }

    struct InvestorPosition {
        uint256 amountDeposited;
        uint256 lpShares;       // proportional ownership
        uint256 depositedAt;
    }

    mapping(bytes32 => Pool) private pools;
    mapping(bytes32 => uint256) public poolTotalShares;
    // poolId => investor => position
    mapping(bytes32 => mapping(address => InvestorPosition)) public positions;

    bytes32[] public poolIds;

    event PoolCreated(bytes32 indexed poolId, string name, uint256 minInvestment);
    event Invested(bytes32 indexed poolId, address indexed investor, uint256 amount, uint256 shares);
    event Rebalanced(bytes32 indexed poolId, bytes32[] startupIds, uint256[] weights);
    event FundsRouted(bytes32 indexed poolId, bytes32 indexed startupId, uint256 amount);

    constructor(address _usdc, address admin) {
        usdc = IERC20(_usdc);
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MANAGER_ROLE, admin);
    }

    function createPool(
        bytes32 poolId,
        string calldata name,
        uint256 minInvestment
    ) external onlyRole(MANAGER_ROLE) {
        require(!pools[poolId].active, "Pool: already exists");
        Pool storage p = pools[poolId];
        p.name = name;
        p.minInvestment = minInvestment;
        p.active = true;
        poolIds.push(poolId);
        emit PoolCreated(poolId, name, minInvestment);
    }

    function invest(bytes32 poolId, uint256 amount) external nonReentrant {
        Pool storage p = pools[poolId];
        require(p.active, "Pool: not active");
        require(amount >= p.minInvestment, "Pool: below minimum");

        usdc.safeTransferFrom(msg.sender, address(this), amount);

        // Calculate LP shares (1:1 on first deposit, proportional thereafter)
        uint256 totalShares = poolTotalShares[poolId];
        uint256 shares;
        if (totalShares == 0 || p.totalValueLocked == 0) {
            shares = amount;
        } else {
            shares = (amount * totalShares) / p.totalValueLocked;
        }

        p.totalValueLocked += amount;
        poolTotalShares[poolId] += shares;

        InvestorPosition storage pos = positions[poolId][msg.sender];
        pos.amountDeposited += amount;
        pos.lpShares += shares;
        if (pos.depositedAt == 0) pos.depositedAt = block.timestamp;

        emit Invested(poolId, msg.sender, amount, shares);
    }

    /**
     * @notice AI rebalancer updates allocation weights for startups in a pool.
     * @param weightsBps  Weights in basis points; must sum to 10000.
     */
    function rebalance(
        bytes32 poolId,
        bytes32[] calldata startupIds,
        uint256[] calldata weightsBps
    ) external onlyRole(REBALANCER_ROLE) {
        require(startupIds.length == weightsBps.length, "Pool: length mismatch");

        uint256 total;
        for (uint256 i = 0; i < weightsBps.length; i++) {
            total += weightsBps[i];
        }
        require(total == 10_000, "Pool: weights must sum to 10000 bps");

        Pool storage p = pools[poolId];
        // Clear existing startup list
        for (uint256 i = 0; i < p.startupIds.length; i++) {
            p.weights[p.startupIds[i]] = 0;
        }
        delete p.startupIds;

        for (uint256 i = 0; i < startupIds.length; i++) {
            p.startupIds.push(startupIds[i]);
            p.weights[startupIds[i]] = weightsBps[i];
        }

        emit Rebalanced(poolId, startupIds, weightsBps);
    }

    function getPoolStartups(bytes32 poolId) external view returns (bytes32[] memory) {
        return pools[poolId].startupIds;
    }

    function getWeight(bytes32 poolId, bytes32 startupId) external view returns (uint256) {
        return pools[poolId].weights[startupId];
    }

    function getPoolTVL(bytes32 poolId) external view returns (uint256) {
        return pools[poolId].totalValueLocked;
    }
}
