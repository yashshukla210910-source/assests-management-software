const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { ethers } = require('ethers');

const prisma = new PrismaClient();

function generateDidCredentials() {
  const wallet = ethers.Wallet.createRandom();
  const address = wallet.address;
  const privateKey = wallet.privateKey;
  const publicKey = wallet.publicKey;
  const chainId = 31337;
  const did = `did:ethr:${chainId}:${address}`;
  return { privateKey, publicKey, address, did, chainId };
}

async function main() {
  console.log('Seeding database...');

  // 1. Create Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin', displayName: 'Administrator', description: 'Full system access', isSystem: true }
  });
  const managerRole = await prisma.role.upsert({
    where: { name: 'manager' },
    update: {},
    create: { name: 'manager', displayName: 'Asset Manager', description: 'Can manage assets and identities', isSystem: true }
  });
  const auditorRole = await prisma.role.upsert({
    where: { name: 'auditor' },
    update: {},
    create: { name: 'auditor', displayName: 'Auditor', description: 'Read-only access to all audit data', isSystem: true }
  });
  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: { name: 'user', displayName: 'Standard User', description: 'Access to own assets and identity', isSystem: true }
  });

  // 2. Create Permissions
  const permissionDefs = [
    // Identity
    { key: 'identity.read', domain: 'identity', description: 'View identity records' },
    { key: 'identity.create', domain: 'identity', description: 'Create new identities' },
    { key: 'identity.update', domain: 'identity', description: 'Update identity metadata' },
    { key: 'identity.revoke', domain: 'identity', description: 'Suspend or revoke identities' },
    { key: 'identity.verify', domain: 'identity', description: 'Verify identity on blockchain' },
    // Asset
    { key: 'asset.read', domain: 'asset', description: 'View asset records' },
    { key: 'asset.create', domain: 'asset', description: 'Mint new assets' },
    { key: 'asset.update', domain: 'asset', description: 'Update asset metadata' },
    { key: 'asset.transfer', domain: 'asset', description: 'Transfer asset ownership' },
    { key: 'asset.revoke', domain: 'asset', description: 'Revoke an asset' },
    { key: 'asset.verify', domain: 'asset', description: 'Verify asset on blockchain' },
    // Role
    { key: 'role.read', domain: 'role', description: 'View roles and permissions' },
    { key: 'role.update', domain: 'role', description: 'Update role permissions' },
    { key: 'role.assign', domain: 'role', description: 'Assign roles to users' },
    { key: 'role.revoke', domain: 'role', description: 'Revoke roles from users' },
    // Audit
    { key: 'audit.read', domain: 'audit', description: 'View audit events' },
    { key: 'audit.export', domain: 'audit', description: 'Export audit logs' },
    // Notifications
    { key: 'notification.read', domain: 'notification', description: 'View notifications' },
    { key: 'notification.manage', domain: 'notification', description: 'Manage all notifications' },
    // Admin
    { key: 'admin.system', domain: 'admin', description: 'Access system administration' },
  ];

  const permissions = {};
  for (const pDef of permissionDefs) {
    const perm = await prisma.permission.upsert({
      where: { key: pDef.key },
      update: { description: pDef.description },
      create: pDef
    });
    permissions[pDef.key] = perm;
  }

  // 3. Assign Permissions to Roles
  // Manager gets most permissions except admin
  const managerPermissions = [
    'identity.read', 'identity.create', 'identity.update', 'identity.verify',
    'asset.read', 'asset.create', 'asset.update', 'asset.transfer', 'asset.verify',
    'role.read', 'audit.read', 'notification.read'
  ];
  for (const key of managerPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: managerRole.id, permissionId: permissions[key].id } },
      update: { granted: true },
      create: { roleId: managerRole.id, permissionId: permissions[key].id, granted: true }
    });
  }

  // Auditor gets read-only
  const auditorPermissions = [
    'identity.read', 'identity.verify',
    'asset.read', 'asset.verify',
    'role.read', 'audit.read', 'audit.export',
    'notification.read'
  ];
  for (const key of auditorPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: auditorRole.id, permissionId: permissions[key].id } },
      update: { granted: true },
      create: { roleId: auditorRole.id, permissionId: permissions[key].id, granted: true }
    });
  }

  // User gets minimal access
  const userPermissions = [
    'identity.read', 'asset.read', 'asset.verify', 'notification.read'
  ];
  for (const key of userPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: userRole.id, permissionId: permissions[key].id } },
      update: { granted: true },
      create: { roleId: userRole.id, permissionId: permissions[key].id, granted: true }
    });
  }

  // 4. Create Users
  const usersToCreate = [
    { email: 'admin@decentravault.com', name: 'System Admin', organization: 'DecentraVault', password: 'Admin@123', role: adminRole },
    { email: 'manager@decentravault.com', name: 'Alice Manager', organization: 'DecentraVault', password: 'Manager@123', role: managerRole },
    { email: 'auditor@decentravault.com', name: 'Bob Auditor', organization: 'Compliance Dept', password: 'Auditor@123', role: auditorRole },
    { email: 'user@decentravault.com', name: 'Charlie User', organization: 'Engineering', password: 'User@123', role: userRole },
  ];

  const createdUsers = {};
  for (const u of usersToCreate) {
    let user = await prisma.user.findUnique({ where: { email: u.email } });
    const passwordHash = await bcrypt.hash(u.password, 10);
    if (!user) {
      user = await prisma.user.create({
        data: { email: u.email, name: u.name, organization: u.organization, passwordHash, status: 'active' }
      });
    } else {
      // Update password to new credential
      user = await prisma.user.update({
        where: { email: u.email },
        data: { passwordHash, name: u.name, organization: u.organization }
      });
    }
    createdUsers[u.email] = user;

    // Assign role
    const existing = await prisma.userRole.findFirst({
      where: { userId: user.id, roleId: u.role.id, revokedAt: null }
    });
    if (!existing) {
      await prisma.userRole.create({ data: { userId: user.id, roleId: u.role.id } });
    }
  }

  // 5. Create DIDs for all users
  const adminUser = createdUsers['admin@decentravault.com'];
  const managerUser = createdUsers['manager@decentravault.com'];
  const auditorUser = createdUsers['auditor@decentravault.com'];
  const regularUser = createdUsers['user@decentravault.com'];

  const dids = {};
  for (const [email, user] of Object.entries(createdUsers)) {
    let existingDid = await prisma.did.findFirst({ where: { userId: user.id } });
    
    // Check if we need to force update the Admin DID
    const isAdmin = email === 'admin@decentravault.com';
    const adminAddress = '0x19aAcE4EA11C6B9DD7Df8Df081d7154105383183';
    const adminDidString = `did:ethr:11155111:${adminAddress}`;
    
    if (isAdmin && existingDid && existingDid.address.toLowerCase() !== adminAddress.toLowerCase()) {
      // Force update the admin DID to the provided MetaMask wallet
      await prisma.did.update({
        where: { id: existingDid.id },
        data: { did: adminDidString, address: adminAddress, publicKey: '0x' }
      });
      existingDid.did = adminDidString;
      existingDid.address = adminAddress;
      
      // Update DID Document
      await prisma.didDocument.updateMany({
        where: { didId: existingDid.id },
        data: { document: JSON.stringify({ "@context": "https://w3id.org/did/v1", "id": adminDidString }) }
      });
      console.log(`Forced update of Admin DID to ${adminAddress}`);
    }

    if (!existingDid) {
      let creds;
      
      // Hardcode the specific Admin DID as requested
      if (isAdmin) {
        creds = {
          address: adminAddress,
          privateKey: 'EXTERNAL_WALLET',
          publicKey: '0x',
          chainId: 11155111,
          did: adminDidString
        };
      } else {
        creds = generateDidCredentials();
      }

      existingDid = await prisma.did.create({
        data: {
          userId: user.id,
          did: creds.did,
          address: creds.address,
          publicKey: creds.publicKey,
          chainId: creds.chainId,
          onChainTx: 'seed_tx_' + Math.random().toString(36).substr(2, 8)
        }
      });
      // DID Document
      await prisma.didDocument.create({
        data: {
          didId: existingDid.id,
          document: {
            "@context": ["https://www.w3.org/ns/did/v1"],
            "id": existingDid.did,
            "verificationMethod": [{
              "id": `${existingDid.did}#controller`,
              "type": "EcdsaSecp256k1VerificationKey2019",
              "controller": existingDid.did,
              "publicKeyHex": creds.publicKey
            }]
          }
        }
      });
    }
    dids[email] = existingDid;
  }

  // 6. Create sample assets
  const sampleAssets = [
    { assetCode: 'ASSET-001', name: 'MacBook Pro 16-inch', category: 'hardware', description: 'Apple MacBook Pro M3 Pro', location: 'HQ Office - Desk 4A' },
    { assetCode: 'ASSET-002', name: 'AWS Production Access Key', category: 'access_credential', description: 'Production environment admin access', location: 'Cloud Infrastructure' },
    { assetCode: 'ASSET-003', name: 'Office Security Badge #44', category: 'physical', description: 'Main office entry badge', location: 'Building A' },
    { assetCode: 'ASSET-004', name: 'Software License - Adobe CC', category: 'software_license', description: 'Adobe Creative Cloud annual license', location: 'Digital' },
  ];

  const adminDid = dids['admin@decentravault.com'];
  const managerDid = dids['manager@decentravault.com'];
  const regularDid = dids['user@decentravault.com'];

  const createdAssets = [];
  for (let i = 0; i < sampleAssets.length; i++) {
    const a = sampleAssets[i];
    let existing = await prisma.asset.findUnique({ where: { assetCode: a.assetCode } });
    if (!existing) {
      const metaStr = JSON.stringify({ ...a, metadata: null });
      const metaHash = '0x' + crypto.createHash('sha256').update(metaStr).digest('hex');
      const tokenId = 1000 + i;
      
      const targetDid = i < 2 ? managerDid : regularDid;
      const targetUser = i < 2 ? managerUser : regularUser;

      existing = await prisma.asset.create({
        data: {
          assetCode: a.assetCode,
          name: a.name,
          category: a.category,
          description: a.description,
          location: a.location,
          status: 'assigned',
          tokenId: BigInt(tokenId),
          metadataHash: metaHash,
          mintTxHash: '0xmint_' + Math.random().toString(36).substr(2, 12),
          createdBy: adminUser.id
        }
      });

      // Create ownership record
      await prisma.ownershipRecord.create({
        data: {
          assetId: existing.id,
          ownerDid: targetDid.did,
          ownerUserId: targetUser.id,
          action: 'mint',
          txHash: '0xmint_tx_' + Math.random().toString(36).substr(2, 12),
          isCurrent: true
        }
      });

      // Audit event
      const eventHash = crypto.createHash('sha256').update(`ASSET_MINTED:${a.assetCode}:${Date.now()}:${Math.random()}`).digest('hex');
      await prisma.auditEvent.create({
        data: {
          eventType: 'ASSET_MINTED',
          actorUserId: adminUser.id,
          actorRole: 'admin',
          entityType: 'asset',
          entityId: existing.id,
          action: 'mint',
          payload: { assetCode: a.assetCode, targetDid: targetDid.did },
          txHash: '0xaudit_mint_' + Math.random().toString(36).substr(2, 10),
          eventHash
        }
      });
    }
    createdAssets.push(existing);
  }

  // 7. Create some audit events for login/identity
  const loginEventHash = crypto.createHash('sha256').update(`USER_LOGIN:${adminUser.email}:seed`).digest('hex');
  const existingLoginEvent = await prisma.auditEvent.findFirst({ where: { eventHash: loginEventHash } });
  if (!existingLoginEvent) {
    await prisma.auditEvent.create({
      data: {
        eventType: 'USER_LOGIN',
        severity: 'info',
        actorUserId: adminUser.id,
        actorRole: 'admin',
        entityType: 'user',
        entityId: adminUser.id,
        action: 'login',
        payload: { email: adminUser.email, method: 'password' },
        eventHash: loginEventHash
      }
    });
  }

  for (const [email, did] of Object.entries(dids)) {
    const eventHash = crypto.createHash('sha256').update(`IDENTITY_CREATED:${did.did}:seed`).digest('hex');
    const existing = await prisma.auditEvent.findFirst({ where: { eventHash } });
    if (!existing) {
      await prisma.auditEvent.create({
        data: {
          eventType: 'IDENTITY_CREATED',
          actorUserId: adminUser.id,
          actorRole: 'admin',
          entityType: 'identity',
          entityId: did.did,
          action: 'create',
          payload: { did: did.did, email },
          txHash: '0xdid_reg_' + Math.random().toString(36).substr(2, 10),
          eventHash
        }
      });
    }
  }

  // 8. Create notifications for admin
  await prisma.notification.createMany({
    data: [
      { userId: adminUser.id, type: 'asset_minted', title: 'New Asset Minted', body: 'MacBook Pro 16-inch has been minted successfully', entityType: 'asset', entityId: createdAssets[0]?.id, isRead: false },
      { userId: adminUser.id, type: 'identity_created', title: 'Identity Created', body: 'New identity registered for Alice Manager', entityType: 'identity', entityId: managerDid?.did, isRead: false },
      { userId: adminUser.id, type: 'system', title: 'System Ready', body: 'DecentraVault blockchain integration initialized', isRead: true },
    ],
    skipDuplicates: true
  });

  console.log('\n=== Database seeded successfully ===');
  console.log('\nDemo Credentials:');
  console.log('  Admin:   admin@decentravault.com   / Admin@123');
  console.log('  Manager: manager@decentravault.com / Manager@123');
  console.log('  Auditor: auditor@decentravault.com / Auditor@123');
  console.log('  User:    user@decentravault.com    / User@123');
  console.log('\nLegacy credential (also works):');
  console.log('  Admin:   admin@decentravault.com   / password');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
