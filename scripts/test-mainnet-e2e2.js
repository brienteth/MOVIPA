const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  const routerAddr = "0x09Bee01F41D36B40e4eB86c4557D1f572949d516";
  const registryAddr = "0xF30f02c6b2bb2D2345C72cCD759F56B8e924D8b1";
  
  const router = await ethers.getContractAt("Brick3Router", routerAddr, deployer);
  const routerRegistry = await router.registry();
  
  console.log("Router's internal registry:", routerRegistry);
  console.log("Our registry address:     ", registryAddr);
  console.log("Match:", routerRegistry.toLowerCase() === registryAddr.toLowerCase());

  // Let's also check executor
  const routerExecutor = await router.executor();
  console.log("Router's executor:", routerExecutor);
  console.log("Expected kernel:  0x18C1d2974D512bEbE2b3bE36375B62f5eb1C38E2");
  
  // Now register + verify + execute in a careful sequence
  const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  const aaveAdapterAddr = "0x0f840e0DeA1c11b2aB35A8f18A3ab4ac47cF5262";
  const flashAmount = 1000000n;
  const abiCoder = new ethers.AbiCoder();
  
  const flashParams = abiCoder.encode(
    ["address", "address", "uint256"],
    [aaveAdapterAddr, USDC, flashAmount]
  );
  const actions = [{ actionType: 0, params: flashParams }];
  
  const strategyHash = ethers.keccak256(
    ethers.toUtf8Bytes("test-e2e2-" + Date.now())
  );
  console.log("\nStrategy hash:", strategyHash);

  // Register on the ROUTER's registry (use that address)
  const registry = await ethers.getContractAt("StrategyRegistry", routerRegistry, deployer);
  
  console.log("Registering strategy on router's registry...");
  const regTx = await registry.registerStrategy(strategyHash, "test://e2e2");
  await regTx.wait();
  console.log("Registered! Tx:", regTx.hash);
  
  // Verify
  const strategy = await registry.strategies(strategyHash);
  console.log("Strategy exists:", strategy.exists);
  console.log("Strategy creator:", strategy.creator);

  // Static call
  console.log("\n--- Static call ---");
  try {
    const deadline = Math.floor(Date.now() / 1000) + 600;
    const result = await router.executeStrategy.staticCall(
      actions, 0, deadline, strategyHash
    );
    console.log("SUCCESS! Net profit:", result[0].toString(), "Fee:", result[1].toString());
  } catch (e) {
    console.error("FAILED:", e.reason || e.message);
    
    // Debug: try markUsed directly
    console.log("\n--- Debug: direct markUsed call ---");
    try {
      await registry.markUsed.staticCall(strategyHash);
      console.log("markUsed staticCall succeeded!");
    } catch (e2) {
      console.error("markUsed failed too:", e2.reason || e2.message);
    }
    
    // Debug: try getCreator directly
    const creator = await registry.getCreator(strategyHash);
    console.log("getCreator returned:", creator);
  }
}

main().catch(console.error);
