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
              Composable DeFi Automation
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-semibold leading-[1.1] tracking-tight">
              Build and run DeFi strategies with <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">visual blocks.</span>
            </h1>
            <p className="mt-6 text-white/60 max-w-xl text-lg leading-relaxed">
              Design strategy flows, sign in with wallet or Gmail, and execute secure DeFi plans from one powerful workspace.
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
                FLASHLOAN ⚡
              </motion.div>
              <motion.div 
                animate={{ y: [0, 10, 0] }} 
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="puzzle-piece" style={{ top: '3rem', right: '2rem' }}>
                FT MARGIN 🌷
              </motion.div>
              <motion.div 
                animate={{ y: [0, -8, 0] }} 
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="puzzle-piece" style={{ bottom: '4rem', left: '3rem' }}>
                FT SWAP 🔀
              </motion.div>
              <motion.div 
                animate={{ y: [0, 12, 0] }} 
                transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                className="puzzle-piece" style={{ bottom: '3rem', right: '3rem' }}>
                ftUSD MINT 🪙
              </motion.div>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-[2rem] bg-gradient-to-br from-red-500/20 to-red-900/20 border border-red-500/30 backdrop-blur-2xl text-white text-center flex flex-col items-center justify-center p-6 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-red-300/80">Unified</span>
                <span className="mt-3 text-2xl font-semibold tracking-tight">DeFi Flow</span>
                <span className="mt-2 text-xs text-white/50 font-medium">Auto-optimized</span>
              </div>
            </div>
          </motion.div>
        </section>

        <section id="how-it-works" className="mt-32 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Visual Canvas', desc: 'Compose blocks and model your execution path in seconds.' },
              { title: 'Cross-chain', desc: 'Route assets across networks effortlessly.' },
              { title: 'Live Tracking', desc: 'Monitor execution status and settlement outcomes in real-time.' },
              { title: 'Flying Tulip', desc: 'Sermaye verimli marj yönetimi ve ftUSD ile pasif getiri.' }
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

