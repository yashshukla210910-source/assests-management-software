// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/extensions/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title IdentityRegistry
 * @notice Registers, updates, and revokes Decentralized Identifiers (DIDs).
 *         UUPS upgradeable. All DID operations are admin-restricted.
 */
contract IdentityRegistry is Initializable, AccessControlEnumerableUpgradeable, UUPSUpgradeable {
    bytes32 public constant ADMIN_ROLE   = keccak256("ADMIN_ROLE");
    bytes32 public constant BACKEND_ROLE = keccak256("BACKEND_ROLE");

    enum IdentityStatus { Active, Suspended, Revoked }

    struct Identity {
        address owner;
        bytes32 metadataHash;
        IdentityStatus status;
        uint256 createdAt;
        uint256 updatedAt;
    }

    mapping(string => Identity) private identities;
    mapping(address => string)  private addressToDID;
    mapping(string => bool)     private registeredDIDs;

    // --- Events ---
    event IdentityRegistered(string indexed did, address indexed owner, bytes32 metadataHash, uint256 timestamp);
    event IdentityUpdated(string indexed did, bytes32 newMetadataHash, uint256 timestamp);
    event IdentitySuspended(string indexed did, uint256 timestamp);
    event IdentityReactivated(string indexed did, uint256 timestamp);
    event IdentityRevoked(string indexed did, uint256 timestamp);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() { _disableInitializers(); }

    function initialize(address admin) public initializer {
        __AccessControlEnumerable_init();

        require(admin != address(0), "IdentityRegistry: zero address");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(BACKEND_ROLE, admin);
    }

    function registerIdentity(
        string calldata did,
        address owner,
        bytes32 metadataHash
    ) external onlyRole(ADMIN_ROLE) {
        require(bytes(did).length > 0 && bytes(did).length <= 256, "IdentityRegistry: invalid DID length");
        require(owner != address(0), "IdentityRegistry: zero address");
        require(metadataHash != bytes32(0), "IdentityRegistry: zero hash");
        require(!registeredDIDs[did], "IdentityRegistry: DID already registered");
        require(bytes(addressToDID[owner]).length == 0, "IdentityRegistry: address already has DID");

        identities[did] = Identity({
            owner: owner,
            metadataHash: metadataHash,
            status: IdentityStatus.Active,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });
        addressToDID[owner] = did;
        registeredDIDs[did] = true;

        emit IdentityRegistered(did, owner, metadataHash, block.timestamp);
    }

    function updateIdentityMetadata(
        string calldata did,
        bytes32 newMetadataHash
    ) external {
        require(registeredDIDs[did], "IdentityRegistry: DID not found");
        require(identities[did].status != IdentityStatus.Revoked, "IdentityRegistry: identity is revoked");
        require(
            hasRole(ADMIN_ROLE, msg.sender) || msg.sender == identities[did].owner,
            "IdentityRegistry: not authorized"
        );
        identities[did].metadataHash = newMetadataHash;
        identities[did].updatedAt = block.timestamp;
        emit IdentityUpdated(did, newMetadataHash, block.timestamp);
    }

    function suspendIdentity(string calldata did) external onlyRole(ADMIN_ROLE) {
        require(registeredDIDs[did], "IdentityRegistry: DID not found");
        require(identities[did].status == IdentityStatus.Active, "IdentityRegistry: not active");
        identities[did].status = IdentityStatus.Suspended;
        identities[did].updatedAt = block.timestamp;
        emit IdentitySuspended(did, block.timestamp);
    }

    function reactivateIdentity(string calldata did) external onlyRole(ADMIN_ROLE) {
        require(registeredDIDs[did], "IdentityRegistry: DID not found");
        require(identities[did].status == IdentityStatus.Suspended, "IdentityRegistry: not suspended");
        identities[did].status = IdentityStatus.Active;
        identities[did].updatedAt = block.timestamp;
        emit IdentityReactivated(did, block.timestamp);
    }

    function revokeIdentity(string calldata did) external onlyRole(ADMIN_ROLE) {
        require(registeredDIDs[did], "IdentityRegistry: DID not found");
        require(identities[did].status != IdentityStatus.Revoked, "IdentityRegistry: already revoked");
        identities[did].status = IdentityStatus.Revoked;
        identities[did].updatedAt = block.timestamp;
        emit IdentityRevoked(did, block.timestamp);
    }

    // --- Views ---
    function getIdentity(string calldata did) external view returns (Identity memory) {
        require(registeredDIDs[did], "IdentityRegistry: DID not found");
        return identities[did];
    }

    function isIdentityActive(string calldata did) external view returns (bool) {
        return registeredDIDs[did] && identities[did].status == IdentityStatus.Active;
    }

    function getAddressForDID(string calldata did) external view returns (address) {
        require(registeredDIDs[did], "IdentityRegistry: DID not found");
        return identities[did].owner;
    }

    function getDIDForAddress(address owner) external view returns (string memory) {
        return addressToDID[owner];
    }

    function isDIDRegistered(string calldata did) external view returns (bool) {
        return registeredDIDs[did];
    }

    // --- UUPS ---
    function _authorizeUpgrade(address) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
}
