import { create } from 'zustand';

export type AuthMethod = 'wallet' | 'google' | null;
export type ExperienceMode = 'simple' | 'advanced';

interface SessionState {
  isAuthenticated: boolean;
  authMethod: AuthMethod;
  embeddedWalletAddress: string | null;
  onboardingCompleted: boolean;
  intentGoals: string[];
  experienceMode: ExperienceMode;
  securityPrefs: {
    privateExecution: boolean;
    mevProtection: boolean;
    autoRevert: boolean;
    simulationBeforeExecution: boolean;
  };
  loginWithWallet: () => void;
  loginWithGoogle: (email: string) => void;
  setIntentGoals: (goals: string[]) => void;
  setExperienceMode: (mode: ExperienceMode) => void;
  setSecurityPrefs: (prefs: Partial<SessionState['securityPrefs']>) => void;
  completeOnboarding: () => void;
  logout: () => void;
}

const STORAGE_KEY = 'brick3_session_v1';

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveSession(state: Partial<SessionState>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage failures
  }
}

function deriveMpcWallet(email: string) {
  const base = Array.from(email.trim().toLowerCase()).reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const hex = base.toString(16).padStart(40, '0').slice(0, 40);
  return `0x${hex}`;
}

const persisted = typeof window !== 'undefined' ? loadSession() : null;

export const useSessionStore = create<SessionState>((set, get) => ({
  isAuthenticated: Boolean(persisted?.isAuthenticated),
  authMethod: persisted?.authMethod || null,
  embeddedWalletAddress: persisted?.embeddedWalletAddress || null,
  onboardingCompleted: Boolean(persisted?.onboardingCompleted),
  intentGoals: persisted?.intentGoals || [],
  experienceMode: persisted?.experienceMode || 'simple',
  securityPrefs: persisted?.securityPrefs || {
    privateExecution: true,
    mevProtection: true,
    autoRevert: true,
    simulationBeforeExecution: true,
  },

  loginWithWallet: () => {
    set({ isAuthenticated: true, authMethod: 'wallet' });
    saveSession({ ...get(), isAuthenticated: true, authMethod: 'wallet' });
  },

  loginWithGoogle: (email: string) => {
    const embeddedWalletAddress = deriveMpcWallet(email);
    set({
      isAuthenticated: true,
      authMethod: 'google',
      embeddedWalletAddress,
    });
    saveSession({
      ...get(),
      isAuthenticated: true,
      authMethod: 'google',
      embeddedWalletAddress,
    });
  },

  setIntentGoals: (intentGoals) => {
    set({ intentGoals });
    saveSession({ ...get(), intentGoals });
  },

  setExperienceMode: (experienceMode) => {
    set({ experienceMode });
    saveSession({ ...get(), experienceMode });
  },

  setSecurityPrefs: (prefs) => {
    const securityPrefs = { ...get().securityPrefs, ...prefs };
    set({ securityPrefs });
    saveSession({ ...get(), securityPrefs });
  },

  completeOnboarding: () => {
    set({ onboardingCompleted: true });
    saveSession({ ...get(), onboardingCompleted: true });
  },

  logout: () => {
    const reset = {
      isAuthenticated: false,
      authMethod: null,
      embeddedWalletAddress: null,
      onboardingCompleted: false,
      intentGoals: [],
      experienceMode: 'simple' as ExperienceMode,
      securityPrefs: {
        privateExecution: true,
        mevProtection: true,
        autoRevert: true,
        simulationBeforeExecution: true,
      },
    };
    set(reset);
    saveSession(reset);
  },
}));
