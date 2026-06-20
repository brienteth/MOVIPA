const { ethers, network } = require("hardhat");
const fs = require("fs");

function ok(label, value = "") {
  console.log(`✓ ${label}${value ? `: ${value}` : ""}`);
}

async function main() {
  if (network.name !== "sepolia") throw new Error("Run with --network sepolia");

  const dep = JSON.parse(fs.readFileSync("./deployments/kernel-sepolia.json", "utf8"));
  const C = dep.contracts;
  const [signer] = await ethers.getSigners();

  console.log("Network:", network.name);
  console.log("Signer:", signer.address);
  ok("Signer balance ETH", ethers.formatEther(await ethers.provider.getBalance(signer.address)));

  const permission = await ethers.getContractAt("PermissionManager", C.PermissionManager);
  const treasury = await ethers.getContractAt("TreasuryManager", C.TreasuryManager);
  const profit = await ethers.getContractAt("ProfitManager", C.ProfitManager);
  const condition = await ethers.getContractAt("ConditionManager", C.ConditionManager);
  const aave = await ethers.getContractAt("AaveFlashAdapter", C.AaveFlashAdapter);
  const uni = await ethers.getContractAt("UniV3Adapter", C.UniV3Adapter);
  const flashManager = await ethers.getContractAt("FlashLoanManager", C.FlashLoanManager);
  const swapManager = await ethers.getContractAt("SwapManager", C.SwapManager);
  const lendingManager = await ethers.getContractAt("LendingManager", C.LendingManager);
  const actionExecutor = await ethers.getContractAt("ActionExecutor", C.ActionExecutor);
  const registry = await ethers.getContractAt("StrategyRegistry", C.StrategyRegistry);
  const sim = await ethers.getContractAt("SimulationHelper", C.SimulationHelper);
  const erc7756 = await ethers.getContractAt("ERC7756QuicTransport", C.ERC7756QuicTransport);
  const inbox = await ethers.getContractAt("CrossChainIntentInbox", C.CrossChainIntentInbox);
  const kernel = await ethers.getContractAt("StrategyExecutorKernel", C.StrategyExecutorKernel);
  const router = await ethers.getContractAt("BandleRouter", C.BandleRouter);

  // Basic read checks
  ok("Router owner", await router.owner());
  ok("Kernel allows router", String(await kernel.allowedRouters(await router.getAddress())));

  const dummyTokenIn = "0x1111111111111111111111111111111111111111";
  const dummyTokenOut = "0x2222222222222222222222222222222222222222";

  // Permission manager write/read
  await (await permission.setToken(dummyTokenIn, true)).wait();
  await (await permission.setToken(dummyTokenOut, true)).wait();
  ok("Permission tokenIn allowed", String(await permission.allowedTokens(dummyTokenIn)));

  // SwapManager live tx
  const swapParams = {
    dex: await uni.getAddress(),
    tokenIn: dummyTokenIn,
    tokenOut: dummyTokenOut,
    amountIn: 1000,
    minAmountOut: 777,
    extraData: "0x",
  };
  const swapTx = await swapManager.executeSwap(swapParams);
  await swapTx.wait();
  ok("SwapManager.executeSwap tx", swapTx.hash);

  // FlashLoanManager live tx
  await (await permission.setProvider(await aave.getAddress(), true)).wait();
  const flashTx = await flashManager.requestFlashLoan(
    {
      provider: await aave.getAddress(),
      asset: dummyTokenIn,
      amount: 12345,
    },
    "0x"
  );
  await flashTx.wait();
  ok("FlashLoanManager.requestFlashLoan tx", flashTx.hash);

  // Aave callback security must revert for unauthorized caller
  let reverted = false;
  try {
    await aave.executeOperation(dummyTokenIn, 1, 1, signer.address, "0x");
  } catch (_) {
    reverted = true;
  }
  if (!reverted) throw new Error("Aave callback security check failed");
  ok("Aave executeOperation unauthorized caller protection", "reverted as expected");

  // Deploy mock lending adapter and test LendingManager
  const MockLendingAdapter = await ethers.getContractFactory("MockLendingAdapter");
  const lendingAdapter = await MockLendingAdapter.deploy();
  await lendingAdapter.waitForDeployment();
  ok("MockLendingAdapter deployed", await lendingAdapter.getAddress());

  const lendTx = await lendingManager.executeLendingAction(
    await lendingAdapter.getAddress(),
    0,
    dummyTokenIn,
    500,
    "0x"
  );
  await lendTx.wait();
  ok("LendingManager.executeLendingAction tx", lendTx.hash);

  // ActionExecutor swap action path
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  const encodedSwap = abiCoder.encode(
    ["tuple(address dex,address tokenIn,address tokenOut,uint256 amountIn,uint256 minAmountOut,bytes extraData)"],
    [[await uni.getAddress(), dummyTokenIn, dummyTokenOut, 100, 55, "0x"]]
  );
  const actTx = await actionExecutor.executeAction({ actionType: 1, params: encodedSwap }); // SWAP
  await actTx.wait();
  ok("ActionExecutor.executeAction(SWAP) tx", actTx.hash);

  // Strategy registry + router/kernel execution
  const strategyHash = ethers.keccak256(ethers.toUtf8Bytes(`live-full-${Date.now()}`));
  const regTx = await registry.registerStrategy(strategyHash, "ipfs://bandle-live-test");
  await regTx.wait();
  ok("StrategyRegistry.registerStrategy tx", regTx.hash);

  const creator = await registry.getCreator(strategyHash);
  ok("Strategy creator", creator);

  const deadline = Math.floor(Date.now() / 1000) + 1800;
  const execTx = await router.executeStrategy([], 0, deadline, strategyHash);
  await execTx.wait();
  ok("BandleRouter.executeStrategy tx", execTx.hash);

  // Relayed path with kernel bypass requirement
  await (await router.setRelayer(signer.address, true)).wait();
  ok("Router relayer set", signer.address);

  let ep = await erc7756.getEndpoint(signer.address);
  const isRegistered = ep.agent && ep.agent.toLowerCase() === signer.address.toLowerCase();
  if (!isRegistered) {
    const bond = ethers.parseEther("0.001");
    const regEpTx = await erc7756.registerEndpoint(
      "quic://agent.sepolia.opacus:4433",
      "https://agent.sepolia.opacus:443",
      1,
      true,
      true,
      1200,
      ethers.ZeroAddress,
      bond,
      { value: bond }
    );
    await regEpTx.wait();
    ok("ERC7756.registerEndpoint tx", regEpTx.hash);
  } else {
    const updTx = await erc7756.updateEndpoint(
      "quic://agent.sepolia.opacus:4433",
      "https://agent.sepolia.opacus:443",
      1,
      true,
      true,
      1200
    );
    await updTx.wait();
    ok("ERC7756.updateEndpoint tx", updTx.hash);
  }

  ep = await erc7756.getEndpoint(signer.address);
  if (!ep.kernelBypass) throw new Error("Kernel bypass flag not set in ERC7756 endpoint");
  ok("ERC7756 endpoint kernelBypass", String(ep.kernelBypass));

  const kbAgents = await erc7756.getKernelBypassAgents(0, 10);
  ok("ERC7756 kernel bypass agents count", String(kbAgents.length));

  const lowLatAgents = await erc7756.getAgentsByLatency(2000, 0, 10);
  ok("ERC7756 low-latency agents count", String(lowLatAgents.length));

  const relayedHash = ethers.keccak256(ethers.toUtf8Bytes(`relayed-${Date.now()}`));
  await (await registry.registerStrategy(relayedHash, "ipfs://bandle-relayed")).wait();
  const relayedTx = await router.executeStrategyRelayed(signer.address, [], 0, deadline, relayedHash);
  await relayedTx.wait();
  ok("BandleRouter.executeStrategyRelayed tx", relayedTx.hash);

  // CrossChainIntentInbox path
  await (await inbox.setRelayer(signer.address, true)).wait();
  const intentHash = ethers.keccak256(ethers.toUtf8Bytes(`intent-${Date.now()}`));
  const proofHash = ethers.keccak256(ethers.toUtf8Bytes("sealed-proof-live"));

  const submitTx = await inbox.submitIntent(intentHash, proofHash, signer.address, signer.address, 11155111, 8453);
  await submitTx.wait();
  ok("CrossChainIntentInbox.submitIntent tx", submitTx.hash);

  const doneTx = await inbox.markExecuted(intentHash);
  await doneTx.wait();
  ok("CrossChainIntentInbox.markExecuted tx", doneTx.hash);

  // Utility managers read calls
  const net = await profit.calculateNetProfit(1000, 1100);
  ok("ProfitManager.calculateNetProfit(1000->1100)", net.toString());

  const c1 = await condition.checkMinOutput(100, 99);
  ok("ConditionManager.checkMinOutput", String(c1));

  const est = await sim.estimateProfit(5000, 3000, 100, 50, 100);
  ok("SimulationHelper.estimateProfit", est.toString());

  // Treasury manager live payout test
  const topupTx = await signer.sendTransaction({ to: await treasury.getAddress(), value: ethers.parseEther("0.0002") });
  await topupTx.wait();
  const distTx = await treasury.distributeNative(signer.address, ethers.ZeroAddress, ethers.parseEther("0.0001"));
  await distTx.wait();
  ok("TreasuryManager.distributeNative tx", distTx.hash);

  console.log("\nALL SEPOLIA LIVE CONTRACT TESTS PASSED");
}

main().catch((e) => {
  console.error("SEPOLIA FULL TEST FAILED", e);
  process.exit(1);
});
