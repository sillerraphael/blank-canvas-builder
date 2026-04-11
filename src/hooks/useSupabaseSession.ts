import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore, DEFAULT_LOCATION } from "@/lib/authStore";

/**
 * Syncs Supabase auth session → authStore on mount and on auth state changes.
 * Must be rendered once near the app root (e.g. inside App or MapLayout).
 */
export function useSupabaseSession() {
  const { setAuthenticatedUser, logout } = useAuthStore();

  useEffect(() => {
    // 1. Restore from existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u = session.user;
        setAuthenticatedUser(
          {
            id: u.id,
            name: u.user_metadata?.full_name || u.email || "User",
            email: u.email || "",
            provider: u.app_metadata?.provider || "email",
            location: useAuthStore.getState().bayernUser?.location ?? DEFAULT_LOCATION,
          },
          {
            persist: true,
          }
        );
      }
    });

    // 2. Listen for future changes (login / logout / token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u = session.user;
        setAuthenticatedUser(
          {
            id: u.id,
            name: u.user_metadata?.full_name || u.email || "User",
            email: u.email || "",
            provider: u.app_metadata?.provider || "email",
            location: useAuthStore.getState().bayernUser?.location ?? DEFAULT_LOCATION,
          },
          { persist: true }
        );
      } else if (_event === "SIGNED_OUT") {
        logout();
      }
    });

    return () => subscription.unsubscribe();
  }, []);  // intentionally stable – store methods are stable refs
}
