import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCommunityInitiatives,
  createCommunityInitiative,
  type CommunityInitiativeCreate,
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
