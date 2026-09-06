import hre from "hardhat";
const { ethers, upgrades } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy DVAccessControl
  const DVAccessControl = await ethers.getContractFactory("DVAccessControl");
  const accessControl = await DVAccessControl.deploy(deployer.address);
  await accessControl.waitForDeployment();
  console.log("DVAccessControl deployed to:", await accessControl.getAddress());

  // 2. Deploy IdentityRegistry (UUPS)
  const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
  const identityRegistry = await upgrades.deployProxy(IdentityRegistry, [deployer.address], { kind: "uups" });
  await identityRegistry.waitForDeployment();
  console.log("IdentityRegistry deployed to:", await identityRegistry.getAddress());

  // 3. Deploy AssetRegistry (UUPS)
  const AssetRegistry = await ethers.getContractFactory("AssetRegistry");
  const assetRegistry = await upgrades.deployProxy(AssetRegistry, [deployer.address], { kind: "uups" });
  await assetRegistry.waitForDeployment();
  console.log("AssetRegistry deployed to:", await assetRegistry.getAddress());

  // 4. Deploy AuditRegistry
  const AuditRegistry = await ethers.getContractFactory("AuditRegistry");
  // In production, this should be a dedicated backend wallet, but we'll use deployer for now
  const auditRegistry = await AuditRegistry.deploy(deployer.address);
  await auditRegistry.waitForDeployment();
  console.log("AuditRegistry deployed to:", await auditRegistry.getAddress());

  console.log("\n--- Deployment Complete ---");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
