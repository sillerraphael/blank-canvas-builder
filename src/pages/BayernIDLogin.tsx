import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_LOCATION, useAuthStore } from "@/lib/authStore";

export default function BayernIDLogin() {
  const navigate = useNavigate();
  const { setAuthenticatedUser } = useAuthStore();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Bitte E-Mail und Passwort eingeben");
      return;
    }

    setIsAuthenticating(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setIsAuthenticating(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (!data.user) {
      toast.error("Login fehlgeschlagen");
      return;
    }

    const name = data.user.user_metadata?.full_name || data.user.email || "User";

    setAuthenticatedUser(
      {
        id: data.user.id,
        name,
        email: data.user.email || email,
        provider: "bayernID",
        location: useAuthStore.getState().bayernUser?.location ?? DEFAULT_LOCATION,
      },
      { hasCompletedOnboarding: true }
    );

    toast.success("Erfolgreich eingeloggt!");
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#f0f4f8" }}>
      <header
        className="w-full px-6 py-4 flex items-center gap-3 shadow-sm"
        style={{ backgroundColor: "#003b80" }}
      >
        <ShieldCheck className="w-7 h-7 text-white" />
        <span className="text-white text-lg font-semibold tracking-wide">
          BayernID – Sicher online ausweisen
        </span>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div
            className="px-6 py-5 border-b border-gray-100 text-center"
            style={{ backgroundColor: "#f8fafc" }}
          >
            <h1 className="text-xl font-bold" style={{ color: "#003b80" }}>
              Anmeldung
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Melden Sie sich mit Ihrem BayernID-Konto an
            </p>
          </div>

          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Benutzername / E-Mail
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="max.mustermann@email.de"
                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
                style={{ ["--tw-ring-color" as string]: "#003b80" }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">
                Passwort
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={isAuthenticating}
              className="w-full h-11 rounded-lg text-white font-semibold text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-70"
              style={{ backgroundColor: "#003b80" }}
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authentifizierung...
                </>
              ) : (
                "Anmelden"
              )}
            </button>

            <div className="pt-2 text-center">
              <a href="#" className="text-xs hover:underline" style={{ color: "#003b80" }}>
                Passwort vergessen?
              </a>
            </div>
          </div>

          <div
            className="px-6 py-4 border-t border-gray-100 text-center"
            style={{ backgroundColor: "#f8fafc" }}
          >
            <p className="text-xs text-gray-400">
              Dies ist eine simulierte Anmeldeseite zu Demonstrationszwecken.
            </p>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-gray-400">
        © 2026 Freistaat Bayern – BayernID Portal (Demo)
      </footer>
    </div>
  );
}
