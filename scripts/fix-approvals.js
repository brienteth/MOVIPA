const { ethers } = require("hardhat");

async function main() {
  const kernelAddress = "0x18C1d2974D512bEbE2b3bE36375B62f5eb1C38E2";
  const aaveAdapter = "0x0f840e0DeA1c11b2aB35A8f18A3ab4ac47cF5262";
  const uniV3Adapter = "0x68Fcae27158aC9464CB54A51c6F0A2A427eb2B36";
  
  const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  const WETH = "0x4200000000000000000000000000000000000006";

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  const kernel = await ethers.getContractAt("StrategyExecutorKernel", kernelAddress, deployer);
  
  const maxAmount = ethers.MaxUint256;

  console.log("Approving AaveAdapter for USDC...");
  let tx = await kernel.approveToken(USDC, aaveAdapter, maxAmount);
  await tx.wait();

  console.log("Approving AaveAdapter for WETH...");
  tx = await kernel.approveToken(WETH, aaveAdapter, maxAmount);
  await tx.wait();

  console.log("Approving UniV3Adapter for USDC...");
  tx = await kernel.approveToken(USDC, uniV3Adapter, maxAmount);
  await tx.wait();

  console.log("Approving UniV3Adapter for WETH...");
  tx = await kernel.approveToken(WETH, uniV3Adapter, maxAmount);
  await tx.wait();

  console.log("Done!");
}
main().catch(console.error);
