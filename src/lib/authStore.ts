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
  loginWithBayernID: (userOverride?: Partial<BayernIDUser>) => Promise<void>;
  logout: () => void;
  setAuthenticatedUser: (
    nextUser: BayernIDUser,
    options?: { hasCompletedOnboarding?: boolean; persist?: boolean }
  ) => void;
  setPriority: (topicId: string, level: PriorityLevel) => void;
  completeOnboarding: () => void;
  updateLocation: (lat: number, lng: number) => void;
}

const STORAGE_KEY = "bayern_id_user";
const PRIORITIES_KEY = "user_priorities";

function getStoredPriorities(): Record<string, PriorityLevel> {
  try {
    const raw = localStorage.getItem(PRIORITIES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function persistPriorities(priorities: Record<string, PriorityLevel>) {
  localStorage.setItem(PRIORITIES_KEY, JSON.stringify(priorities));
}

export const DEFAULT_LOCATION = {
  lat: 48.14305255731116,
  lng: 11.574993368397342,
};

function getInitials(name: string): string {
  const parts = name.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getOnboardingState(userId: string): boolean {
  try {
    return localStorage.getItem(`onboarding_completed_${userId}`) === "true";
  } catch {
    return false;
  }
}

function buildAuthState(nextUser: BayernIDUser) {
  return {
    isLoggedIn: true,
    user: {
      email: nextUser.email,
      initials: getInitials(nextUser.name),
      name: nextUser.name,
    },
    bayernUser: nextUser,
    hasCompletedOnboarding: getOnboardingState(nextUser.id),
    isLoading: false,
  };
}

function persistUser(user: BayernIDUser) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
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
    return buildAuthState(stored);
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
  location: DEFAULT_LOCATION,
};

export const useAuthStore = create<AuthState>((set) => ({
  ...loadInitialState(),
  priorities: {},

  setAuthenticatedUser: (nextUser, options) => {
    if (options?.persist !== false) {
      persistUser(nextUser);
    }

    set({
      ...buildAuthState(nextUser),
      hasCompletedOnboarding: options?.hasCompletedOnboarding ?? getOnboardingState(nextUser.id),
    });
  },

  loginWithBayernID: async (userOverride) => {
    await new Promise((r) => setTimeout(r, 1200));

    const nextUser: BayernIDUser = {
      ...MOCK_USER,
      ...userOverride,
      location: userOverride?.location ?? MOCK_USER.location,
    };

    persistUser(nextUser);
    set({
      ...buildAuthState(nextUser),
      hasCompletedOnboarding: true,
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
      isLoading: false,
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

  updateLocation: (lat, lng) => {
    const bayernUser = useAuthStore.getState().bayernUser;
    if (bayernUser) {
      const updated = { ...bayernUser, location: { lat, lng } };
      persistUser(updated);
      set({ bayernUser: updated });
    }
  },
}));
