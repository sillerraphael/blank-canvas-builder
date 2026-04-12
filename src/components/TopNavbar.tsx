import { useState, useEffect } from "react";
import agorixLogo from "@/assets/agorix_logo.svg";
import { Bell, Settings, Plus, LogOut, User, Lightbulb, Loader2, Mail, Lock, X, MapPin, Menu } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { DEFAULT_LOCATION, useAuthStore } from "@/lib/authStore";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const navLinks = [
  { label: "Karte", path: "/" },
  { label: "Initiative", path: "/initiativen" },
  { label: "Abonnements", path: "/abonnements" },
];

interface TopNavbarProps {
  onNewInitiative?: () => void;
}

export function TopNavbar({ onNewInitiative }: TopNavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, hasCompletedOnboarding, user, bayernUser, logout, setAuthenticatedUser, updateLocation } = useAuthStore();

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showInitiativesModal, setShowInitiativesModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBayernRedirecting, setIsBayernRedirecting] = useState(false);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [locationInput, setLocationInput] = useState("");
  const [isGeocodingLocation, setIsGeocodingLocation] = useState(false);

  const showLoggedInUI = isLoggedIn && hasCompletedOnboarding;

  const handleSupabaseLogin = async () => {
    if (!email || !password) {
      toast.error("Bitte E-Mail und Passwort eingeben");
      return;
    }

    setIsSubmitting(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setIsSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (data.user) {
      const name = data.user.user_metadata?.full_name || data.user.email || "User";
      const emailVal = data.user.email || "";

      setAuthenticatedUser(
        {
          id: data.user.id,
          name,
          email: emailVal,
          provider: "supabase",
          location: useAuthStore.getState().bayernUser?.location ?? DEFAULT_LOCATION,
        },
        { hasCompletedOnboarding: true }
      );

      toast.success("Erfolgreich eingeloggt!");
      setShowLoginDialog(false);
      navigate("/");
    }
  };

  const handleSupabaseSignUp = async () => {
    if (!email || !password) {
      toast.error("Bitte E-Mail und Passwort eingeben");
      return;
    }
    if (password.length < 6) {
      toast.error("Passwort muss mindestens 6 Zeichen lang sein");
      return;
    }
    setIsSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    setIsSubmitting(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Registrierung erfolgreich! Bitte E-Mail bestätigen.");
    }
  };

  const handleBayernIDLogin = async () => {
    setShowLoginDialog(false);
    setIsBayernRedirecting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIsBayernRedirecting(false);
    navigate("/bayernid-login");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    navigate("/");
  };

  const handleGeocodeLocation = async () => {
    const query = locationInput.trim();
    if (!query) return;
    setIsGeocodingLocation(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
      );
      const data = await res.json();
      if (data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        updateLocation(lat, lng);
        setLocationInput("");
        toast.success(`Standort aktualisiert: ${data[0].display_name.split(",").slice(0, 2).join(",")}`);
      } else {
        toast.error("Adresse nicht gefunden");
      }
    } catch {
      toast.error("Geocoding fehlgeschlagen");
    } finally {
      setIsGeocodingLocation(false);
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[55] flex justify-between items-center px-4 md:px-8 h-[56px] md:h-[72px] glass-chip border-t-0 rounded-none border-x-0 border-b border-b-white/20">
        <div className="flex items-center gap-4 md:gap-8">
          <img src={agorixLogo} alt="Agorix" className="h-5 md:h-7 w-auto" />
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = link.path === "/"
                ? link.label === "Karte" && location.pathname === "/"
                : location.pathname === link.path;
              return (
                <button
                  key={link.label}
                  onClick={() => navigate(link.path)}
                  className={`text-sm transition-all duration-300 ${
                    isActive
                      ? "text-primary font-medium border-b-2 border-primary/50 pb-0.5"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 rounded-xl hidden md:flex"
            onClick={() => {
              if (onNewInitiative) {
                onNewInitiative();
              } else {
                navigate("/initiativen");
              }
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Neue Initiative</span>
          </Button>

          {showLoggedInUI ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold hover:opacity-90 transition-opacity">
                  {user?.initials ?? "U"}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={8} className="w-48 rounded-xl z-[200]">
                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => setShowProfileModal(true)}>
                  <User className="w-4 h-4" /> Mein Profil
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => setShowInitiativesModal(true)}>
                  <Lightbulb className="w-4 h-4" /> Meine Initiativen
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => setShowSettingsModal(true)}>
                  <Settings className="w-4 h-4" /> Einstellungen
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 cursor-pointer text-destructive"
                  onClick={() => {
                    void handleLogout();
                  }}
                >
                  <LogOut className="w-4 h-4" /> Abmelden
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              size="sm"
              className="rounded-xl gap-2"
              onClick={() => setShowLoginDialog(true)}
            >
              Login
            </Button>
          )}

          {/* Hamburger menu — mobile only */}
          <button
            className="md:hidden p-2 text-foreground/70 hover:text-foreground rounded-xl hover:bg-foreground/5 transition-all"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile navigation dropdown */}
      {showMobileMenu && (
        <div className="fixed top-[56px] left-0 right-0 z-[54] md:hidden glass-chip border-t-0 rounded-none border-x-0 border-b border-b-white/20 animate-in fade-in slide-in-from-top-1 duration-200">
          <nav className="flex flex-col px-4 py-2">
            {navLinks.map((link) => {
              const isActive = link.path === "/"
                ? link.label === "Karte" && location.pathname === "/"
                : location.pathname === link.path;
              return (
                <button
                  key={link.label}
                  onClick={() => {
                    navigate(link.path);
                    setShowMobileMenu(false);
                  }}
                  className={`text-sm py-2.5 text-left transition-all ${
                    isActive
                      ? "text-primary font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
            <button
              onClick={() => {
                setShowMobileMenu(false);
                if (onNewInitiative) {
                  onNewInitiative();
                } else {
                  navigate("/initiativen");
                }
              }}
              className="text-sm py-2.5 text-left text-muted-foreground flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Neue Initiative
            </button>
          </nav>
        </div>
      )}

      {/* ── Mein Profil Modal ─────────────────────────────────── */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl border-border/50">
          <DialogHeader>
            <DialogTitle className="text-lg">Mein Profil</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
              {user?.initials ?? "U"}
            </div>
            <div className="text-center space-y-1">
              <p className="text-lg font-semibold text-foreground">{user?.name ?? "Benutzer"}</p>
              <p className="text-sm text-muted-foreground">{user?.email ?? "–"}</p>
            </div>

            <div className="w-full space-y-2 mt-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary" />
                Mein Wohnsitz
              </label>
              <p className="text-xs text-muted-foreground">
                {bayernUser?.location
                  ? `${bayernUser.location.lat.toFixed(4)}, ${bayernUser.location.lng.toFixed(4)}`
                  : "Nicht festgelegt"}
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="z.B. Marienplatz, München"
                  className="rounded-xl text-sm"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGeocodeLocation()}
                />
                <Button
                  size="sm"
                  className="rounded-xl shrink-0"
                  onClick={handleGeocodeLocation}
                  disabled={isGeocodingLocation || !locationInput.trim()}
                >
                  {isGeocodingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : "Setzen"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Meine Initiativen Modal ───────────────────────────── */}
      <Dialog open={showInitiativesModal} onOpenChange={setShowInitiativesModal}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl border-border/50">
          <DialogHeader>
            <DialogTitle className="text-lg">Meine Initiativen</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-8">
            <Lightbulb className="w-12 h-12 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm text-center">
              Du hast noch keine Initiativen gestartet.
            </p>
            <Button
              className="rounded-xl gap-2 mt-2"
              onClick={() => {
                setShowInitiativesModal(false);
                if (onNewInitiative) {
                  onNewInitiative();
                } else {
                  navigate("/initiativen");
                }
              }}
            >
              <Plus className="w-4 h-4" />
              Neue Initiative erstellen
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Einstellungen Modal ───────────────────────────────── */}
      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl border-border/50">
          <DialogHeader>
            <DialogTitle className="text-lg">Einstellungen</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Benachrichtigungen aktivieren</p>
                <p className="text-xs text-muted-foreground">Push- und E-Mail-Benachrichtigungen</p>
              </div>
              <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowSettingsModal(false)}>
              Schließen
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dual-Auth Login Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl border-border/50">
          <DialogHeader>
            <DialogTitle className="text-center text-lg">Anmelden</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="E-Mail"
                  className="pl-10 rounded-xl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSupabaseLogin()}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Passwort"
                  className="pl-10 rounded-xl"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSupabaseLogin()}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 rounded-xl"
                  onClick={handleSupabaseLogin}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Login"}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={handleSupabaseSignUp}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Registrieren"}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">oder</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <Button
              variant="outline"
              className="w-full rounded-xl gap-2 border-[#003b80]/30 text-[#003b80] hover:bg-[#003b80]/10 hover:text-[#003b80] font-semibold"
              onClick={handleBayernIDLogin}
            >
              🪪 Login mit BayernID
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* BayernID loading overlay */}
      <Dialog open={isBayernRedirecting} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[360px] rounded-2xl border-border/50 flex flex-col items-center gap-4 py-10" onInteractOutside={(e) => e.preventDefault()}>
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-lg font-semibold text-foreground">Weiterleitung zur BayernID...</p>
          <p className="text-sm text-muted-foreground">Bitte warten</p>
        </DialogContent>
      </Dialog>
    </>
  );
}