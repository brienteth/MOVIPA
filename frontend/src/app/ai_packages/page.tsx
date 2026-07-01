import React, { useState, useEffect, useMemo } from 'react';

interface Package {
  id: string;
  name: string;
  description: string;
  cost: string;
  profitFee: string;
  networks: string[];
  cap: string;
  speed: string;
  badge?: string;
  color: string;
  borderColor: string;
  features: string[];
  active?: boolean;
}

const PACKAGES: Package[] = [
  {
    id: 'bronze',
    name: 'Bronze Arbitrage Bot',
    description: 'Perfect for beginners starting to explore AI MEV. Runs basic daily scans on major pools.',
    cost: '$19 / Month',
    profitFee: '10%',
    networks: ['Base', 'BSC'],
    cap: '$10,000 USDC',
    speed: 'Standard Routing',
    color: 'from-amber-700/20 to-amber-950/20',
    borderColor: 'border-amber-700/40 hover:border-amber-500',
    features: ['Daily Automated Scans', 'Base & BSC Network support', 'Anti-Revert Protection', 'Email/App Notifications'],
    active: true,
  },
  {
    id: 'silver',
    name: 'Silver Speed Solver',
    description: 'High-speed automated bot leveraging QUIC transport protocols for immediate executions.',
    cost: '$99 / Month',
    profitFee: '5%',
    networks: ['Base', 'BSC', 'Arbitrum'],
    cap: '$100,000 USDC',
    speed: 'QUIC Priority Relaying',
    badge: 'Popular',
    color: 'from-slate-500/20 to-slate-800/20',
    borderColor: 'border-slate-500/40 hover:border-slate-300',
    features: ['Real-time Pool Scanning', 'Base, BSC & Arbitrum support', 'HTTP/3 QUIC Relayer priority', 'Dynamic gas fee optimization', 'Session-key auto delegation'],
    active: true,
  },
  {
    id: 'gold',
    name: 'Gold VIP Multi-Chain MEV',
    description: 'Full-featured solver routing complex arbitrage paths across multiple chains simultaneously.',
    cost: '$499 / Month',
    profitFee: '2%',
    networks: ['Base', 'BSC', 'Arbitrum', 'Solana'],
    cap: 'Unlimited',
    speed: 'Direct Node Co-location',
    badge: 'Advanced',
    color: 'from-yellow-600/20 to-yellow-950/20',
    borderColor: 'border-yellow-600/40 hover:border-yellow-400',
    features: ['Multi-Hop Arbitrage Pathfinding', 'Solana, Arbitrum, Base & BSC', 'Co-located RPC Direct Solver', 'Frontrun (Sandwich) protection', 'VIP dedicated discord solvers'],
    active: true,
  },
  {
    id: 'monad',
    name: 'Monad Parallel Alpha',
    description: 'Exclusive access to our high-performance parallelized EVM MEV bot on Monad.',
    cost: 'Free (Alpha Testing)',
    profitFee: '0%',
    networks: ['Monad'],
    cap: '$500,000 USDC',
    speed: 'Monad Parallel Pipeline',
    badge: 'New Devnet',
    color: 'from-purple-600/20 to-purple-950/20',
    borderColor: 'border-purple-600/40 hover:border-purple-400',
    features: ['Parallelized transaction bundling', '0% performance fee during devnet', 'Under-the-hood contract solvers', 'Private Monad node access'],
    active: true,
  },
];

interface LiveRun {
  id: string;
  time: string;
  network: string;
  package: string;
  borrowed: string;
  profit: string;
  status: 'SUCCESS' | 'REVERTED' | 'SOLVING';
}

