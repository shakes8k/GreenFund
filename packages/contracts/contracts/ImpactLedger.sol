// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title ImpactLedger
 * @notice Append-only on-chain record of verified environmental impact.
 *         Written by REPORTER_ROLE (trusted backend after DVN verification).
 *         Queryable by anyone for the public impact dashboard.
 */
contract ImpactLedger is AccessControl {
    bytes32 public constant REPORTER_ROLE = keccak256("REPORTER_ROLE");

    struct ImpactEntry {
        bytes32  startupId;
        uint256  co2ReducedKg;      // stored in kg for precision
        uint32   jobsCreated;
        uint8[]  sdgGoals;          // UN SDG 1-17
        string   reportingPeriod;   // "YYYY-MM"
        string   evidenceCID;       // IPFS bundle
        uint256  recordedAt;
    }

    ImpactEntry[] public entries;

    // Aggregate counters (updated on each entry)
    uint256 public totalCO2ReducedKg;
    uint256 public totalJobsCreated;

    event ImpactRecorded(
        uint256 indexed entryIndex,
        bytes32 indexed startupId,
        uint256 co2ReducedKg,
        uint32  jobsCreated,
        string  reportingPeriod
    );

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(REPORTER_ROLE, admin);
    }

    function recordImpact(
        bytes32 startupId,
        uint256 co2ReducedKg,
        uint32  jobsCreated,
        uint8[] calldata sdgGoals,
        string calldata reportingPeriod,
        string calldata evidenceCID
    ) external onlyRole(REPORTER_ROLE) {
        entries.push(ImpactEntry({
            startupId: startupId,
            co2ReducedKg: co2ReducedKg,
            jobsCreated: jobsCreated,
            sdgGoals: sdgGoals,
            reportingPeriod: reportingPeriod,
            evidenceCID: evidenceCID,
            recordedAt: block.timestamp
        }));

        totalCO2ReducedKg += co2ReducedKg;
        totalJobsCreated  += jobsCreated;

        emit ImpactRecorded(entries.length - 1, startupId, co2ReducedKg, jobsCreated, reportingPeriod);
    }

    function getEntry(uint256 index) external view returns (ImpactEntry memory) {
        return entries[index];
    }

    function totalEntries() external view returns (uint256) {
        return entries.length;
    }
}
