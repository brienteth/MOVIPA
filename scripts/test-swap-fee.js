const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("=== Testing Swap with correct fee tier ===");

  const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  const WETH = "0x4200000000000000000000000000000000000006";
  const kernelAddr = "0x18C1d2974D512bEbE2b3bE36375B62f5eb1C38E2";
  const routerAddr = "0x09Bee01F41D36B40e4eB86c4557D1f572949d516";
  const registryAddr = "0xF30f02c6b2bb2D2345C72cCD759F56B8e924D8b1";
  const uniAdapterAddr = "0x68Fcae27158aC9464CB54A51c6F0A2A427eb2B36";

  const abiCoder = new ethers.AbiCoder();
  
  // Check kernel USDC balance
  const erc20 = new ethers.Contract(USDC, [
    "function balanceOf(address) view returns (uint256)",
  ], deployer);
  const kernelBal = await erc20.balanceOf(kernelAddr);
  console.log("Kernel USDC:", ethers.formatUnits(kernelBal, 6));

  // On Base mainnet, USDC/WETH Uniswap V3 pool is at fee tier 500 (0.05%)
  // The adapter defaults to 3000 (0.3%) which likely doesn't have a pool!
  // We need to encode fee=500 in extraData
  const fee500 = abiCoder.encode(["uint24"], [500]);
  console.log("Fee 500 extraData:", fee500);
  
  // Try fee 500 (0.05%)
  const swapAmount = 500000n; // 0.5 USDC
  const swapParams500 = abiCoder.encode(
    ["address", "address", "address", "uint256", "uint256", "bytes"],
    [uniAdapterAddr, USDC, WETH, swapAmount, 0, fee500]
  );
  
  const actions500 = [{ actionType: 1, params: swapParams500 }];
  const hash500 = ethers.keccak256(ethers.toUtf8Bytes("fee500-" + Date.now()));
  
  const registry = await ethers.getContractAt("StrategyRegistry", registryAddr, deployer);
  const router = await ethers.getContractAt("Brick3Router", routerAddr, deployer);
  
  await (await registry.registerStrategy(hash500, "test")).wait();
  await new Promise(r => setTimeout(r, 3000));
  
  const deadline = Math.floor(Date.now() / 1000) + 600;
  
  console.log("\nTesting fee=500 (0.05%)...");
  try {
    const result = await router.executeStrategy.staticCall(actions500, 0, deadline, hash500);
    console.log("✅ FEE 500 SUCCESS:", result[0].toString(), result[1].toString());
  } catch (e) {
    console.error("Fee 500 failed:", e.reason || e.message);
  }
  
  // Also try fee 3000 to confirm that's what fails
  const fee3000 = abiCoder.encode(["uint24"], [3000]);
  const swapParams3000 = abiCoder.encode(
    ["address", "address", "address", "uint256", "uint256", "bytes"],
    [uniAdapterAddr, USDC, WETH, swapAmount, 0, fee3000]
  );
  const actions3000 = [{ actionType: 1, params: swapParams3000 }];
  const hash3000 = ethers.keccak256(ethers.toUtf8Bytes("fee3000-" + Date.now()));
  await (await registry.registerStrategy(hash3000, "test")).wait();
  await new Promise(r => setTimeout(r, 3000));
  
  console.log("\nTesting fee=3000 (0.3%)...");
  try {
    const result = await router.executeStrategy.staticCall(actions3000, 0, deadline, hash3000);
    console.log("Fee 3000 SUCCESS:", result[0].toString(), result[1].toString());
  } catch (e) {
    console.error("Fee 3000 failed:", e.reason || e.message);
  }
  
  // If fee 500 worked, try the full flow: Flash Loan + Swap + Swap back
  console.log("\n=== Full Flow: Flash Loan + Swap + Swap Back ===");
  const aaveAdapterAddr = "0x0f840e0DeA1c11b2aB35A8f18A3ab4ac47cF5262";
  const flashAmount = 1000000n; // 1 USDC
  
  const flashParams = abiCoder.encode(
    ["address", "address", "uint256"],
    [aaveAdapterAddr, USDC, flashAmount]
  );
  
  const swap1Params = abiCoder.encode(
    ["address", "address", "address", "uint256", "uint256", "bytes"],
    [uniAdapterAddr, USDC, WETH, flashAmount, 0, fee500]
  );
  
  // For swap back, we don't know exact WETH amount.
  // 1 USDC ≈ 0.000286 WETH at $3500/ETH → 286000000000000 wei
  // Use a conservative estimate and let Uniswap handle it
  const estimatedWeth = 280000000000000n; // ~0.00028 WETH
  const swap2Params = abiCoder.encode(
    ["address", "address", "address", "uint256", "uint256", "bytes"],
    [uniAdapterAddr, WETH, USDC, estimatedWeth, 0, fee500]
  );
  
  const fullActions = [
    { actionType: 0, params: flashParams },
    { actionType: 1, params: swap1Params },
    { actionType: 1, params: swap2Params },
  ];
  
  const fullHash = ethers.keccak256(ethers.toUtf8Bytes("full-" + Date.now()));
  await (await registry.registerStrategy(fullHash, "test://full")).wait();
  await new Promise(r => setTimeout(r, 3000));
  
  console.log("Static call...");
  try {
    const result = await router.executeStrategy.staticCall(fullActions, 0, deadline, fullHash);
    console.log("✅ FULL FLOW SUCCESS! Net profit:", result[0].toString(), "Fee:", result[1].toString());
    
    // Execute for real
    console.log("Executing for real...");
    const tx = await router.executeStrategy(fullActions, 0, deadline, fullHash, { gasLimit: 5000000 });
    console.log("Tx:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ CONFIRMED! Block:", receipt.blockNumber, "Gas:", receipt.gasUsed.toString());
  } catch (e) {
    console.error("FULL FLOW FAILED:", e.reason || e.message);
  }
}

main().catch(console.error);
