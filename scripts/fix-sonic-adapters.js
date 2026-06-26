const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const deployment = JSON.parse(fs.readFileSync("./deployments/kernel-sonic_mainnet.json", "utf8"));
  
  const aaveAdapterAddr = deployment.contracts.AaveFlashAdapter;
  const uniV3AdapterAddr = deployment.contracts.UniV3Adapter;
  const flashManagerAddr = deployment.contracts.FlashLoanManager;
  const swapManagerAddr = deployment.contracts.SwapManager;

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  const aaveAdapter = await ethers.getContractAt("AaveFlashAdapter", aaveAdapterAddr, deployer);
  const uniV3Adapter = await ethers.getContractAt("UniswapV3SwapAdapter", uniV3AdapterAddr, deployer);

  console.log("Setting FlashLoanManager as actionExecutor in AaveAdapter...");
  let tx = await aaveAdapter.setActionExecutor(flashManagerAddr);
  await tx.wait();
  console.log("Tx:", tx.hash);

  console.log("Setting SwapManager as actionExecutor in UniV3Adapter...");
  tx = await uniV3Adapter.setActionExecutor(swapManagerAddr);
  await tx.wait();
  console.log("Tx:", tx.hash);

  console.log("Done fixing adapter permissions on Sonic Mainnet!");
}

main().catch(console.error);
