const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Starting deployment on Base Mainnet with account: ${deployer.address}`);

  const kernelAddress = "0x18C1d2974D512bEbE2b3bE36375B62f5eb1C38E2";
  const permissionManagerAddress = "0x618A13a1dE79cde892a1cA5B3FC24D4AA66b718D";
  const swapManagerAddress = "0xE0C701bDc519BCfB0C36B1fFbAf44308A3D0672c";
  
  const uniV3Router = "0x2626664c2603336E57B271c5C0b26F421741e481";
  const aavePool = "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5";

  const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  const WETH = "0x4200000000000000000000000000000000000006";

  // 1. Deploy new UniswapV3SwapAdapter
  console.log("\nDeploying dynamic UniswapV3SwapAdapter...");
  const UniV3Factory = await ethers.getContractFactory("UniswapV3SwapAdapter");
  const newSwapAdapter = await UniV3Factory.deploy(uniV3Router, kernelAddress);
  await newSwapAdapter.waitForDeployment();
  const swapAdapterAddress = await newSwapAdapter.getAddress();
  console.log(`UniswapV3SwapAdapter deployed to: ${swapAdapterAddress}`);

  // 2. Deploy new AaveV3LendingAdapter
  console.log("\nDeploying dynamic AaveV3LendingAdapter...");
  const AaveLendFactory = await ethers.getContractFactory("AaveV3LendingAdapter");
  const newLendAdapter = await AaveLendFactory.deploy(aavePool, kernelAddress);
  await newLendAdapter.waitForDeployment();
  const lendAdapterAddress = await newLendAdapter.getAddress();
  console.log(`AaveV3LendingAdapter deployed to: ${lendAdapterAddress}`);

  // 3. Set Action Executor on dynamic swap adapter to SwapManager
  console.log("\nSetting SwapManager as actionExecutor in new UniswapV3SwapAdapter...");
  let tx = await newSwapAdapter.setActionExecutor(swapManagerAddress);
  await tx.wait();
  console.log(`SwapManager set. Hash: ${tx.hash}`);

  // 4. Whitelist new swap adapter in PermissionManager
  console.log("\nWhitelisting UniswapV3SwapAdapter in PermissionManager...");
  const pm = await ethers.getContractAt("PermissionManager", permissionManagerAddress, deployer);
  tx = await pm.setRouter(swapAdapterAddress, true);
  await tx.wait();
  console.log(`Whitelisted swap adapter. Hash: ${tx.hash}`);

  // 5. Setup approvals from Kernel to the new adapters
  console.log("\nSetting up Kernel token approvals for new adapters...");
  const kernel = await ethers.getContractAt("StrategyExecutorKernel", kernelAddress, deployer);
  const maxAmount = ethers.MaxUint256;

  console.log("Approving new UniswapV3SwapAdapter for USDC...");
  tx = await kernel.approveToken(USDC, swapAdapterAddress, maxAmount);
  await tx.wait();

  console.log("Approving new UniswapV3SwapAdapter for WETH...");
  tx = await kernel.approveToken(WETH, swapAdapterAddress, maxAmount);
  await tx.wait();

  console.log("Approving new AaveV3LendingAdapter for USDC...");
  tx = await kernel.approveToken(USDC, lendAdapterAddress, maxAmount);
  await tx.wait();

  console.log("Approving new AaveV3LendingAdapter for WETH...");
  tx = await kernel.approveToken(WETH, lendAdapterAddress, maxAmount);
  await tx.wait();

  console.log("\nDeployment and setup complete!");
  console.log("-----------------------------------------");
  console.log(`New UniV3Adapter:      ${swapAdapterAddress}`);
  console.log(`New AaveV3LendAdapter: ${lendAdapterAddress}`);
  console.log("-----------------------------------------");
}

main().catch(console.error);
