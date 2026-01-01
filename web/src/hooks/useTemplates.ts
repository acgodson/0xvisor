"use client";

import { trpc } from "../trpc/client";
import type { PolicyTemplate } from "../types/policy";

interface UseTemplatesResult {
  templates: PolicyTemplate[];
  loading: boolean;
  error: string | null;
}

export function useTemplates(): UseTemplatesResult {
  const { data, isLoading, error } = trpc.policies.getTemplates.useQuery({});

  return {
    templates: (data?.templates as PolicyTemplate[]) || [],
    loading: isLoading,
    error: error?.message || null,
  };
}
