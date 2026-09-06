// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title AuditRegistry
 * @notice Immutable on-chain anchor for off-chain audit event Merkle roots.
 *         Non-upgradeable by design — maximum integrity trust.
 *         Only the backend wallet (set at deploy) can anchor batches.
 */
contract AuditRegistry {
    address public immutable backendWallet;

    struct AnchorRecord {
        address anchoredBy;
        uint256 timestamp;
        uint256 batchSize;
        uint256 fromSequence;
        uint256 toSequence;
        bool exists;
    }

    mapping(bytes32 => AnchorRecord) private anchors;
    bytes32[] private anchorHistory;
    uint256 private totalAnchored;

    event BatchAnchored(
        bytes32 indexed merkleRoot,
        address indexed anchoredBy,
        uint256 timestamp,
        uint256 batchSize,
        uint256 fromSequence,
        uint256 toSequence
    );

    modifier onlyBackend() {
        require(msg.sender == backendWallet, "AuditRegistry: caller is not backend");
        _;
    }

    constructor(address _backendWallet) {
        require(_backendWallet != address(0), "AuditRegistry: zero address");
        backendWallet = _backendWallet;
    }

    function anchorBatch(
        bytes32 merkleRoot,
        uint256 batchSize,
        uint256 fromSequence,
        uint256 toSequence
    ) external onlyBackend {
        require(!anchors[merkleRoot].exists, "AuditRegistry: root already anchored");
        require(batchSize > 0, "AuditRegistry: empty batch");

        anchors[merkleRoot] = AnchorRecord({
            anchoredBy: msg.sender,
            timestamp: block.timestamp,
            batchSize: batchSize,
            fromSequence: fromSequence,
            toSequence: toSequence,
            exists: true
        });
        anchorHistory.push(merkleRoot);
        totalAnchored += batchSize;

        emit BatchAnchored(merkleRoot, msg.sender, block.timestamp, batchSize, fromSequence, toSequence);
    }

    function verifyAnchor(bytes32 merkleRoot) external view returns (
        bool exists,
        uint256 timestamp,
        address anchoredBy,
        uint256 batchSize,
        uint256 fromSequence,
        uint256 toSequence
    ) {
        AnchorRecord memory r = anchors[merkleRoot];
        return (r.exists, r.timestamp, r.anchoredBy, r.batchSize, r.fromSequence, r.toSequence);
    }

    function getAnchorHistory() external view returns (bytes32[] memory) {
        return anchorHistory;
    }

    function getAnchorCount() external view returns (uint256) {
        return anchorHistory.length;
    }

    function getTotalAnchored() external view returns (uint256) {
        return totalAnchored;
    }
}
