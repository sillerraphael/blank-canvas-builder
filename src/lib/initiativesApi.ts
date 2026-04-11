const API_BASE = "https://blog.bauer-jakob.de/api/v1/community-initiatives";

export interface CommunityInitiativeResponse {
  id: string | number;
  title: string;
  category: string;
  description: string | null;
  upvotes: number;
  downvotes: number;
  neutral_votes: number;
  lat: number;
  lng: number;
  created_at: string | null;
}

export interface CommunityInitiativeCreate {
  title: string;
  category: string;
  description?: string | null;
  lat: number;
  lng: number;
}

export async function fetchCommunityInitiatives(
  category?: string
): Promise<CommunityInitiativeResponse[]> {
  const url = new URL(API_BASE + "/");
  if (category) url.searchParams.set("category", category);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Failed to fetch initiatives: ${res.status}`);
  return res.json();
}

export async function createCommunityInitiative(
  data: CommunityInitiativeCreate
): Promise<CommunityInitiativeResponse> {
  const res = await fetch(API_BASE + "/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to create initiative: ${res.status} ${body}`);
  }
  return res.json();
}

// --- Local vote tracking (until backend supports voting) ---

const VOTES_KEY = "individuWahl_votes";

export type VoteType = "up" | "down" | null;

export function getLocalVotes(): Record<string, VoteType> {
  try {
    const raw = localStorage.getItem(VOTES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalVotes(votes: Record<string, VoteType>) {
  localStorage.setItem(VOTES_KEY, JSON.stringify(votes));
}

export function toggleVote(
  initiativeId: string | number,
  direction: "up" | "down"
): { newVote: VoteType; delta: { upvotes: number; downvotes: number } } {
  const id = String(initiativeId);
  const votes = getLocalVotes();
  const current = votes[id] ?? null;

  let delta = { upvotes: 0, downvotes: 0 };

  if (current === direction) {
    // Undo vote
    delete votes[id];
    delta[direction === "up" ? "upvotes" : "downvotes"] = -1;
    saveLocalVotes(votes);
    return { newVote: null, delta };
  }

  // Remove old vote if switching
  if (current === "up") delta.upvotes = -1;
  if (current === "down") delta.downvotes = -1;

  // Add new vote
  delta[direction === "up" ? "upvotes" : "downvotes"] += 1;
  votes[id] = direction;
  saveLocalVotes(votes);
  return { newVote: direction, delta };
}
