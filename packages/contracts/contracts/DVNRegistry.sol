// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./GreenFundToken.sol";

/**
 * @title DVNRegistry
 * @notice Manages the Decentralized Verification Network.
 *         Experts stake GFT to submit assessments. Incorrect assessments
 *         result in slashing; correct ones earn rewards.
 */
contract DVNRegistry is AccessControl, ReentrancyGuard {
    bytes32 public constant RESOLVER_ROLE = keccak256("RESOLVER_ROLE");

    GreenFundToken public immutable token;

    uint256 public constant MIN_STAKE = 100 * 10 ** 18;       // 100 GFT
    uint256 public constant CHALLENGE_PERIOD = 7 days;
    uint256 public constant SLASH_PERCENTAGE = 30;             // 30% of staked amount
    uint256 public constant REWARD_PERCENTAGE = 10;            // 10% bonus on stake

    enum Verdict { Approved, Rejected, NeedsRevision }

    struct Assessment {
        address expert;
        bytes32 startupId;       // off-chain ID hash
        Verdict verdict;
        uint8   confidenceScore; // 0-100
        string  reportCID;       // IPFS content hash
        uint256 stakedAmount;
        uint256 challengeDeadline;
        bool    resolved;
        bool    slashed;
    }

    struct Expert {
        uint256 stakedTokens;
        uint256 reputationScore;   // 0-100 (stored as fixed-point *100 internally)
        uint256 totalAssessments;
        uint256 slashedCount;
        bool    registered;
    }

    mapping(address => Expert)        public experts;
    mapping(bytes32 => Assessment)    public assessments;  // assessmentId => Assessment
    mapping(bytes32 => bytes32[])     public startupAssessments; // startupId => assessmentIds

    event ExpertRegistered(address indexed expert, uint256 stakedAmount);
    event AssessmentSubmitted(bytes32 indexed assessmentId, address indexed expert, bytes32 startupId);
    event AssessmentResolved(bytes32 indexed assessmentId, bool slashed, uint256 reward);
    event ExpertSlashed(address indexed expert, uint256 amount);

    constructor(address _token, address admin) {
        token = GreenFundToken(_token);
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(RESOLVER_ROLE, admin);
    }

    // ─── Expert Management ────────────────────────────────────────────────────

    function register(uint256 stakeAmount) external nonReentrant {
        require(stakeAmount >= MIN_STAKE, "DVN: below minimum stake");
        require(!experts[msg.sender].registered, "DVN: already registered");

        token.transferFrom(msg.sender, address(this), stakeAmount);

        experts[msg.sender] = Expert({
            stakedTokens: stakeAmount,
            reputationScore: 50,
            totalAssessments: 0,
            slashedCount: 0,
            registered: true
        });

        emit ExpertRegistered(msg.sender, stakeAmount);
    }

    function addStake(uint256 amount) external nonReentrant {
        require(experts[msg.sender].registered, "DVN: not registered");
        token.transferFrom(msg.sender, address(this), amount);
        experts[msg.sender].stakedTokens += amount;
    }

    // ─── Assessment Submission ────────────────────────────────────────────────

    function submitAssessment(
        bytes32 assessmentId,
        bytes32 startupId,
        Verdict verdict,
        uint8   confidenceScore,
        string calldata reportCID,
        uint256 stakeForAssessment
    ) external nonReentrant {
        require(experts[msg.sender].registered, "DVN: not registered");
        require(stakeForAssessment <= experts[msg.sender].stakedTokens, "DVN: insufficient stake");
        require(confidenceScore <= 100, "DVN: invalid confidence score");
        require(assessments[assessmentId].expert == address(0), "DVN: assessment exists");

        experts[msg.sender].stakedTokens -= stakeForAssessment;

        assessments[assessmentId] = Assessment({
            expert: msg.sender,
            startupId: startupId,
            verdict: verdict,
            confidenceScore: confidenceScore,
            reportCID: reportCID,
            stakedAmount: stakeForAssessment,
            challengeDeadline: block.timestamp + CHALLENGE_PERIOD,
            resolved: false,
            slashed: false
        });

        startupAssessments[startupId].push(assessmentId);
        experts[msg.sender].totalAssessments++;

        emit AssessmentSubmitted(assessmentId, msg.sender, startupId);
    }

    // ─── Resolution (called by RESOLVER_ROLE after challenge period) ──────────

    function resolveAssessment(bytes32 assessmentId, bool correct) external onlyRole(RESOLVER_ROLE) nonReentrant {
        Assessment storage a = assessments[assessmentId];
        require(!a.resolved, "DVN: already resolved");
        require(block.timestamp >= a.challengeDeadline, "DVN: challenge period active");

        Expert storage expert = experts[a.expert];
        a.resolved = true;

        if (correct) {
            uint256 reward = (a.stakedAmount * REWARD_PERCENTAGE) / 100;
            expert.stakedTokens += a.stakedAmount + reward;
            // Increase reputation (capped at 100*100)
            if (expert.reputationScore < 9900) {
                expert.reputationScore += 100;
            }
            token.mint(a.expert, reward);
            emit AssessmentResolved(assessmentId, false, reward);
        } else {
            uint256 slashAmount = (a.stakedAmount * SLASH_PERCENTAGE) / 100;
            a.slashed = true;
            expert.slashedCount++;
            if (expert.reputationScore >= 300) {
                expert.reputationScore -= 300;
            } else {
                expert.reputationScore = 0;
            }
            // Remainder returned to expert
            expert.stakedTokens += a.stakedAmount - slashAmount;
            token.burn(slashAmount);
            emit ExpertSlashed(a.expert, slashAmount);
            emit AssessmentResolved(assessmentId, true, 0);
        }
    }

    function getStartupAssessments(bytes32 startupId) external view returns (bytes32[] memory) {
        return startupAssessments[startupId];
    }
}
