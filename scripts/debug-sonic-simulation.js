const { ethers, network } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("Starting Hardhat Network reset with Sonic fork...");
  // 1. Force network fork of Sonic Mainnet
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

  console.log("Forked Sonic Mainnet successfully.");

  const deployment = JSON.parse(fs.readFileSync("./deployments/kernel-sonic_mainnet.json", "utf8"));
  
  const routerAddr = deployment.contracts.Brick3Router;
  const pmAddr = deployment.contracts.PermissionManager;
  const mockPoolAddr = deployment.contracts.MockAavePool;
  const kernelAddr = deployment.contracts.StrategyExecutorKernel;
  const aaveAdapterAddr = deployment.contracts.AaveFlashAdapter;
  const usdcAddr = "0x29219dd400f2Bf60E5a23d13Be72B486D4038894";
  const ftusdAddr = "0x618A13a1dE79cde892a1cA5B3FC24D4AA66b718D";

  // Impersonate real owner
  const realOwner = "0x73D4B99cF0C04D481036478F00Fd862D9589A940";
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [realOwner],
  });
  await network.provider.send("hardhat_setBalance", [
    realOwner,
    "0x56BC75E2D63100000", // 100 S
  ]);
  const ownerSigner = await ethers.getSigner(realOwner);

  console.log("Real Owner / Solver:", realOwner);

  // Impersonate USDC holder to fund MockAavePool and kernel
  const usdcHolder = "0xEcb04e075503Bd678241f00155AbCB532c0a15Eb";
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [usdcHolder],
  });
  
  // Give holder some gas S tokens so they can pay for transfer tx
  await network.provider.send("hardhat_setBalance", [
    usdcHolder,
    "0x56BC75E2D63100000", // 100 S
  ]);

  const holderSigner = await ethers.getSigner(usdcHolder);
  const usdc = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", usdcAddr, holderSigner);

  // Let's send 1,000 USDC to MockAavePool to fund the flash loan
  const sendAmount = ethers.parseUnits("1000", 6); // 1,000 USDC
  console.log(`Funding MockAavePool (${mockPoolAddr}) with 1000 USDC...`);
  await (await usdc.transfer(mockPoolAddr, sendAmount)).wait();

  // Also fund Kernel with 10 USDC to cover fees/premiums
  console.log(`Funding Kernel (${kernelAddr}) with 10 USDC...`);
  await (await usdc.transfer(kernelAddr, ethers.parseUnits("10", 6))).wait();

  // Let's also approve kernel on the USDC contract for the AaveFlashAdapter
  console.log("Approving AaveFlashAdapter on USDC for Kernel...");
  const kernel = await ethers.getContractAt("StrategyExecutorKernel", kernelAddr, ownerSigner);
  await (await kernel.approveToken(usdcAddr, aaveAdapterAddr, ethers.MaxUint256)).wait();

  // Now, let's prepare the actions for the strategy
  const actionExecutor = deployment.contracts.ActionExecutor;
  const mockLendingAdapter = deployment.contracts.MockLendingAdapter;
  
  // Encode Flash Loan Params
  const flParams = ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "address", "uint256"],
    [aaveAdapterAddr, usdcAddr, ethers.parseUnits("100", 6)] // Borrow 100 USDC
  );

  // Encode Deposit Params
  const depositParams = ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "uint8", "address", "uint256", "bytes"],
    [mockLendingAdapter, 0, usdcAddr, ethers.parseUnits("100", 6), "0x"]
  );

  // Encode Mint Params
  const mintParams = ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "uint8", "address", "uint256", "bytes"],
    [mockLendingAdapter, 2, usdcAddr, ethers.parseUnits("70", 6), "0x"]
  );

  // Encode Yield Params (ftUSD)
  const yieldParams = ethers.AbiCoder.defaultAbiCoder().encode(
    ["address"],
    [ftusdAddr]
  );

  // Encode Repay Params
  const repayParams = ethers.AbiCoder.defaultAbiCoder().encode(
    ["address"],
    [realOwner]
  );

  const actions = [
    { actionType: 0, params: flParams }, // FLASH_LOAN
    { actionType: 2, params: depositParams }, // FT_DEPOSIT
    { actionType: 2, params: mintParams }, // FT_USD_MINT
    { actionType: 7, params: yieldParams }, // YIELD
    { actionType: 5, params: repayParams } // REPAY
  ];

  console.log("Simulating strategy execution on router...");
  const router = await ethers.getContractAt("Brick3Router", routerAddr, ownerSigner);

  try {
    const tx = await router.executeStrategy(
      actions,
      0, // minProfit
      Math.floor(Date.now() / 1000) + 10000,
      ethers.ZeroHash
    );
    console.log("Tx success!", tx.hash);
  } catch (err) {
    console.error("Simulation Reverted with error:");
    console.error(err);
  }
}

main().catch(console.error);
