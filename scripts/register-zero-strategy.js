const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const deployment = JSON.parse(fs.readFileSync("./deployments/kernel-sonic_mainnet.json", "utf8"));
  const registryAddress = deployment.contracts.StrategyRegistry;
  console.log("StrategyRegistry Address:", registryAddress);

  const [deployer] = await ethers.getSigners();
  console.log("Signer:", deployer.address);

  const registry = await ethers.getContractAt("StrategyRegistry", registryAddress, deployer);

  const zeroHash = ethers.ZeroHash;
  console.log("Checking if Zero Hash is registered...");
  const creator = await registry.getCreator(zeroHash);
  
  if (creator !== ethers.ZeroAddress) {
    console.log("Zero Hash is already registered by:", creator);
    return;
  }

  console.log("Registering Zero Hash...");
  const tx = await registry.registerStrategy(zeroHash, "ipfs://mock-strategy");
  console.log("Tx sent:", tx.hash);
  await tx.wait();
  console.log("Zero Hash successfully registered!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
