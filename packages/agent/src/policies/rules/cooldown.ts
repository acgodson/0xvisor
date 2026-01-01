import type { PolicyRule, PolicyContext, PolicyResult } from "../types.js";

function formatTimeRemaining(seconds: number): string {
  if (seconds < 60) {
    return `${Math.ceil(seconds)}s`;
  } else if (seconds < 3600) {
    const minutes = Math.ceil(seconds / 60);
    return `${minutes}m`;
  } else {
    const hours = Math.ceil(seconds / 3600);
    return `${hours}h`;
  }
}

export const cooldownRule: PolicyRule = {
  type: "cooldown",
  name: "Transaction Cooldown",
  description: "Enforce minimum time between transactions",
  defaultConfig: { minimumSeconds: 60 },

  async evaluate(
    context: PolicyContext,
    config: Record<string, any>
  ): Promise<PolicyResult> {
    const { minimumSeconds = 60 } = config;
    const { timestamp, lastExecutionTime } = context;

    if (!lastExecutionTime) {
      return {
        policyType: "cooldown",
        policyName: "Transaction Cooldown",
        allowed: true,
        reason: "First transaction - no cooldown required",
        metadata: { minimumSeconds, isFirstTransaction: true },
      };
    }

    const now = timestamp.getTime();
    const lastTime = lastExecutionTime.getTime();
    const elapsedSeconds = (now - lastTime) / 1000;

    if (elapsedSeconds < minimumSeconds) {
      const remainingSeconds = minimumSeconds - elapsedSeconds;
      return {
        policyType: "cooldown",
        policyName: "Transaction Cooldown",
        allowed: false,
        reason: `Cooldown active: ${formatTimeRemaining(remainingSeconds)} remaining`,
        metadata: {
          minimumSeconds,
          elapsedSeconds: Math.floor(elapsedSeconds),
          remainingSeconds: Math.ceil(remainingSeconds),
          lastExecution: lastExecutionTime.toISOString(),
        },
      };
    }

    return {
      policyType: "cooldown",
      policyName: "Transaction Cooldown",
      allowed: true,
      reason: `Cooldown satisfied: ${Math.floor(elapsedSeconds)}s elapsed`,
      metadata: {
        minimumSeconds,
        elapsedSeconds: Math.floor(elapsedSeconds),
        lastExecution: lastExecutionTime.toISOString(),
      },
    };
  },
};
