const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying Phase 1 Adapters with account:", deployer.address);

  // Addresses on Base Mainnet
  const kernelAddress = "0x18C1d2974D512bEbE2b3bE36375B62f5eb1C38E2";
  const actionExecutorAddress = "0xd190A715Ee25bfd2Ebfc19292A3d1c0544c6EA28";
  const sushiRouterBase = "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506"; // SushiSwap V2 Router on Base
  const balancerVaultBase = "0xBA12222222228d8Ba445958a75a0704d566BF2C8"; // Balancer V2 Vault (same on all chains)

  // 1. Deploy SushiSwapAdapter
  const SushiAdapter = await hre.ethers.getContractFactory("SushiSwapAdapter");
  const sushiAdapter = await SushiAdapter.deploy(sushiRouterBase, kernelAddress);
  await sushiAdapter.waitForDeployment();
  const sushiAddr = await sushiAdapter.getAddress();
  console.log("SushiSwapAdapter deployed to:", sushiAddr);

  // Configure SushiSwapAdapter
  await sushiAdapter.setActionExecutor(actionExecutorAddress);
  console.log("SushiSwapAdapter configured with ActionExecutor");

  // 2. Deploy BalancerAdapter
  const BalancerAdapter = await hre.ethers.getContractFactory("BalancerAdapter");
  const balancerAdapter = await BalancerAdapter.deploy(balancerVaultBase, kernelAddress);
  await balancerAdapter.waitForDeployment();
  const balancerAddr = await balancerAdapter.getAddress();
  console.log("BalancerAdapter deployed to:", balancerAddr);

  // Configure BalancerAdapter
  await balancerAdapter.setActionExecutor(actionExecutorAddress);
  console.log("BalancerAdapter configured with ActionExecutor");

  console.log("\nDeployment Summary:");
  console.log("-------------------");
  console.log(`SushiSwapAdapter: ${sushiAddr}`);
  console.log(`BalancerAdapter: ${balancerAddr}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
