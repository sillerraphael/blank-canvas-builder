import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/authStore";

interface TopicCard {
  id: string;
  emoji: string;
  title: string;
  tags: string[];
  softColor: string;
  darkerTag: string;
  accentColor: string;
  imageUrl: string;
}

const topics: TopicCard[] = [
  {
    id: "housing",
    emoji: "🏠",
    title: "Housing & Living",
    tags: ["Housing construction", "Affordable housing", "Building permits & renovation"],
    softColor: "#FDF3E7",
    darkerTag: "#E8D5B8",
    accentColor: "#D4913B",
    imageUrl: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&h=400&fit=crop",
  },
  {
    id: "mobility",
    emoji: "🚌",
    title: "Mobility & Transport",
    tags: ["Public transport", "Cycling infrastructure", "Road planning"],
    softColor: "#E8F4FD",
    darkerTag: "#B8D8EE",
    accentColor: "#3B82D4",
    imageUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&h=400&fit=crop",
  },
  {
    id: "environment",
    emoji: "🌿",
    title: "Environment & Climate",
    tags: ["Green spaces", "Climate protection", "Waste management"],
    softColor: "#EAF7EE",
    darkerTag: "#B8E0C4",
    accentColor: "#34A853",
    imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=400&fit=crop",
  },
  {
    id: "social",
    emoji: "🤝",
    title: "Social Policy",
    tags: ["Integration", "Social cohesion", "Youth & education"],
    softColor: "#F0EAFB",
    darkerTag: "#C9B8E8",
    accentColor: "#7C3BD4",
    imageUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=400&fit=crop",
  },
  {
    id: "economy",
    emoji: "💼",
    title: "Economy & Labor",
    tags: ["Local economy", "Business districts", "Job market"],
    softColor: "#FDFAE8",
    darkerTag: "#E8E0B8",
    accentColor: "#B8960F",
    imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop",
  },
  {
    id: "digital",
    emoji: "💻",
    title: "Digitalization",
    tags: ["Smart city tech", "Broadband expansion", "Digital administration"],
    softColor: "#E8F6F7",
    darkerTag: "#B8DFE1",
    accentColor: "#1BA3A8",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=400&fit=crop",
  },
  {
    id: "urban",
    emoji: "🏙️",
    title: "Urban Development",
    tags: ["Urban development", "City center", "Citizen participation"],
    softColor: "#FDECEA",
    darkerTag: "#E8C4BE",
    accentColor: "#D44B3B",
    imageUrl: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=600&h=400&fit=crop",
  },
];



export default function Onboarding() {
  const navigate = useNavigate();
  const { priorities, setPriority, completeOnboarding } = useAuthStore();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [showSkip, setShowSkip] = useState(true);

  useEffect(() => {
    const onScroll = () => setShowSkip(window.scrollY < 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const selectedCount = useMemo(
    () => Object.values(priorities).filter((p) => p && p !== null).length,
    [priorities]
  );

  const canProceed = selectedCount >= 3;

  const handleGoToMap = () => {
    completeOnboarding();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <motion.button
        onClick={() => {
          completeOnboarding();
          navigate("/");
        }}
        className="fixed top-6 right-6 z-[9999] cursor-pointer bg-primary hover:bg-primary/80 text-primary-foreground rounded-full px-6 py-2.5 text-sm font-medium border-none"
        initial={{ opacity: 1 }}
        animate={{ opacity: showSkip ? 1 : 0.4 }}
        transition={{ duration: 0.25 }}
      >
        Skip
      </motion.button>
      <div className="max-w-[900px] mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            What moves you in your city?
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto mb-4">
            Select your personal priorities — we'll show you what's happening in your neighborhood.
          </p>
          <p className="text-sm text-muted-foreground">
            Step 1 of 2 — Your Priorities
          </p>
          {/* Progress bar */}
          <div className="mt-3 mx-auto max-w-xs h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: "50%" }} />
          </div>
        </div>

        {/* Topic Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          {topics.map((topic, idx) => {
            const selected = priorities[topic.id];
            const isSelected = selected && selected !== null;
            const isLast = idx === topics.length - 1 && topics.length % 2 !== 0;

            return (
              <motion.div
                key={topic.id}
                onClick={() => setPriority(topic.id, isSelected ? null : "medium")}
                className={`relative rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing transition-all duration-300 ${
                  isLast ? "md:col-span-2 md:max-w-[calc(50%-10px)] md:mx-auto" : ""
                }`}
                style={{
                  minHeight: 260,
                  border: isSelected
                    ? `2px solid ${topic.accentColor}`
                    : "2px solid transparent",
                  backgroundColor: isSelected ? `${topic.accentColor}0A` : undefined,
                }}
                onMouseEnter={() => setHoveredCard(topic.id)}
                onMouseLeave={() => setHoveredCard(null)}
                whileHover={{ y: -3, boxShadow: "0 12px 32px rgba(0,0,0,0.12)" }}
              >
                {/* Background image */}
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `linear-gradient(to bottom, transparent 0%, transparent 20%, ${topic.softColor} 50%, ${topic.softColor} 100%), url(${topic.imageUrl})`,
                  }}
                />

                {/* Checkmark badge */}
                {isSelected && (
                  <div
                    className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full flex items-center justify-center shadow-md"
                    style={{ backgroundColor: topic.accentColor }}
                  >
                    <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                  </div>
                )}

                {/* Content */}
                <div
                  className="relative z-10 flex flex-col items-center text-center justify-end h-full"
                  style={{ minHeight: 260, padding: 20 }}
                >
                  <div className="flex-1" style={{ minHeight: "40%" }} />

                  <span className="text-5xl mb-2">{topic.emoji}</span>
                  <h3 className="text-base font-bold mb-2" style={{ color: "#1a1a1a" }}>
                    {topic.title}
                  </h3>

                  {/* Subtopic tags */}
                  <div className="flex flex-wrap justify-center gap-1.5 mb-3">
                    {topic.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-full text-[11px] font-medium"
                        style={{
                          backgroundColor: topic.darkerTag,
                          color: "#2a2a2a",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Select button */}
                  <button
                    className="px-6 py-2 rounded-full text-xs font-semibold transition-all duration-200"
                    style={{
                      backgroundColor: isSelected ? topic.accentColor : "rgba(255,255,255,0.7)",
                      color: isSelected ? "#fff" : topic.accentColor,
                      border: `1.5px solid ${topic.accentColor}`,
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    {isSelected ? "✓ Selected" : "Select"}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center space-y-3">
          <Button
            onClick={handleGoToMap}
            disabled={!canProceed}
            size="lg"
            className="rounded-xl px-10 text-base"
          >
            Go to Map →
          </Button>
          <p className="text-xs text-muted-foreground">
            {canProceed
              ? "You can always change these later in your profile."
              : `Select at least 3 priorities (${selectedCount}/3)`}
          </p>
        </div>
      </div>
    </div>
  );
}
