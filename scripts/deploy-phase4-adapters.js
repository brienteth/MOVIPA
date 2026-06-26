const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const networkName = hre.network.name;
  console.log(`Deploying Phase 4 Adapters to ${networkName} with account:`, deployer.address);

  let kernelAddress;
  let actionExecutorAddress;
  let gpV2SettlementAddress = hre.ethers.ZeroAddress; // Default mock

  if (networkName === "base_mainnet") {
    kernelAddress = "0x18C1d2974D512bEbE2b3bE36375B62f5eb1C38E2";
    actionExecutorAddress = "0xd190A715Ee25bfd2Ebfc19292A3d1c0544c6EA28";
  } else if (networkName === "sonic_mainnet") {
    kernelAddress = "0x09Bee01F41D36B40e4eB86c4557D1f572949d516";
    actionExecutorAddress = "0x18C1d2974D512bEbE2b3bE36375B62f5eb1C38E2";
  } else {
    throw new Error("Unsupported network for Phase 4 deployment script.");
  }

  // Deploy CowSwapAdapter
  const CowSwapAdapter = await hre.ethers.getContractFactory("CowSwapAdapter");
  const cowswapAdapter = await CowSwapAdapter.deploy(kernelAddress, gpV2SettlementAddress);
  await cowswapAdapter.waitForDeployment();
  const cowswapAddr = await cowswapAdapter.getAddress();
  console.log("CowSwapAdapter deployed to:", cowswapAddr);

  await cowswapAdapter.setActionExecutor(actionExecutorAddress);
  console.log("CowSwapAdapter configured with ActionExecutor");

  console.log("\nDeployment Summary:");
  console.log("-------------------");
  console.log(`CowSwapAdapter: ${cowswapAddr}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
