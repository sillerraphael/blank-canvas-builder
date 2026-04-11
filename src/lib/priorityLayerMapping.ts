import type { PriorityLevel } from "./authStore";

/**
 * Centralized mapping: topic → priority level → map layer IDs to activate.
 * 
 * Edit the layer ID strings here when you have the real database category/layer IDs.
 * The keys match the topicId used in the onboarding cards.
 */
export const priorityLayerMapping: Record<string, { high: string[]; medium: string[] }> = {
  housing: {
    high: ["bauprojekt", "wohnort"],
    medium: ["bauprojekt"],
  },
  mobility: {
    high: ["oepnv", "radweg"],
    medium: ["oepnv"],
  },
  environment: {
    high: ["park", "radweg"],
    medium: ["park"],
  },
  social: {
    high: ["spielplatz", "initiative"],
    medium: ["spielplatz"],
  },
  economy: {
    high: ["initiative"],
    medium: [],
  },
  digital: {
    high: ["initiative"],
    medium: [],
  },
  urban: {
    high: ["initiative", "bauprojekt"],
    medium: ["initiative"],
  },
};

/**
 * Given user priorities, return the set of map layer IDs that should be enabled.
 * Categories NOT mentioned in any mapping are always enabled (never auto-disabled).
 */
export function getActiveLayersFromPriorities(
  priorities: Record<string, PriorityLevel>
): Set<string> {
  const layers = new Set<string>();

  for (const [topicId, level] of Object.entries(priorities)) {
    if (!level || level === "low") continue;
    const mapping = priorityLayerMapping[topicId];
    if (!mapping) continue;

    const layerIds = level === "high" ? mapping.high : mapping.medium;
    layerIds.forEach((id) => layers.add(id));
  }

  return layers;
}

/**
 * Returns the set of all category IDs that appear in at least one priority mapping.
 * Categories outside this set should never be auto-disabled.
 */
export function getMappedCategoryIds(): Set<string> {
  const ids = new Set<string>();
  for (const mapping of Object.values(priorityLayerMapping)) {
    mapping.high.forEach((id) => ids.add(id));
    mapping.medium.forEach((id) => ids.add(id));
  }
  return ids;
}
