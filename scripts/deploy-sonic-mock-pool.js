const { ethers, network } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log(`Deploying MockAavePool on ${network.name}...`);
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);

  // Deploy MockAavePool
  const MockAavePool = await ethers.getContractFactory("MockAavePool");
  const mockPool = await MockAavePool.deploy();
  await mockPool.waitForDeployment();
  const mockPoolAddr = await mockPool.getAddress();
  console.log(`- MockAavePool: ${mockPoolAddr}`);

  // Load current deployment
  const deploymentPath = "./deployments/kernel-sonic_mainnet.json";
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  
  const aaveAdapterAddr = deployment.contracts.AaveFlashAdapter;
  console.log(`AaveFlashAdapter Address: ${aaveAdapterAddr}`);
  
  const aaveAdapter = await ethers.getContractAt("AaveFlashAdapter", aaveAdapterAddr, deployer);
  
  console.log("Setting MockAavePool as trustedPool in AaveFlashAdapter...");
  const tx = await aaveAdapter.setTrustedPool(mockPoolAddr);
  await tx.wait();
  console.log("Tx setTrustedPool complete. Tx hash:", tx.hash);

  // Update deployment JSON
  deployment.contracts.MockAavePool = mockPoolAddr;
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log(`Updated ${deploymentPath} with MockAavePool address.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
