const { ethers } = require("hardhat");

async function main() {
  const usdcAddr = "0x29219dd400f2Bf60E5a23d13Be72B486D4038894";
  const rpcUrl = "https://rpc.soniclabs.com";
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  const usdcAbi = [
    "function balanceOf(address) view returns (uint256)",
    "function name() view returns (string)",
    "function totalSupply() view returns (uint256)",
    "event Transfer(address indexed from, address indexed to, uint256 value)"
  ];
  
  const usdc = new ethers.Contract(usdcAddr, usdcAbi, provider);
  console.log("Token:", await usdc.name());
  console.log("Total Supply:", (await usdc.totalSupply()).toString());

  const testAddresses = [
    "0x1D368773735ee1E678950B7A97bcA2CafB330CDc", // Shadow Router
    "0x09Bee01F41D36B40e4eB86c4557D1f572949d516", // Our kernel
    "0x73D4B99cF0C04D481036478F00Fd862D9589A940", // Our deployer
    "0x50c4271a269386c6b17dc69a5a4086ad2791d01b"  // wS contract
  ];

  let targetAddr = null;
  let targetBalance = 0n;

  for (const addr of testAddresses) {
    try {
      const bal = await usdc.balanceOf(addr);
      console.log(`Address: ${addr} | Balance: ${bal.toString()}`);
      if (bal > 0n && !targetAddr) {
        targetAddr = addr;
        targetBalance = bal;
      }
    } catch (e) {
      console.log(`Failed to query balance for ${addr}:`, e.message);
    }
  }

  if (!targetAddr) {
    console.log("No address in our test list has a non-zero balance. Let's find one by looking at recent Transfer events...");
    const currentBlock = await provider.getBlockNumber();
    const logs = await provider.getLogs({
      address: usdcAddr,
      topics: [ethers.id("Transfer(address,address,uint256)")],
      fromBlock: currentBlock - 5000,
      toBlock: currentBlock
    });

    console.log(`Found ${logs.length} recent transfer logs.`);
    for (const log of logs) {
      try {
        const parsed = usdc.interface.parseLog(log);
        if (parsed) {
          const to = parsed.args.to;
          const bal = await usdc.balanceOf(to);
          if (bal > 0n) {
            targetAddr = to;
            targetBalance = bal;
            console.log(`Found holder from log: ${to} | Balance: ${bal.toString()}`);
            break;
          }
        }
      } catch (e) {
        // Ignore parse error
      }
    }
  }

  if (!targetAddr) {
    console.log("Could not find any address with a non-zero balance.");
    return;
  }

  console.log(`Searching storage slot for holder: ${targetAddr} with balance: ${targetBalance.toString()}`);

  // Loop through slot 0 to 100 to find the slot index
  for (let slot = 0; slot < 100; slot++) {
    // Standard solidity mapping storage key calculation
    const slotHash = ethers.solidityPackedKeccak256(
      ["bytes32", "bytes32"],
      [
        ethers.zeroPadValue(targetAddr, 32),
        ethers.zeroPadValue(ethers.toBeHex(slot), 32)
      ]
    );

    const val = await provider.getStorage(usdcAddr, slotHash);
    const valBigInt = BigInt(val);
    
    if (valBigInt === targetBalance) {
      console.log(`🎉 Found correct storage slot! Mapping index: ${slot}`);
      console.log(`Storage Key Hash: ${slotHash}`);
      console.log(`Storage Value: ${valBigInt.toString()}`);
      return;
    }
  }

  console.log("Could not find storage slot in range 0-100.");
}

main().catch(console.error);
