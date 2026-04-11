import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/authStore";

export interface SubscriptionWithMarker {
  user_id: string;
  event_id: number;
  markers: {
    id: number;
    label: string;
    description: string;
    category: string;
    scenario: string;
    status?: string;
  } | null;
}

const SUBS_STORAGE_KEY = "user_subscriptions";

function getStoredSubs(userId: string): number[] {
  try {
    const raw = localStorage.getItem(`${SUBS_STORAGE_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setStoredSubs(userId: string, eventIds: number[]) {
  localStorage.setItem(`${SUBS_STORAGE_KEY}_${userId}`, JSON.stringify(eventIds));
}

async function fetchSubscriptions(userId: string): Promise<number[]> {
  return getStoredSubs(userId);
}

export function useSubscriptions() {
  const { bayernUser } = useAuthStore();
  const userId = bayernUser?.id;

  return useQuery({
    queryKey: ["subscriptions", userId],
    queryFn: () => fetchSubscriptions(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });
}

export function useSubscribedEventIds(): Set<number> {
  const { data: subs } = useSubscriptions();
  return new Set(subs ?? []);
}

export function useToggleSubscription() {
  const qc = useQueryClient();
  const { bayernUser } = useAuthStore();
  const userId = bayernUser?.id;

  return useMutation({
    mutationFn: async ({
      eventId,
      isCurrentlySubscribed,
    }: {
      eventId: number;
      isCurrentlySubscribed: boolean;
    }) => {
      if (!userId) throw new Error("Nicht eingeloggt");
      const current = getStoredSubs(userId);
      if (isCurrentlySubscribed) {
        setStoredSubs(userId, current.filter((id) => id !== eventId));
      } else {
        if (!current.includes(eventId)) {
          setStoredSubs(userId, [...current, eventId]);
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });
}
