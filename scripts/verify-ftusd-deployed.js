const { ethers } = require("hardhat");

async function main() {
  const address = "0x618A13a1dE79cde892a1cA5B3FC24D4AA66b718D";
  console.log("Checking address:", address);
  
  const code = await ethers.provider.getCode(address);
  if (code === "0x") {
    console.log("No contract deployed at this address!");
    return;
  }
  console.log("Contract code exists (length:", code.length, ")");
  
  const token = await ethers.getContractAt("Mock_ftUSD", address);
  try {
    const name = await token.name();
    const symbol = await token.symbol();
    const totalSupply = await token.totalSupply();
    const balance = await token.balanceOf("0x73D4B99cF0C04D481036478F00Fd862D9589A940");
    console.log("Token Name:", name);
    console.log("Token Symbol:", symbol);
    console.log("Total Supply:", ethers.formatUnits(totalSupply, 18));
    console.log("Deployer Token Balance:", ethers.formatUnits(balance, 18));
  } catch (err) {
    console.error("Failed to read token details:", err.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
