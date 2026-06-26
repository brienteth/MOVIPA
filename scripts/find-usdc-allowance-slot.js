const { ethers, network } = require("hardhat");

async function main() {
  // Reset with Sonic fork
  await network.provider.request({
    method: "hardhat_reset",
    params: [
      {
        forking: {
          jsonRpcUrl: "https://rpc.soniclabs.com",
        },
      },
    ],
  });

  const usdcAddr = "0x29219dd400f2Bf60E5a23d13Be72B486D4038894";
  const [deployer] = await ethers.getSigners();
  const owner = deployer.address;
  const spender = "0x180A97d63681013aDd660901f06d0230368AFd53"; // aave flash adapter
  const targetAllowance = 123456789n;

  const usdc = await ethers.getContractAt([
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)"
  ], usdcAddr, deployer);

  console.log(`Setting allowance: owner ${owner} => spender ${spender} to ${targetAllowance.toString()}...`);
  await (await usdc.approve(spender, targetAllowance)).wait();

  const currentAllowance = await usdc.allowance(owner, spender);
  console.log("Current Allowance:", currentAllowance.toString());

  // Search slots 0 to 100 for the allowance mapping index
  for (let slot = 0; slot < 100; slot++) {
    // Nested mapping key calculation: keccak256(spender . keccak256(owner . slot))
    const ownerPadded = ethers.zeroPadValue(owner, 32);
    const slotPadded = ethers.zeroPadValue(ethers.toBeHex(slot), 32);
    const hash1 = ethers.solidityPackedKeccak256(
      ["bytes32", "bytes32"],
      [ownerPadded, slotPadded]
    );

    const spenderPadded = ethers.zeroPadValue(spender, 32);
    const slotHash = ethers.solidityPackedKeccak256(
      ["bytes32", "bytes32"],
      [spenderPadded, hash1]
    );

    const val = await ethers.provider.getStorage(usdcAddr, slotHash);
    const valBigInt = BigInt(val);

    if (valBigInt === targetAllowance) {
      console.log(`🎉 Found correct allowance slot! Mapping index: ${slot}`);
      console.log(`Storage Key Hash: ${slotHash}`);
      return;
    }
  }

  console.log("Could not find allowance storage slot in range 0-100.");
}

main().catch(console.error);
