const { ethers } = require('ethers');
const prisma = require('../utils/prisma');
const blockchain = require('./blockchain');

const POLL_INTERVAL = 30000; // 30 seconds (reduced polling frequency)
let isPolling = false;
let consecutiveErrors = 0;
const MAX_BACKOFF = 10; // stop aggressive retries

const startBlockchainPoller = async () => {
  if (isPolling) return;
  isPolling = true;

  const provider = blockchain.provider;
  if (!provider) {
    console.warn('No blockchain provider configured, poller disabled.');
    return;
  }

  // Test connection first
  try {
    await provider.getBlockNumber();
    console.log('⛓  Blockchain provider connected');
  } catch (err) {
    console.warn('⚠  No blockchain node available — poller running in offline mode');
    // Don't start aggressive polling if node is not available
    // Just set up a slow health check
    setInterval(async () => {
      try {
        await provider.getBlockNumber();
        consecutiveErrors = 0;
      } catch (e) {
        // silently skip
      }
    }, 60000); // check every minute
    return;
  }

  setInterval(async () => {
    try {
      consecutiveErrors = 0;
      const latestBlock = await provider.getBlockNumber();
      // TODO: Implement full event log polling here
      // This would query AssetTransferred events and sync ownership records
    } catch (err) {
      consecutiveErrors++;
      if (consecutiveErrors <= 3) {
        console.error('Error in blockchain poller:', err.message);
      }
    }
  }, POLL_INTERVAL);
};

module.exports = { startBlockchainPoller };
