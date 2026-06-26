const { ethers, network } = require("hardhat");

/**
 * UPGRADE SCRIPT: Deploy only the 3 changed contracts (TreasuryManager, StrategyExecutorKernel, Brick3Router)
 * and wire them to existing infrastructure.
 * 
 * Usage:
 *   npx hardhat run scripts/upgrade-sweep.js --network base_mainnet
 *   npx hardhat run scripts/upgrade-sweep.js --network sonic_mainnet
 */

// ============ EXISTING CONTRACT ADDRESSES (NOT CHANGED) ============

const EXISTING = {
  base_mainnet: {
    ActionExecutor: "0xd190A715Ee25bfd2Ebfc19292A3d1c0544c6EA28",
    ProfitManager: "0x6e44B6d48AFe3123C9906E9959f1C7C5A21f5e80",
    PermissionManager: "0x618A13a1dE79cde892a1cA5B3FC24D4AA66b718D",
    StrategyRegistry: "0xF30f02c6b2bb2D2345C72cCD759F56B8e924D8b1",
    SimulationHelper: "0x80EF502f3CDC6bE44c77b4DBCF9c0B347eE036eB",
    ERC7756QuicTransport: "0x463D733832cBD497C29a0521ad3030a19f64f712",
    AaveFlashAdapter: "0x0f840e0DeA1c11b2aB35A8f18A3ab4ac47cF5262",
    UniV3Adapter: "0x3eD1013d060401fA6435cfd6a96cb6cD4BFCc6c0",
    AaveV3LendingAdapter: "0x4a4AbC511067Ba3fD9FA32875D19B8b96Ff45eA5",
    // Tokens
    USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    WETH: "0x4200000000000000000000000000000000000006",
  },
  sonic_mainnet: {
    ActionExecutor: "0x2eFC29c41A9E185D8e69888c9eF45E208925D78C",
    ProfitManager: "0x14d8aAb378316549E870BB03497B3A0592Ad5aA5",
    PermissionManager: "0x612b1D28bD19AD4d9738F152836538BF239d256a",
    StrategyRegistry: "0x1C2E4b9e80799Dd7E92d43fF9774A0fE79428D02",
    SimulationHelper: "0xC8f896683574Ad3bad8151Ab97A0080aFc7Fb41b",
    ERC7756QuicTransport: "0xA720561A37022f5021AF460bE96006F0D7A0e359",
    AaveFlashAdapter: "0x78A326Cb86512Be28CBCcFD4FEe2995d21d770Fd",
    UniV3Adapter: "0x82b31D1B4876c138d5d6198d38CA31164621DF98",
    AaveV3LendingAdapter: "0xaC676f1d752C2354F347ed72A73164042b3E4E38",
    // Tokens (Sonic uses USDC.e and wS)
    USDC: "0x29219dd400f2Bf60E5a23d13Be72B486D4038894", // USDC.e on Sonic
    WETH: "0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38", // wS (Wrapped Sonic)
  },
};

async function deploy(name, args = []) {
  const F = await ethers.getContractFactory(name);
  const c = await F.deploy(...args);
  await c.waitForDeployment();
  const addr = await c.getAddress();
  console.log(`✅ Deployed ${name}: ${addr}`);
  return c;
}

