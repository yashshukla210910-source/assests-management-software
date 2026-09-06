const { ethers } = require('ethers');

// In a real scenario these would be imported from the compiled artifacts
const IdentityRegistryABI = [
  "function registerIdentity(string did, address owner, bytes32 metadataHash) external",
  "function updateIdentityMetadata(string did, bytes32 newMetadataHash) external",
  "function suspendIdentity(string did) external",
  "function reactivateIdentity(string did) external",
  "function revokeIdentity(string did) external",
  "function getIdentity(string did) external view returns (tuple(address owner, bytes32 metadataHash, uint8 status, uint256 createdAt, uint256 updatedAt))",
  "function isIdentityActive(string did) external view returns (bool)"
];

const AssetRegistryABI = [
  "function mintAsset(string ownerDID, bytes32 metadataHash, string tokenURIStr) external returns (uint256)",
  "function platformTransfer(uint256 tokenId, string fromDID, string toDID) external",
  "function revokeAsset(uint256 tokenId) external",
  "function burnAsset(uint256 tokenId) external",
  "function verifyAsset(uint256 tokenId) external view returns (string ownerDID, bytes32 metadataHash, uint8 status, uint256 mintedAt)"
];

const AuditRegistryABI = [
  "function anchorBatch(bytes32 merkleRoot, uint256 batchSize, uint256 fromSequence, uint256 toSequence) external",
  "function verifyAnchor(bytes32 merkleRoot) external view returns (bool exists, uint256 timestamp, address anchoredBy, uint256 batchSize, uint256 fromSequence, uint256 toSequence)"
];

const DVAccessControlABI = [
  "function hasRole(bytes32 role, address account) external view returns (bool)"
];

class BlockchainService {
  constructor() {
    const rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
    const chainId = parseInt(process.env.CHAIN_ID || '31337');
    // Use staticNetwork to prevent aggressive reconnect retries when no node is available
    const network = ethers.Network.from({ chainId, name: 'hardhat' });
    this.provider = new ethers.JsonRpcProvider(rpcUrl, network, { staticNetwork: network });
    this.wallet = new ethers.Wallet(
      process.env.BACKEND_WALLET_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      this.provider
    );
    
    // Fallback addresses for local dev if not in .env
    this.identityAddress = process.env.IDENTITY_REGISTRY_ADDRESS;
    this.assetAddress = process.env.ASSET_REGISTRY_ADDRESS;
    this.auditAddress = process.env.AUDIT_REGISTRY_ADDRESS;
    this.accessAddress = process.env.ACCESS_CONTROL_ADDRESS;

    if (this.identityAddress) {
      this.identityRegistry = new ethers.Contract(this.identityAddress, IdentityRegistryABI, this.wallet);
    }
    if (this.assetAddress) {
      this.assetRegistry = new ethers.Contract(this.assetAddress, AssetRegistryABI, this.wallet);
    }
    if (this.auditAddress) {
      this.auditRegistry = new ethers.Contract(this.auditAddress, AuditRegistryABI, this.wallet);
    }
  }

  // --- Identity ---

  async registerIdentity(did, ownerAddress, metadataHash) {
    if (!this.identityRegistry) return { hash: 'mock_tx_hash' }; // Mock if not configured
    const tx = await this.identityRegistry.registerIdentity(did, ownerAddress, metadataHash);
    const receipt = await tx.wait();
    return receipt;
  }

  async updateIdentity(did, newMetadataHash) {
    if (!this.identityRegistry) return { hash: 'mock_tx_hash' };
    const tx = await this.identityRegistry.updateIdentityMetadata(did, newMetadataHash);
    return await tx.wait();
  }

  async revokeIdentity(did) {
    if (!this.identityRegistry) return { hash: 'mock_tx_hash' };
    const tx = await this.identityRegistry.revokeIdentity(did);
    return await tx.wait();
  }

  // --- Assets ---

  async mintAsset(ownerDID, metadataHash, tokenURIStr) {
    if (!this.assetRegistry) return { hash: 'mock_tx_hash', logs: [{ topics: ['0x', '0x', '0x', ethers.zeroPadValue(ethers.toBeHex(1), 32)] }] };
    const tx = await this.assetRegistry.mintAsset(ownerDID, metadataHash, tokenURIStr);
    const receipt = await tx.wait();
    return receipt;
  }

  async platformTransfer(tokenId, fromDID, toDID) {
    if (!this.assetRegistry) return { hash: 'mock_tx_hash' };
    const tx = await this.assetRegistry.platformTransfer(tokenId, fromDID, toDID);
    return await tx.wait();
  }

  // --- Audit Anchoring ---

  async anchorBatch(merkleRoot, batchSize, fromSequence, toSequence) {
    if (!this.auditRegistry) return { hash: 'mock_tx_hash' };
    const tx = await this.auditRegistry.anchorBatch(merkleRoot, batchSize, fromSequence, toSequence);
    return await tx.wait();
  }
}

module.exports = new BlockchainService();
