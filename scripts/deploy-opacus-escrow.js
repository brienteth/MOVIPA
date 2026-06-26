const hre = require("hardhat");

async function main() {
  console.log("Starting OpacusEscrow deployment...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);
  
  // Deployer will act as the initial trusted Opacus Relayer for demonstration
  const relayerAddress = deployer.address;

  console.log("Deploying OpacusEscrow with Relayer:", relayerAddress);
  
  // We get the contract to deploy
  const OpacusEscrow = await hre.ethers.getContractFactory("contracts/OpacusEscrow.sol:OpacusEscrow");
  const escrow = await OpacusEscrow.deploy(relayerAddress);

  await escrow.waitForDeployment();
  const address = await escrow.getAddress();

  console.log("✅ OpacusEscrow deployed to:", address);
  
  // Verify it initializes correctly
  const contractRelayer = await escrow.relayer();
  console.log("Verified Relayer Address on-chain:", contractRelayer);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