async function main() {
  const net = network.name;
  if (!EXISTING[net]) {
    console.error(`❌ No existing addresses for network: ${net}`);
    console.log("Supported: base_mainnet, sonic_mainnet");
    process.exit(1);
  }

  const existing = EXISTING[net];
  const [deployer] = await ethers.getSigners();
  console.log(`\n🚀 Upgrading sweep-claim on ${net}`);
  console.log(`   Deployer: ${deployer.address}\n`);

  // ============ STEP 1: Deploy new TreasuryManager ============
  console.log("--- Step 1: Deploy TreasuryManager (with distributeERC20) ---");
  const treasuryManager = await deploy("TreasuryManager", [deployer.address, 500, 200]);
  // 500 bps = 5% platform fee, 200 bps = 2% creator fee

  // ============ STEP 2: Deploy new StrategyExecutorKernel ============
  console.log("\n--- Step 2: Deploy StrategyExecutorKernel (with sweep) ---");
  const kernel = await deploy("StrategyExecutorKernel", [
    existing.ActionExecutor,
    existing.ProfitManager,
    await treasuryManager.getAddress(),
  ]);

  // ============ STEP 3: Deploy new Brick3Router ============
  console.log("\n--- Step 3: Deploy Brick3Router (with sweepTokens) ---");
  const router = await deploy("Brick3Router", [
    await kernel.getAddress(),
    existing.StrategyRegistry,
    existing.SimulationHelper,
    existing.ERC7756QuicTransport,
  ]);

  // ============ STEP 4: Wire permissions ============
  console.log("\n--- Step 4: Wire permissions ---");

  // Router allowed on Kernel
  console.log("  Setting router as allowed on kernel...");
  await (await kernel.setRouter(await router.getAddress(), true)).wait();

  // AaveFlashAdapter trusted on Kernel (for executeCallback)
  console.log("  Setting AaveFlashAdapter as trusted adapter...");
  await (await kernel.setTrustedAdapter(existing.AaveFlashAdapter, true)).wait();

  // Deployer as relayer on Router
  console.log("  Setting deployer as relayer...");
  await (await router.setRelayer(deployer.address, true)).wait();

  // Disable kernel bypass requirement (easier for testing)
  console.log("  Disabling kernel bypass policy...");
  await (await router.setKernelBypassPolicy(false)).wait();

  // ============ STEP 5: Update adapters to point to new Kernel ============
  console.log("\n--- Step 5: Update adapters to use new kernel ---");

  // AaveFlashAdapter.setKernel
  const aaveFlash = await ethers.getContractAt("AaveFlashAdapter", existing.AaveFlashAdapter, deployer);
  console.log("  Updating AaveFlashAdapter.kernel...");
  await (await aaveFlash.setKernel(await kernel.getAddress())).wait();
  // AaveFlashAdapter.setActionExecutor
  console.log("  Updating AaveFlashAdapter.actionExecutor...");
  await (await aaveFlash.setActionExecutor(existing.ActionExecutor)).wait();

  // UniV3Adapter.setKernel
  const uniAdapter = await ethers.getContractAt("UniswapV3SwapAdapter", existing.UniV3Adapter, deployer);
  console.log("  Updating UniV3Adapter.kernel...");
  await (await uniAdapter.setKernel(await kernel.getAddress())).wait();
  // UniV3Adapter.setActionExecutor
  console.log("  Updating UniV3Adapter.actionExecutor...");
  await (await uniAdapter.setActionExecutor(existing.ActionExecutor)).wait();

  // AaveV3LendingAdapter.setKernel (if it has one)
  try {
    const lendAdapter = await ethers.getContractAt("AaveV3LendingAdapter", existing.AaveV3LendingAdapter, deployer);
    console.log("  Updating AaveV3LendingAdapter.kernel...");
    await (await lendAdapter.setKernel(await kernel.getAddress())).wait();
  } catch (e) {
    console.log("  ⚠️ AaveV3LendingAdapter.setKernel skipped:", e.message?.slice(0, 80));
  }

  // ============ STEP 6: Approve tokens on new Kernel ============
  console.log("\n--- Step 6: Approve tokens for adapters on new kernel ---");
  const maxApproval = ethers.MaxUint256;
  const tokens = [existing.USDC, existing.WETH];
  const adapters = [existing.AaveFlashAdapter, existing.UniV3Adapter, existing.AaveV3LendingAdapter];

  for (const token of tokens) {
    for (const adapter of adapters) {
      try {
        console.log(`  Approving ${token.slice(0,8)}... for ${adapter.slice(0,8)}...`);
        await (await kernel.approveToken(token, adapter, maxApproval)).wait();
      } catch (e) {
        console.log(`  ⚠️ Skipped: ${e.message?.slice(0, 60)}`);
      }
    }
  }

  // Also approve TreasuryManager for sweep tokens (Kernel transfers to Treasury for fee distribution)
  for (const token of tokens) {
    try {
      console.log(`  Approving ${token.slice(0,8)}... for TreasuryManager...`);
      await (await kernel.approveToken(token, await treasuryManager.getAddress(), maxApproval)).wait();
    } catch (e) {
      console.log(`  ⚠️ Skipped: ${e.message?.slice(0, 60)}`);
    }
  }

  // ============ RESULTS ============
  const newAddresses = {
    TreasuryManager: await treasuryManager.getAddress(),
    StrategyExecutorKernel: await kernel.getAddress(),
    BandleRouter: await router.getAddress(),
  };

  console.log("\n" + "=".repeat(60));
  console.log("🎉 UPGRADE COMPLETE!");
  console.log("=".repeat(60));
  console.log(`\nNetwork: ${net}`);
  console.log("\n📋 NEW CONTRACT ADDRESSES (update contracts.ts):");
  for (const [name, addr] of Object.entries(newAddresses)) {
    console.log(`   ${name}: "${addr}",`);
  }
  console.log("\n📋 UNCHANGED ADDRESSES:");
  console.log(`   PermissionManager: "${existing.PermissionManager}",`);
  console.log(`   ProfitManager: "${existing.ProfitManager}",`);
  console.log(`   AaveFlashAdapter: "${existing.AaveFlashAdapter}",`);
  console.log(`   UniV3Adapter: "${existing.UniV3Adapter}",`);
  console.log(`   AaveV3LendingAdapter: "${existing.AaveV3LendingAdapter}",`);

  // Save deployment
  const fs = require("fs");
  fs.mkdirSync("./deployments", { recursive: true });
  fs.writeFileSync(
    `./deployments/upgrade-sweep-${net}.json`,
    JSON.stringify({ network: net, newAddresses, existing, deployedAt: new Date().toISOString() }, null, 2)
  );
  console.log(`\n💾 Saved to ./deployments/upgrade-sweep-${net}.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
