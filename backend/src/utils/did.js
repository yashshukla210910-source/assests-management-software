const crypto = require('crypto');
const { ethers } = require('ethers');

/**
 * Generates a new SECP256K1 keypair and derives the did:ethr DID
 * @returns {Object} { privateKey, publicKey, address, did }
 */
const generateDidCredentials = () => {
  const wallet = ethers.Wallet.createRandom();
  const address = wallet.address;
  const privateKey = wallet.privateKey;
  const publicKey = wallet.publicKey; // Compressed public key
  
  const chainId = parseInt(process.env.CHAIN_ID || '80002'); // Amoy default, parse as int
  const did = `did:ethr:${chainId}:${address}`;

  return { privateKey, publicKey, address, did, chainId };
};

/**
 * Encrypts a private key for safe storage using AES-256-GCM
 */
const encryptPrivateKey = (privateKey) => {
  const encryptionKey = process.env.JWT_SECRET ? crypto.createHash('sha256').update(String(process.env.JWT_SECRET)).digest('base64').substring(0, 32) : '0123456789abcdef0123456789abcdef';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);
  
  let encrypted = cipher.update(privateKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return {
    encryptedKey: `${iv.toString('hex')}:${authTag}:${encrypted}`
  };
};

/**
 * Decrypts a stored private key
 */
const decryptPrivateKey = (encryptedString) => {
  const encryptionKey = process.env.JWT_SECRET ? crypto.createHash('sha256').update(String(process.env.JWT_SECRET)).digest('base64').substring(0, 32) : '0123456789abcdef0123456789abcdef';
  const parts = encryptedString.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encryptedText = parts[2];

  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

/**
 * Generate a standard W3C DID Document
 */
const generateDidDocument = (did, publicKey) => {
  return {
    "@context": ["https://www.w3.org/ns/did/v1"],
    "id": did,
    "verificationMethod": [{
      "id": `${did}#controller`,
      "type": "EcdsaSecp256k1VerificationKey2019",
      "controller": did,
      "publicKeyHex": publicKey
    }],
    "authentication": [`${did}#controller`]
  };
};

module.exports = {
  generateDidCredentials,
  encryptPrivateKey,
  decryptPrivateKey,
  generateDidDocument
};
