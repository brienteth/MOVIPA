/**
 * Deploy Flash Loan Adapters and Canvas Block to Sepolia
 * Deploys: AaveV3Adapter, UniswapV3Adapter, UniswapV4Adapter, CanvasFlashLoanBlock
 */

const hre = require("hardhat");

// Sepolia Contract Addresses
const SEPOLIA = {
  // Aave V3 - Use lowercase to avoid checksum issues
  lendingPool: "0x6ae43d3271ff6888e7fc43fd7321a26f13f34dd4", // Pool (V3) - lowercase
  poolAddressesProvider: "0x0496275d34753a48320ca58103d5220d394ff77fc", // PoolAddressesProvider - lowercase

  // Uniswap V3
  uniswapV3Factory: "0x1F98431c8aD98523631AE4a59f267346ea3b26Bf", // Same on all EVM chains

  // Uniswap V4
  poolManager: "0x00000000000000000000000000000000000000000000", // Will be updated

  // Tokens
  USDC: "0x94a9D9Ac8a22534E3FAcA9f88AbF5D1Da0C4dEf8",
  DAI: "0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357",
  USDT: "0xF4dB845EdF52B65E4f1B69B51E013Cf67FB552E5",
  WETH: "0xfFf9976782d46CC05630D1855595EB8d5cbF6f12",
};

async function main() {
  console.log("🚀 Deploying Flash Loan Adapters & Canvas Block to Sepolia...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log(`📝 Deployer: ${deployer.address}\n`);

  const provider = hre.ethers.provider;
  let nonce = await provider.getTransactionCount(deployer.address);

  try {
    // ==================== Deploy Aave V3 Adapter ====================
    console.log("1️⃣  Deploying Aave V3 Adapter...");
    const AaveV3Adapter = await hre.ethers.getContractFactory("AaveV3FlashLoanAdapter");
    const aaveAdapter = await AaveV3Adapter.deploy(
      SEPOLIA.lendingPool,
      SEPOLIA.poolAddressesProvider,
      { gasLimit: 3000000, nonce: nonce++ }
    );
    await aaveAdapter.deployed();
    console.log(`✅ Aave V3 Adapter: ${aaveAdapter.address}\n`);

    // ==================== Deploy Uniswap V3 Adapter ====================
    console.log("2️⃣  Deploying Uniswap V3 Adapter...");
    const UniswapV3Adapter = await hre.ethers.getContractFactory("UniswapV3FlashLoanAdapter");
    const uniswapV3Adapter = await UniswapV3Adapter.deploy(
      SEPOLIA.uniswapV3Factory,
      { gasLimit: 3000000, nonce: nonce++ }
    );
    await uniswapV3Adapter.deployed();
    console.log(`✅ Uniswap V3 Adapter: ${uniswapV3Adapter.address}\n`);

    // ==================== Deploy Uniswap V4 Adapter ====================
    console.log("3️⃣  Deploying Uniswap V4 Adapter...");
    // Note: V4 PoolManager might not be available on Sepolia yet
    // Using placeholder, will update when V4 is live
    const UniswapV4Adapter = await hre.ethers.getContractFactory("UniswapV4FlashLoanAdapter");
    const uniswapV4Adapter = await UniswapV4Adapter.deploy(
      SEPOLIA.poolManager,
      { gasLimit: 3000000, nonce: nonce++ }
    );
    await uniswapV4Adapter.deployed();
    console.log(`✅ Uniswap V4 Adapter: ${uniswapV4Adapter.address}\n`);

    // ==================== Deploy Canvas Flash Loan Block ====================
    console.log("4️⃣  Deploying Canvas Flash Loan Block...");
    const CanvasFlashLoanBlock = await hre.ethers.getContractFactory("CanvasFlashLoanBlock");
    const canvasBlock = await CanvasFlashLoanBlock.deploy(
      aaveAdapter.address,
      uniswapV3Adapter.address,
      uniswapV4Adapter.address,
      { gasLimit: 3000000, nonce: nonce++ }
    );
    await canvasBlock.deployed();
    console.log(`✅ Canvas Flash Loan Block: ${canvasBlock.address}\n`);

    // ==================== Deploy Registry ====================
    console.log("5️⃣  Deploying Flash Loan Block Registry...");
    const Registry = await hre.ethers.getContractFactory("FlashLoanBlockRegistry");
    const registry = await Registry.deploy(
      { gasLimit: 2000000, nonce: nonce++ }
    );
    await registry.deployed();
    console.log(`✅ Registry: ${registry.address}\n`);

    // ==================== Register Canvas Block ====================
    console.log("6️⃣  Registering Canvas Block in Registry...");
    const registerTx = await registry.registerBlock(
      "CanvasFlashLoanBlock-Sepolia-v1",
      canvasBlock.address,
      "Canvas Flash Loan Block with Aave V3, Uniswap V3, V4 support",
      { gasLimit: 1000000, nonce: nonce++ }
    );
    await registerTx.wait();
    console.log(`✅ Registered in Registry\n`);

    // ==================== Verify Adapters ====================
    console.log("7️⃣  Verifying Adapter Configuration...");
    const [names, addresses, fees] = await canvasBlock.getAdaptersInfo();
    console.log(`📊 Registered Adapters:`);
    for (let i = 0; i < names.length; i++) {
      console.log(`   ${i + 1}. ${names[i]} (${addresses[i]}) - Fee: ${fees[i]} bps`);
    }

    // ==================== Final Report ====================
    console.log("\n" + "=".repeat(60));
    console.log("✨ DEPLOYMENT COMPLETE ✨");
    console.log("=".repeat(60));
    console.log("\n📋 SEPOLIA DEPLOYMENT SUMMARY:\n");
    console.log(`AaveV3FlashLoanAdapter:    ${aaveAdapter.address}`);
    console.log(`UniswapV3FlashLoanAdapter: ${uniswapV3Adapter.address}`);
    console.log(`UniswapV4FlashLoanAdapter: ${uniswapV4Adapter.address}`);
    console.log(`CanvasFlashLoanBlock:      ${canvasBlock.address}`);
    console.log(`FlashLoanBlockRegistry:    ${registry.address}`);

    console.log("\n🔗 Add to Canvas config (frontend/src/lib/contracts.ts):");
    console.log(`
const FLASH_LOAN_ADAPTERS = {
  aaveV3: "${aaveAdapter.address}",
  uniswapV3: "${uniswapV3Adapter.address}",
  uniswapV4: "${uniswapV4Adapter.address}",
};

const CANVAS_FLASH_LOAN_BLOCK = "${canvasBlock.address}";
const FLASH_LOAN_REGISTRY = "${registry.address}";
    `);

    console.log("\n📄 Save deployment to backend:");
    const deployment = {
      network: "sepolia",
      timestamp: new Date().toISOString(),
      addresses: {
        aaveV3Adapter: aaveAdapter.address,
        uniswapV3Adapter: uniswapV3Adapter.address,
        uniswapV4Adapter: uniswapV4Adapter.address,
        canvasFlashLoanBlock: canvasBlock.address,
        registry: registry.address,
      },
      tokens: SEPOLIA,
    };

    console.log("\n✅ Next Steps:");
    console.log("   1. Update frontend contracts.ts with adapter addresses");
    console.log("   2. Update Canvas UI to show flash loan options");
    console.log("   3. Test executeFlashLoanStrategy on Sepolia testnet");
    console.log("   4. Verify adapters support target tokens\n");

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
