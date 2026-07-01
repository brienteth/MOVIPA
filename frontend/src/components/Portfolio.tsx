"use client";

import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { motion, AnimatePresence } from 'framer-motion';
import { BRICK3_CONTRACTS } from '../lib/contracts';
import { getOpacusWalletAddress } from '../lib/web3';
import { useToast } from '../hooks/use-toast';

interface TxHistory {
  hash: string;
  timestamp: number;
  status: 'Success' | 'Failed';
  type: string;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

const getTransactionOverrides = async (provider: ethers.BrowserProvider) => {
  try {
    const feeData = await provider.getFeeData();
    const overrides: any = {};
    if (feeData.maxFeePerGas) {
      overrides.maxFeePerGas = feeData.maxFeePerGas;
    }
    if (feeData.maxPriorityFeePerGas) {
      overrides.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
    }
    if (!overrides.maxFeePerGas && feeData.gasPrice) {
      overrides.gasPrice = feeData.gasPrice;
    }
    return overrides;
  } catch (e) {
    console.error("Failed to fetch fee data:", e);
    return {};
  }
};

export default function Portfolio() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const [history, setHistory] = useState<TxHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState("0.00");
  
  const [kernelBalance, setKernelBalance] = useState("0.00");
  const [fundingUSDC, setFundingUSDC] = useState(false);
  const kernelAddress = address ? getOpacusWalletAddress(address) : "0x0000000000000000000000000000000000000000";
  const sharedKernelAddress = "0x40021c19a16d2Ca7640D0B93A487023F9f6250B2";
  const usdcAddress = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  const FACTORY_ADDRESS = "0x026E35ae1FB5458e7332056793f1814A58a687b6";
  const [sharedKernelBalance, setSharedKernelBalance] = useState("0.00");
  const [isSharedKernelOwner, setIsSharedKernelOwner] = useState(false);

  const fetchKernelBalance = async () => {
    try {
      const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
      const abi = [
        "function balanceOf(address account) external view returns (uint256)",
        "function owner() external view returns (address)"
      ];
      const contract = new ethers.Contract(usdcAddress, abi, provider);
      
      const bal = await contract.balanceOf(kernelAddress);
      setKernelBalance(ethers.formatUnits(bal, 6));

      const sharedBal = await contract.balanceOf(sharedKernelAddress);
      setSharedKernelBalance(ethers.formatUnits(sharedBal, 6));

      if (address) {
        try {
          const code = await provider.getCode(sharedKernelAddress);
          if (code !== "0x" && code !== "0x00") {
            const kernelContract = new ethers.Contract(sharedKernelAddress, abi, provider);
            const owner = await kernelContract.owner();
            setIsSharedKernelOwner(owner.toLowerCase() === address.toLowerCase());
          }
        } catch (e) {
          console.warn("Could not fetch shared kernel owner:", e);
        }
      }
    } catch (e) {
      console.error("Failed to fetch kernel balance:", e);
    }
  };
  const [showFundModal, setShowFundModal] = useState(false);
  const [fundType, setFundType] = useState<'deposit' | 'withdraw' | 'shared_withdraw'>('deposit');
  const [fundAmount, setFundAmount] = useState('2.0');

  const openDepositModal = () => {
    setFundType('deposit');
    setFundAmount('2.0');
    setShowFundModal(true);
  };

  const openWithdrawModal = () => {
    setFundType('withdraw');
    setFundAmount(kernelBalance);
    setShowFundModal(true);
  };

