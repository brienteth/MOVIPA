const { ethers } = require("ethers");

async function main() {
  const provider = new ethers.JsonRpcProvider("https://rpc.sepolia.org");
  const user = "0x164694750a8407B909336f1C9a1a4EB1Ba5911d4";
  console.log(`Checking Sepolia TXs for: ${user}`);
  
  // Just get the current block
  const blockNumber = await provider.getBlockNumber();
  console.log(`Current block: ${blockNumber}`);
  
  const balance = await provider.getBalance(user);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH`);
  
  // Since we can't easily get all TXs from a standard RPC without an indexer,
  // we can check if the user has interacted with the StrategyRegistry.
  const registryAddr = "0x7c19CB67a6CD4242043B6A635851FE47e2D7C2cf";
  
  const logs = await provider.getLogs({
    fromBlock: blockNumber - 10000,
    toBlock: "latest",
    address: registryAddr,
  });
  
  console.log(`Found ${logs.length} events on StrategyRegistry in last 10000 blocks.`);
  // Parse logs if possible
  // We can also fetch Etherscan API directly
  const etherscanUrl = `https://api-sepolia.etherscan.io/api?module=account&action=txlist&address=${user}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc`;
  const res = await fetch(etherscanUrl);
  const data = await res.json();
  if (data.status === "1") {
    console.log(`\nLast 5 Transactions from Etherscan:`);
    for (const tx of data.result.slice(0, 5)) {
      console.log(`- Hash: ${tx.hash}`);
      console.log(`  To: ${tx.to}`);
      console.log(`  MethodId: ${tx.methodId} (${tx.functionName || 'Unknown'})`);
      console.log(`  Status: ${tx.isError === '0' ? 'Success' : 'Failed'}`);
      console.log(`  Time: ${new Date(tx.timeStamp * 1000).toLocaleString()}`);
    }
  } else {
    console.log("No transactions found or Etherscan API limited.");
    console.log(data);
  }
}

main().catch(console.error);
