const { ethers } = require("hardhat");

async function main() {
  const aaveAdapterAddr = "0x0f840e0DeA1c11b2aB35A8f18A3ab4ac47cF5262";
  const uniV3AdapterAddr = "0x68Fcae27158aC9464CB54A51c6F0A2A427eb2B36";
  const flashManagerAddr = "0xdd345972941c3acfAEFf6b14FA20b4Eea3c32F76";
  const swapManagerAddr = "0xE0C701bDc519BCfB0C36B1fFbAf44308A3D0672c";

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

  console.log("Done fixing adapter permissions!");
}

main().catch(console.error);
