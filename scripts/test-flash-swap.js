const { ethers } = require("hardhat");

async function main() {
  const routerAddress = "0x09Bee01F41D36B40e4eB86c4557D1f572949d516";
  const [deployer] = await ethers.getSigners();
  
  const router = await ethers.getContractAt("Brick3Router", routerAddress, deployer);
  
  const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  const AaveAdapter = "0x0f840e0DeA1c11b2aB35A8f18A3ab4ac47cF5262";
  const flashLoanAmount = 1000000; // 1 USDC

  const abiCoder = new ethers.AbiCoder();
  
  const flashLoanParams = abiCoder.encode(
    ["address", "address", "uint256"],
    [AaveAdapter, USDC, flashLoanAmount]
  );
  
  const actions = [
    {
      actionType: 0, // FLASH_LOAN
      params: flashLoanParams
    }
  ];

  const strategyHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(actions)));
  
  try {
    const res = await router.executeStrategy.staticCall(actions, 0, Math.floor(Date.now()/1000) + 1000, strategyHash);
    console.log("Success:", res);
  } catch(e) {
    console.error("Revert reason:", e.reason || e.message);
    if(e.info) console.error(e.info.error.message);
  }
}

main().catch(console.error);
