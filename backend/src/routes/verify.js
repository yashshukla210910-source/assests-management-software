const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const prisma = require('../utils/prisma');
const { success, error } = require('../utils/response');
const { APP_CONFIG } = require('../config/constants');
const upload = require('../middleware/upload');
const { ethers } = require('ethers');

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
          include: {
            didRecord: { select: { did: true, user: { select: { name: true, organization: true } } } },
            owner: { select: { name: true, organization: true } }
          }
        }
      }
    });

    if (!asset) {
      return error(res, 'Asset not found', 404);
    }

    const currentOwnerRec = asset.ownershipRecords[0];
    const ownerDid = currentOwnerRec ? currentOwnerRec.ownerDid : "PLATFORM";
    const ownerName = currentOwnerRec
      ? (currentOwnerRec.owner?.name || currentOwnerRec.didRecord?.user?.name || `${APP_CONFIG.BRAND_NAME} Platform`)
      : `${APP_CONFIG.BRAND_NAME} Platform`;
    
    // In a real scenario, this endpoint would verify the signature of the asset data,
    // or call the blockchain to ensure the token hasn't been tampered with.
    // For now, we simulate this verification check.
    
    // Fetch stored metadata to reconstruct the original hash input
    const storedMetadata = await prisma.assetMetadata.findMany({
      where: { assetId: asset.id }
    });

    // Rebuild the metadata object from stored key-value rows
    let reconstructedMetadata = null;
    let documentHash = null;
    let documentUrl = null;
    if (storedMetadata.length > 0) {
      reconstructedMetadata = {};
      for (const m of storedMetadata) {
        if (m.key === '_documentHash') {
          documentHash = m.value;
        } else if (m.key === '_documentUrl') {
          documentUrl = m.value;
        } else {
          reconstructedMetadata[m.key] = m.value;
        }
      }
      if (Object.keys(reconstructedMetadata).length === 0) {
        reconstructedMetadata = null;
      }
    }

    /**
     * Hash robustness: JSON.stringify behaves differently based on the metadata value:
     *   - undefined   → key is OMITTED from JSON string (most common for no-metadata mints)
     *   - null        → key is present as "metadata":null
     *   - {}          → key is present as "metadata":{}
     *   - {k:v, ...}  → full object
     *
     * We try all plausible variants and accept any that matches the stored hash.
     */
    const baseFields = {
      assetCode: asset.assetCode,
      name: asset.name,
      category: asset.category,
      description: asset.description,
      location: asset.location,
      ...(documentHash && { documentHash, documentUrl })
    };

    const computeHash = (data) =>
      '0x' + crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');

    const candidateHashes = [
      // Variant 1: no metadata key at all (metadata was undefined at mint time — most common)
      computeHash(baseFields),
      // Variant 2: metadata: null explicitly
      computeHash({ ...baseFields, metadata: null }),
      // Variant 3: metadata: {} (empty object)
      computeHash({ ...baseFields, metadata: {} }),
    ];

    // Variant 4: reconstructed metadata from DB rows (if any)
    if (reconstructedMetadata !== null) {
      candidateHashes.push(computeHash({ ...baseFields, metadata: reconstructedMetadata }));
    }

    const storedHash = asset.metadataHash;
    const hashMatch = storedHash != null && candidateHashes.includes(storedHash);



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

/**
 * @route POST /api/v1/verify/asset/:assetCode/document
 * @desc Verify if a physical document matches the stored asset hash
 */
router.post('/asset/:assetCode/document', upload.single('document'), async (req, res, next) => {
  try {
    const { assetCode } = req.params;

    if (!req.file) {
      return error(res, 'No document uploaded to verify', 400);
    }

    const asset = await prisma.asset.findUnique({ where: { assetCode } });
    if (!asset) {
      fs.unlinkSync(req.file.path);
      return error(res, 'Asset not found', 404);
    }

    const documentHashObj = await prisma.assetMetadata.findFirst({
      where: { assetId: asset.id, key: '_documentHash' }
    });

    if (!documentHashObj) {
      fs.unlinkSync(req.file.path);
      return error(res, 'This asset does not have a linked physical document.', 400);
    }

    const fileBuffer = fs.readFileSync(req.file.path);
    const calculatedHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    fs.unlinkSync(req.file.path); // clean up immediately

    const hashMatch = (calculatedHash === documentHashObj.value);

    return success(res, {
      assetCode: asset.assetCode,
      name: asset.name,
      verified: hashMatch,
      calculatedHash,
      storedHash: documentHashObj.value,
      message: hashMatch ? 'Document verified successfully. No tampering detected.' : 'ASSET NOT MATCHED. The document has been tampered with or modified.'
    });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(err);
  }
});
