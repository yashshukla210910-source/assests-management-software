// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/extensions/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title AssetRegistry
 * @notice ERC-721 based enterprise asset registry with platform-controlled transfers.
 *         NFTs are minted to the contract itself (platform custody).
 *         All standard ERC-721 transfer/approval functions are BLOCKED.
 *         Logical ownership is tracked via ownerDID field.
 */
contract AssetRegistry is
    Initializable,
    ERC721URIStorageUpgradeable,
    AccessControlEnumerableUpgradeable,
    UUPSUpgradeable,
    IERC721Receiver
{
    bytes32 public constant ADMIN_ROLE   = keccak256("ADMIN_ROLE");
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    bytes32 public constant BACKEND_ROLE = keccak256("BACKEND_ROLE");

    enum AssetStatus { Active, Revoked, Burned }

    struct AssetRecord {
        string ownerDID;
        bytes32 metadataHash;
        AssetStatus status;
        uint256 mintedAt;
        uint256 updatedAt;
    }

    uint256 private _tokenIdCounter;
    mapping(uint256 => AssetRecord) private _assetRecords;

    // --- Events ---
    event AssetMinted(uint256 indexed tokenId, string ownerDID, address indexed custodian, bytes32 metadataHash, uint256 timestamp);
    event AssetTransferred(uint256 indexed tokenId, string indexed fromDID, string indexed toDID, uint256 timestamp);
    event AssetRevoked(uint256 indexed tokenId, uint256 timestamp);
    event AssetBurned(uint256 indexed tokenId, uint256 timestamp);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() { _disableInitializers(); }

    function initialize(address admin) public initializer {
        __ERC721_init("DecentraVault Asset", "DVA");
        __ERC721URIStorage_init();
        __AccessControlEnumerable_init();

        require(admin != address(0), "AssetRegistry: zero address");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(MANAGER_ROLE, admin);
        _grantRole(BACKEND_ROLE, admin);
    }

    function mintAsset(
        string calldata ownerDID,
        bytes32 metadataHash,
        string calldata tokenURIStr
    ) external onlyRole(ADMIN_ROLE) returns (uint256) {
        require(bytes(ownerDID).length > 0, "AssetRegistry: empty ownerDID");
        require(metadataHash != bytes32(0), "AssetRegistry: zero hash");

        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;

        _safeMint(address(this), tokenId);
        if (bytes(tokenURIStr).length > 0) {
            _setTokenURI(tokenId, tokenURIStr);
        }

        _assetRecords[tokenId] = AssetRecord({
            ownerDID: ownerDID,
            metadataHash: metadataHash,
            status: AssetStatus.Active,
            mintedAt: block.timestamp,
            updatedAt: block.timestamp
        });

        emit AssetMinted(tokenId, ownerDID, address(this), metadataHash, block.timestamp);
        return tokenId;
    }

    function platformTransfer(
        uint256 tokenId,
        string calldata fromDID,
        string calldata toDID
    ) external {
        require(
            hasRole(ADMIN_ROLE, msg.sender) || hasRole(MANAGER_ROLE, msg.sender),
            "AssetRegistry: not authorized"
        );
        require(_assetRecords[tokenId].status == AssetStatus.Active, "AssetRegistry: asset not active");
        require(bytes(toDID).length > 0, "AssetRegistry: empty toDID");

        string memory currentOwner = _assetRecords[tokenId].ownerDID;
        // Allow transfer from PLATFORM or from current owner DID
        if (bytes(fromDID).length > 0 && keccak256(bytes(fromDID)) != keccak256(bytes("PLATFORM"))) {
            require(
                keccak256(bytes(currentOwner)) == keccak256(bytes(fromDID)),
                "AssetRegistry: fromDID mismatch"
            );
        }

        _assetRecords[tokenId].ownerDID = toDID;
        _assetRecords[tokenId].updatedAt = block.timestamp;

        emit AssetTransferred(tokenId, fromDID, toDID, block.timestamp);
    }

    function revokeAsset(uint256 tokenId) external onlyRole(ADMIN_ROLE) {
        require(_assetRecords[tokenId].status == AssetStatus.Active, "AssetRegistry: asset not active");
        _assetRecords[tokenId].status = AssetStatus.Revoked;
        _assetRecords[tokenId].updatedAt = block.timestamp;
        emit AssetRevoked(tokenId, block.timestamp);
    }

    function burnAsset(uint256 tokenId) external onlyRole(ADMIN_ROLE) {
        require(_assetRecords[tokenId].status == AssetStatus.Revoked, "AssetRegistry: must revoke first");
        _assetRecords[tokenId].status = AssetStatus.Burned;
        _burn(tokenId);
        emit AssetBurned(tokenId, block.timestamp);
    }

    // --- Views ---
    function verifyAsset(uint256 tokenId) external view returns (
        string memory ownerDID,
        bytes32 metadataHash,
        AssetStatus status,
        uint256 mintedAt
    ) {
        require(_tokenIdCounter >= tokenId && tokenId > 0, "AssetRegistry: token not found");
        AssetRecord memory r = _assetRecords[tokenId];
        return (r.ownerDID, r.metadataHash, r.status, r.mintedAt);
    }

    function getAssetRecord(uint256 tokenId) external view returns (AssetRecord memory) {
        require(_tokenIdCounter >= tokenId && tokenId > 0, "AssetRegistry: token not found");
        return _assetRecords[tokenId];
    }

    function totalMinted() external view returns (uint256) {
        return _tokenIdCounter;
    }



    // --- ERC721Receiver (so contract can receive its own minted tokens) ---
    function onERC721Received(address, address, uint256, bytes memory) public pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    // --- Interface support ---
    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721URIStorageUpgradeable, AccessControlEnumerableUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // --- UUPS ---
    function _authorizeUpgrade(address) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
}
