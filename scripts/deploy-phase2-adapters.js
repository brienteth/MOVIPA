const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const networkName = hre.network.name;
  console.log(`Deploying Phase 2 Adapters to ${networkName} with account:`, deployer.address);

  let kernelAddress;
  let actionExecutorAddress;
  let morphoAddress;

  if (networkName === "base_mainnet") {
    kernelAddress = "0x18C1d2974D512bEbE2b3bE36375B62f5eb1C38E2";
    actionExecutorAddress = "0xd190A715Ee25bfd2Ebfc19292A3d1c0544c6EA28";
    morphoAddress = "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb"; // Morpho Blue on Base
  } else if (networkName === "sonic_mainnet") {
    kernelAddress = "0x09Bee01F41D36B40e4eB86c4557D1f572949d516";
    actionExecutorAddress = "0x18C1d2974D512bEbE2b3bE36375B62f5eb1C38E2";
    morphoAddress = "0x0000000000000000000000000000000000000000"; // Placeholder for Sonic
  } else {
    throw new Error("Unsupported network for Phase 2 deployment script.");
  }

  // 1. Deploy CurveAdapter
  const CurveAdapter = await hre.ethers.getContractFactory("CurveAdapter");
  const curveAdapter = await CurveAdapter.deploy(kernelAddress);
  await curveAdapter.waitForDeployment();
  const curveAddr = await curveAdapter.getAddress();
  console.log("CurveAdapter deployed to:", curveAddr);

  await curveAdapter.setActionExecutor(actionExecutorAddress);
  console.log("CurveAdapter configured with ActionExecutor");

  // 2. Deploy MorphoAdapter
  const MorphoAdapter = await hre.ethers.getContractFactory("MorphoAdapter");
  const morphoAdapter = await MorphoAdapter.deploy(morphoAddress, kernelAddress);
  await morphoAdapter.waitForDeployment();
  const morphoAddr = await morphoAdapter.getAddress();
  console.log("MorphoAdapter deployed to:", morphoAddr);

  console.log("\nDeployment Summary:");
  console.log("-------------------");
  console.log(`CurveAdapter: ${curveAddr}`);
  console.log(`MorphoAdapter: ${morphoAddr}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
