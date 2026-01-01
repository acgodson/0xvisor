"use client";

import { useEffect } from "react";
import { trpc } from "../trpc/client";

interface Session {
  address: string;
  userAddress: string;
  adapterId: string;
  createdAt: string;
}

export function useSession(userAddress: string | null, adapterId?: string) {
  const createSessionMutation = trpc.session.create.useMutation();

  // Automatically fetch/create session when userAddress and adapterId are available
  useEffect(() => {
    if (userAddress && adapterId && !createSessionMutation.data && !createSessionMutation.isPending) {
      createSessionMutation.mutate({
        userAddress: userAddress as `0x${string}`,
        adapterId,
      });
    }
  }, [userAddress, adapterId]);

  const fetchOrCreateSession = async () => {
    if (!userAddress || !adapterId) return;

    try {
      const result = await createSessionMutation.mutateAsync({
        userAddress: userAddress as `0x${string}`,
        adapterId,
      });
      return result;
    } catch (error) {
      console.error("Failed to create session:", error);
      throw error;
    }
  };

  return {
    session: createSessionMutation.data || null,
    isLoading: createSessionMutation.isPending,
    error: createSessionMutation.error?.message || null,
    refetch: fetchOrCreateSession,
  };
}
