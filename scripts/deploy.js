const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying Bendle contracts to", network.name);

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy CitadelRegistry
  console.log("📋 Deploying CitadelRegistry...");
  const CitadelRegistry = await ethers.getContractFactory("CitadelRegistry");
  const citadelRegistry = await CitadelRegistry.deploy();
  await citadelRegistry.deployed();
  console.log("✅ CitadelRegistry deployed to:", citadelRegistry.address);

  // Deploy mock USDC for testing (on testnets)
  let usdcAddress;
  if (network.name === "hardhat" || network.name === "localhost") {
    console.log("💰 Deploying Mock USDC...");
    const MockUSDC = await ethers.getContractFactory("MockERC20");
    const mockUSDC = await MockUSDC.deploy("USD Coin", "USDC", 6);
    await mockUSDC.deployed();
    usdcAddress = mockUSDC.address;
    console.log("✅ Mock USDC deployed to:", usdcAddress);

    // Mint some USDC to deployer for testing
    await mockUSDC.mint(deployer.address, ethers.utils.parseUnits("1000000", 6));
    console.log("💰 Minted 1,000,000 USDC to deployer");
  } else {
    // Use real USDC address on mainnets
    usdcAddress = "0xA0b86a33E6441e88C5F2712C3E9b74F5c4d6E3E6"; // Replace with actual USDC address
    console.log("💰 Using USDC at:", usdcAddress);
  }

  // Deploy X402Settlement
  console.log("💸 Deploying X402Settlement...");
  const X402Settlement = await ethers.getContractFactory("X402Settlement");
  const x402Settlement = await X402Settlement.deploy(
    usdcAddress,
    citadelRegistry.address,
    deployer.address // treasury address
  );
  await x402Settlement.deployed();
  console.log("✅ X402Settlement deployed to:", x402Settlement.address);

  // Register some default protocols in CitadelRegistry
  console.log("🔒 Configuring CitadelRegistry...");

  // Register common DeFi protocols
  const protocols = [
    { name: "Aave", category: "Lending", riskLevel: 20 },
    { name: "Uniswap", category: "DEX", riskLevel: 15 },
    { name: "Compound", category: "Lending", riskLevel: 25 },
    { name: "Curve", category: "DEX", riskLevel: 30 },
    { name: "Across", category: "Bridge", riskLevel: 35 }
  ];

  for (const protocol of protocols) {
    const tx = await citadelRegistry.whitelistProtocol(
      ethers.constants.AddressZero, // placeholder address
      protocol.name,
      protocol.category,
      protocol.riskLevel
    );
    await tx.wait();
    console.log(`✅ Whitelisted ${protocol.name}`);
  }

  // Save deployment addresses
  const deploymentInfo = {
    network: network.name,
    citadelRegistry: citadelRegistry.address,
    x402Settlement: x402Settlement.address,
    usdc: usdcAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString()
  };

  console.log("\n🎉 Deployment completed!");
  console.log("📄 Deployment info:", JSON.stringify(deploymentInfo, null, 2));

  // Save to file
  const fs = require("fs");
  fs.writeFileSync(
    `./deployments/${network.name}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log(`💾 Saved deployment info to ./deployments/${network.name}.json`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });