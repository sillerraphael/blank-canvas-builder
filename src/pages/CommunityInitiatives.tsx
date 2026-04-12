import { useState, useCallback } from "react";
import { Plus, ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useInitiatives, useVoteInitiative } from "@/hooks/useInitiatives";
import { useCategories } from "@/hooks/useCategories";
import { useNavigate } from "react-router-dom";
import { getLocalVotes, type VoteType } from "@/lib/initiativesApi";
import PartyResponses from "@/components/PartyResponses";

export default function CommunityInitiatives() {
  const { categories: categoryOptions, categoryColors } = useCategories();
  const { data: initiatives, isLoading, error } = useInitiatives();
  const voteMutation = useVoteInitiative();
  const navigate = useNavigate();

  const [votes, setVotes] = useState<Record<string, VoteType>>(getLocalVotes);

  const pendingVoteId =
    voteMutation.isPending && voteMutation.variables
      ? String(voteMutation.variables.initiativeId)
      : null;

  const handleVote = useCallback(
    async (id: string | number, direction: "up" | "down") => {
      try {
        await voteMutation.mutateAsync({ initiativeId: id, direction });
        setVotes(getLocalVotes());
      } catch (error) {
        console.error("Failed to save initiative vote:", error);
        toast.error("Deine Stimme konnte nicht gespeichert werden.");
      }
    },
    [voteMutation],
  );

  return (
    <>
      <header className="border-b border-border/40 bg-background/60 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-4">
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Bürgerinitiativen</h1>
            <p className="text-xs text-muted-foreground">
              Ideen einreichen, abstimmen & deine Stadt mitgestalten
            </p>
          </div>
          <Button
            onClick={() => navigate("/")}
            size="sm"
            className="gap-1.5 rounded-xl"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Auf der Karte erstellen</span>
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-4">
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-5 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <Skeleton className="w-8 h-8 rounded-lg" />
                    <Skeleton className="w-6 h-4" />
                    <Skeleton className="w-8 h-8 rounded-lg" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Skeleton className="w-20 h-4 rounded-full" />
                    <Skeleton className="w-3/4 h-4" />
                    <Skeleton className="w-full h-3" />
                    <Skeleton className="w-2/3 h-3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-16">
            <p className="text-destructive text-sm">Fehler beim Laden der Initiativen.</p>
          </div>
        )}

        {!isLoading && !error && (
          <div className="space-y-3">
            {(initiatives ?? []).map((init, i) => {
              const id = String(init.id);
              const userVote = votes[id] ?? null;
              const displayUpvotes = Math.max(0, init.upvotes);
              const displayDownvotes = Math.max(0, init.downvotes);
              const netScore = displayUpvotes - displayDownvotes;
              const isSavingVote = pendingVoteId === id;

              return (
                <motion.div
                  key={init.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-5 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center gap-1 pt-0.5">
                      <button
                        onClick={() => handleVote(init.id, "up")}
                        disabled={isSavingVote}
                        className={`p-1.5 rounded-lg transition-colors disabled:opacity-60 ${
                          userVote === "up"
                            ? "bg-primary/20 text-primary"
                            : "hover:bg-primary/10 text-muted-foreground hover:text-primary"
                        }`}
                      >
                        <ThumbsUp className="w-4 h-4" />
                      </button>
                      <span
                        className={`text-sm font-bold min-w-[24px] text-center ${
                          netScore > 0
                            ? "text-primary"
                            : netScore < 0
                            ? "text-destructive"
                            : "text-foreground"
                        }`}
                      >
                        {netScore}
                      </span>
                      <button
                        onClick={() => handleVote(init.id, "down")}
                        disabled={isSavingVote}
                        className={`p-1.5 rounded-lg transition-colors disabled:opacity-60 ${
                          userVote === "down"
                            ? "bg-destructive/20 text-destructive"
                            : "hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        }`}
                      >
                        <ThumbsDown className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            categoryColors[init.category] ?? "bg-muted text-muted-foreground"
                          }`}
                        >
                          {init.category}
                        </span>
                        {init.created_at && (
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(init.created_at).toLocaleDateString("de-DE")}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-foreground leading-snug mb-1">
                        {init.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {init.description}
                      </p>
                      <div className="mt-3 flex items-center gap-3">
                        <button className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-primary transition-colors">
                          <MessageSquare className="w-3.5 h-3.5" />
                          Änderungsvorschlag
                        </button>
                      </div>

                      <PartyResponses
                        initiativeId={init.id}
                        category={init.category}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {!isLoading && !error && (!initiatives || initiatives.length === 0) && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-sm">Noch keine Initiativen vorhanden.</p>
            <Button onClick={() => navigate("/")} variant="outline" size="sm" className="mt-4 rounded-xl">
              Erste Initiative auf der Karte erstellen
            </Button>
          </div>
        )}
      </main>
    </>
  );
}
