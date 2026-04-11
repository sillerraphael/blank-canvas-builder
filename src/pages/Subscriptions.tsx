import { BellOff, Bell } from "lucide-react";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubscriptions, useToggleSubscription } from "@/hooks/useSubscriptions";
import { useAuthStore } from "@/lib/authStore";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCategories } from "@/hooks/useCategories";

export default function Subscriptions() {
  const navigate = useNavigate();
  const { isLoggedIn, hasCompletedOnboarding } = useAuthStore();
  const { data: subs, isLoading: subsLoading } = useSubscriptions();
  const toggleMutation = useToggleSubscription();
  const { categoryColors } = useCategories();

  const showLoggedIn = isLoggedIn && hasCompletedOnboarding;

  const handleUnsubscribe = (eventId: number) => {
    toggleMutation.mutate(
      { eventId, isCurrentlySubscribed: true },
      {
        onSuccess: () => toast.success("Abonnement beendet"),
        onError: () => toast.error("Fehler beim Beenden des Abonnements"),
      }
    );
  };

  if (!showLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Bell className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground text-sm">Bitte logge dich ein, um deine Abonnements zu sehen.</p>
          <Button size="sm" className="rounded-xl" onClick={() => navigate("/")}>
            Zur Startseite
          </Button>
        </div>
      </div>
    );
  }

  const items = (subs ?? []).filter((s) => s.markers != null);

  return (
    <>
      <header className="border-b border-border/40 bg-background/60 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <h1 className="text-lg font-bold text-foreground">Meine Abonnements</h1>
          <p className="text-xs text-muted-foreground">
            Events und Initiativen, die du abonniert hast
          </p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-4">
        {subsLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-5 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-10 h-10 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="w-20 h-4 rounded-full" />
                    <Skeleton className="w-3/4 h-4" />
                    <Skeleton className="w-full h-3" />
                  </div>
                  <Skeleton className="w-28 h-9 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!subsLoading && items.length > 0 && (
          <div className="space-y-3">
            {items.map((sub, i) => {
              const marker = sub.markers!;
              return (
                <motion.div
                  key={sub.event_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-5 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Bell className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            categoryColors[marker.category] ?? "bg-muted text-muted-foreground"
                          }`}
                        >
                          {marker.category}
                        </span>
                        {marker.status && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">
                            {marker.status}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-foreground leading-snug">
                        {marker.label}
                      </h3>
                      {marker.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mt-0.5">
                          {marker.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl gap-1.5 text-destructive hover:text-destructive shrink-0"
                      onClick={() => handleUnsubscribe(sub.event_id)}
                      disabled={toggleMutation.isPending}
                    >
                      <BellOff className="w-4 h-4" />
                      Abo beenden
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {!subsLoading && items.length === 0 && (
          <div className="text-center py-16">
            <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Du hast noch keine Abonnements.</p>
            <p className="text-muted-foreground text-xs mt-1">
              Klicke auf der Karte auf einen Marker und dann auf „Abonnieren".
            </p>
            <Button onClick={() => navigate("/")} variant="outline" size="sm" className="mt-4 rounded-xl">
              Zur Karte
            </Button>
          </div>
        )}
      </main>
    </>
  );
}
