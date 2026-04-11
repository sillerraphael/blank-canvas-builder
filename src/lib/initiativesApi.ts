import { supabase } from "@/integrations/supabase/client";

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

const VOTES_KEY = "individuWahl_votes";

export type VoteType = "up" | "down" | null;

interface VoteDelta {
  upvotes: number;
  downvotes: number;
}

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

function getVoteChange(current: VoteType, direction: "up" | "down") {
  const delta: VoteDelta = { upvotes: 0, downvotes: 0 };

  if (current === direction) {
    delta[direction === "up" ? "upvotes" : "downvotes"] = -1;
    return { newVote: null as VoteType, delta };
  }

  if (current === "up") delta.upvotes = -1;
  if (current === "down") delta.downvotes = -1;

  delta[direction === "up" ? "upvotes" : "downvotes"] += 1;
  return { newVote: direction as VoteType, delta };
}

export async function toggleVote(
  initiativeId: string | number,
  direction: "up" | "down"
): Promise<{
  newVote: VoteType;
  delta: VoteDelta;
  counts: { upvotes: number; downvotes: number };
}> {
  const id = String(initiativeId);
  const votes = getLocalVotes();
  const current = votes[id] ?? null;
  const { newVote, delta } = getVoteChange(current, direction);

  const { data: currentRow, error: fetchError } = await supabase
    .from("community_initiatives")
    .select("id, upvotes, downvotes")
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;

  const nextCounts = {
    upvotes: Math.max(0, (currentRow.upvotes ?? 0) + delta.upvotes),
    downvotes: Math.max(0, (currentRow.downvotes ?? 0) + delta.downvotes),
  };

  const { data: updatedRow, error: updateError } = await supabase
    .from("community_initiatives")
    .update(nextCounts)
    .eq("id", id)
    .select("upvotes, downvotes")
    .single();

  if (updateError) throw updateError;

  if (newVote === null) {
    delete votes[id];
  } else {
    votes[id] = newVote;
  }

  saveLocalVotes(votes);

  return {
    newVote,
    delta,
    counts: {
      upvotes: updatedRow?.upvotes ?? nextCounts.upvotes,
      downvotes: updatedRow?.downvotes ?? nextCounts.downvotes,
    },
  };
}
