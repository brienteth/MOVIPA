const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("=== BRICK3 Final E2E Test ===");
  console.log("Deployer:", deployer.address);

  const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  const kernelAddr = "0x18C1d2974D512bEbE2b3bE36375B62f5eb1C38E2";
  const routerAddr = "0x09Bee01F41D36B40e4eB86c4557D1f572949d516";
  const registryAddr = "0xF30f02c6b2bb2D2345C72cCD759F56B8e924D8b1";
  const aaveAdapterAddr = "0x0f840e0DeA1c11b2aB35A8f18A3ab4ac47cF5262";

  const abiCoder = new ethers.AbiCoder();
  const flashAmount = 1000000n; // 1 USDC

  const flashParams = abiCoder.encode(
    ["address", "address", "uint256"],
    [aaveAdapterAddr, USDC, flashAmount]
  );
  const actions = [{ actionType: 0, params: flashParams }];

  const uniqueId = "final-test-" + Date.now();
  const strategyHash = ethers.keccak256(ethers.toUtf8Bytes(uniqueId));
  console.log("Strategy hash:", strategyHash);
  console.log("Unique ID:", uniqueId);

  const registry = await ethers.getContractAt("StrategyRegistry", registryAddr, deployer);
  const router = await ethers.getContractAt("Brick3Router", routerAddr, deployer);

  // Step 1: Register
  console.log("\n1. Registering strategy...");
  const regTx = await registry.registerStrategy(strategyHash, "test://" + uniqueId);
  const regReceipt = await regTx.wait();
  console.log("   Registered in block:", regReceipt.blockNumber);

  // Step 2: Wait a moment for state to propagate
  console.log("   Waiting 3 seconds...");
  await new Promise(r => setTimeout(r, 3000));

  // Step 3: Verify via getCreator
  const creator = await registry.getCreator(strategyHash);
  console.log("2. getCreator:", creator);

  // Step 4: Try markUsed directly
  console.log("3. Testing markUsed staticCall...");
  try {
    await registry.markUsed.staticCall(strategyHash);
    console.log("   markUsed staticCall: SUCCESS");
  } catch (e) {
    console.error("   markUsed staticCall FAILED:", e.reason || e.message);
    
    // Try with a raw call
    console.log("   Trying raw eth_call...");
    const iface = new ethers.Interface(["function markUsed(bytes32)"]);
    const calldata = iface.encodeFunctionData("markUsed", [strategyHash]);
    try {
      await ethers.provider.call({ to: registryAddr, data: calldata });
      console.log("   Raw call succeeded!");
    } catch (e2) {
      console.error("   Raw call failed:", e2.message?.substring(0, 200));
    }
    return;
  }

  // Step 5: Check kernel USDC balance
  const erc20 = new ethers.Contract(USDC, [
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address,uint256) returns (bool)"
  ], deployer);
  
  const kernelBal = await erc20.balanceOf(kernelAddr);
  console.log("4. Kernel USDC:", ethers.formatUnits(kernelBal, 6));
  
  if (kernelBal < 1000n) {
    console.log("   Funding kernel with 0.01 USDC...");
    const tx = await erc20.transfer(kernelAddr, 10000n);
    await tx.wait();
    console.log("   Funded!");
  }

  // Step 6: Execute for real
  console.log("5. Executing strategy...");
  const deadline = Math.floor(Date.now() / 1000) + 600;
  
  try {
    // Static call first
    const simResult = await router.executeStrategy.staticCall(
      actions, 0, deadline, strategyHash
    );
    console.log("   Static call SUCCESS:", simResult[0].toString(), simResult[1].toString());
    
    // Real execution
    const execTx = await router.executeStrategy(
      actions, 0, deadline, strategyHash,
      { gasLimit: 3000000 }
    );
    console.log("   Tx:", execTx.hash);
    const receipt = await execTx.wait();
    console.log("   ✅ CONFIRMED! Block:", receipt.blockNumber, "Gas:", receipt.gasUsed.toString());
  } catch (e) {
    console.error("   FAILED:", e.reason || e.message);
  }
}

main().catch(console.error);
