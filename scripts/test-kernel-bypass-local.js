const { ethers, network } = require("hardhat");

async function deploy(name, args = []) {
  const F = await ethers.getContractFactory(name);
  const c = await F.deploy(...args);
  await c.waitForDeployment();
  return c;
}

async function main() {
  if (network.name !== "hardhat") {
    throw new Error("Run this script on --network hardhat");
  }

  const [deployer, user] = await ethers.getSigners();

  const permissionManager = await deploy("PermissionManager");
  const treasuryManager = await deploy("TreasuryManager", [deployer.address, 1000, 500]);
  const profitManager = await deploy("ProfitManager");
  await deploy("ConditionManager");

  const aaveFlashAdapter = await deploy("AaveFlashAdapter", [ethers.ZeroAddress]);
  const uniV3Adapter = await deploy("UniV3Adapter");

  const flashLoanManager = await deploy("FlashLoanManager", [await permissionManager.getAddress()]);
  const swapManager = await deploy("SwapManager", [await permissionManager.getAddress()]);
  const lendingManager = await deploy("LendingManager");

  const actionExecutor = await deploy("ActionExecutor", [
    await flashLoanManager.getAddress(),
    await swapManager.getAddress(),
    await lendingManager.getAddress(),
  ]);

  const strategyRegistry = await deploy("StrategyRegistry");
  const simulationHelper = await deploy("SimulationHelper");
  const erc7756 = await deploy("ERC7756QuicTransport");
  const inbox = await deploy("CrossChainIntentInbox", [await erc7756.getAddress()]);

  const kernel = await deploy("StrategyExecutorKernel", [
    await actionExecutor.getAddress(),
    await profitManager.getAddress(),
    await treasuryManager.getAddress(),
  ]);

  const router = await deploy("BandleRouter", [
    await kernel.getAddress(),
    await strategyRegistry.getAddress(),
    await simulationHelper.getAddress(),
    await erc7756.getAddress(),
  ]);

  await (await kernel.setRouter(await router.getAddress(), true)).wait();
  await (await permissionManager.setProvider(await aaveFlashAdapter.getAddress(), true)).wait();
  await (await permissionManager.setRouter(await uniV3Adapter.getAddress(), true)).wait();
  await (await router.setRelayer(deployer.address, true)).wait();
  await (await inbox.setRelayer(deployer.address, true)).wait();

  // Register relayer endpoint with kernel bypass in ERC7756
  await (
    await erc7756.registerEndpoint(
      "quic://agent.local:4433",
      "https://agent.local:443",
      1, // KernelBypass
      true,
      true,
      1200,
      ethers.ZeroAddress,
      ethers.parseEther("0.01"),
      { value: ethers.parseEther("0.01") }
    )
  ).wait();

  const ep = await erc7756.getEndpoint(deployer.address);
  if (!ep.kernelBypass) throw new Error("Kernel bypass flag is false");

  const kbAgents = await erc7756.getKernelBypassAgents(0, 10);
  if (!kbAgents.length) throw new Error("No kernel bypass agents returned");

  // Register strategy and execute relayed (empty actions allowed for smoke)
  const strategyHash = ethers.keccak256(ethers.toUtf8Bytes("local-kernel-bypass-smoke"));
  await (await strategyRegistry.connect(user).registerStrategy(strategyHash, "ipfs://test")).wait();

  const deadline = Math.floor(Date.now() / 1000) + 3600;
  await (await router.executeStrategyRelayed(user.address, [], 0, deadline, strategyHash)).wait();

  const rec = await strategyRegistry.strategies(strategyHash);
  if (rec.executionCount.toString() !== "1") {
    throw new Error("Execution count did not increment");
  }

  // Cross-chain intent inbox path with kernel bypass relayer check
  const intentHash = ethers.keccak256(ethers.toUtf8Bytes("intent-1"));
  const proofHash = ethers.keccak256(ethers.toUtf8Bytes("sealed-proof"));

  await (
    await inbox.submitIntent(intentHash, proofHash, user.address, deployer.address, 11155111, 8453)
  ).wait();
  await (await inbox.markExecuted(intentHash)).wait();

  const intent = await inbox.intents(intentHash);
  if (!intent.executed) throw new Error("Intent not marked executed");

  console.log("ALL CONTRACT TESTS PASSED");
  console.log("router:", await router.getAddress());
  console.log("kernel:", await kernel.getAddress());
  console.log("erc7756:", await erc7756.getAddress());
  console.log("inbox:", await inbox.getAddress());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
