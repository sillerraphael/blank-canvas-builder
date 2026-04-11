import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/authStore";

interface Topic {
  id: string;
  title: string;
  subtitle: string;
}

const topics: Topic[] = [
  { id: "housing", title: "Wohnen & Bauen", subtitle: "Bauprojekte, Genehmigungen & Bezahlbarkeit" },
  { id: "mobility", title: "Mobilität & Verkehr", subtitle: "ÖPNV, Radwege & Straßenplanung" },
  { id: "environment", title: "Umwelt & Klima", subtitle: "Grünflächen & Klimaschutz" },
  { id: "social", title: "Soziales", subtitle: "Integration, Jugend & Bildung" },
  { id: "economy", title: "Wirtschaft & Arbeit", subtitle: "Lokale Wirtschaft & Arbeitsmarkt" },
  { id: "digital", title: "Digitalisierung", subtitle: "Smart City & Breitband" },
  { id: "urban", title: "Stadtentwicklung", subtitle: "Planung & Bürgerbeteiligung" },
];

function TopicTile({
  topic,
  isSelected,
  onToggle,
}: {
  topic: Topic;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`w-full text-left rounded-xl px-5 py-4 transition-all duration-200 border cursor-pointer backdrop-blur-sm ${
        isSelected
          ? "border-primary bg-primary/10 ring-1 ring-primary/20"
          : "border-border/60 bg-card/80 hover:border-muted-foreground/30"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{topic.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{topic.subtitle}</p>
        </div>
        <div
          className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
            isSelected ? "bg-primary" : "bg-muted"
          }`}
        >
          {isSelected && <Check className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={2.5} />}
        </div>
      </div>
    </button>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { priorities, setPriority, completeOnboarding } = useAuthStore();

  const selectedCount = useMemo(
    () => Object.values(priorities).filter((p) => p && p !== null).length,
    [priorities],
  );

  const canProceed = selectedCount >= 3;

  const handleGoToMap = () => {
    completeOnboarding();
    navigate("/");
  };

  return (
    <div className="min-h-screen relative flex flex-col">
      {/* Map background */}
      <div className="absolute inset-0 z-0">
        <iframe
          src="https://www.openstreetmap.org/export/embed.html?bbox=11.45,48.08,11.7,48.2&layer=mapnik"
          className="w-full h-full border-0 pointer-events-none opacity-30"
          title="map background"
        />
        <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 flex-1 w-full max-w-md mx-auto px-6 py-16 flex flex-col">
        {/* Header */}
        <div className="text-center mb-10 space-y-3">
          <h1 className="text-2xl font-bold text-foreground">
            Was bewegt dich in deiner Stadt?
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Wähle mindestens drei Prioritäten, damit deine Kartenansicht optimal angepasst wird.
          </p>
        </div>

        {/* Topic tiles */}
        <div className="flex flex-col gap-3 mb-10">
          {topics.map((topic) => {
            const selected = priorities[topic.id];
            const isSelected = !!selected && selected !== null;
            return (
              <TopicTile
                key={topic.id}
                topic={topic}
                isSelected={isSelected}
                onToggle={() => setPriority(topic.id, isSelected ? null : "medium")}
              />
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-auto text-center space-y-2">
          <Button
            onClick={handleGoToMap}
            disabled={!canProceed}
            size="lg"
            className="w-full rounded-xl text-sm"
          >
            Weiter
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full rounded-xl text-sm text-muted-foreground"
            onClick={() => {
              completeOnboarding();
              navigate("/");
            }}
          >
            Überspringen
          </Button>
          <p className="text-xs text-muted-foreground pt-1">
            {canProceed
              ? "Du kannst diese später in den Einstellungen ändern."
              : `${selectedCount}/3 ausgewählt`}
          </p>
        </div>
      </div>
    </div>
  );
}
