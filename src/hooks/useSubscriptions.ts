import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

async function fetchSubscriptions(userId: string): Promise<SubscriptionWithMarker[]> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("user_id, event_id, markers(*)")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []) as unknown as SubscriptionWithMarker[];
}

async function addSubscription(userId: string, eventId: number) {
  const { error } = await supabase
    .from("subscriptions")
    .insert({ user_id: userId, event_id: eventId });
  if (error) {
    console.error("Subscription insert error:", error);
    throw error;
  }
}

async function removeSubscription(userId: string, eventId: number) {
  const { error } = await supabase
    .from("subscriptions")
    .delete()
    .eq("user_id", userId)
    .eq("event_id", eventId);
  if (error) {
    console.error("Subscription delete error:", error);
    throw error;
  }
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
  return new Set((subs ?? []).map((s) => s.event_id));
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
      if (isCurrentlySubscribed) {
        await removeSubscription(userId, eventId);
      } else {
        await addSubscription(userId, eventId);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });
}
