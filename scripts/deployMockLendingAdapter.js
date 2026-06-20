const hre = require("hardhat");

async function main() {
  const MockLendingAdapter = await hre.ethers.getContractFactory("MockLendingAdapter");
  const adapter = await MockLendingAdapter.deploy();

  await adapter.waitForDeployment();

  console.log("MockLendingAdapter deployed to:", await adapter.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
