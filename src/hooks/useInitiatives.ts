import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCommunityInitiatives,
  createCommunityInitiative,
  toggleVote,
  type CommunityInitiativeCreate,
  type CommunityInitiativeResponse,
} from "@/lib/initiativesApi";

export function useInitiatives(category?: string) {
  return useQuery({
    queryKey: ["community-initiatives", category ?? "all"],
    queryFn: () => fetchCommunityInitiatives(category),
    staleTime: 30_000,
  });
}

export function useCreateInitiative() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CommunityInitiativeCreate) =>
      createCommunityInitiative(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["community-initiatives"] });
    },
  });
}

function updateInitiativeCounts(
  items: CommunityInitiativeResponse[] | undefined,
  initiativeId: string | number,
  upvotes: number,
  downvotes: number,
) {
  if (!items) return items;

  return items.map((initiative) =>
    String(initiative.id) === String(initiativeId)
      ? { ...initiative, upvotes, downvotes }
      : initiative,
  );
}

export function useVoteInitiative() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      initiativeId,
      direction,
    }: {
      initiativeId: string | number;
      direction: "up" | "down";
    }) => toggleVote(initiativeId, direction),
    onSuccess: (result, variables) => {
      qc.setQueriesData<CommunityInitiativeResponse[]>(
        { queryKey: ["community-initiatives"] },
        (current) =>
          updateInitiativeCounts(
            current,
            variables.initiativeId,
            result.counts.upvotes,
            result.counts.downvotes,
          ),
      );
      qc.invalidateQueries({ queryKey: ["community-initiatives"] });
    },
  });
}
