/**
 * Deploy ALL remaining contracts to Sonic Mainnet
 * Contracts already deployed are skipped (read from kernel-sonic_mainnet.json)
 * New contracts: OpacusEscrow, CanvasFlashLoanBlock, FlashLoanBlockRegistry,
 *                CitadelRegistry, OpacusTransportRegistry, X402Settlement
 */
const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

const DEPLOYMENT_FILE = path.join(__dirname, "..", "deployments", "kernel-sonic_mainnet.json");

async function deploy(name, args = []) {
  console.log(`\n  Deploying ${name}...`);
  const F = await ethers.getContractFactory(name);
  const c = await F.deploy(...args);
  await c.waitForDeployment();
  const addr = await c.getAddress();
  console.log(`  ✅ ${name}: ${addr}`);
  return { contract: c, address: addr };
}

async function main() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  BRICK3 — Deploy ALL Remaining Contracts to Sonic Mainnet");
  console.log("═══════════════════════════════════════════════════════════\n");

  const [deployer] = await ethers.getSigners();
  console.log(`Network: ${network.name} (chainId: ${(await ethers.provider.getNetwork()).chainId})`);
  console.log(`Deployer: ${deployer.address}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Balance: ${ethers.formatEther(balance)} S\n`);

  // Load existing deployment
  let existing = {};
  if (fs.existsSync(DEPLOYMENT_FILE)) {
    const data = JSON.parse(fs.readFileSync(DEPLOYMENT_FILE, "utf-8"));
    existing = data.contracts || {};
    console.log(`Loaded ${Object.keys(existing).length} existing contracts from deployment file.\n`);
  }

  const newContracts = {};

  // ───────────────────────────────────────────────────────
  // 1. OpacusEscrow — Ajan görev ödemesi escrow kontratı
  // ───────────────────────────────────────────────────────
  if (!existing.OpacusEscrow) {
    console.log("─── [1/6] OpacusEscrow ───");
    const treasuryAddr = existing.TreasuryManager || deployer.address;
    const feeRateBps = 100; // 1% protocol fee
    const { address } = await deploy("OpacusEscrow", [treasuryAddr, feeRateBps]);
    newContracts.OpacusEscrow = address;
  } else {
    console.log(`⏭  OpacusEscrow already deployed: ${existing.OpacusEscrow}`);
  }

  // ───────────────────────────────────────────────────────
  // 2. FlashLoanBlockRegistry — Flaş kredi blok kaydı
  // ───────────────────────────────────────────────────────
  if (!existing.FlashLoanBlockRegistry) {
    console.log("─── [2/6] FlashLoanBlockRegistry ───");
    const { address } = await deploy("FlashLoanBlockRegistry");
    newContracts.FlashLoanBlockRegistry = address;
  } else {
    console.log(`⏭  FlashLoanBlockRegistry already deployed: ${existing.FlashLoanBlockRegistry}`);
  }

  // ───────────────────────────────────────────────────────
  // 3. CitadelRegistry — Citadel strateji kasası kaydı
  // ───────────────────────────────────────────────────────
  if (!existing.CitadelRegistry) {
    console.log("─── [3/6] CitadelRegistry ───");
    const { address } = await deploy("CitadelRegistry", [deployer.address]);
    newContracts.CitadelRegistry = address;
  } else {
    console.log(`⏭  CitadelRegistry already deployed: ${existing.CitadelRegistry}`);
  }

  // ───────────────────────────────────────────────────────
  // 4. OpacusTransportRegistry — Cross-chain transport kaydı
  // ───────────────────────────────────────────────────────
  if (!existing.OpacusTransportRegistry) {
    console.log("─── [4/6] OpacusTransportRegistry ───");
    const { address } = await deploy("OpacusTransportRegistry");
    newContracts.OpacusTransportRegistry = address;
  } else {
    console.log(`⏭  OpacusTransportRegistry already deployed: ${existing.OpacusTransportRegistry}`);
  }

  // ───────────────────────────────────────────────────────
  // 5. X402Settlement — Ödeme settlement protokolü
  // ───────────────────────────────────────────────────────
  if (!existing.X402Settlement) {
    console.log("─── [5/6] X402Settlement ───");
    const { address } = await deploy("X402Settlement", [deployer.address]);
    newContracts.X402Settlement = address;
  } else {
    console.log(`⏭  X402Settlement already deployed: ${existing.X402Settlement}`);
  }

  // ───────────────────────────────────────────────────────
  // 6. CanvasFlashLoanBlock — Canvas flaş kredi bloğu
  //    (Requires adapter addresses)
  // ───────────────────────────────────────────────────────
  if (!existing.CanvasFlashLoanBlock) {
    console.log("─── [6/6] CanvasFlashLoanBlock ───");
    const aaveFlashAdapter = existing.AaveFlashAdapter;
    // For uniV3 and uniV4 adapters, we use the existing UniV3Adapter as placeholder
    // since Sonic doesn't have native Uniswap V3/V4 pools
    const uniV3Adapter = existing.UniV3Adapter || ethers.ZeroAddress;
    const uniV4Adapter = existing.UniV3AdapterMockSwap || ethers.ZeroAddress;
    
    const { address } = await deploy("CanvasFlashLoanBlock", [
      aaveFlashAdapter,
      uniV3Adapter,
      uniV4Adapter,
    ]);
    newContracts.CanvasFlashLoanBlock = address;
  } else {
    console.log(`⏭  CanvasFlashLoanBlock already deployed: ${existing.CanvasFlashLoanBlock}`);
  }

  // ───────────────────────────────────────────────────────
  // Wire permissions for new contracts
  // ───────────────────────────────────────────────────────
  if (Object.keys(newContracts).length > 0) {
    console.log("\n═══ Wiring Permissions ═══");

    const permissionManager = await ethers.getContractAt("PermissionManager", existing.PermissionManager);

    // Wire OpacusEscrow as authorized agent
    if (newContracts.OpacusEscrow) {
      console.log("  Wiring OpacusEscrow...");
      // OpacusEscrow manages its own permissions internally, no kernel wiring needed
      console.log(`  ✅ OpacusEscrow ready (self-managed permissions)`);
    }

    // Wire CanvasFlashLoanBlock — whitelist as provider
    if (newContracts.CanvasFlashLoanBlock) {
      console.log("  Wiring CanvasFlashLoanBlock as provider...");
      await (await permissionManager.setProvider(newContracts.CanvasFlashLoanBlock, true)).wait();
      console.log(`  ✅ CanvasFlashLoanBlock whitelisted as provider`);
    }

    // Wire FlashLoanBlockRegistry — set deployer as admin
    if (newContracts.FlashLoanBlockRegistry) {
      console.log("  FlashLoanBlockRegistry ready (deployer is owner by default)");
    }

    // Wire CitadelRegistry — set deployer as admin
    if (newContracts.CitadelRegistry) {
      console.log("  CitadelRegistry ready (deployer is owner by default)");
    }

    // Wire OpacusTransportRegistry — set deployer as admin
    if (newContracts.OpacusTransportRegistry) {
      console.log("  OpacusTransportRegistry ready (deployer is owner by default)");
    }
  }

  // ───────────────────────────────────────────────────────
  // Save updated deployment file
  // ───────────────────────────────────────────────────────
  const allContracts = { ...existing, ...newContracts };
  
  const deployment = {
    network: network.name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    contracts: allContracts,
    deployedAt: new Date().toISOString(),
  };

  fs.writeFileSync(DEPLOYMENT_FILE, JSON.stringify(deployment, null, 2));

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  DEPLOYMENT SUMMARY");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  Network: ${network.name}`);
  console.log(`  Total contracts: ${Object.keys(allContracts).length}`);
  console.log(`  New contracts deployed: ${Object.keys(newContracts).length}`);
  
  if (Object.keys(newContracts).length > 0) {
    console.log("\n  ── New Deployments ──");
    for (const [name, addr] of Object.entries(newContracts)) {
      console.log(`  ${name}: ${addr}`);
    }
  }

  const endBalance = await ethers.provider.getBalance(deployer.address);
  const gasCost = balance - endBalance;
  console.log(`\n  Gas spent: ${ethers.formatEther(gasCost)} S`);
  console.log(`  Remaining balance: ${ethers.formatEther(endBalance)} S`);
  console.log("═══════════════════════════════════════════════════════════\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
