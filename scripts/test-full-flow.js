const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("=== BRICK3 Full Flow Test: Flash Loan + 2 Swaps ===");
  console.log("Deployer:", deployer.address);

  const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  const WETH = "0x4200000000000000000000000000000000000006";
  const kernelAddr = "0x18C1d2974D512bEbE2b3bE36375B62f5eb1C38E2";
  const routerAddr = "0x09Bee01F41D36B40e4eB86c4557D1f572949d516";
  const registryAddr = "0xF30f02c6b2bb2D2345C72cCD759F56B8e924D8b1";
  const aaveAdapterAddr = "0x0f840e0DeA1c11b2aB35A8f18A3ab4ac47cF5262";
  const uniAdapterAddr = "0x68Fcae27158aC9464CB54A51c6F0A2A427eb2B36";

  const abiCoder = new ethers.AbiCoder();
  const flashAmount = 1000000n; // 1 USDC (6 decimals)

  // Action 1: Flash Loan 1 USDC
  const flashParams = abiCoder.encode(
    ["address", "address", "uint256"],
    [aaveAdapterAddr, USDC, flashAmount]
  );

  // Action 2: Swap USDC → WETH (inside flash loan callback)
  const swapParams1 = abiCoder.encode(
    ["address", "address", "address", "uint256", "uint256", "bytes"],
    [uniAdapterAddr, USDC, WETH, flashAmount, 0, "0x"] // dex, tokenIn, tokenOut, amountIn, minAmountOut, extraData
  );

  // Action 3: Swap WETH → USDC (swap back)
  // We don't know exact WETH amount, use 0 for amountIn (adapter should use balance)
  // Actually we need to estimate. 1 USDC ≈ 0.0003 WETH at ~$3300/ETH
  // Let's use a very small minAmountOut
  const swapParams2 = abiCoder.encode(
    ["address", "address", "address", "uint256", "uint256", "bytes"],
    [uniAdapterAddr, WETH, USDC, 0, 0, "0x"] // Will need actual amount
  );

  // Flash loan with nested swaps
  const actions = [
    { actionType: 0, params: flashParams },  // FLASH_LOAN - remaining actions run inside callback
    { actionType: 1, params: swapParams1 },  // SWAP USDC -> WETH
    { actionType: 1, params: swapParams2 },  // SWAP WETH -> USDC
  ];

  const uniqueId = "full-flow-" + Date.now();
  const strategyHash = ethers.keccak256(ethers.toUtf8Bytes(uniqueId));

  const registry = await ethers.getContractAt("StrategyRegistry", registryAddr, deployer);
  const router = await ethers.getContractAt("Brick3Router", routerAddr, deployer);

  // Register
  console.log("\n1. Registering strategy...");
  const regTx = await registry.registerStrategy(strategyHash, "test://" + uniqueId);
  await regTx.wait();
  console.log("   Done.");

  await new Promise(r => setTimeout(r, 3000));

  // Static call
  console.log("2. Static call (simulation)...");
  const deadline = Math.floor(Date.now() / 1000) + 600;
  try {
    const simResult = await router.executeStrategy.staticCall(
      actions, 0, deadline, strategyHash
    );
    console.log("   SUCCESS! Net profit:", simResult[0].toString(), "Fee:", simResult[1].toString());
    
    // Real execution
    console.log("3. Real execution...");
    const execTx = await router.executeStrategy(
      actions, 0, deadline, strategyHash,
      { gasLimit: 5000000 }
    );
    console.log("   Tx:", execTx.hash);
    const receipt = await execTx.wait();
    console.log("   ✅ CONFIRMED! Block:", receipt.blockNumber, "Gas:", receipt.gasUsed.toString());
    
    // Check events
    for (const log of receipt.logs) {
      try {
        const parsed = router.interface.parseLog(log);
        if (parsed) console.log("   Event:", parsed.name, parsed.args);
      } catch {}
    }
  } catch (e) {
    console.error("   FAILED:", e.reason || e.message);
    if (e.data) {
      // Try to decode error
      console.error("   Error data:", e.data.substring(0, 200));
    }
    
    // If swap fails, let's test just flash loan + 1 swap
    console.log("\n--- Trying simpler: Flash Loan + 1 Swap only ---");
    const actions2 = [
      { actionType: 0, params: flashParams },
      { actionType: 1, params: swapParams1 },
    ];
    const hash2 = ethers.keccak256(ethers.toUtf8Bytes("simple-" + Date.now()));
    await (await registry.registerStrategy(hash2, "test://simple")).wait();
    await new Promise(r => setTimeout(r, 3000));
    
    try {
      const result = await router.executeStrategy.staticCall(actions2, 0, deadline, hash2);
      console.log("   Simple flow SUCCESS:", result);
    } catch (e2) {
      console.error("   Simple flow FAILED:", e2.reason || e2.message);
    }
  }
}

main().catch(console.error);
