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

  // Aave V3 Pool Sepolia: 0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951
  // Uniswap V3 SwapRouter02 Sepolia: 0x3bFA4769FC09EcdA60Ce8f2b7b2ceC74BdfF5286
  let aavePool = ethers.ZeroAddress;
  let uniV3Router = ethers.ZeroAddress;
  
  if (network.name === "sepolia") {
    aavePool = "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951";
    uniV3Router = "0x3bfa4769fc09ecda60ce8f2b7b2cec74bdff5286";
  } else if (network.name === "base_mainnet") {
    aavePool = "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5";
    uniV3Router = "0x2626664c2603336E57B271c5C0b26F421741e481";
  }

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

  // Adapters (mvp - real logic now)
  const aaveFlashAdapter = await deploy("AaveFlashAdapter", [aavePool, await strategyExecutorKernel.getAddress()]);
  const aaveLendAdapter = await deploy("AaveV3LendingAdapter", [aavePool, await strategyExecutorKernel.getAddress()]);
  const uniV3Adapter = await deploy("UniswapV3SwapAdapter", [uniV3Router, await strategyExecutorKernel.getAddress()]);


  // Wiring permissions
  await (await strategyExecutorKernel.setRouter(await brick3Router.getAddress(), true)).wait();
  await (await permissionManager.setProvider(await aaveFlashAdapter.getAddress(), true)).wait();
  await (await permissionManager.setRouter(await uniV3Adapter.getAddress(), true)).wait();
  await (await brick3Router.setRelayer(deployer.address, true)).wait();
  await (await crossChainIntentInbox.setRelayer(deployer.address, true)).wait();
  await (await intentSettlement.setRelayer(deployer.address, true)).wait();

  // Whitelist tokens
  let tokensToWhitelist = [];
  if (network.name === "base_mainnet") {
    tokensToWhitelist = [
      "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base USDC
      "0x4200000000000000000000000000000000000006", // Base WETH
      "0x0000000000000000000000000000000000000000"  // ETH
    ];
  } else {
    tokensToWhitelist = [
      "0x94a9D9Ac8a22534E3FAcA9f88AbF5D1Da0C4dEf8", // Mock USDC
      "0xF4dB845EdF52B65E4f1B69B51E013Cf67FB552E5", // Mock USDT
      "0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357", // Mock DAI
      "0x88541670e55cC00beefD87eB59edd1b91c4f3e60", // Mock WETH
      "0x0000000000000000000000000000000000000000"  // ETH
    ];
  }
  for (const t of tokensToWhitelist) {
    await (await permissionManager.setToken(t, true)).wait();
  }

  // Register at least one eligible solver to unlock on-chain settlement flow.
  await (
    await solverRegistry.registerSolver(
      deployer.address,
      ethers.parseEther("1"),
      85,
      ethers.keccak256(ethers.toUtf8Bytes("solver://primary"))
    )
  ).wait();

  // Optional: backend wallet can be a relayer if PRIVATE_KEY exists.
  if (process.env.PRIVATE_KEY) {
    const pk = process.env.PRIVATE_KEY.startsWith("0x")
      ? process.env.PRIVATE_KEY
      : `0x${process.env.PRIVATE_KEY}`;
    const backendWallet = new ethers.Wallet(pk);
    await (await intentSettlement.setRelayer(backendWallet.address, true)).wait();
    console.log(`- IntentSettlement relayer enabled: ${backendWallet.address}`);
  }

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
