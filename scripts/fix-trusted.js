const { ethers } = require("hardhat");

async function main() {
  const kernelAddress = "0x18C1d2974D512bEbE2b3bE36375B62f5eb1C38E2";
  const aaveAdapter = "0x0f840e0DeA1c11b2aB35A8f18A3ab4ac47cF5262";
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  const kernel = await ethers.getContractAt("StrategyExecutorKernel", kernelAddress, deployer);
  
  console.log("Setting AaveFlashAdapter as trusted...");
  const tx = await kernel.setTrustedAdapter(aaveAdapter, true);
  console.log("Tx hash:", tx.hash);
  await tx.wait();
  console.log("Done!");
}
main().catch(console.error);
