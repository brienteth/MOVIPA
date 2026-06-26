import React, { useState } from 'react';

type Section = {
  id: string;
  title: string;
  icon: string;
  topics: {
    id: string;
    title: string;
    content: React.ReactNode;
  }[];
};

const docsData: Section[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: 'rocket_launch',
    topics: [
      {
        id: 'what-is-brick3',
        title: 'What is BRICK3 Brick3?',
        content: (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Autonomous Multi-Chain Strategy Executor</h2>
            <p className="text-white/70 leading-relaxed text-lg">
              BRICK3 Brick3 is a decentralized strategy execution platform that enables users to create, simulate, 
              and execute complex DeFi strategies across multiple blockchains without technical expertise. 
              Our system uses intent-based architecture to translate natural language into on-chain actions.
            </p>
            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="bg-gradient-to-br from-blue-900/20 to-blue-900/5 border border-blue-500/20 p-6 rounded-2xl">
                <div className="text-4xl font-bold text-blue-400 mb-2">7</div>
                <h4 className="text-white font-medium">Action Types</h4>
                <p className="text-sm text-white/60 mt-2">Flash Loans, Swaps, Bridges, Lending, Borrowing, Staking, Claims</p>
              </div>
              <div className="bg-gradient-to-br from-purple-900/20 to-purple-900/5 border border-purple-500/20 p-6 rounded-2xl">
                <div className="text-4xl font-bold text-purple-400 mb-2">5+</div>
                <h4 className="text-white font-medium">Chains</h4>
                <p className="text-sm text-white/60 mt-2">Ethereum, Base, Arbitrum, Optimism, Polygon</p>
              </div>
              <div className="bg-gradient-to-br from-green-900/20 to-green-900/5 border border-green-500/20 p-6 rounded-2xl">
                <div className="text-4xl font-bold text-green-400 mb-2">$0 Rent</div>
                <h4 className="text-white font-medium">No Setup Cost</h4>
                <p className="text-sm text-white/60 mt-2">Use the platform for free, pay only gas fees</p>
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'how-it-works',
        title: 'How It Works: 5-Step Flow',
        content: (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-white">Complete Strategy Lifecycle</h2>
            <div className="space-y-4">
              {[
                { num: 1, title: 'Intent Input', desc: 'User defines strategy in natural language or visual blocks', color: 'from-blue-600 to-blue-400' },
                { num: 2, title: 'AI Analysis', desc: 'System analyzes intent and routes through optimal protocols', color: 'from-purple-600 to-purple-400' },
                { num: 3, title: 'Simulation', desc: 'Strategy is tested in sandbox with real market data', color: 'from-orange-600 to-orange-400' },
                { num: 4, title: 'Compilation', desc: 'Strategy converted to on-chain actions and encoded calldata', color: 'from-green-600 to-green-400' },
                { num: 5, title: 'Execution', desc: 'Transaction submitted to blockchain with real-time monitoring', color: 'from-pink-600 to-pink-400' }
              ].map(step => (
                <div key={step.num} className="flex gap-4">
                  <div className={`bg-gradient-to-br ${step.color} rounded-full w-12 h-12 flex-shrink-0 flex items-center justify-center font-bold text-white text-lg`}>
                    {step.num}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-semibold text-lg">{step.title}</h4>
                    <p className="text-white/60 mt-1">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'modules',
    title: 'Core Modules',
    icon: 'dns',
    topics: [
      {
        id: 'canvas-builder',
        title: 'Canvas Strategy Builder',
        content: (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Drag-and-Drop Strategy Designer</h2>
            <p className="text-white/70 leading-relaxed">
              No coding required. Build complex DeFi strategies using visual blocks that represent real on-chain actions.
            </p>
            <div className="bg-[#151821] border border-white/10 p-6 rounded-2xl mt-6">
              <h3 className="text-white font-semibold mb-4">Available Block Types</h3>
              <div className="grid grid-cols-2 gap-3">
                {['Flash Loan', 'Swap', 'Bridge', 'Lend', 'Borrow', 'Stake', 'Yield Farming', 'Claim Rewards'].map(block => (
                  <div key={block} className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/10">
                    <span className="material-symbols-outlined text-blue-400">check_circle</span>
                    <span className="text-white/80 text-sm">{block}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-blue-900/10 border border-blue-500/30 p-6 rounded-2xl mt-6">
              <h4 className="text-white font-semibold mb-2">Example Strategy</h4>
              <p className="text-white/70 text-sm">Flash Loan 100 USDC → Swap to ETH → Bridge to Base → Yield Farm → Repay Loan</p>
            </div>
          </div>
        )
      },
      {
        id: 'smart-automation',
        title: 'Capital Protection & Marketplace',
        content: (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Intuitive Automation & Capital Safety</h2>
            <p className="text-white/70 leading-relaxed">
              We design workflows to make decentralized finance both user-friendly and highly secure. 
              Here is how our latest canvas features and simulation rules protect and optimize your investments:
            </p>
            <div className="space-y-4">
              <div className="bg-[#151821] border border-white/10 p-6 rounded-2xl">
                <h3 className="text-white font-semibold mb-2">1. Automated Loan Corridors (Auto-Bracketing)</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  When you initiate a strategy with a Flash Loan, the canvas automatically appends a Repayment step at the end. 
                  Any additional actions you insert are kept safe inside this loan corridor. This structure prevents critical loan-payment 
                  errors on the blockchain and automatically arranges steps chronologically.
                </p>
              </div>

              <div className="bg-[#151821] border border-white/10 p-6 rounded-2xl">
                <h3 className="text-white font-semibold mb-2">2. Connected Step Outputs (Dynamic Piping)</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  Instead of calculating and typing static token amounts manually, you can set steps to automatically use the outputs 
                  of previous actions. This ensures that assets flow seamlessly between steps, maximizing capital utilization 
                  without manual math.
                </p>
              </div>

              <div className="bg-[#151821] border border-white/10 p-6 rounded-2xl">
                <h3 className="text-white font-semibold mb-2">3. Accurate Fee Calculations & Warnings</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  Our simulation sandbox factors in Aave's 0.09% protocol fee for flash loans directly in the net profit estimation. 
                  If a simulation fails, the engine converts raw technical errors into clear diagnostic solutions. Most importantly, 
                  failed simulations never hit the main network, guaranteeing that your capital remains completely safe.
                </p>
              </div>

              <div className="bg-[#151821] border border-white/10 p-6 rounded-2xl">
                <h3 className="text-white font-semibold mb-2">4. Opacus Strategy Marketplace</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  Once your strategy compiles and simulates successfully, you can share or deploy it as an autonomous agent in the 
                  Opacus Marketplace. Other users can discover, copy, or rent your strategies, enabling collaborative capital 
                  generation across the community.
                </p>
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'simulation-engine',
        title: 'Simulation & Risk Engine',
        content: (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Before Execution: Test Everything</h2>
            <p className="text-white/70 leading-relaxed">
              Our simulation engine runs your strategy against live market data without spending gas. 
              Identify failures, slippage, and profitability BEFORE committing funds.
            </p>
            <div className="bg-[#151821] border border-white/10 p-6 rounded-2xl mt-6">
              <h3 className="text-white font-semibold mb-4">Simulation Outputs</h3>
              <div className="space-y-3">
                {[
                  { label: 'Net Profit (USD)', value: '+$2,450', color: 'text-green-400' },
                  { label: 'Gas Cost', value: '0.085 ETH', color: 'text-orange-400' },
                  { label: 'Slippage Risk', value: '0.34%', color: 'text-yellow-400' },
                  { label: 'Failure Probability', value: '1.2%', color: 'text-red-400' }
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                    <span className="text-white/70">{item.label}</span>
                    <span className={`font-bold ${item.color}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-white/60 text-sm italic mt-6">
              💡 Pro tip: Compare multiple strategy variations to maximize profit while minimizing risk.
            </p>
          </div>
        )
      },
      {
        id: 'compiler',
        title: 'Strategy Compiler',
        content: (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">High-Level → On-Chain Bytecode</h2>
            <p className="text-white/70 leading-relaxed">
              The compiler transforms your visual strategy into optimized smart contract calls with proper encoding,
              parameter validation, and gas optimization.
            </p>
            <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/20 p-6 rounded-2xl mt-6">
              <h3 className="text-white font-semibold mb-4">Compilation Process</h3>
              <div className="space-y-2 font-mono text-xs">
                <p className="text-blue-400">User Input: {'{type: SWAP, params: {...}}'}</p>
                <p className="text-white/50">    ↓ Validation & Routing</p>
                <p className="text-purple-400">Compiled: {'{actionType: 1, params: 0x...'}</p>
                <p className="text-white/50">    ↓ ABI Encoding</p>
                <p className="text-green-400">Calldata: 0xa9059cbb000000...</p>
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'monitor',
        title: 'Execution Monitor',
        content: (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Real-Time Tracking & Alerts</h2>
            <p className="text-white/70 leading-relaxed">
              Watch your strategy execute across multiple chains with live gas tracking, profit updates, and 
              failure detection. Get notified of any anomalies instantly.
            </p>
            <div className="bg-[#151821] border border-white/10 p-6 rounded-2xl mt-6">
              <h3 className="text-white font-semibold mb-4">Monitor Dashboard Includes</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'TX Hash Tracking', 'Block Confirmation Counter', 'Real-Time Gas Usage', 
                  'Chain Bridge Status', 'Protocol Response Times', 'Fund Flow Visualization',
                  'Error Detection', 'Profit/Loss Updates'
                ].map(item => (
                  <div key={item} className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-400 text-sm">check</span>
                    <span className="text-white/80 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'integrations',
    title: 'Protocol Integrations',
    icon: 'link',
    topics: [
      {
        id: 'dex-integrations',
        title: 'DEX Aggregators',
        content: (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Liquidity Aggregation</h2>
            <p className="text-white/70 leading-relaxed">
              We integrate with multiple DEXs to find the best swap rates across all protocols and chains.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-6">
              {[
                { name: 'Uniswap V3', desc: 'Concentrated liquidity DEX', chains: 'Multi-chain' },
                { name: 'Curve Finance', desc: 'Stablecoin optimized', chains: 'Multi-chain' },
                { name: 'CowSwap', desc: 'Intent-based swapping', chains: 'Ethereum, Arbitrum' },
                { name: 'SushiSwap', desc: 'Community DEX', chains: 'Multi-chain' }
              ].map(dex => (
                <div key={dex.name} className="bg-[#151821] border border-white/10 p-4 rounded-xl">
                  <h4 className="text-white font-semibold">{dex.name}</h4>
                  <p className="text-white/60 text-sm mt-1">{dex.desc}</p>
                  <p className="text-blue-400 text-xs mt-2">{dex.chains}</p>
                </div>
              ))}
            </div>
            <div className="bg-blue-900/10 border border-blue-500/30 p-6 rounded-2xl mt-6">
              <h4 className="text-white font-semibold mb-2">Smart Routing Algorithm</h4>
              <p className="text-white/70 text-sm">
                Our router checks rates across all integrated DEXs in real-time and selects the path with:
                <br />• Highest output for the input amount<br />• Lowest total gas cost<br />• Minimum slippage risk
              </p>
            </div>
          </div>
        )
      },
      {
        id: 'lending-integrations',
        title: 'Lending Protocols',
        content: (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Liquidity & Flash Loan Sources</h2>
            <p className="text-white/70 leading-relaxed">
              Access deep liquidity and flash loan capabilities from the largest lending protocols in DeFi.
            </p>
            <div className="space-y-4 mt-6">
              {[
                { 
                  name: 'Aave', 
                  features: ['Flash Loans', 'Lending', 'Borrowing'], 
                  flashFee: '0.05%',
                  tvl: '$10B+' 
                },
                { 
                  name: 'Morpho', 
                  features: ['Optimized Lending', 'Low Fees'], 
                  flashFee: '0.02%',
                  tvl: '$4B+' 
                },
                { 
                  name: 'dYdX', 
                  features: ['Flash Loans', 'Trading'], 
                  flashFee: '0.02%',
                  tvl: '$2B+' 
                }
              ].map(protocol => (
                <div key={protocol.name} className="bg-[#151821] border border-white/10 p-6 rounded-2xl">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-white font-semibold text-lg">{protocol.name}</h4>
                    <span className="text-sm text-white/60">TVL: {protocol.tvl}</span>
                  </div>
                  <div className="flex gap-2 mb-3">
                    {protocol.features.map(f => (
                      <span key={f} className="px-2 py-1 bg-white/5 rounded text-xs text-white/70">{f}</span>
                    ))}
                  </div>
                  <p className="text-blue-400 text-sm">Flash Loan Fee: {protocol.flashFee}</p>
                </div>
              ))}
            </div>
          </div>
        )
      },
      {
        id: 'bridge-integrations',
        title: 'Cross-Chain Bridges',
        content: (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Seamless Asset Movement</h2>
            <p className="text-white/70 leading-relaxed">
              We integrate with leading bridge protocols to enable efficient cross-chain asset transfers with minimal slippage.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-6">
              {[
                { name: 'Stargate', chains: 'All Major', speed: '1-3 min', fee: '0.1%' },
                { name: 'Across', chains: 'L1 → L2', speed: '~1 min', fee: '0.05%' },
                { name: 'Hyperlane', chains: 'Modular', speed: '2-5 min', fee: '0.08%' },
                { name: 'Axelar', chains: 'Multi-chain', speed: '2-4 min', fee: '0.12%' }
              ].map(bridge => (
                <div key={bridge.name} className="bg-[#151821] border border-white/10 p-4 rounded-xl">
                  <h4 className="text-white font-semibold mb-3">{bridge.name}</h4>
                  <div className="space-y-2 text-sm">
                    <p className="text-white/60"><span className="text-white/80">Chains:</span> {bridge.chains}</p>
                    <p className="text-white/60"><span className="text-white/80">Speed:</span> {bridge.speed}</p>
                    <p className="text-green-400"><span className="text-white/80">Fee:</span> {bridge.fee}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      },
      {
        id: 'yield-integrations',
        title: 'Yield & Staking Protocols',
        content: (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Passive Income Opportunities</h2>
            <p className="text-white/70 leading-relaxed">
              Automate your capital deployment across the best yield-generating protocols.
            </p>
            <div className="space-y-3 mt-6">
              {[
                { name: 'Lido', type: 'ETH Staking', apy: '3.2-3.8%', risk: 'Low' },
                { name: 'Aave', type: 'Supply APY', apy: '2-8%', risk: 'Medium' },
                { name: 'Curve', type: 'LP Farming', apy: '5-15%', risk: 'Medium' },
                { name: 'Balancer', type: 'BAL Farming', apy: '4-12%', risk: 'Medium' }
              ].map(protocol => (
                <div key={protocol.name} className="flex items-center justify-between p-4 bg-[#151821] border border-white/10 rounded-xl">
                  <div className="flex-1">
                    <h4 className="text-white font-semibold">{protocol.name}</h4>
                    <p className="text-white/60 text-sm">{protocol.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-semibold">{protocol.apy}</p>
                    <p className="text-white/60 text-xs">{protocol.risk} Risk</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      },
      {
        id: 'flying-tulip-integration',
        title: 'Flying Tulip Protocol',
        content: (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Flying Tulip Integration</h2>
            <p className="text-white/70 leading-relaxed">
              Brick3 natively integrates Flying Tulip protocols to offer capital-efficient cross-margin strategy composition and yield generation via ftUSD.
            </p>
            <div className="bg-[#151821] border border-white/10 p-6 rounded-2xl mt-6">
              <h3 className="text-white font-semibold mb-4">Supported Operations</h3>
              <div className="space-y-3">
                {[
                  { name: 'Tulip Deposit / Margin', desc: 'Deposit collateral once and use it simultaneously for lending, borrow margin, and trading.' },
                  { name: 'ftUSD Minting & Burning', desc: 'Mint yield-bearing ftUSD using your deposited collateral, providing delta-neutral yield for idle assets.' },
                  { name: 'Tulip Swap CLOB/AMM', desc: 'Swap with depth-aware pricing directly through the Flying Tulip swap routing adapter.' }
                ].map(op => (
                  <div key={op.name} className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <h4 className="text-white font-semibold text-sm">{op.name}</h4>
                    <p className="text-white/60 text-xs mt-1">{op.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-rose-900/10 border border-rose-500/30 p-6 rounded-2xl mt-6">
              <h4 className="text-white font-semibold mb-2">Key Advantage</h4>
              <p className="text-white/70 text-sm">
                Combining Flying Tulip's Cross-Margin capabilities with Brick3 workflows eliminates protocol hopping and reduces strategy gas costs by executing all credit/margin operations within the same state environment.
              </p>
            </div>
          </div>
        )
      },
      {
        id: 'opacus-integration',
        title: 'Opacus Intents (ERC-7752 / ERC-7753)',
        content: (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Opacus Intent Network & Cross-Chain Escrows</h2>
            <p className="text-white/70 leading-relaxed">
              Brick3 goes beyond single-chain execution by natively supporting the <strong>Opacus Intent Protocol</strong>. We leverage new ERC standards to enable complex cross-chain atomic operations like multi-chain flash loans.
            </p>
            <div className="bg-[#151821] border border-white/10 p-6 rounded-2xl mt-6">
              <h3 className="text-white font-semibold mb-4">Core ERC Standards</h3>
              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <h4 className="text-blue-400 font-semibold mb-2">ERC-7752: Bridge Intent</h4>
                  <p className="text-white/70 text-sm">
                    Instead of interacting directly with bridge contracts, the BRIDGE block compiles into an intent payload. The Opacus network solver agents bid to execute the bridge transfer at the lowest cost and fastest time, with automatic retries on failure.
                  </p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <h4 className="text-purple-400 font-semibold mb-2">ERC-7753: Flash Loan Escrow</h4>
                  <p className="text-white/70 text-sm">
                    The holy grail of DeFi composability. By combining FLASH LOAN and BRIDGE blocks, Brick3 locks the borrowed capital into an ERC-7753 escrow. Once the cross-chain solver provides an on-chain proof of execution on the destination chain, the escrow is released to repay the loan automatically. If the solver fails, the escrow refunds the flash loan entirely, ensuring zero user risk.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-red-900/10 border border-red-500/30 p-6 rounded-2xl mt-6">
              <h4 className="text-white font-semibold mb-2">What this unlocks</h4>
              <p className="text-white/70 text-sm">
                You can now borrow assets on Ethereum, execute a high-yield strategy on Sonic, and settle the position automatically. This makes cross-chain carry trades and delta-neutral hedging fully trustless.
              </p>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'architecture',
    title: 'Technical Architecture',
    icon: 'architecture',
    topics: [
      {
        id: 'smart-contracts',
        title: 'Smart Contract System',
        content: (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">On-Chain Components</h2>
            <p className="text-white/70 leading-relaxed">
              Our system uses a modular smart contract architecture optimized for security and gas efficiency.
            </p>
            <div className="space-y-4 mt-6">
              {[
                {
                  name: 'BandleRouter',
                  role: 'Entry Point',
                  desc: 'Routes strategies to the appropriate executor based on type and complexity',
                  functions: ['executeStrategy()', 'validateStrategy()', 'estimateGas()']
                },
                {
                  name: 'StrategyExecutorKernel',
                  role: 'Orchestration',
                  desc: 'Manages strategy execution flow and handles action sequencing',
                  functions: ['execute()', 'rollback()', 'emitEvents()']
                },
                {
                  name: 'ActionExecutor',
                  role: 'Action Handler',
                  desc: 'Executes individual actions (swaps, loans, bridges, etc)',
                  functions: ['executeFlashLoan()', 'executeSwap()', 'executeBridge()']
                }
              ].map(contract => (
                <div key={contract.name} className="bg-[#151821] border border-white/10 p-6 rounded-2xl">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-white font-semibold text-lg">{contract.name}</h4>
                      <p className="text-blue-400 text-sm">{contract.role}</p>
                    </div>
                    <span className="material-symbols-outlined text-green-400">verified</span>
                  </div>
                  <p className="text-white/70 text-sm mb-4">{contract.desc}</p>
                  <div className="bg-white/5 p-3 rounded text-xs font-mono text-green-400">
                    {contract.functions.map(fn => `${fn}`).join(' • ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      },
      {
        id: 'backend-stack',
        title: 'Backend Infrastructure',
        content: (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Server-Side Architecture</h2>
            <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/20 p-6 rounded-2xl">
              <h3 className="text-white font-semibold mb-4">Core Components</h3>
              <div className="space-y-3">
                {[
                  { component: 'API Gateway', tech: 'FastAPI / Python 3.11', role: 'Request routing & validation' },
                  { component: 'Arbitrage Engine', tech: 'AsyncIO', role: 'Opportunity detection & scoring' },
                  { component: 'Strategy Compiler', tech: 'Web3.py', role: 'ABI encoding & optimization' },
                  { component: 'Event Monitor', tech: 'Websocket Listener', role: 'Real-time blockchain tracking' },
                  { component: 'Database', tech: 'JSON/In-Memory', role: 'Strategy history & metrics' }
                ].map(item => (
                  <div key={item.component} className="flex gap-4 p-3 bg-white/5 rounded-xl">
                    <div className="flex-1">
                      <p className="text-white font-medium">{item.component}</p>
                      <p className="text-white/60 text-sm">{item.tech}</p>
                    </div>
                    <p className="text-blue-400 text-sm">{item.role}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-blue-900/10 border border-blue-500/30 p-6 rounded-2xl mt-6">
              <h4 className="text-white font-semibold mb-2">API Endpoints</h4>
              <div className="space-y-2 font-mono text-xs">
                <p><span className="text-green-400">POST</span> <span className="text-white/70">/api/v2/strategy/compile</span></p>
                <p><span className="text-green-400">POST</span> <span className="text-white/70">/api/v2/strategy/execute</span></p>
                <p><span className="text-blue-400">WS</span> <span className="text-white/70">{'/ws/strategy/monitor/{id}'}</span></p>
                <p><span className="text-yellow-400">GET</span> <span className="text-white/70">/api/v2/strategy/history</span></p>
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'frontend-stack',
        title: 'Frontend Technology',
        content: (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">User Interface Stack</h2>
            <div className="grid grid-cols-2 gap-4 mt-6">
              {[
                { name: 'React 18', purpose: 'UI Framework', features: 'Hooks, Context API' },
                { name: 'TypeScript', purpose: 'Type Safety', features: 'Strict mode, Interfaces' },
                { name: 'Tailwind CSS', purpose: 'Styling', features: 'Utility-first, Dark mode' },
                { name: 'Wagmi', purpose: 'Web3 Integration', features: 'Wallet connect, Contract calls' },
                { name: 'Ethers.js', purpose: 'Blockchain Lib', features: 'ABI encoding, Signing' },
                { name: 'Zustand', purpose: 'State Mgmt', features: 'Lightweight, Persistent' }
              ].map(tech => (
                <div key={tech.name} className="bg-[#151821] border border-white/10 p-4 rounded-xl">
                  <h4 className="text-white font-semibold">{tech.name}</h4>
                  <p className="text-blue-400 text-xs mt-1">{tech.purpose}</p>
                  <p className="text-white/60 text-xs mt-2">{tech.features}</p>
                </div>
              ))}
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'security',
    title: 'Security & Risk',
    icon: 'security',
    topics: [
      {
        id: 'risk-framework',
        title: 'Risk Assessment Framework',
        content: (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Multi-Layer Risk Protection</h2>
            <p className="text-white/70 leading-relaxed">
              Every strategy is evaluated against multiple risk dimensions before execution.
            </p>
            <div className="space-y-3 mt-6">
              {[
                { factor: 'Counterparty Risk', assessment: 'Protocol audits & TVL health', mitigation: 'TVL thresholds' },
                { factor: 'Price Impact', assessment: 'Slippage simulation', mitigation: 'Max slippage limits' },
                { factor: 'Liquidation Risk', assessment: 'Collateral ratio monitoring', mitigation: 'Pre-emptive exits' },
                { factor: 'Bridge Risk', assessment: 'Bridge delay & failure rates', mitigation: 'Redundant routes' },
                { factor: 'Gas Risk', assessment: 'Network congestion analysis', mitigation: 'Dynamic gas pricing' }
              ].map(risk => (
                <div key={risk.factor} className="bg-[#151821] border border-white/10 p-4 rounded-xl">
                  <h4 className="text-white font-semibold text-sm mb-2">{risk.factor}</h4>
                  <p className="text-white/60 text-xs mb-2">{risk.assessment}</p>
                  <p className="text-green-400 text-xs">✓ {risk.mitigation}</p>
                </div>
              ))}
            </div>
          </div>
        )
      },
      {
        id: 'contract-security',
        title: 'Smart Contract Security',
        content: (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Security Measures</h2>
            <ul className="space-y-3">
              {[
                'Reentrancy guards on all critical functions',
                'Access control with role-based permissions',
                'Checks-Effects-Interactions pattern throughout',
                'SafeERC20 for token operations',
                'Emergency pause functionality',
                'Upgrade-safe proxy pattern'
              ].map((measure, idx) => (
                <li key={idx} className="flex gap-3 items-start">
                  <span className="material-symbols-outlined text-green-400 mt-0.5 flex-shrink-0">shield_check</span>
                  <span className="text-white/70">{measure}</span>
                </li>
              ))}
            </ul>
            <div className="bg-green-900/10 border border-green-500/30 p-6 rounded-2xl mt-6">
              <p className="text-white/70">
                <span className="text-green-400 font-semibold">Audited by:</span> Community auditors & professional reviews
              </p>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'examples',
    title: 'Strategy Examples',
    icon: 'lightbulb',
    topics: [
      {
        id: 'arbitrage-example',
        title: 'Flash Loan Arbitrage',
        content: (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Example: Cross-DEX Arbitrage</h2>
            <div className="bg-blue-900/10 border border-blue-500/30 p-6 rounded-2xl">
              <h3 className="text-white font-semibold mb-3">Scenario</h3>
              <p className="text-white/70">ETH trades for 2000 USDC on Uniswap (Ethereum) and 2050 USDC on Curve (Arbitrum)</p>
            </div>
            <div className="space-y-4 mt-6">
              <h3 className="text-white font-semibold">Strategy Steps</h3>
              {[
                { step: 1, action: 'Flash Loan', details: '1 ETH from Aave (0.05% fee)' },
                { step: 2, action: 'Swap', details: '1 ETH → 2000 USDC on Uniswap' },
                { step: 3, action: 'Bridge', details: 'Bridge 2000 USDC to Arbitrum (~1 min)' },
                { step: 4, action: 'Swap', details: '2000 USDC → 0.976 ETH on Curve' },
                { step: 5, action: 'Bridge Back', details: 'Bridge 0.976 ETH to Ethereum' },
                { step: 6, action: 'Repay', details: 'Repay 1 ETH + 0.05% fee' }
              ].map(item => (
                <div key={item.step} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-400 font-bold">{item.step}</span>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{item.action}</h4>
                    <p className="text-white/60 text-sm">{item.details}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-green-900/10 border border-green-500/30 p-6 rounded-2xl mt-6">
              <h4 className="text-white font-semibold mb-2">Result</h4>
              <p className="text-green-400 text-lg font-bold">+50 USDC profit (after all fees)</p>
              <p className="text-white/60 text-sm mt-1">Executed in ~90 seconds, 0.025 ETH gas cost</p>
            </div>
          </div>
        )
      },
      {
        id: 'yield-farming-example',
        title: 'Multi-Chain Yield Optimization',
        content: (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Example: Yield Farm Aggregation</h2>
            <div className="bg-purple-900/10 border border-purple-500/30 p-6 rounded-2xl">
              <h3 className="text-white font-semibold mb-3">Goal</h3>
              <p className="text-white/70">Maximize yield on 50,000 USDC across multiple chains</p>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              {[
                { protocol: 'Aave (Ethereum)', apy: '4.2%', amount: '$20,000', risk: 'Low' },
                { protocol: 'Curve (Optimism)', apy: '6.8%', amount: '$15,000', risk: 'Low' },
                { protocol: 'Balancer (Arbitrum)', apy: '5.5%', amount: '$15,000', risk: 'Medium' }
              ].map(position => (
                <div key={position.protocol} className="bg-[#151821] border border-white/10 p-4 rounded-xl">
                  <h4 className="text-white font-semibold text-sm">{position.protocol}</h4>
                  <div className="space-y-2 mt-3 text-sm">
                    <p className="text-green-400">APY: {position.apy}</p>
                    <p className="text-white/60">Amount: {position.amount}</p>
                    <p className="text-yellow-400">Risk: {position.risk}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-green-900/10 border border-green-500/30 p-6 rounded-2xl mt-6">
              <h4 className="text-white font-semibold mb-2">Monthly Yield</h4>
              <p className="text-green-400 text-2xl font-bold">$217.50 / month</p>
              <p className="text-white/60 text-sm mt-1">Average 5.2% APY across all positions</p>
            </div>
          </div>
        )
      }
    ]
  }
];

export default function DocsPage() {
  const [activeSectionId, setActiveSectionId] = useState(docsData[0].id);
  const [activeTopicId, setActiveTopicId] = useState(docsData[0].topics[0].id);

  const activeSection = docsData.find(s => s.id === activeSectionId);
  const activeTopic = activeSection?.topics.find(t => t.id === activeTopicId);

  return (
    <div className="flex h-screen w-screen bg-[#0A0505] overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-[320px] flex-shrink-0 border-r border-white/5 bg-[#0A0505] overflow-y-auto">
        <div className="p-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <img src="/brick3-logo.jpg" alt="BRICK3" className="w-6 h-6 rounded-md" />
              <h1 className="text-2xl font-bold text-white">Docs</h1>
            </div>
            <p className="text-xs text-white/40">Complete Platform Guide & Technical Reference</p>
          </div>
          
          <div className="space-y-8">
            {docsData.map((section) => (
              <div key={section.id}>
                <div className="flex items-center gap-2 mb-4 px-3">
                  <span className="material-symbols-outlined text-white/50" style={{ fontSize: '18px' }}>
                    {section.icon}
                  </span>
                  <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">{section.title}</h3>
                </div>
                <div className="flex flex-col gap-2">
                  {section.topics.map((topic) => {
                    const isActive = activeTopicId === topic.id;
                    return (
                      <button
                        key={topic.id}
                        onClick={() => {
                          setActiveSectionId(section.id);
                          setActiveTopicId(topic.id);
                        }}
                        className={`text-left px-4 py-3 rounded-lg text-sm transition-all duration-200 ${
                          isActive 
                            ? 'bg-blue-500/20 text-white font-semibold border border-blue-500/50' 
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {topic.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-12 max-w-5xl">
          {activeTopic ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8 flex items-center gap-3">
                <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded"></div>
                <div>
                  <p className="text-xs text-white/50 uppercase tracking-wider">{activeSection?.title}</p>
                  <p className="text-lg text-white/80">{activeTopic.title}</p>
                </div>
              </div>
              <div className="prose prose-invert max-w-none">
                {activeTopic.content}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}