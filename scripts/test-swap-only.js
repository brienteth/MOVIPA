const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("=== Testing Swap Without Flash Loan ===");

  const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  const WETH = "0x4200000000000000000000000000000000000006";
  const kernelAddr = "0x18C1d2974D512bEbE2b3bE36375B62f5eb1C38E2";
  const routerAddr = "0x09Bee01F41D36B40e4eB86c4557D1f572949d516";
  const registryAddr = "0xF30f02c6b2bb2D2345C72cCD759F56B8e924D8b1";
  const uniAdapterAddr = "0x68Fcae27158aC9464CB54A51c6F0A2A427eb2B36";
  const swapManagerAddr = "0xE0C701bDc519BCfB0C36B1fFbAf44308A3D0672c";
  const actionExecutorAddr = "0xd190A715Ee25bfd2Ebfc19292A3d1c0544c6EA28";
  const permManagerAddr = "0x618A13a1dE79cde892a1cA5B3FC24D4AA66b718D";

  // Check kernel has USDC
  const erc20 = new ethers.Contract(USDC, [
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address,address) view returns (uint256)",
  ], deployer);
  
  const kernelBal = await erc20.balanceOf(kernelAddr);
  console.log("Kernel USDC balance:", ethers.formatUnits(kernelBal, 6));
  
  // Check permissions for swap path
  const perm = await ethers.getContractAt("PermissionManager", permManagerAddr, deployer);
  const isUniAllowed = await perm.allowedRouters(uniAdapterAddr);
  console.log("UniV3 allowed as router in PermissionManager:", isUniAllowed);
  
  // Check allowances: kernel -> uniAdapter
  const allowance = await erc20.allowance(kernelAddr, uniAdapterAddr);
  console.log("Kernel USDC allowance to UniAdapter:", ethers.formatUnits(allowance, 6));
  
  // Check: ActionExecutor -> what calls SwapManager?
  // ActionExecutor.executeAction -> SwapManager.executeSwap -> UniswapAdapter.swap
  // UniswapAdapter requires msg.sender == kernel || msg.sender == actionExecutor
  // But SwapManager calls it, not ActionExecutor or kernel!
  
  const uniAdapter = await ethers.getContractAt("UniswapV3SwapAdapter", uniAdapterAddr, deployer);
  const uniKernel = await uniAdapter.kernel();
  const uniAE = await uniAdapter.actionExecutor();
  console.log("UniAdapter.kernel:", uniKernel);
  console.log("UniAdapter.actionExecutor:", uniAE, "(SwapManager:", swapManagerAddr + ")");
  
  // The problem: SwapManager calls uniAdapter.swap(), but uniAdapter checks
  // msg.sender == kernel || msg.sender == actionExecutor
  // SwapManager is neither! SwapManager is set as actionExecutor, but let's verify
  console.log("SwapManager == uniAdapter.actionExecutor?", uniAE.toLowerCase() === swapManagerAddr.toLowerCase());
  
  // Now try a swap-only strategy
  const abiCoder = new ethers.AbiCoder();
  
  // Encode swap params matching the SwapParams struct
  const swapParams = abiCoder.encode(
    ["tuple(address,address,address,uint256,uint256,bytes)"],
    [[uniAdapterAddr, USDC, WETH, kernelBal, 0, "0x"]]
  );
  console.log("\nSwap params encoded length:", swapParams.length);
  
  // Actually ActionExecutor decodes it as SwapParams memory:
  // abi.decode(action.params, (StrategyTypes.SwapParams))
  // which is the same as tuple(address,address,address,uint256,uint256,bytes)
  
  const actions = [{ actionType: 1, params: swapParams }];
  const strategyHash = ethers.keccak256(ethers.toUtf8Bytes("swap-test-" + Date.now()));
  
  const registry = await ethers.getContractAt("StrategyRegistry", registryAddr, deployer);
  const router = await ethers.getContractAt("Brick3Router", routerAddr, deployer);
  
  console.log("\nRegistering...");
  await (await registry.registerStrategy(strategyHash, "test://swap")).wait();
  await new Promise(r => setTimeout(r, 3000));
  
  console.log("Static call...");
  const deadline = Math.floor(Date.now() / 1000) + 600;
  try {
    const result = await router.executeStrategy.staticCall(actions, 0, deadline, strategyHash);
    console.log("SUCCESS:", result);
  } catch (e) {
    console.error("FAILED:", e.reason || e.message);
    // Try to get more info
    if (e.info?.error?.data) console.error("Error data:", e.info.error.data);
  }
}

main().catch(console.error);
