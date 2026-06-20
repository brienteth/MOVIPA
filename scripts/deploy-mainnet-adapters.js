const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying mainnet adapters with the account:", deployer.address);

  // Address of existing Kernel and Routers
  const kernelAddress = "0x011b9A74D16e043ba3f227B4ADa41374F141d300"; // From contracts.ts
  
  // Real or mock addresses for Aave and Uniswap on Sepolia
  // Aave V3 Pool Sepolia: 0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951
  // Uniswap V3 SwapRouter02 Sepolia: 0x3bFA4769FC09EcdA60Ce8f2b7b2ceC74BdfF5286
  const aavePool = "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951";
  const uniV3Router = "0x3bFA4769FC09EcdA60Ce8f2b7b2ceC74BdfF5286";

  console.log("Deploying AaveFlashAdapter...");
  const AaveFlashAdapter = await hre.ethers.getContractFactory("AaveFlashAdapter");
  const aaveFlashAdapter = await AaveFlashAdapter.deploy(aavePool, kernelAddress);
  await aaveFlashAdapter.waitForDeployment();
  console.log("AaveFlashAdapter deployed to:", await aaveFlashAdapter.getAddress());

  console.log("Deploying AaveV3LendingAdapter...");
  const AaveLendAdapter = await hre.ethers.getContractFactory("AaveV3LendingAdapter");
  const aaveLendAdapter = await AaveLendAdapter.deploy(aavePool, kernelAddress);
  await aaveLendAdapter.waitForDeployment();
  console.log("AaveV3LendingAdapter deployed to:", await aaveLendAdapter.getAddress());

  console.log("Deploying UniswapV3SwapAdapter...");
  const UniV3SwapAdapter = await hre.ethers.getContractFactory("UniswapV3SwapAdapter");
  const uniV3SwapAdapter = await UniV3SwapAdapter.deploy(uniV3Router, kernelAddress);
  await uniV3SwapAdapter.waitForDeployment();
  console.log("UniswapV3SwapAdapter deployed to:", await uniV3SwapAdapter.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
