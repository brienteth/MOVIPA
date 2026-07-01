import React from 'react';
import { motion } from 'framer-motion';

export default function AppLandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0505] text-white selection:bg-red-500/30">
      <header className="px-8 py-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-white/5 bg-[#0A0505]/80 backdrop-blur-xl sticky top-0 z-50">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <img src="/brick3-logo.jpg" alt="BRICK3" className="w-8 h-8" />
          <span className="text-xl font-semibold tracking-tight">BRICK3</span>
        </motion.div>

        <motion.nav 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap items-center gap-6 text-sm font-medium text-white/60"
        >
          <a href="#product" className="hover:text-white transition-colors">Product</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
          <a href="/docs" className="hover:text-white transition-colors">Docs</a>
        </motion.nav>

        <motion.a 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          href="/lending" 
          className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
        >
          Manage
        </motion.a>
      </header>

      <main className="px-8 md:px-16 py-14 md:py-24 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-500/10 rounded-full blur-[120px] pointer-events-none" />

        <section id="product" className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-16 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-medium tracking-wide text-red-300 mb-6"
            >
              Simple & Automated
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-semibold leading-[1.1] tracking-tight">
              Automate your crypto strategies with <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">drag-and-drop bricks</span>.
            </h1>
            <p className="mt-6 text-white/60 max-w-xl text-lg leading-relaxed">
              No coding required. Snap together the actions you need (Borrow, Swap, Yield) just like playing with Lego bricks. Sit back and let the system handle the execution automatically.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <motion.a 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="/lending" 
                className="px-8 py-4 rounded-full bg-white text-black font-semibold shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] transition-shadow"
              >
                Start Building
              </motion.a>
              <motion.a 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="/docs" 
                className="px-8 py-4 rounded-full border border-white/10 bg-white/5 text-white/90 hover:bg-white/10 transition-colors font-medium"
              >
                Read Documentation
              </motion.a>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95, rotateY: 10 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative h-[420px] rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent overflow-hidden shadow-2xl shadow-black/50 backdrop-blur-3xl"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.1),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(220,38,38,0.1),transparent_40%)]" />
            <div className="absolute left-8 top-8 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <div className="text-[10px] font-bold tracking-[0.25em] uppercase text-white/40">Strategy Active</div>
            </div>

            <div className="puzzle-grid h-full relative p-8">
              <motion.div 
                animate={{ y: [0, -10, 0] }} 
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="puzzle-piece" style={{ top: '4rem', left: '2rem' }}>
                BORROW ⚡
              </motion.div>
              <motion.div 
                animate={{ y: [0, 10, 0] }} 
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="puzzle-piece" style={{ top: '3rem', right: '2rem' }}>
                YIELD 🏦
              </motion.div>
              <motion.div 
                animate={{ y: [0, -8, 0] }} 
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="puzzle-piece" style={{ bottom: '4rem', left: '3rem' }}>
                SWAP 🔀
              </motion.div>
              <motion.div 
                animate={{ y: [0, 12, 0] }} 
                transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                className="puzzle-piece" style={{ bottom: '3rem', right: '3rem' }}>
                SETTLE ⬇
              </motion.div>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-[2rem] bg-gradient-to-br from-red-500/20 to-red-900/20 border border-red-500/30 backdrop-blur-2xl text-white text-center flex flex-col items-center justify-center p-6 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-red-300/80">One-Click</span>
                <span className="mt-3 text-2xl font-semibold tracking-tight">Execute</span>
                <span className="mt-2 text-xs text-white/50 font-medium">Fully Automated</span>
              </div>
            </div>
          </motion.div>
        </section>

        <section id="how-it-works" className="mt-32 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Visual Canvas', desc: 'Assemble and deploy transactions in seconds using interactive building blocks.' },
              { title: 'Cross-Chain Simplicity', desc: 'Move your assets across different networks seamlessly and cheaply.' },
              { title: 'Live Tracking', desc: 'Monitor your portfolio and transaction outcomes in real-time.' },
              { title: 'Passive Income', desc: 'Use pre-built templates so your money keeps earning even while you sleep.' }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group rounded-3xl border border-white/5 bg-white/[0.02] p-8 hover:bg-white/[0.04] transition-colors"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <div className="w-4 h-4 rounded-full bg-red-500/50" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight">{feature.title}</h3>
                <p className="mt-3 text-white/50 leading-relaxed text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mt-32 max-w-6xl mx-auto border-t border-white/10 pt-20">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Solving DeFi Complexity</h2>
            <p className="mt-4 text-white/60 leading-relaxed text-sm md:text-base">
              Executing crypto transactions, borrowing, or earning passive income is complex and prone to errors. With Brick3 and our ready-made templates, we eliminate these difficulties entirely.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-16 items-center">
            {/* Visual Schema / Illustrator-like block diagram */}
            <div className="relative rounded-[2rem] border border-[#00D1C7]/20 bg-[#070B14]/80 p-8 min-h-[460px] overflow-hidden flex flex-col justify-between shadow-[0_15px_40px_rgba(0,209,199,0.05)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(0,209,199,0.05),transparent_40%)]" />
              
              <div className="flex items-center justify-between mb-4 relative z-10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#00D1C7] bg-[#00D1C7]/10 px-2.5 py-1 rounded-full">Secure Execution Corridor</span>
                <span className="text-xs text-white/40">Visual Block Flow</span>
              </div>

              {/* Diagrams of blocks linking together */}
              <div className="flex flex-col gap-6 my-auto relative z-10">
                
                {/* Block 1 */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-4 bg-white/[0.03] border border-white/10 p-4 rounded-2xl relative"
                >
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center font-bold text-yellow-400 text-sm">⚡</div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-white">BORROW (Start)</h4>
                    <p className="text-xs text-white/50 mt-0.5">The borrowing block that meets your capital needs (with minimal fees).</p>
                  </div>
                  <div className="text-[10px] text-yellow-400 font-mono">Automated</div>
                </motion.div>

                {/* Arrow indicator */}
                <div className="flex justify-center -my-3">
                  <span className="material-symbols-outlined text-[#00D1C7] animate-bounce">arrow_downward</span>
                </div>

                {/* Block 2 */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-4 bg-white/[0.03] border border-white/10 p-4 rounded-2xl relative"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 text-sm">🔀</div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-white">SWAP AND INVEST</h4>
                    <p className="text-xs text-white/50 mt-0.5">Funds acquired in the previous step are automatically routed into this block for execution.</p>
                  </div>
                  <div className="text-[10px] text-blue-400 font-mono">Interconnected</div>
                </motion.div>

                {/* Arrow indicator */}
                <div className="flex justify-center -my-3">
                  <span className="material-symbols-outlined text-[#00D1C7] animate-bounce">arrow_downward</span>
                </div>

                {/* Block 3 */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-4 bg-white/[0.03] border border-white/10 p-4 rounded-2xl relative"
                >
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-center font-bold text-green-400 text-sm">✓</div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-white">REPAY & TAKE PROFIT (End)</h4>
                    <p className="text-xs text-white/50 mt-0.5">Your debt is automatically repaid and the net profit is sent straight to your wallet.</p>
                  </div>
                  <div className="text-[10px] text-green-400 font-mono">Secured</div>
                </motion.div>

              </div>

              {/* Sandbox info indicator */}
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-xs text-red-300 relative z-10 leading-relaxed">
                <span className="material-symbols-outlined text-sm">shield</span>
                <span>Simulator Protection Active: If a transaction sequence is flawed, the system detects it beforehand and prevents any loss of funds.</span>
              </div>
            </div>

            {/* Benefit descriptions / problems solved */}
            <div className="space-y-6">
              {[
                {
                  title: "1. End Missing Steps Errors",
                  desc: "Users often face errors by forgetting to repay after borrowing. We automatically append the 'Repay' brick the moment you borrow, making such mistakes impossible."
                },
                {
                  title: "2. No Complex Math Required",
                  desc: "Instead of manually calculating expected yields, connect your blocks using 'Previous Step Output'. The system handles all the math."
                },
                {
                  title: "3. No Hidden Fees or Losses",
                  desc: "Our system calculates all transaction fees upfront. If your block setup would result in a loss, it warns you and halts execution to protect your funds."
                },
                {
                  title: "4. Cross-Chain & Stellar Settlement",
                  desc: "Easily manage transactions across networks (e.g. Ethereum to Base) and settle final strategy yields into Stellar distribution payouts (Treasury, Payroll, Creator Royalty) automatically."
                }
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-[#00D1C7]/10 flex items-center justify-center flex-shrink-0 mt-0.5 border border-[#00D1C7]/30 text-[#00D1C7] text-xs font-bold font-mono">
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-white leading-relaxed">{item.title}</h4>
                    <p className="text-white/60 text-sm mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <style>{`
          .puzzle-piece {
            position: absolute;
            width: 120px;
            height: 90px;
            border-radius: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            font-size: 10px;
            font-weight: 800;
            background: rgba(10, 15, 25, 0.8);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.1);
            box-shadow: 0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1);
            color: rgba(255,255,255,0.9);
          }
        `}</style>
      </main>
    </div>
  );
}

