const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Flash Loan Arbitrage Execution", function () {
  it("Should compile and deploy adapters successfully", async function () {
    const Kernel = await ethers.getContractFactory("StrategyExecutorKernel");
    const ActionExec = await ethers.getContractFactory("ActionExecutor");
    const FlashManager = await ethers.getContractFactory("FlashLoanManager");
    const SwapManager = await ethers.getContractFactory("SwapManager");
    const LendingManager = await ethers.getContractFactory("LendingManager");

    // We just deploy them to ensure they compile and can be instantiated.
    const flashLoanManager = await FlashManager.deploy(ethers.ZeroAddress);
    const swapManager = await SwapManager.deploy(ethers.ZeroAddress);
    const lendingManager = await LendingManager.deploy();

    const actionExecutor = await ActionExec.deploy(
      await flashLoanManager.getAddress(),
      await swapManager.getAddress(),
      await lendingManager.getAddress()
    );

    const kernel = await Kernel.deploy(
      await actionExecutor.getAddress(),
      ethers.ZeroAddress,
      ethers.ZeroAddress
    );

    const AaveFlashAdapter = await ethers.getContractFactory("AaveFlashAdapter");
    const aaveFlashAdapter = await AaveFlashAdapter.deploy(ethers.ZeroAddress, await kernel.getAddress());

    const AaveV3LendingAdapter = await ethers.getContractFactory("AaveV3LendingAdapter");
    const aaveLendAdapter = await AaveV3LendingAdapter.deploy(ethers.ZeroAddress, await kernel.getAddress());

    const UniswapV3SwapAdapter = await ethers.getContractFactory("UniswapV3SwapAdapter");
    const uniV3SwapAdapter = await UniswapV3SwapAdapter.deploy(ethers.ZeroAddress, await kernel.getAddress());

    expect(await kernel.getAddress()).to.properAddress;
    expect(await aaveFlashAdapter.getAddress()).to.properAddress;
    expect(await aaveLendAdapter.getAddress()).to.properAddress;
    expect(await uniV3SwapAdapter.getAddress()).to.properAddress;
    console.log("✅ All mainnet adapters compiled and deployed in test mode.");
  });
});
