const { ethers, network } = require("hardhat");

async function deploy(name, args = []) {
  const F = await ethers.getContractFactory(name);
  const c = await F.deploy(...args);
  await c.waitForDeployment();
  const addr = await c.getAddress();
  console.log(`- ${name}: ${addr}`);
  return c;
}

async function main() {
  console.log(`Deploying BRICK3 kernel on ${network.name}...`);
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);

  // Core managers
  const permissionManager = await deploy("PermissionManager");
  const treasuryManager = await deploy("TreasuryManager", [deployer.address, 1000, 500]);
  const profitManager = await deploy("ProfitManager");
  const conditionManager = await deploy("ConditionManager");

  // Placeholders for Aave / Uniswap V3 on Sonic
  // We use Flying Tulip's Lend USDC Aave Strategy on Sonic as the Aave pool placeholder for now
  const aavePool = "0xf09b9d5aBDe8B84d36578f6DA977440332D94DDa";
  const uniV3Router = ethers.ZeroAddress;

  const strategyRegistry = await deploy("StrategyRegistry");
  const simulationHelper = await deploy("SimulationHelper");
  const solverRegistry = await deploy("SolverRegistry");
  const intentSettlement = await deploy("IntentSettlement", [
    await solverRegistry.getAddress(),
    deployer.address,
    100,
  ]);
  const erc7756QuicTransport = await deploy("ERC7756QuicTransport");
  const crossChainIntentInbox = await deploy("CrossChainIntentInbox", [
    await erc7756QuicTransport.getAddress(),
  ]);

  const flashLoanManager = await deploy("FlashLoanManager", [await permissionManager.getAddress()]);
  const swapManager = await deploy("SwapManager", [await permissionManager.getAddress()]);
  const lendingManager = await deploy("LendingManager");
  const actionExecutor = await deploy("ActionExecutor", [
    await flashLoanManager.getAddress(),
    await swapManager.getAddress(),
    await lendingManager.getAddress(),
  ]);

  const strategyExecutorKernel = await deploy("StrategyExecutorKernel", [
    await actionExecutor.getAddress(),
    await profitManager.getAddress(),
    await treasuryManager.getAddress(),
  ]);

  const brick3Router = await deploy("Brick3Router", [
    await strategyExecutorKernel.getAddress(),
    await strategyRegistry.getAddress(),
    await simulationHelper.getAddress(),
    await erc7756QuicTransport.getAddress(),
  ]);

  // Standard adapters
  const aaveFlashAdapter = await deploy("AaveFlashAdapter", [aavePool, await strategyExecutorKernel.getAddress()]);
  const aaveLendAdapter = await deploy("AaveV3LendingAdapter", [aavePool, await strategyExecutorKernel.getAddress()]);
  const uniV3Adapter = await deploy("UniswapV3SwapAdapter", [uniV3Router, await strategyExecutorKernel.getAddress()]);

  // Flying Tulip Mock Adapters
  // Flying Tulip Real Integration Adapter
  const ftMintAndRedeem = "0x0C6f8eC81c3eA5BFf06F6CD0791780f9f050eE31";
  const realFtUSD = "0xF7D85EC4E7710f71992752eac2111312e73E9C9C";
  const flyingTulipAdapter = await deploy("FlyingTulipAdapter", [ftMintAndRedeem, realFtUSD]);
  const mockSwapAdapter = await deploy("UniV3Adapter"); // Mock swap adapter

  console.log("Wiring permissions...");

  // Wiring Router & Relayers
  await (await strategyExecutorKernel.setRouter(await brick3Router.getAddress(), true)).wait();
  await (await brick3Router.setRelayer(deployer.address, true)).wait();
  await (await crossChainIntentInbox.setRelayer(deployer.address, true)).wait();
  await (await intentSettlement.setRelayer(deployer.address, true)).wait();

  // Wiring callback trust
  await (await strategyExecutorKernel.setTrustedAdapter(await aaveFlashAdapter.getAddress(), true)).wait();

  // Wiring Providers and Routers in PermissionManager
  await (await permissionManager.setProvider(await aaveFlashAdapter.getAddress(), true)).wait();
  await (await permissionManager.setProvider(await flashLoanManager.getAddress(), true)).wait();
  await (await aaveFlashAdapter.setActionExecutor(await flashLoanManager.getAddress())).wait();
  await (await permissionManager.setRouter(await uniV3Adapter.getAddress(), true)).wait();
  
  // Wire Flying Tulip Adapter
  await (await permissionManager.setProvider(await flyingTulipAdapter.getAddress(), true)).wait();
  await (await flyingTulipAdapter.setLendingManager(await lendingManager.getAddress())).wait();
  await (await permissionManager.setRouter(await mockSwapAdapter.getAddress(), true)).wait();

  // Whitelist tokens
  const tokensToWhitelist = [
    "0xF7D85EC4E7710f71992752eac2111312e73E9C9C", // Real ftUSD (Proxy) on Sonic Mainnet
    "0x50c4271a269386c6b17dc69a5a4086ad2791d01b", // wS (Wrapped Sonic)
    "0x29219dd400f2Bf60E5a23d13Be72B486D4038894", // USDC on Sonic Mainnet
    "0x0000000000000000000000000000000000000000"  // Native S (Zero address)
  ];

  for (const t of tokensToWhitelist) {
    await (await permissionManager.setToken(t, true)).wait();
    console.log(`- Whitelisted token: ${t}`);
  }

  // Register solver
  await (
    await solverRegistry.registerSolver(
      deployer.address,
      ethers.parseEther("1"),
      85,
      ethers.keccak256(ethers.toUtf8Bytes("solver://primary"))
    )
  ).wait();
  console.log("- Primary Solver registered.");

  const deployment = {
    network: network.name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    contracts: {
      PermissionManager: await permissionManager.getAddress(),
      TreasuryManager: await treasuryManager.getAddress(),
      ProfitManager: await profitManager.getAddress(),
      ConditionManager: await conditionManager.getAddress(),
      AaveFlashAdapter: await aaveFlashAdapter.getAddress(),
      UniV3Adapter: await uniV3Adapter.getAddress(),
      AaveV3LendingAdapter: await aaveLendAdapter.getAddress(),
      FlashLoanManager: await flashLoanManager.getAddress(),
      SwapManager: await swapManager.getAddress(),
      LendingManager: await lendingManager.getAddress(),
      ActionExecutor: await actionExecutor.getAddress(),
      StrategyRegistry: await strategyRegistry.getAddress(),
      SimulationHelper: await simulationHelper.getAddress(),
      SolverRegistry: await solverRegistry.getAddress(),
      IntentSettlement: await intentSettlement.getAddress(),
      ERC7756QuicTransport: await erc7756QuicTransport.getAddress(),
      CrossChainIntentInbox: await crossChainIntentInbox.getAddress(),
      StrategyExecutorKernel: await strategyExecutorKernel.getAddress(),
      Brick3Router: await brick3Router.getAddress(),
      MockLendingAdapter: await flyingTulipAdapter.getAddress(), // FT mock adapter
      UniV3AdapterMockSwap: await mockSwapAdapter.getAddress(), // FT mock swap
    },
    deployedAt: new Date().toISOString(),
  };

  const fs = require("fs");
  fs.mkdirSync("./deployments", { recursive: true });
  fs.writeFileSync(`./deployments/kernel-${network.name}.json`, JSON.stringify(deployment, null, 2));

  console.log("Deployment complete.");
  console.log(JSON.stringify(deployment, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
