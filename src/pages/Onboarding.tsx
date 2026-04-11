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
  { id: "housing", title: "Housing & Living", subtitle: "Construction, permits & affordability" },
  { id: "mobility", title: "Mobility & Transport", subtitle: "Transit, cycling & roads" },
  { id: "environment", title: "Environment & Climate", subtitle: "Green spaces & climate action" },
  { id: "social", title: "Social Policy", subtitle: "Integration, youth & education" },
  { id: "economy", title: "Economy & Labor", subtitle: "Local business & job market" },
  { id: "digital", title: "Digitalization", subtitle: "Smart city & broadband" },
  { id: "urban", title: "Urban Development", subtitle: "City planning & participation" },
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
      className={`w-full text-left rounded-xl px-5 py-4 transition-all duration-200 border cursor-pointer ${
        isSelected
          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
          : "border-border bg-card hover:border-muted-foreground/30"
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
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 w-full max-w-md mx-auto px-6 py-16 flex flex-col">
        {/* Header */}
        <div className="text-center mb-10 space-y-3">
          <h1 className="text-2xl font-bold text-foreground">
            What moves you in your city?
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Pick at least 3 priorities — we'll tailor your map experience.
          </p>
          {/* Progress */}
          <div className="mx-auto max-w-[200px] h-1 rounded-full bg-muted overflow-hidden mt-4">
            <div className="h-full bg-primary/60 rounded-full transition-all" style={{ width: "50%" }} />
          </div>
          <p className="text-xs text-muted-foreground/60">Step 1 of 2</p>
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
        <div className="mt-auto text-center space-y-3">
          <Button
            onClick={handleGoToMap}
            disabled={!canProceed}
            size="lg"
            className="w-full rounded-xl text-sm"
          >
            Continue
          </Button>
          <p className="text-xs text-muted-foreground">
            {canProceed
              ? "You can change these later in settings."
              : `${selectedCount}/3 selected`}
          </p>
          <button
            onClick={() => {
              completeOnboarding();
              navigate("/");
            }}
            className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
