const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const registryAddr = "0xF30f02c6b2bb2D2345C72cCD759F56B8e924D8b1";
  
  // Get raw storage to check what's really on chain
  // strategies mapping is at slot 1 (slot 0 is owner from Ownable)
  // For a mapping, the slot is keccak256(key . slot)
  const hash = "0xf9f9e7c701546c114c714dfafef43276fff7d64f3117f26535a63066be7382ab";
  
  // Slot for strategies mapping - it's after Ownable's _owner (slot 0)
  // mapping(bytes32 => StrategyMeta) public strategies;  at slot 1
  const baseSlot = ethers.solidityPackedKeccak256(
    ["bytes32", "uint256"],
    [hash, 1]
  );
  
  console.log("Base slot:", baseSlot);
  
  // Read slot 0 of the struct (creator address)
  const slot0 = await ethers.provider.getStorage(registryAddr, baseSlot);
  console.log("Slot 0 (creator):", slot0);
  
  // Read slot 1 (uri - string, only length/ptr)
  const slot1Num = BigInt(baseSlot) + 1n;
  const slot1 = await ethers.provider.getStorage(registryAddr, "0x" + slot1Num.toString(16));
  console.log("Slot 1 (uri):", slot1);
  
  // Read slot 2 (executionCount)
  const slot2Num = BigInt(baseSlot) + 2n;
  const slot2 = await ethers.provider.getStorage(registryAddr, "0x" + slot2Num.toString(16));
  console.log("Slot 2 (executionCount):", slot2);
  
  // Read slot 3 (exists bool)
  const slot3Num = BigInt(baseSlot) + 3n;
  const slot3 = await ethers.provider.getStorage(registryAddr, "0x" + slot3Num.toString(16));
  console.log("Slot 3 (exists):", slot3);
  
  // Also check deployed bytecode
  const code = await ethers.provider.getCode(registryAddr);
  console.log("\nBytecode length:", code.length);
  
  // Check if markUsed exists by looking for the function selector
  const markUsedSel = ethers.id("markUsed(bytes32)").slice(0, 10);
  const registerSel = ethers.id("registerStrategy(bytes32,string)").slice(0, 10);
  const getCreatorSel = ethers.id("getCreator(bytes32)").slice(0, 10);
  const strategiesSel = ethers.id("strategies(bytes32)").slice(0, 10);
  
  console.log("markUsed selector:", markUsedSel, "in bytecode:", code.includes(markUsedSel.slice(2)));
  console.log("registerStrategy selector:", registerSel, "in bytecode:", code.includes(registerSel.slice(2)));
  console.log("getCreator selector:", getCreatorSel, "in bytecode:", code.includes(getCreatorSel.slice(2)));
  console.log("strategies selector:", strategiesSel, "in bytecode:", code.includes(strategiesSel.slice(2)));
  
  // Try a low-level call to markUsed
  console.log("\n--- Low-level markUsed call ---");
  const iface = new ethers.Interface([
    "function markUsed(bytes32)",
    "function strategies(bytes32) view returns (address,string,uint256,bool)"
  ]);
  
  // Call strategies() directly via low level
  const calldata = iface.encodeFunctionData("strategies", [hash]);
  const rawResult = await ethers.provider.call({ to: registryAddr, data: calldata });
  console.log("Raw strategies() result:", rawResult);
  
  try {
    const decoded = iface.decodeFunctionResult("strategies", rawResult);
    console.log("Decoded:", decoded);
  } catch (e) {
    console.log("Decode error:", e.message);
    // Maybe the on-chain struct is different - try without exists field
    const iface2 = new ethers.Interface([
      "function strategies(bytes32) view returns (address,string,uint256)"
    ]);
    try {
      const decoded2 = iface2.decodeFunctionResult("strategies", rawResult);
      console.log("Decoded (3 fields):", decoded2);
    } catch (e2) {
      console.log("3-field decode also failed:", e2.message);
    }
  }
}

main().catch(console.error);