export default function AiPackagesPage() {
  const [selectedNetwork, setSelectedNetwork] = useState<string>('All');
  const [subscribingPkg, setSubscribingPkg] = useState<Package | null>(null);
  const [subscribedIds, setSubscribedIds] = useState<string[]>(['bronze']); // Bronze subscribed by default for demo
  const [activationStep, setActivationStep] = useState<number>(1);
  const [gasLimit, setGasLimit] = useState<string>('15');
  const [liveRuns, setLiveRuns] = useState<LiveRun[]>([]);
  const [totalAIEarnings, setTotalAIEarnings] = useState<number>(241.95);

  const networks = ['All', 'Base', 'Solana', 'Arbitrum', 'Monad', 'BSC'];

  // Filter packages by selected network tab
  const filteredPackages = useMemo(() => {
    if (selectedNetwork === 'All') return PACKAGES;
    return PACKAGES.filter(p => p.networks.includes(selectedNetwork));
  }, [selectedNetwork]);

  // Generate live-updating simulation terminal runs
  useEffect(() => {
    const networksList = ['Base', 'BSC', 'Arbitrum', 'Solana', 'Monad'];
    const packagesList = ['Bronze', 'Silver', 'Gold', 'Monad Alpha'];
    const initialRuns: LiveRun[] = [
      { id: '1', time: '20:41:02', network: 'Base', package: 'Silver', borrowed: '5,000 USDC', profit: '+$21.80 USDC', status: 'SUCCESS' },
      { id: '2', time: '20:42:15', network: 'BSC', package: 'Bronze', borrowed: '1,000 USDC', profit: '+$4.12 BUSD', status: 'SUCCESS' },
      { id: '3', time: '20:43:30', network: 'Arbitrum', package: 'Silver', borrowed: '12,500 USDC', profit: '+$52.90 USDC', status: 'SUCCESS' },
      { id: '4', time: '20:44:11', network: 'Base', package: 'Gold', borrowed: '50,000 USDC', profit: '+$214.30 USDC', status: 'SUCCESS' },
    ];
    setLiveRuns(initialRuns);

    const interval = setInterval(() => {
      const net = networksList[Math.floor(Math.random() * networksList.length)];
      const pkg = packagesList[Math.floor(Math.random() * packagesList.length)];
      const borrow = Math.floor(Math.random() * 50) + 1;
      const isSuccess = Math.random() > 0.15;
      const profitVal = (borrow * (Math.random() * 4 + 1)).toFixed(2);
      
      const newRun: LiveRun = {
        id: Math.random().toString(),
        time: new Date().toTimeString().split(' ')[0],
        network: net,
        package: pkg,
        borrowed: `${(borrow * 1000).toLocaleString()} USDC`,
        profit: isSuccess ? `+$${profitVal} USDC` : '$0.00 (Reverted)',
        status: isSuccess ? 'SUCCESS' : 'REVERTED'
      };

      setLiveRuns(prev => [newRun, ...prev.slice(0, 7)]);
      if (isSuccess) {
        setTotalAIEarnings(prev => prev + parseFloat(profitVal));
      }
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const handleSubscribe = (pkg: Package) => {
    setSubscribingPkg(pkg);
    setActivationStep(1);
  };

  const handleConfirmActivation = () => {
    // Phase 1: approve limits, Phase 2: delegate key, Phase 3: complete
    if (activationStep < 3) {
      setActivationStep(prev => prev + 1);
    } else {
      if (subscribingPkg) {
        setSubscribedIds(prev => [...prev, subscribingPkg.id]);
      }
      setSubscribingPkg(null);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 bg-[#06080E] text-white">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            🤖 AI Automation Pools
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Delegate automated arbitrage & MEV solver agents to scan and execute trades on your behalf.
          </p>
        </div>
        <div className="bg-[#101524] border border-white/10 rounded-xl px-4 py-3 text-right">
          <div className="text-[10px] uppercase text-gray-400 font-semibold font-mono tracking-wider">Total Automated Earnings</div>
          <div className="text-xl font-bold text-[#1EF0A6] font-mono">${totalAIEarnings.toFixed(2)}</div>
        </div>
      </div>

      {/* Networks Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {networks.map(net => (
          <button
            key={net}
            onClick={() => setSelectedNetwork(net)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider uppercase border transition-all ${
              selectedNetwork === net
                ? 'bg-[#00D1C7] text-black border-[#00D1C7] shadow-[0_0_15px_rgba(0,209,199,0.3)]'
                : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:border-white/20'
            }`}
          >
            {net === 'All' ? '🌐 All Networks' : net}
          </button>
        ))}
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPackages.map((pkg) => {
          const isSubscribed = subscribedIds.includes(pkg.id);
          return (
            <div
              key={pkg.id}
              className={`rounded-2xl p-6 border bg-gradient-to-br ${pkg.color} ${pkg.borderColor} relative shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl flex flex-col justify-between`}
            >
              {pkg.badge && (
                <span className="absolute top-4 right-4 bg-[#00D1C7]/10 border border-[#00D1C7]/30 text-[#00D1C7] text-[10px] uppercase font-mono tracking-wider font-semibold px-2 py-0.5 rounded-lg">
                  {pkg.badge}
                </span>
              )}
              
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  {pkg.name}
                  {isSubscribed && <span className="text-xs font-mono font-normal text-[#1EF0A6] bg-[#1EF0A6]/10 px-2 py-0.5 rounded border border-[#1EF0A6]/20">🤖 Active</span>}
                </h3>
                <p className="text-xs text-white/70 mt-2 min-h-[40px]">{pkg.description}</p>
                
                <div className="grid grid-cols-2 gap-3 mt-4 border-t border-b border-white/5 py-4 my-4 text-xs font-mono">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase">Abonelik / Cost</span>
                    <span className="text-white font-bold">{pkg.cost}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase">Kar Payı / Profit Share</span>
                    <span className="text-white font-bold">{pkg.profitFee} Platform Fee</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase">Max Capital Limit</span>
                    <span className="text-white font-bold">{pkg.cap}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase">Latency / Routing</span>
                    <span className="text-white font-bold text-[#00D1C7]">{pkg.speed}</span>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  {pkg.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-white/80">
                      <span className="text-[#00D1C7] text-xs">✓</span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                {isSubscribed ? (
                  <button
                    disabled
                    className="w-full py-3 rounded-xl border border-[#1EF0A6]/30 bg-[#1EF0A6]/5 text-[#1EF0A6] font-semibold text-xs tracking-wider uppercase"
                  >
                    AI Agent Running On-Chain
                  </button>
                ) : (
                  <button
                    onClick={() => handleSubscribe(pkg)}
                    className="w-full py-3 rounded-xl bg-white hover:bg-gray-100 text-black font-semibold text-xs tracking-wider uppercase transition-all shadow-md hover:shadow-lg"
                  >
                    Activate AI Automation
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Layout - Live Terminal Run logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        {/* Terminal Log Console */}
        <div className="lg:col-span-2 bg-[#080B12] border border-white/10 rounded-2xl p-5 flex flex-col gap-3 font-mono">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-xs font-semibold text-white tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-success animate-ping"></span>
              LIVE AI AGENT EXECUTION TERMINAL
            </h3>
            <span className="text-[10px] text-gray-500">POLLING MULTI-CHAIN DEXes</span>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[250px] text-[11px] text-gray-300">
            {liveRuns.map((run) => (
              <div key={run.id} className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/[0.02] py-2 gap-1.5 hover:bg-white/[0.02] px-2 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-gray-500">[{run.time}]</span>
                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white font-semibold text-[9px] uppercase tracking-wider">{run.network}</span>
                  <span className="text-gray-400">{run.package} Agent</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gray-500">Cap: {run.borrowed}</span>
                  <span className={run.status === 'SUCCESS' ? 'text-[#1EF0A6] font-bold' : 'text-red-400'}>{run.profit}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                    run.status === 'SUCCESS' ? 'bg-[#1EF0A6]/10 text-[#1EF0A6]' : 'bg-red-500/10 text-red-400'
                  }`}>{run.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info card */}
        <div className="lg:col-span-1 bg-gradient-to-br from-[#101826] to-[#0A0D14] border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-3">🛡️ Citadel Session-Key Security</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              When activating an AI Automation Package, you do not transfer ownership of your wallet. 
              Instead, you authorize a secure ephemeral <strong>Session Key</strong> linked to our 
              <strong>Citadel Registry</strong> contract.
            </p>
            <ul className="text-xs text-gray-300 mt-4 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-[#00D1C7] mt-0.5">•</span>
                <span>The bot can only spend up to your configured Gas Limit.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#00D1C7] mt-0.5">•</span>
                <span>The bot CANNOT withdraw or transfer your capital to third-party addresses.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#00D1C7] mt-0.5">•</span>
                <span>All profits are automatically swept directly back to your wallet.</span>
              </li>
            </ul>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-gray-500 font-mono">
            Citadel Registry Contract Address:<br/>
            0x5E9714A6D073B4F53C40f636421aE95226753AF1
          </div>
        </div>
      </div>

      {/* Subscription Modal */}
      {subscribingPkg && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0C0F19] border border-white/15 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setSubscribingPkg(null)}
              className="absolute top-4 right-4 text-white/50 hover:text-white"
            >
              ✕
            </button>

            <h3 className="text-lg font-bold text-white mb-2">Activate {subscribingPkg.name}</h3>
            <p className="text-xs text-gray-400 mb-6">
              Complete the steps below in MetaMask to delegate execution authority to the AI Agent.
            </p>

            {/* Stepper */}
            <div className="flex items-center justify-between mb-6 text-xs font-mono">
              <div className="flex flex-col items-center gap-1">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                  activationStep >= 1 ? 'bg-[#00D1C7] text-black border-[#00D1C7]' : 'border-white/20'
                }`}>1</span>
                <span className="text-[9px] text-gray-400">Gas Limit</span>
              </div>
              <div className="h-[1px] bg-white/20 flex-1 mx-2 mb-4"></div>
              <div className="flex flex-col items-center gap-1">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                  activationStep >= 2 ? 'bg-[#00D1C7] text-black border-[#00D1C7]' : 'border-white/20'
                }`}>2</span>
                <span className="text-[9px] text-gray-400">Approve Keys</span>
              </div>
              <div className="h-[1px] bg-white/20 flex-1 mx-2 mb-4"></div>
              <div className="flex flex-col items-center gap-1">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                  activationStep >= 3 ? 'bg-[#00D1C7] text-black border-[#00D1C7]' : 'border-white/20'
                }`}>3</span>
                <span className="text-[9px] text-gray-400">Activate</span>
              </div>
            </div>

            {/* Step Content */}
            {activationStep === 1 && (
              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <label className="block text-[11px] text-gray-400 uppercase font-mono tracking-wider mb-2">Set Session Gas Pool (Max limit the bot can consume)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={gasLimit}
                      onChange={(e) => setGasLimit(e.target.value)}
                      className="bg-[#080B12] border border-white/10 rounded-lg p-2 outline-none text-white text-sm font-mono w-full"
                    />
                    <span className="text-sm font-semibold">USDC</span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                    This deposit forms the gas buffer. Any unused gas is refundable at any time by revoking the session key.
                  </p>
                </div>
              </div>
            )}

            {activationStep === 2 && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                <div className="font-bold text-xs">Generate Session Keypair</div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  MetaMask will ask you to sign a message generating a secure keypair for the agent. This signature does not cost gas.
                </p>
              </div>
            )}

            {activationStep === 3 && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center py-6 space-y-3">
                <span className="text-3xl animate-bounce block">🚀</span>
                <div className="font-bold text-sm">Ready to Launch</div>
                <p className="text-xs text-gray-400">
                  Click below to deposit your gas pool and whitelist the agent session key on the Citadel Registry contract.
                </p>
              </div>
            )}

            {/* Stepper Buttons */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-white/5">
              {activationStep > 1 && (
                <button
                  onClick={() => setActivationStep(prev => prev - 1)}
                  className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-xl text-xs font-semibold uppercase"
                >
                  Back
                </button>
              )}
              <button
                onClick={handleConfirmActivation}
                className="flex-1 py-3 bg-[#00D1C7] text-black hover:bg-[#00D1C7]/90 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all"
              >
                {activationStep === 1 ? 'Configure Gas & Next' : activationStep === 2 ? 'Sign Key & Next' : 'Authorize & Start Bot'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
