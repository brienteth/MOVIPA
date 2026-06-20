const { ethers, network } = require("hardhat");

async function main() {
  const deployment = require("../deployments/kernel-sepolia.json");
  const c = deployment.contracts;

  const permMgr = await ethers.getContractAt("PermissionManager", c.PermissionManager);
  const stratReg = await ethers.getContractAt("StrategyRegistry", c.StrategyRegistry);
  const kernel   = await ethers.getContractAt("StrategyExecutorKernel", c.StrategyExecutorKernel);
  const router   = await ethers.getContractAt("BandleRouter", c.BandleRouter);

  console.log("=== BandleRouter checks ===");
  console.log("paused:", await router.paused());
  console.log("executor:", await router.executor());
  console.log("registry:", await router.registry());

  console.log("\n=== StrategyExecutorKernel checks ===");
  console.log("paused:", await kernel.paused());
  console.log("allowedRouters[BandleRouter]:", await kernel.allowedRouters(c.BandleRouter));

  console.log("\n=== PermissionManager token whitelist ===");
  const tokens = {
    "USDC":  "0x94a9D9Ac8a22534E3FAcA9f88AbF5D1Da0C4dEf8",
    "USDT":  "0xF4dB845EdF52B65E4f1B69B51E013Cf67FB552E5",
    "DAI":   "0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357",
    "WETH":  "0x88541670e55cC00beefD87eB59edd1b91c4f3e60",
    "ETH":   "0x0000000000000000000000000000000000000000",
  };
  for (const [sym, addr] of Object.entries(tokens)) {
    console.log(`  ${sym}: ${await permMgr.allowedTokens(addr)}`);
  }
  console.log("allowedProviders[AaveFlashAdapter]:", await permMgr.allowedProviders(c.AaveFlashAdapter));
  console.log("allowedRouters[UniV3Adapter]:", await permMgr.allowedRouters(c.UniV3Adapter));
}
main().catch(e => { console.error(e); process.exit(1); });
