const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const deployment = JSON.parse(fs.readFileSync("./deployments/kernel-sonic_mainnet.json", "utf8"));
  const pmAddress = deployment.contracts.PermissionManager;
  console.log("PermissionManager Address:", pmAddress);

  const [deployer] = await ethers.getSigners();
  console.log("Signer:", deployer.address);

  const pm = await ethers.getContractAt("PermissionManager", pmAddress, deployer);

  const usdcAddress = "0x29219dd400f2Bf60E5a23d13Be72B486D4038894";
  console.log(`Checking if token ${usdcAddress} is allowed...`);
  const isAllowed = await pm.allowedTokens(usdcAddress);
  
  if (isAllowed) {
    console.log("USDC is already allowed!");
    return;
  }

  console.log("Whitelisting USDC...");
  const tx = await pm.setToken(usdcAddress, true);
  console.log("Tx sent:", tx.hash);
  await tx.wait();
  console.log("USDC successfully whitelisted on Sonic Mainnet!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
