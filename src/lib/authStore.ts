import { create } from "zustand";

export type PriorityLevel = "low" | "medium" | "high" | null;

export interface BayernIDUser {
  id: string;
  name: string;
  email: string;
  provider: string;
  location: { lat: number; lng: number };
}

export interface AuthState {
  isLoggedIn: boolean;
  user: { email: string; initials: string; name: string } | null;
  bayernUser: BayernIDUser | null;
  hasCompletedOnboarding: boolean;
  priorities: Record<string, PriorityLevel>;
  isLoading: boolean;
  loginWithBayernID: () => Promise<void>;
  logout: () => void;
  setPriority: (topicId: string, level: PriorityLevel) => void;
  completeOnboarding: () => void;
}

const STORAGE_KEY = "bayern_id_user";

function getInitials(name: string): string {
  const parts = name.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function getStoredUser(): BayernIDUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function loadInitialState() {
  const stored = getStoredUser();
  if (stored) {
    const onboardingDone = localStorage.getItem(`onboarding_completed_${stored.id}`) === "true";
    return {
      isLoggedIn: true,
      user: { email: stored.email, initials: getInitials(stored.name), name: stored.name },
      bayernUser: stored,
      hasCompletedOnboarding: onboardingDone,
      isLoading: false,
    };
  }
  return {
    isLoggedIn: false,
    user: null,
    bayernUser: null,
    hasCompletedOnboarding: false,
    isLoading: false,
  };
}

const MOCK_USER: BayernIDUser = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "Peter Parker",
  email: "peter.parker@bayern.de",
  provider: "bayernID",
  location: {
    lat: 48.14305255731116,
    lng: 11.574993368397342,
  },
};

export const useAuthStore = create<AuthState>((set) => ({
  ...loadInitialState(),
  priorities: {},

  loginWithBayernID: async () => {
    // Simulate redirect delay
    await new Promise((r) => setTimeout(r, 1200));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_USER));
    set({
      isLoggedIn: true,
      user: { email: MOCK_USER.email, initials: getInitials(MOCK_USER.name), name: MOCK_USER.name },
      bayernUser: MOCK_USER,
      hasCompletedOnboarding: false,
      isLoading: false,
    });
  },

  logout: () => {
    const stored = getStoredUser();
    if (stored) {
      localStorage.removeItem(`onboarding_completed_${stored.id}`);
    }
    localStorage.removeItem(STORAGE_KEY);
    set({
      isLoggedIn: false,
      user: null,
      bayernUser: null,
      hasCompletedOnboarding: false,
      priorities: {},
    });
  },

  setPriority: (topicId, level) =>
    set((state) => ({
      priorities: { ...state.priorities, [topicId]: level },
    })),

  completeOnboarding: () => {
    const bayernUser = useAuthStore.getState().bayernUser;
    if (bayernUser) {
      localStorage.setItem(`onboarding_completed_${bayernUser.id}`, "true");
    }
    set({ hasCompletedOnboarding: true });
  },
}));
