const { ethers, network } = require("hardhat");

async function main() {
  console.log(`Deploying Mock_ftUSD on ${network.name}...`);
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);

  const F = await ethers.getContractFactory("Mock_ftUSD");
  const contract = await F.deploy();
  await contract.waitForDeployment();
  const addr = await contract.getAddress();
  
  console.log(`Mock_ftUSD deployed at: ${addr}`);

  const fs = require("fs");
  fs.mkdirSync("./deployments", { recursive: true });
  fs.writeFileSync(
    `./deployments/ftUSD-${network.name}.json`, 
    JSON.stringify({
      network: network.name,
      deployer: deployer.address,
      contract: addr,
      deployedAt: new Date().toISOString()
    }, null, 2)
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
