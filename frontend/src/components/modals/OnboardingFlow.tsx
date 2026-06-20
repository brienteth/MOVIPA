import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUiStore } from '../../store/ui.store';
import { useSessionStore } from '../../store/session.store';

const GOALS = [
  'Arbitrage',
  'Earn Yield',
  'Leverage',
  'Bridge Assets',
  'Automate Strategies',
  'Explore Templates',
] as const;

export default function OnboardingFlow() {
  const { setView } = useUiStore();
  const {
    setIntentGoals,
    setExperienceMode,
    setSecurityPrefs,
    securityPrefs,
    completeOnboarding,
  } = useSessionStore();

  const [step, setStep] = useState(0);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');

  const title = useMemo(() => {
    if (step === 0) return 'Welcome to BRICK3';
    if (step === 1) return 'What do you want to do?';
    if (step === 2) return 'Choose your experience';
    if (step === 3) return 'Security Preferences';
    return "You're ready.";
  }, [step]);

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const finish = () => {
    setIntentGoals(selectedGoals);
    setExperienceMode(mode);
    completeOnboarding();
    setView('canvas');
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 40 : -40,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 40 : -40,
      opacity: 0
    })
  };

  const [direction, setDirection] = useState(0);

  const nextStep = () => {
    setDirection(1);
    setStep((s) => Math.min(4, s + 1));
  };

  const prevStep = () => {
    setDirection(-1);
    setStep((s) => Math.max(0, s - 1));
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[210] flex items-center justify-center p-4"
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-[#0B0E14]/90 p-8 shadow-2xl shadow-black/50 relative overflow-hidden flex flex-col"
          style={{ minHeight: '440px' }}
        >
          {/* subtle glow */}
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px]" />

          <p className="text-xs text-cyan-400/80 font-bold uppercase tracking-widest relative z-10">Step {step + 1} / 5</p>
          <h2 className="text-3xl text-white font-semibold tracking-tight mt-2 relative z-10">{title}</h2>

          <div className="flex-1 relative mt-6 z-10">
            <AnimatePresence custom={direction} mode="wait">
              <motion.div
                key={step}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                className="absolute inset-0"
              >
                {step === 0 && (
                  <p className="text-white/60 text-lg leading-relaxed">
                    BRICK3 executes complex DeFi strategies through encrypted intent routing. We'll set up your environment in just a few steps.
                  </p>
                )}

                {step === 1 && (
                  <div className="flex flex-wrap gap-3">
                    {GOALS.map((goal) => (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        key={goal}
                        onClick={() => toggleGoal(goal)}
                        className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${selectedGoals.includes(goal)
                          ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                          : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'}`}
                      >
                        {goal}
                      </motion.button>
                    ))}
                  </div>
                )}

                {step === 2 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setMode('simple')}
                      className={`text-left rounded-2xl border p-5 transition-all ${mode === 'simple' ? 'border-white bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.15)]' : 'border-white/10 bg-white/[0.02] text-white hover:bg-white/[0.04]'}`}
                    >
                      <h3 className="font-semibold text-lg">Simple</h3>
                      <p className={mode === 'simple' ? 'text-black/70 text-sm mt-2' : 'text-white/50 text-sm mt-2'}>
                        Less settings, less technical detail, more automation. Best for quick execution.
                      </p>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setMode('advanced')}
                      className={`text-left rounded-2xl border p-5 transition-all ${mode === 'advanced' ? 'border-white bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.15)]' : 'border-white/10 bg-white/[0.02] text-white hover:bg-white/[0.04]'}`}
                    >
                      <h3 className="font-semibold text-lg">Advanced</h3>
                      <p className={mode === 'advanced' ? 'text-black/70 text-sm mt-2' : 'text-white/50 text-sm mt-2'}>
                        Full canvas control, detailed execution and routing configs for maximum yield.
                      </p>
                    </motion.button>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-3">
                    {[
                      { key: 'privateExecution', label: 'Private Execution' },
                      { key: 'mevProtection', label: 'MEV Protection' },
                      { key: 'autoRevert', label: 'Auto-Revert Unsafe Trades' },
                      { key: 'simulationBeforeExecution', label: 'Simulation Before Execution' },
                    ].map((item) => (
                      <div key={item.key} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 flex items-center justify-between">
                        <span className="text-sm font-medium text-white/90">{item.label}</span>
                        <button
                          onClick={() => setSecurityPrefs({ [item.key]: !securityPrefs[item.key as keyof typeof securityPrefs] } as any)}
                          className={`w-12 h-6 rounded-full transition-colors relative ${securityPrefs[item.key as keyof typeof securityPrefs] ? 'bg-red-500' : 'bg-white/10'}`}
                        >
                          <motion.span 
                            layout
                            className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                            animate={{ x: securityPrefs[item.key as keyof typeof securityPrefs] ? 24 : 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {step === 4 && (
                  <div className="flex flex-col items-center justify-center pt-8">
                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-6 text-red-500">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <p className="text-white/80 text-lg text-center max-w-sm">
                      Your profile is configured. You can now open Canvas and execute securely.
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-auto pt-6 flex justify-between relative z-10 border-t border-white/5">
            <button
              onClick={prevStep}
              disabled={step === 0}
              className="px-6 py-2.5 rounded-xl border border-white/10 text-white/70 font-medium hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              Back
            </button>

            {step < 4 ? (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={nextStep}
                className="px-8 py-2.5 rounded-xl bg-white text-black font-semibold shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-shadow"
              >
                Continue
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={finish}
                className="px-8 py-2.5 rounded-xl bg-red-500 text-black font-bold shadow-[0_0_20px_rgba(52,211,153,0.3)] hover:shadow-[0_0_30px_rgba(52,211,153,0.4)] transition-shadow"
              >
                Open Canvas
              </motion.button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
