require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { decryptPrivateKey } = require('./src/utils/did');

async function dumpKeys() {
  console.log('--- DecentraVault Demo Key Dumper ---');
  const dids = await prisma.did.findMany({
    include: {
      user: true,
      keyStore: true
    }
  });

  if (dids.length === 0) {
    console.log('No DIDs found in the database. Please register an identity first.');
    process.exit(0);
  }

  for (const did of dids) {
    console.log(`\nUser: ${did.user.name} (${did.user.email})`);
    console.log(`Role: ${did.user.roles || 'Check DB for roles'}`);
    console.log(`DID: ${did.did}`);
    
    if (did.keyStore && did.keyStore.length > 0) {
      try {
        const pk = decryptPrivateKey(did.keyStore[0].encryptedKey);
        console.log(`Private Key: ${pk}`);
      } catch (err) {
        console.log(`Private Key: <Failed to decrypt: ${err.message}>`);
      }
    } else {
      console.log('Private Key: <No KeyStore entry found>');
    }
  }
  
  console.log('\n-------------------------------------');
  console.log('Copy a DID and its Private Key to test the DID Login flow in the browser.');
  process.exit(0);
}

dumpKeys().catch(console.error);
