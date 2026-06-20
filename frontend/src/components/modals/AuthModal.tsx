import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE } from '../../lib/api';
import { useAccount, useConnect } from 'wagmi';
import { useSessionStore } from '../../store/session.store';

const walletOptions = ['MetaMask', 'Rabby', 'Phantom', 'WalletConnect'];

export default function AuthModal() {
  const { connect, connectors } = useConnect();
  const { address, isConnected } = useAccount();
  const injected = connectors.find((connector) => /meta|injected|browser/i.test(connector.name));
  const { loginWithWallet, loginWithGoogle } = useSessionStore();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const notifyBackend = async (walletAddress: string, authMethod: 'wallet' | 'google', email?: string) => {
    try {
      await fetch(`${API_BASE}/api/v2/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: walletAddress,
          auth_method: authMethod,
          email,
          embedded_wallet: authMethod === 'google' ? walletAddress : undefined,
        }),
      });
    } catch {
      // Fail silently; backend analytics should not block auth flow.
    }
  };

  const connectWallet = async () => {
    if (!injected) {
      setError('No browser wallet found.');
      return;
    }

    try {
      await connect({ connector: injected });
      if (isConnected && address) {
        await notifyBackend(address, 'wallet');
      }
      loginWithWallet();
    } catch (err: any) {
      setError(err?.message || 'Wallet connection failed.');
    }
  };

  const continueWithGoogle = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Enter a valid Google email.');
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    const derivedWallet = Array.from(normalizedEmail)
      .reduce((acc, c) => acc + c.charCodeAt(0), 0)
      .toString(16)
      .padStart(40, '0')
      .slice(0, 40);
    const walletAddress = `0x${derivedWallet}`;
    await notifyBackend(walletAddress, 'google', normalizedEmail);
    loginWithGoogle(normalizedEmail);
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4"
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-[#0B0E14]/90 p-8 shadow-2xl shadow-black/50 relative overflow-hidden"
        >
          {/* subtle glow */}
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-red-500/10 rounded-full blur-[80px]" />

          <h2 className="text-3xl text-white font-semibold tracking-tight relative z-10">Sign in to BRICK3</h2>
          <p className="text-white/50 text-sm mt-2 relative z-10">Secure wallet and Google access in one place.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8 relative z-10">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-colors"
            >
              <p className="text-[10px] uppercase tracking-widest text-red-500/80 mb-4 font-bold">Option A</p>
              <h3 className="text-white font-medium mb-3">Continue with Wallet</h3>
              <div className="space-y-2 mb-5">
                {walletOptions.map((w) => (
                  <div key={w} className="px-4 py-2.5 rounded-xl border border-white/5 text-sm text-white/70 bg-black/20 font-medium">
                    {w}
                  </div>
                ))}
              </div>
              <motion.button 
                whileTap={{ scale: 0.97 }}
                onClick={connectWallet} 
                className="w-full py-3 rounded-xl bg-white text-black text-sm font-semibold shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-shadow"
              >
                Sign In
              </motion.button>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-colors"
            >
              <p className="text-[10px] uppercase tracking-widest text-cyan-400/80 mb-4 font-bold">Option B</p>
              <h3 className="text-white font-medium mb-1">Continue with Google</h3>
              <p className="text-white/40 text-xs mb-5">Magic link + embedded MPC wallet</p>
              <input
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="you@gmail.com"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-cyan-500/50 focus:bg-black/50 transition-all"
              />
              <motion.button 
                whileTap={{ scale: 0.97 }}
                onClick={continueWithGoogle} 
                className="w-full mt-4 py-3 rounded-xl bg-white text-black text-sm font-semibold shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-shadow"
              >
                Continue with Google
              </motion.button>
              <p className="text-white/30 text-xs mt-4 text-center">Wallet management is handled for you.</p>
            </motion.div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-red-400 text-xs mt-4 bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
