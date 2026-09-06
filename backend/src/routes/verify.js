const express = require('express');
const crypto = require('crypto');
const prisma = require('../utils/prisma');
const { success, error } = require('../utils/response');

const router = express.Router();

/**
 * @route GET /api/v1/verify/asset/:assetCode
 * @desc Public route to verify an asset
 */
router.get('/asset/:assetCode', async (req, res, next) => {
  try {
    const { assetCode } = req.params;

    const asset = await prisma.asset.findUnique({
      where: { assetCode },
      include: {
        ownershipRecords: {
          where: { isCurrent: true },
          include: { ownerDid: { select: { did: true, user: { select: { name: true, organization: true } } } } }
        }
      }
    });

    if (!asset) {
      return error(res, 'Asset not found', 404);
    }

    const currentOwnerRec = asset.ownershipRecords[0];
    const ownerDid = currentOwnerRec ? currentOwnerRec.ownerDid.did : "PLATFORM";
    const ownerName = currentOwnerRec && currentOwnerRec.ownerDid.user ? currentOwnerRec.ownerDid.user.name : "DecentraVault Platform";
    
    // In a real scenario, this endpoint would verify the signature of the asset data,
    // or call the blockchain to ensure the token hasn't been tampered with.
    // For now, we simulate this verification check.
    
    // Validate Hash
    const offchainData = { 
      assetCode: asset.assetCode, 
      name: asset.name, 
      category: asset.category, 
      description: asset.description, 
      location: asset.location, 
      metadata: null // Simplified for example
    };
    const metadataString = JSON.stringify(offchainData);
    const recomputedHash = '0x' + crypto.createHash('sha256').update(metadataString).digest('hex');
    
    const hashMatch = recomputedHash === asset.metadataHash;

    const verificationResult = {
      assetCode: asset.assetCode,
      name: asset.name,
      category: asset.category,
      status: asset.status,
      currentOwner: {
        did: ownerDid,
        name: ownerName
      },
      blockchain: {
        tokenId: asset.tokenId ? asset.tokenId.toString() : null,
        mintTxHash: asset.mintTxHash,
        hashMatch
      },
      verifiedAt: new Date().toISOString()
    };

    return success(res, verificationResult);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