  const executeDeposit = async (amountStr: string) => {
    if (!address) return;
    if (!amountStr || isNaN(Number(amountStr)) || Number(amountStr) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid USDC amount.",
        variant: "destructive",
      });
      return;
    }
    setFundingUSDC(true);
    try {
      // @ts-ignore
      let provider = new ethers.BrowserProvider(window.ethereum);
      let signer = await provider.getSigner();

      // Check network and switch to Base Mainnet (8453) if needed
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== 8453) {
        toast({
          title: "Switching Network",
          description: "Please switch your wallet network to Base Mainnet...",
        });
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x2105' }], // 8453 in hex
          });
          // Re-initialize provider and signer
          provider = new ethers.BrowserProvider(window.ethereum);
          signer = await provider.getSigner();
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0x2105',
                  chainName: 'Base',
                  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
                  rpcUrls: ['https://mainnet.base.org'],
                  blockExplorerUrls: ['https://basescan.org'],
                },
              ],
            });
            provider = new ethers.BrowserProvider(window.ethereum);
            signer = await provider.getSigner();
          } else {
            throw switchError;
          }
        }
      }

      const abi = ["function transfer(address to, uint256 amount) public returns (bool)"];
      const usdcContract = new ethers.Contract(usdcAddress, abi, signer);
      
      const safeTruncateAmount = (val: string, dec: number) => {
        if (!val || isNaN(Number(val))) return '0';
        const parts = val.split('.');
        if (parts.length > 1) return `${parts[0]}.${parts[1].slice(0, dec)}`;
        return val;
      };
       const amount = ethers.parseUnits(safeTruncateAmount(amountStr, 6), 6);
      const overrides = await getTransactionOverrides(provider);
      const tx = await usdcContract.transfer(kernelAddress, amount, overrides);
      await tx.wait();
      
      toast({
        title: "USDC Deposit Confirmed!",
        description: `Your Smart Account is now funded with ${amountStr} USDC.`,
        variant: "success",
      });
      await fetchKernelBalance();
    } catch (e: any) {
      toast({
        title: "Deposit Failed",
        description: e.message || String(e),
        variant: "destructive",
      });
    } finally {
      setFundingUSDC(false);
    }
  };

  const executeWithdraw = async (amountStr: string) => {
    if (!address) return;
    if (!amountStr || isNaN(Number(amountStr)) || Number(amountStr) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid USDC amount.",
        variant: "destructive",
      });
      return;
    }
    const amountNum = Number(amountStr);
    const balanceNum = Number(kernelBalance);
    if (amountNum > balanceNum) {
      toast({
        title: "Insufficient Balance",
        description: "You do not have enough USDC inside your Smart Account.",
        variant: "destructive",
      });
      return;
    }

    try {
      setFundingUSDC(true);
      // @ts-ignore
      let provider = new ethers.BrowserProvider(window.ethereum);
      let signer = await provider.getSigner();

      // Check network and switch to Base Mainnet (8453) if needed
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== 8453) {
        toast({
          title: "Switching Network",
          description: "Please switch your wallet network to Base Mainnet...",
        });
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x2105' }], // 8453 in hex
          });
          // Re-initialize provider and signer
          provider = new ethers.BrowserProvider(window.ethereum);
          signer = await provider.getSigner();
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0x2105',
                  chainName: 'Base',
                  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
                  rpcUrls: ['https://mainnet.base.org'],
                  blockExplorerUrls: ['https://basescan.org'],
                },
              ],
            });
            provider = new ethers.BrowserProvider(window.ethereum);
            signer = await provider.getSigner();
          } else {
            throw switchError;
          }
        }
      }

      // Check if kernel smart wallet is deployed on-chain
      const code = await provider.getCode(kernelAddress);
      const isDeployed = code !== "0x" && code !== "0x00";

      if (!isDeployed) {
        // Auto-deploy the smart wallet via factory before withdrawing
        toast({
          title: "Deploying Your Smart Wallet",
          description: "Your personal vault is being deployed on-chain for the first time...",
        });

        const factory = new ethers.Contract(
          FACTORY_ADDRESS,
          ["function createAccount(address owner) external returns (address)"],
          signer
        );

        const deployTx = await factory.createAccount(address);
        await deployTx.wait();

        toast({
          title: "Smart Wallet Deployed!",
          description: "Your personal vault is now live. Proceeding with withdrawal...",
        });
      }

      const kernelContract = new ethers.Contract(
        kernelAddress,
        [
          "function approveToken(address token, address spender, uint256 amount) external",
          "function owner() view returns (address)"
        ],
        signer
      );

      const owner = await kernelContract.owner();
      if (owner.toLowerCase() !== address.toLowerCase()) {
        toast({
          title: "Ownership Error",
          description: `Connected wallet is not the owner. Owner: ${owner.slice(0, 6)}...${owner.slice(-4)}`,
          variant: "destructive",
        });
        setFundingUSDC(false);
        return;
      }

      toast({
        title: "Initiating Withdrawal",
        description: "Step 1: Granting USDC allowance from your vault...",
      });

      const safeTruncateAmount = (val: string, dec: number) => {
        if (!val || isNaN(Number(val))) return '0';
        const parts = val.split('.');
        if (parts.length > 1) return `${parts[0]}.${parts[1].slice(0, dec)}`;
        return val;
      };
       const amountUnits = ethers.parseUnits(safeTruncateAmount(amountStr, 6), 6);
      const overrides = await getTransactionOverrides(provider);
      const tx1 = await kernelContract.approveToken(usdcAddress, address, amountUnits, overrides);
      await tx1.wait();

      toast({
        title: "Allowance Granted",
        description: "Step 2: Transferring USDC to your wallet...",
      });

      const usdcContract = new ethers.Contract(
        usdcAddress,
        ["function transferFrom(address from, address to, uint256 amount) public returns (bool)"],
        signer
      );

       const tx2 = await usdcContract.transferFrom(kernelAddress, address, amountUnits, overrides);
      await tx2.wait();

      toast({
        title: "Withdrawal Succeeded!",
        description: `${amountStr} USDC transferred to your wallet.`,
        variant: "success",
      });

      await fetchKernelBalance();
    } catch (e: any) {
      toast({
        title: "Withdrawal Failed",
        description: e.message || String(e),
        variant: "destructive",
      });
    } finally {
      setFundingUSDC(false);
    }
  };

  const executeSharedWithdraw = async (amountStr: string) => {
    if (!address) return;
    if (!amountStr || isNaN(Number(amountStr)) || Number(amountStr) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid USDC amount.",
        variant: "destructive",
      });
      return;
    }
    const amountNum = Number(amountStr);
    const balanceNum = Number(sharedKernelBalance);
    if (amountNum > balanceNum) {
      toast({
        title: "Insufficient Balance",
        description: "You do not have enough USDC inside the shared Kernel.",
        variant: "destructive",
      });
      return;
    }

    try {
      setFundingUSDC(true);
      // @ts-ignore
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const kernelContract = new ethers.Contract(
        sharedKernelAddress,
        [
          "function approveToken(address token, address spender, uint256 amount) external",
          "function owner() view returns (address)"
        ],
        signer
      );

      const owner = await kernelContract.owner();
      if (owner.toLowerCase() !== address.toLowerCase()) {
        toast({
          title: "Ownership Error",
          description: `Connected wallet is not the owner of the shared Kernel contract.`,
          variant: "destructive",
        });
        setFundingUSDC(false);
        return;
      }

      toast({
        title: "Initiating Shared Withdrawal",
        description: "Step 1: Granting USDC allowance from Shared Kernel...",
      });

      const safeTruncateAmount = (val: string, dec: number) => {
        if (!val || isNaN(Number(val))) return '0';
        const parts = val.split('.');
        if (parts.length > 1) return `${parts[0]}.${parts[1].slice(0, dec)}`;
        return val;
      };
       const amountUnits = ethers.parseUnits(safeTruncateAmount(amountStr, 6), 6);
      const overrides = await getTransactionOverrides(provider);
      const tx1 = await kernelContract.approveToken(usdcAddress, address, amountUnits, overrides);
      await tx1.wait();

      toast({
        title: "Allowance Granted",
        description: "Step 2: Transferring USDC from Shared Kernel to your EOA...",
      });

      const usdcContract = new ethers.Contract(
        usdcAddress,
        ["function transferFrom(address from, address to, uint256 amount) public returns (bool)"],
        signer
      );

       const tx2 = await usdcContract.transferFrom(sharedKernelAddress, address, amountUnits, overrides);
      await tx2.wait();

      toast({
        title: "Shared Withdrawal Succeeded!",
        description: `${amountStr} USDC returned to your Metamask wallet.`,
        variant: "success",
      });

      await fetchKernelBalance();
    } catch (e: any) {
      toast({
        title: "Withdrawal Failed",
        description: e.message || String(e),
        variant: "destructive",
      });
    } finally {
      setFundingUSDC(false);
    }
  };


  useEffect(() => {
    if (!address || !isConnected) return;
    
    let isMounted = true;
    const fetchPortfolio = async () => {
      setLoading(true);
      try {
        const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
        const bal = await provider.getBalance(address);
        if (isMounted) setBalance(ethers.formatEther(bal));

        // Fetch logs for StrategyRegistry
        const blockNumber = await provider.getBlockNumber();
        let logs: any[] = [];
        try {
          logs = await provider.getLogs({
            fromBlock: blockNumber - 5000,
            toBlock: 'latest',
            address: BRICK3_CONTRACTS.StrategyRegistry,
          });
        } catch (e) {
          console.warn("Failed to get logs with 5000 range, trying 500 range...", e);
          try {
            logs = await provider.getLogs({
              fromBlock: blockNumber - 500,
              toBlock: 'latest',
              address: BRICK3_CONTRACTS.StrategyRegistry,
            });
          } catch (innerErr) {
            console.error("Failed to query logs", innerErr);
          }
        }

        const txs: TxHistory[] = [];
        
        // Go backwards to get the most recent ones first
        for (let i = logs.length - 1; i >= Math.max(0, logs.length - 20); i--) {
          const log = logs[i];
          const tx = await provider.getTransaction(log.transactionHash);
          if (tx && tx.from.toLowerCase() === address.toLowerCase()) {
            const receipt = await provider.getTransactionReceipt(tx.hash);
            const block = await provider.getBlock(log.blockNumber);
            
            // Avoid duplicates
            if (!txs.find(t => t.hash === tx.hash)) {
              txs.push({
                hash: tx.hash,
                timestamp: block?.timestamp ? block.timestamp * 1000 : Date.now(),
                status: receipt?.status === 1 ? 'Success' : 'Failed',
                type: 'Strategy Registered'
              });
            }
          }
        }
        
        if (isMounted) setHistory(txs);
      } catch (err) {
        console.error("Failed to fetch portfolio data", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPortfolio();
    fetchKernelBalance();
    
    // Poll balance every 10 seconds
    const interval = setInterval(fetchKernelBalance, 10000);
    
    return () => { 
      isMounted = false; 
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, isConnected]);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white p-10">
        <span className="material-symbols-outlined text-6xl text-white/20 mb-4">wallet</span>
        <h2 className="text-xl font-medium text-white/80">Connect Wallet to view Portfolio</h2>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#0A0505] text-white p-6 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto space-y-8"
      >
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-wide">Your Portfolio</h1>
          <p className="text-sm text-white/50">Track your strategy executions, P&L, and asset distribution on Base.</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-[#0F121A] border border-white/10 rounded-2xl p-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <span className="material-symbols-outlined text-6xl">account_balance_wallet</span>
            </div>
            <div className="text-sm text-white/50 uppercase tracking-wider mb-2">Total Value (Base ETH)</div>
            <div className="text-3xl font-bold">{parseFloat(balance).toFixed(4)} ETH</div>
            <div className="text-xs text-green-400 mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              Active
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-[#0F121A] border border-white/10 rounded-2xl p-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <span className="material-symbols-outlined text-6xl">analytics</span>
            </div>
            <div className="text-sm text-white/50 uppercase tracking-wider mb-2">Est. P&L (Monthly)</div>
            <div className="text-3xl font-bold text-green-400">+$0.00</div>
            <div className="text-xs text-white/40 mt-2">Simulated yield based on strategies</div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-[#0F121A] border border-white/10 rounded-2xl p-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <span className="material-symbols-outlined text-6xl">bolt</span>
            </div>
            <div className="text-sm text-white/50 uppercase tracking-wider mb-2">Active Strategies</div>
            <div className="text-3xl font-bold">{loading ? "..." : history.filter(h => h.status === 'Success').length}</div>
            <div className="text-xs text-white/40 mt-2">Registered on-chain</div>
          </motion.div>
        </div>
        
        {/* Kernel Smart Wallet & AI Automation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Kernel Card */}
          <div className="bg-[#0F121A] border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-white">
              <span className="material-symbols-outlined text-[#00D1C7]">account_balance_wallet</span>
              Kernel Smart Wallet (Auto-Pilot Vault)
            </h2>



            <p className="text-sm text-white/60 mb-6 leading-relaxed">
              Your strategy flows execute inside your personal autonomous vault contract. Keep a small USDC balance in this vault as a gas/slippage buffer to guarantee seamless multi-step automation.
            </p>
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-4 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/50">Smart Vault Address:</span>
                <span className="font-mono text-white/90 select-all">{kernelAddress}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/50">Gas & Slippage Buffer:</span>
                <span className="font-bold text-[#00D1C7]">{parseFloat(kernelBalance).toFixed(4)} USDC</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={openDepositModal}
                disabled={fundingUSDC}
                className="flex items-center justify-center gap-1.5 bg-white text-black font-semibold rounded-xl py-3 hover:bg-white/90 transition-colors disabled:opacity-50 text-sm"
              >
                {fundingUSDC ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">add_circle</span>
                    Deposit USDC
                  </>
                )}
              </button>
              <button
                onClick={openWithdrawModal}
                disabled={fundingUSDC || parseFloat(kernelBalance) <= 0}
                className="flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl py-3 transition-colors disabled:opacity-50 text-sm border border-white/10"
              >
                <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                Withdraw to EOA
              </button>
            </div>

            {isSharedKernelOwner && parseFloat(sharedKernelBalance) > 0 && (
              <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-yellow-500 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[16px]">warning</span>
                  Shared Contract Recoverable Funds Detected
                </div>
                <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/50">Shared Contract:</span>
                    <span className="font-mono text-white/90 select-all">{sharedKernelAddress}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/50">Recoverable Balance:</span>
                    <span className="font-bold text-yellow-500">{parseFloat(sharedKernelBalance).toFixed(4)} USDC</span>
                  </div>
                  <button
                    onClick={() => {
                      setFundType('shared_withdraw' as any);
                      setFundAmount(sharedKernelBalance);
                      setShowFundModal(true);
                    }}
                    className="w-full bg-yellow-500 text-black font-semibold rounded-xl py-2.5 hover:bg-yellow-400 transition-colors text-xs flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">publish</span>
                    Recover from Shared Contract
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Transaction History */}
        <div className="bg-[#0F121A] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Recent Executions</h2>
            {loading && (
              <span className="flex items-center gap-2 text-xs text-white/50">
                <span className="w-2 h-2 rounded-full bg-white/50 animate-pulse"></span> Syncing
              </span>
            )}
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {history.length === 0 && !loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8 text-center text-white/40 text-sm">
                  No strategies executed yet. Head to the Workspace to build your first strategy.
                </motion.div>
              )}
              
              {history.map((tx, idx) => (
                <motion.div 
                  key={tx.hash}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.status === 'Success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      <span className="material-symbols-outlined text-[20px]">
                        {tx.status === 'Success' ? 'check_circle' : 'error'}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-sm">{tx.type}</div>
                      <div className="text-xs text-white/40 mt-0.5">{new Date(tx.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className={`text-xs px-2.5 py-1 rounded-full ${tx.status === 'Success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {tx.status}
                    </div>
                    <a 
                      href={`https://basescan.org/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/30 hover:text-white transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                    </a>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Custom Fund Modal */}
      <AnimatePresence>
        {showFundModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFundModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#0D1017] border border-white/10 rounded-2xl p-6 shadow-2xl overflow-hidden"
            >
              {/* Decorative gradient overlay */}
              <div className="absolute -top-32 -left-32 w-64 h-64 bg-[#00D1C7]/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />


              <div className="relative text-left">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-[#00D1C7]">
                    {fundType === 'deposit' ? 'add_circle' : 'account_balance_wallet'}
                  </span>
                  {fundType === 'deposit' ? 'Deposit USDC' : fundType === 'shared_withdraw' ? 'Recover USDC' : 'Withdraw USDC'}
                </h3>
                <p className="text-sm text-white/60 mb-6">
                  {fundType === 'deposit' 
                    ? 'Transfer USDC from your main Metamask wallet to your smart execution account.'
                    : fundType === 'shared_withdraw'
                    ? 'Reclaim USDC from the shared Kernel contract directly back to your main wallet.'
                    : 'Withdraw USDC from your smart execution account back to your main wallet.'}
                </p>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">
                      USDC Amount
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={fundAmount}
                        onChange={(e) => setFundAmount(e.target.value)}
                        className="w-full bg-[#141822] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#00D1C7] transition-colors font-medium text-lg pr-16"
                        autoFocus
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-white/40">
                        USDC
                      </div>
                    </div>
                    {(fundType === 'withdraw' || fundType === 'shared_withdraw') && (
                      <div className="flex justify-between items-center mt-2 text-xs text-white/50">
                        <span>Available Balance: {parseFloat(fundType === 'shared_withdraw' ? sharedKernelBalance : kernelBalance).toFixed(4)} USDC</span>
                        <button 
                          onClick={() => setFundAmount(fundType === 'shared_withdraw' ? sharedKernelBalance : kernelBalance)}
                          className="text-[#00D1C7] hover:underline font-semibold"
                        >
                          Max
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowFundModal(false)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl py-3 transition-colors border border-white/10 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      setShowFundModal(false);
                      if (fundType === 'deposit') {
                        await executeDeposit(fundAmount);
                      } else if (fundType === 'withdraw') {
                        await executeWithdraw(fundAmount);
                      } else if (fundType === 'shared_withdraw') {
                        await executeSharedWithdraw(fundAmount);
                      }
                    }}
                    className="flex-1 bg-white text-black font-semibold rounded-xl py-3 hover:bg-white/90 transition-colors text-sm flex items-center justify-center gap-1.5"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
