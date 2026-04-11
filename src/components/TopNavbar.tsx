import { useState } from "react";
import { Bell, Settings, Plus, LogOut, User, Lightbulb, Loader2, Mail, Lock } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/lib/authStore";
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
  const { isLoggedIn, hasCompletedOnboarding, user, logout } = useAuthStore();

  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBayernRedirecting, setIsBayernRedirecting] = useState(false);

  const showLoggedInUI = isLoggedIn && hasCompletedOnboarding;

  const handleSupabaseLogin = async () => {
    if (!email || !password) {
      toast.error("Bitte E-Mail und Passwort eingeben");
      return;
    }
    setIsSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsSubmitting(false);
    if (error) {
      toast.error(error.message);
    } else {
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

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[55] flex justify-between items-center px-8 h-[72px] glass-chip border-t-0 rounded-none border-x-0 border-b border-b-white/20">
        <div className="flex items-center gap-8">
          <span className="text-xl font-semibold bg-gradient-to-br from-primary to-[hsl(var(--primary-container))] bg-clip-text text-transparent tracking-tight">
            Agorum
          </span>
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

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 rounded-xl"
            onClick={() => {
              if (onNewInitiative) {
                onNewInitiative();
              } else {
                navigate("/initiativen");
              }
            }}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Neue Initiative</span>
          </Button>

          <button className="p-2 text-muted-foreground hover:bg-background/40 rounded-full transition-all hidden">
            <Bell className="w-5 h-5" strokeWidth={1.5} />
          </button>
          <button className="p-2 text-muted-foreground hover:bg-background/40 rounded-full transition-all hidden">
            <Settings className="w-5 h-5" strokeWidth={1.5} />
          </button>

          {showLoggedInUI ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold hover:opacity-90 transition-opacity">
                  {user?.initials ?? "U"}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl">
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <User className="w-4 h-4" /> Mein Profil
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <Lightbulb className="w-4 h-4" /> Meine Initiativen
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <Settings className="w-4 h-4" /> Einstellungen
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 cursor-pointer text-destructive"
                  onClick={() => { logout(); navigate("/"); }}
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
        </div>
      </header>

      {/* Dual-Auth Login Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl border-border/50">
          <DialogHeader>
            <DialogTitle className="text-center text-lg">Anmelden</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Supabase Email/Password */}
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

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">oder</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* BayernID Mock Login */}
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