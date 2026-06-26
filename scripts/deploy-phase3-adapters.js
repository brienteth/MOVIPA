const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const networkName = hre.network.name;
  console.log(`Deploying Phase 3 Adapters to ${networkName} with account:`, deployer.address);

  let kernelAddress;
  let actionExecutorAddress;

  if (networkName === "base_mainnet") {
    kernelAddress = "0x18C1d2974D512bEbE2b3bE36375B62f5eb1C38E2";
    actionExecutorAddress = "0xd190A715Ee25bfd2Ebfc19292A3d1c0544c6EA28";
  } else if (networkName === "sonic_mainnet") {
    kernelAddress = "0x09Bee01F41D36B40e4eB86c4557D1f572949d516";
    actionExecutorAddress = "0x18C1d2974D512bEbE2b3bE36375B62f5eb1C38E2";
  } else {
    throw new Error("Unsupported network for Phase 3 deployment script.");
  }

  // 1. Deploy DyDxFlashAdapter
  const DyDxAdapter = await hre.ethers.getContractFactory("DyDxFlashAdapter");
  const dydxAdapter = await DyDxAdapter.deploy(hre.ethers.ZeroAddress, kernelAddress); // Mock SoloMargin
  await dydxAdapter.waitForDeployment();
  const dydxAddr = await dydxAdapter.getAddress();
  console.log("DyDxFlashAdapter deployed to:", dydxAddr);

  await dydxAdapter.setActionExecutor(actionExecutorAddress);
  console.log("DyDxFlashAdapter configured with ActionExecutor");

  // 2. Deploy LidoAdapter
  const LidoAdapter = await hre.ethers.getContractFactory("LidoAdapter");
  const lidoAdapter = await LidoAdapter.deploy(hre.ethers.ZeroAddress, kernelAddress); // Mock stETH
  await lidoAdapter.waitForDeployment();
  const lidoAddr = await lidoAdapter.getAddress();
  console.log("LidoAdapter deployed to:", lidoAddr);

  await lidoAdapter.setActionExecutor(actionExecutorAddress);
  console.log("LidoAdapter configured with ActionExecutor");

  console.log("\nDeployment Summary:");
  console.log("-------------------");
  console.log(`DyDxFlashAdapter: ${dydxAddr}`);
  console.log(`LidoAdapter: ${lidoAddr}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
