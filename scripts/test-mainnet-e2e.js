const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("=== BRICK3 Base Mainnet E2E Test ===");
  console.log("Deployer:", deployer.address);

  // Addresses
  const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  const WETH = "0x4200000000000000000000000000000000000006";
  const kernelAddr = "0x18C1d2974D512bEbE2b3bE36375B62f5eb1C38E2";
  const routerAddr = "0x09Bee01F41D36B40e4eB86c4557D1f572949d516";
  const registryAddr = "0xF30f02c6b2bb2D2345C72cCD759F56B8e924D8b1";
  const aaveAdapterAddr = "0x0f840e0DeA1c11b2aB35A8f18A3ab4ac47cF5262";
  const uniAdapterAddr = "0x68Fcae27158aC9464CB54A51c6F0A2A427eb2B36";
  const flashManagerAddr = "0xdd345972941c3acfAEFf6b14FA20b4Eea3c32F76";
  const swapManagerAddr = "0xE0C701bDc519BCfB0C36B1fFbAf44308A3D0672c";
  const actionExecutorAddr = "0xd190A715Ee25bfd2Ebfc19292A3d1c0544c6EA28";
  const permManagerAddr = "0x618A13a1dE79cde892a1cA5B3FC24D4AA66b718D";

  // ERC20 interface
  const erc20 = new ethers.Contract(USDC, [
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address,uint256) returns (bool)",
    "function allowance(address,address) view returns (uint256)",
    "function decimals() view returns (uint8)"
  ], deployer);

  const weth = new ethers.Contract(WETH, [
    "function balanceOf(address) view returns (uint256)",
  ], deployer);

  // ---- Step 1: Check balances ----
  const deployerUsdc = await erc20.balanceOf(deployer.address);
  const kernelUsdc = await erc20.balanceOf(kernelAddr);
  const deployerEth = await ethers.provider.getBalance(deployer.address);
  console.log("\n--- Balances ---");
  console.log("Deployer ETH:", ethers.formatEther(deployerEth));
  console.log("Deployer USDC:", ethers.formatUnits(deployerUsdc, 6));
  console.log("Kernel USDC:", ethers.formatUnits(kernelUsdc, 6));

  // ---- Step 2: Check all permissions ----
  console.log("\n--- Permission Checks ---");
  const kernel = await ethers.getContractAt("StrategyExecutorKernel", kernelAddr, deployer);
  const router = await ethers.getContractAt("Brick3Router", routerAddr, deployer);
  const perm = await ethers.getContractAt("PermissionManager", permManagerAddr, deployer);
  const aaveAdapter = await ethers.getContractAt("AaveFlashAdapter", aaveAdapterAddr, deployer);
  const uniAdapter = await ethers.getContractAt("UniswapV3SwapAdapter", uniAdapterAddr, deployer);

  const isRouterAllowed = await kernel.allowedRouters(routerAddr);
  const isAaveTrusted = await kernel.trustedAdapters(aaveAdapterAddr);
  const isAaveProviderAllowed = await perm.allowedProviders(aaveAdapterAddr);
  const isUsdcAllowed = await perm.allowedTokens(USDC);
  const isWethAllowed = await perm.allowedTokens(WETH);
  const isUniRouterAllowed = await perm.allowedRouters(uniAdapterAddr);
  
  const aaveActionExecutor = await aaveAdapter.actionExecutor();
  const uniActionExecutor = await uniAdapter.actionExecutor();
  
  const kernelUsdcAllowanceAave = await erc20.allowance(kernelAddr, aaveAdapterAddr);
  const kernelUsdcAllowanceUni = await erc20.allowance(kernelAddr, uniAdapterAddr);

  console.log("Router allowed on Kernel:", isRouterAllowed);
  console.log("AaveAdapter trusted on Kernel:", isAaveTrusted);
  console.log("AaveAdapter as provider allowed:", isAaveProviderAllowed);
  console.log("USDC token allowed:", isUsdcAllowed);
  console.log("WETH token allowed:", isWethAllowed);
  console.log("UniV3Adapter as router allowed:", isUniRouterAllowed);
  console.log("AaveAdapter.actionExecutor:", aaveActionExecutor, "(expected FlashLoanManager:", flashManagerAddr + ")");
  console.log("UniAdapter.actionExecutor:", uniActionExecutor, "(expected SwapManager:", swapManagerAddr + ")");
  console.log("Kernel USDC allowance -> AaveAdapter:", ethers.formatUnits(kernelUsdcAllowanceAave, 6));
  console.log("Kernel USDC allowance -> UniAdapter:", ethers.formatUnits(kernelUsdcAllowanceUni, 6));

  // ---- Step 3: Fund kernel with USDC to cover Aave premium ----
  // Aave flash premium on Base = 0.05% = 500 on 1M (1 USDC)
  // We'll send 0.01 USDC (10000) to kernel to cover premium and have profit
  if (kernelUsdc < 10000n) {
    if (deployerUsdc >= 10000n) {
      console.log("\n--- Funding kernel with 0.01 USDC to cover premium ---");
      const fundTx = await erc20.transfer(kernelAddr, 10000n);
      await fundTx.wait();
      console.log("Funded! Tx:", fundTx.hash);
    } else {
      console.log("ERROR: Deployer has no USDC to fund kernel!");
      return;
    }
  } else {
    console.log("\nKernel already has enough USDC to cover premium.");
  }

  // ---- Step 4: Build and simulate strategy ----
  const flashAmount = 1000000n; // 1 USDC
  const abiCoder = new ethers.AbiCoder();

  // Flash Loan action
  const flashParams = abiCoder.encode(
    ["address", "address", "uint256"],
    [aaveAdapterAddr, USDC, flashAmount]
  );

  // Just flash loan (borrow & repay) - simplest possible test
  const actions = [
    { actionType: 0, params: flashParams } // FLASH_LOAN only
  ];

  const strategyHash = ethers.keccak256(
    ethers.toUtf8Bytes("test-mainnet-e2e-" + Date.now())
  );

  // Register strategy
  const registry = await ethers.getContractAt("StrategyRegistry", registryAddr, deployer);
  console.log("\n--- Registering strategy ---");
  const regTx = await registry.registerStrategy(strategyHash, "test://e2e");
  await regTx.wait();
  console.log("Registered! Tx:", regTx.hash);

  // Static call first
  console.log("\n--- Static call (simulation) ---");
  try {
    const deadline = Math.floor(Date.now() / 1000) + 600;
    const result = await router.executeStrategy.staticCall(
      actions, 0, deadline, strategyHash
    );
    console.log("Static call SUCCESS! Net profit:", result[0].toString(), "Fee:", result[1].toString());
  } catch (e) {
    console.error("Static call FAILED:", e.reason || e.message);
    if (e.data) console.error("Data:", e.data);
    return;
  }

  // Actual execution
  console.log("\n--- REAL execution ---");
  try {
    const deadline = Math.floor(Date.now() / 1000) + 600;
    const execTx = await router.executeStrategy(
      actions, 0, deadline, strategyHash,
      { gasLimit: 3000000 }
    );
    console.log("Tx submitted:", execTx.hash);
    const receipt = await execTx.wait();
    console.log("✅ TX CONFIRMED! Block:", receipt.blockNumber, "Gas used:", receipt.gasUsed.toString());
    console.log("Status:", receipt.status === 1 ? "SUCCESS" : "FAILED");
  } catch (e) {
    console.error("Execution FAILED:", e.reason || e.message);
  }

  // Final balances
  const finalKernelUsdc = await erc20.balanceOf(kernelAddr);
  console.log("\n--- Final Balances ---");
  console.log("Kernel USDC:", ethers.formatUnits(finalKernelUsdc, 6));
}

main().catch(console.error);
