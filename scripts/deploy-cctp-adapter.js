const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const networkName = hre.network.name;
  console.log(`🚀 Deploying CCTPSettlementAdapter to ${networkName} using account:`, deployer.address);

  let tokenMessenger;
  let usdc;
  let kernel;

  if (networkName === "sepolia") {
    tokenMessenger = "0x9f3B8679c73C2Fef8b59B4f37449E8547728a4DB";
    usdc = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
    kernel = "0x2c0f410Aa11523EE935361Ac71947d74812145C4";
  } else if (networkName === "base_mainnet") {
    tokenMessenger = "0x1682Ae6375C4E4A97e4B583BC394c861A46D8962";
    usdc = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
    kernel = "0x40021c19a16d2Ca7640D0B93A487023F9f6250B2";
  } else {
    // Hardhat / local network fallback: Deploy mock USDC first
    console.log("💰 Local/Hardhat network. Deploying mock CCTP dependencies...");
    const MockFTUSD = await hre.ethers.getContractFactory("MockFTUSD");
    const mockUSDC = await MockFTUSD.deploy();
    await mockUSDC.waitForDeployment();
    usdc = await mockUSDC.getAddress();
    console.log("✅ Mock USDC deployed to:", usdc);

    // Deploy mock TokenMessenger
    const mockMessenger = await MockFTUSD.deploy();
    await mockMessenger.waitForDeployment();
    tokenMessenger = await mockMessenger.getAddress();
    console.log("✅ Mock TokenMessenger deployed to:", tokenMessenger);

    kernel = "0x40021c19a16d2Ca7640D0B93A487023F9f6250B2"; // Dummy kernel for local testing
  }

  console.log("📋 Deploying CCTPSettlementAdapter...");
  const CCTPSettlementAdapter = await hre.ethers.getContractFactory("CCTPSettlementAdapter");
  const adapter = await CCTPSettlementAdapter.deploy(
    hre.ethers.getAddress(tokenMessenger.toLowerCase()),
    hre.ethers.getAddress(usdc.toLowerCase()),
    hre.ethers.getAddress(kernel.toLowerCase())
  );
  await adapter.waitForDeployment();
  const adapterAddress = await adapter.getAddress();
  console.log("✅ CCTPSettlementAdapter deployed to:", adapterAddress);

  console.log("\nDeployment Details:");
  console.log("-------------------");
  console.log(`Network: ${networkName}`);
  console.log(`CCTPSettlementAdapter: ${adapterAddress}`);
  console.log(`TokenMessenger: ${tokenMessenger}`);
  console.log(`USDC: ${usdc}`);
  console.log(`Kernel: ${kernel}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
