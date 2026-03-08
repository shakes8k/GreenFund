import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // 1. GreenFund Token
  const GFT = await ethers.getContractFactory("GreenFundToken");
  const gft = await GFT.deploy(deployer.address);
  await gft.waitForDeployment();
  console.log("GreenFundToken deployed:", await gft.getAddress());

  // 2. DVN Registry
  const DVN = await ethers.getContractFactory("DVNRegistry");
  const dvn = await DVN.deploy(await gft.getAddress(), deployer.address);
  await dvn.waitForDeployment();
  console.log("DVNRegistry deployed:", await dvn.getAddress());

  // Grant DVN minting rights for rewards
  await gft.grantRole(await gft.MINTER_ROLE(), await dvn.getAddress());
  console.log("DVN granted MINTER_ROLE on GFT");

  // 3. MilestoneVault (uses USDC — on testnet use a mock ERC20)
  // For local/testnet: deploy a mock USDC
  const MockUSDC = await ethers.getContractFactory("GreenFundToken"); // reuse ERC20 for mock
  const mockUSDC = await MockUSDC.deploy(deployer.address);
  await mockUSDC.waitForDeployment();
  const usdcAddress = await mockUSDC.getAddress();
  console.log("Mock USDC deployed:", usdcAddress);

  const Vault = await ethers.getContractFactory("MilestoneVault");
  const vault = await Vault.deploy(usdcAddress, deployer.address);
  await vault.waitForDeployment();
  console.log("MilestoneVault deployed:", await vault.getAddress());

  // 4. RiskPoolManager
  const PoolManager = await ethers.getContractFactory("RiskPoolManager");
  const poolManager = await PoolManager.deploy(usdcAddress, deployer.address);
  await poolManager.waitForDeployment();
  console.log("RiskPoolManager deployed:", await poolManager.getAddress());

  // 5. ImpactLedger
  const Ledger = await ethers.getContractFactory("ImpactLedger");
  const ledger = await Ledger.deploy(deployer.address);
  await ledger.waitForDeployment();
  console.log("ImpactLedger deployed:", await ledger.getAddress());

  console.log("\n--- Deployment Summary ---");
  console.log({
    GreenFundToken: await gft.getAddress(),
    DVNRegistry: await dvn.getAddress(),
    MockUSDC: usdcAddress,
    MilestoneVault: await vault.getAddress(),
    RiskPoolManager: await poolManager.getAddress(),
    ImpactLedger: await ledger.getAddress(),
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
