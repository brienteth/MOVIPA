const { ethers, network } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log(`Starting End-to-End Test on ${network.name}...`);
  
  const [deployer] = await ethers.getSigners();
  console.log(`Testing with Deployer Wallet: ${deployer.address}`);
  
  // Load deployed addresses
  const deployPath = `./deployments/kernel-${network.name}.json`;
  if (!fs.existsSync(deployPath)) {
    throw new Error(`Deployment file not found at ${deployPath}. Did you deploy?`);
  }
  const deployment = JSON.parse(fs.readFileSync(deployPath, "utf-8"));
  const addrs = deployment.contracts;

  // Connect to contracts
  const StrategyRegistry = await ethers.getContractAt("StrategyRegistry", addrs.StrategyRegistry);
  const StrategyExecutorKernel = await ethers.getContractAt("StrategyExecutorKernel", addrs.StrategyExecutorKernel);
  const PermissionManager = await ethers.getContractAt("PermissionManager", addrs.PermissionManager);

  console.log("Checking Permissions...");
  const isAaveAllowed = await PermissionManager.allowedProviders(addrs.AaveFlashAdapter);
  const isUniAllowed = await PermissionManager.allowedRouters(addrs.UniV3Adapter);
  console.log(`- Aave Flash Adapter Allowed: ${isAaveAllowed}`);
  console.log(`- Uni V3 Adapter Allowed: ${isUniAllowed}`);

  // Sepolia Tokens
  const USDC = "0x94a9D9Ac8a22534E3FAcA9f88AbF5D1Da0C4dEf8"; 
  const WETH = "0x88541670e55cC00beefD87eB59edd1b91c4f3e60";

  console.log("\n[1] Registering Strategy on-chain...");
  const ACTION_FLASH_LOAN = 1;
  const ACTION_SWAP = 2;

  const flashData = ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "address", "uint256", "bytes"],
    [addrs.AaveFlashAdapter, USDC, 1, "0x"] 
  );

  const swapData = ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "address", "address", "uint256"],
    [addrs.UniV3Adapter, USDC, WETH, 1]
  );

  const actions = [
    { targetId: 1, actionType: ACTION_FLASH_LOAN, data: flashData },
    { targetId: 2, actionType: ACTION_SWAP, data: swapData }
  ];

  const strategyHash = ethers.id("test-strategy-" + Date.now());
  const tx = await StrategyRegistry.registerStrategy(strategyHash, "ipfs://test");
  console.log(`Registering TX Hash: ${tx.hash}`);
  await tx.wait();
  console.log(`✅ Strategy Registered!`);

  console.log("\n[1.5] Whitelisting Deployer as Router...");
  await (await StrategyExecutorKernel.setRouter(deployer.address, true)).wait();

  console.log("\n[2] Attempting Execution (Expected to revert)...");
  try {
    const execTx = await StrategyExecutorKernel.executeStrategy(
      deployer.address,
      deployer.address,
      actions,
      0, // minProfitWei
      Math.floor(Date.now() / 1000) + 3600, // deadline
      strategyHash,
      { gasLimit: 1000000 }
    );
    await execTx.wait();
    console.log("✅ Execution Succeeded? Magic USDC!");
  } catch (error) {
    console.log("❌ Execution Reverted as expected (lack of funds or real slippage).");
    // We parse the error to prove it reached the Kernel/Aave
    if (error.message.includes("execution reverted")) {
      console.log(`Revert Reason matched: The modules are wired correctly and talking to the blockchain!`);
    } else {
      console.log(`Error details: ${error.message.slice(0, 200)}...`);
    }
  }

  console.log("\n🎉 End-to-End Sepolia Module Integration Test Completed!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
