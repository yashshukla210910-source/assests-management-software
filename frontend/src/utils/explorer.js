// frontend/src/utils/explorer.js

// Using Vite's import.meta.env for frontend environment variables
const CHAIN_ID = import.meta.env.VITE_CHAIN_ID || '11155111'; // Default to Sepolia if not set

export const getExplorerNetworkName = () => {
  switch (CHAIN_ID.toString()) {
    case '11155111':
      return 'Ethereum Sepolia';
    case '80002':
      return 'Polygon Amoy';
    case '1':
      return 'Ethereum Mainnet';
    case '137':
      return 'Polygon Mainnet';
    default:
      return 'Unknown Network';
  }
};

export const getExplorerUrl = (txHash) => {
  let baseUrl = '';
  switch (CHAIN_ID.toString()) {
    case '11155111':
      baseUrl = 'https://sepolia.etherscan.io';
      break;
    case '80002':
      baseUrl = 'https://amoy.polygonscan.com';
      break;
    case '1':
      baseUrl = 'https://etherscan.io';
      break;
    case '137':
      baseUrl = 'https://polygonscan.com';
      break;
    default:
      baseUrl = 'https://sepolia.etherscan.io'; // Fallback
  }

  if (!txHash) return baseUrl;
  
  // If it's just a general link (no hash), return the base
  if (txHash === 'base') return baseUrl;

  // Clean the hash just in case
  const cleanHash = txHash.startsWith('0x') ? txHash : `0x${txHash}`;
  
  return `${baseUrl}/tx/${cleanHash}`;
};

export const getAddressExplorerUrl = (address) => {
  const baseUrl = getExplorerUrl('base');
  if (!address) return baseUrl;
  
  const cleanAddress = address.startsWith('0x') ? address : `0x${address}`;
  return `${baseUrl}/address/${cleanAddress}`;
};
