const { ethers, network } = require("hardhat");
const fs = require("fs");

async function main() {
  if (network.name !== "sepolia") {
    throw new Error("This smoke script must run on sepolia network");
  }

  const deployment = JSON.parse(fs.readFileSync("./deployments/kernel-sepolia.json", "utf8"));
  const [signer] = await ethers.getSigners();

  console.log("Network:", network.name);
  console.log("Signer:", signer.address);

  const router = await ethers.getContractAt("BandleRouter", deployment.contracts.BandleRouter);
  const registry = await ethers.getContractAt("StrategyRegistry", deployment.contracts.StrategyRegistry);
  const kernel = await ethers.getContractAt("StrategyExecutorKernel", deployment.contracts.StrategyExecutorKernel);

  const signerBalance = await ethers.provider.getBalance(signer.address);
  console.log("Signer balance (ETH):", ethers.formatEther(signerBalance));

  const strategyHash = ethers.keccak256(ethers.toUtf8Bytes(`smoke-${Date.now()}`));
  console.log("Strategy hash:", strategyHash);

  const tx1 = await registry.registerStrategy(strategyHash, "ipfs://bandle-smoke-test");
  const r1 = await tx1.wait();
  console.log("registerStrategy tx:", r1.hash);

  const creator = await registry.getCreator(strategyHash);
  console.log("registered creator:", creator);

  const deadline = Math.floor(Date.now() / 1000) + 1800;
  const tx2 = await router.executeStrategy([], 0, deadline, strategyHash);
  const r2 = await tx2.wait();
  console.log("executeStrategy tx:", r2.hash);

  const used = await registry.strategies(strategyHash);
  console.log("executionCount:", used.executionCount.toString());

  const owner = await router.owner();
  const isRouterAllowed = await kernel.allowedRouters(await router.getAddress());

  console.log("router owner:", owner);
  console.log("kernel allows router:", isRouterAllowed);

  console.log("SMOKE TEST PASSED");
}

main().catch((e) => {
  console.error("SMOKE TEST FAILED", e);
  process.exit(1);
});
