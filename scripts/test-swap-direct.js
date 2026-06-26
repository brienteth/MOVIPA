const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  const WETH = "0x4200000000000000000000000000000000000006";
  const kernelAddr = "0x18C1d2974D512bEbE2b3bE36375B62f5eb1C38E2";
  const uniAdapterAddr = "0x68Fcae27158aC9464CB54A51c6F0A2A427eb2B36";
  const swapManagerAddr = "0xE0C701bDc519BCfB0C36B1fFbAf44308A3D0672c";
  const actionExecutorAddr = "0xd190A715Ee25bfd2Ebfc19292A3d1c0544c6EA28";

  const abiCoder = new ethers.AbiCoder();
  
  // Step 1: Test if ActionExecutor is callable by Kernel
  const kernel = await ethers.getContractAt("StrategyExecutorKernel", kernelAddr, deployer);
  
  // The swap flow is:
  // Router.executeStrategy -> Kernel.executeStrategy -> ActionExecutor.executeAction -> SwapManager.executeSwap -> UniswapV3SwapAdapter.swap
  
  // Let's check the ActionExecutor contract for any access control
  const actionExec = await ethers.getContractAt("ActionExecutor", actionExecutorAddr, deployer);
  
  // ActionExecutor has no access control - anyone can call executeAction!
  // But it calls SwapManager.executeSwap which calls UniV3Adapter.swap
  // UniV3Adapter.swap checks: msg.sender == kernel || msg.sender == actionExecutor
  // But the caller is SwapManager, not ActionExecutor!
  
  // Wait - UniV3Adapter.actionExecutor is set to SwapManager, so:
  // require(msg.sender == kernel || msg.sender == actionExecutor)
  // actionExecutor = SwapManager ✓ 
  
  // BUT! SwapManager calls uniAdapter.swap(p) where msg.sender = SwapManager ✓
  // Then UniV3Adapter does: IERC20(params.tokenIn).transferFrom(kernel, address(this), params.amountIn)
  // This requires kernel to have approved UniV3Adapter for USDC - which we did ✓
  
  // So the issue is somewhere else. Let me encode params differently.
  // ActionExecutor does: abi.decode(action.params, (StrategyTypes.SwapParams))
  // SwapParams is a struct, so it's encoded as a tuple
  
  // Let me try encoding WITHOUT the outer tuple wrapper:
  const swapParams = abiCoder.encode(
    ["address", "address", "address", "uint256", "uint256", "bytes"],
    [uniAdapterAddr, USDC, WETH, 9500n, 0, "0x"]
  );
  
  console.log("Swap params (flat):", swapParams);
  
  const actions = [{ actionType: 1, params: swapParams }];
  const strategyHash = ethers.keccak256(ethers.toUtf8Bytes("swap-direct-" + Date.now()));
  
  const registryAddr = "0xF30f02c6b2bb2D2345C72cCD759F56B8e924D8b1";
  const routerAddr = "0x09Bee01F41D36B40e4eB86c4557D1f572949d516";
  const registry = await ethers.getContractAt("StrategyRegistry", registryAddr, deployer);
  const router = await ethers.getContractAt("Brick3Router", routerAddr, deployer);
  
  await (await registry.registerStrategy(strategyHash, "test")).wait();
  await new Promise(r => setTimeout(r, 3000));
  
  const deadline = Math.floor(Date.now() / 1000) + 600;
  
  console.log("Testing with flat encoding...");
  try {
    const result = await router.executeStrategy.staticCall(actions, 0, deadline, strategyHash);
    console.log("SUCCESS:", result);
  } catch (e) {
    console.error("FAILED:", e.reason || e.message);
    
    // Maybe the problem is that 9500 (0.0095 USDC) is too small for Uniswap
    // Try with a slightly larger amount - but we only have 0.0095 USDC in kernel
    // Let's try with the exact kernel balance
    console.log("\nKernel has 9500 units (0.0095 USDC). This might be too small for Uniswap pool.");
    console.log("Uniswap may revert due to dust amount.");
    
    // Try: fund kernel with more USDC and retry
    const erc20 = new ethers.Contract(USDC, [
      "function balanceOf(address) view returns (uint256)",
      "function transfer(address,uint256) returns (bool)"
    ], deployer);
    
    const deployerBal = await erc20.balanceOf(deployer.address);
    console.log("Deployer USDC:", ethers.formatUnits(deployerBal, 6));
    
    if (deployerBal >= 500000n) {
      console.log("Funding kernel with 0.5 USDC...");
      await (await erc20.transfer(kernelAddr, 500000n)).wait();
      
      // Re-encode with 500000
      const swapParams2 = abiCoder.encode(
        ["address", "address", "address", "uint256", "uint256", "bytes"],
        [uniAdapterAddr, USDC, WETH, 500000n, 0, "0x"]
      );
      const actions2 = [{ actionType: 1, params: swapParams2 }];
      const hash2 = ethers.keccak256(ethers.toUtf8Bytes("swap2-" + Date.now()));
      await (await registry.registerStrategy(hash2, "test2")).wait();
      await new Promise(r => setTimeout(r, 3000));
      
      console.log("Retrying with 0.5 USDC...");
      try {
        const result = await router.executeStrategy.staticCall(actions2, 0, deadline, hash2);
        console.log("SUCCESS:", result);
      } catch (e2) {
        console.error("Still FAILED:", e2.reason || e2.message);
      }
    }
  }
}

main().catch(console.error);
