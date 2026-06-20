const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // For local validation we use deployer address as mock pool caller.
  const mockPool = deployer.address;

  const Receiver = await hre.ethers.getContractFactory("AaveFlashReceiver");
  const receiver = await Receiver.deploy(mockPool);
  await receiver.waitForDeployment();

  const receiverAddress = await receiver.getAddress();
  console.log("AaveFlashReceiver deployed:", receiverAddress);

  // Callback call validation (no flash loan execution, only signature/caller path)
  const tx = await receiver.executeOperation(
    hre.ethers.ZeroAddress,
    0,
    0,
    receiverAddress,
    "0x"
  );
  await tx.wait();

  console.log("executeOperation callback signature validated.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
