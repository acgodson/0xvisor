import type { PolicyRule, PolicyContext, PolicyResult } from "../types.js";

export const gasLimitRule: PolicyRule = {
  type: "gas-limit",
  name: "Gas Limit",
  description: "Block transactions when gas price exceeds threshold",
  defaultConfig: { maxGwei: 50 },

  async evaluate(
    context: PolicyContext,
    config: Record<string, any>
  ): Promise<PolicyResult> {
    const maxGwei = config.maxGwei || 50;
    const gasSignal = context.signals.gas;

    if (!gasSignal || gasSignal.standard === null) {
      return {
        policyType: "gas-limit",
        policyName: "Gas Limit",
        allowed: true,
        reason: "Gas signal unavailable, allowing by default",
      };
    }

    const currentGwei = gasSignal.standard;

    if (currentGwei > maxGwei) {
      return {
        policyType: "gas-limit",
        policyName: "Gas Limit",
        allowed: false,
        reason: `Gas too high: ${currentGwei.toFixed(
          1
        )} gwei exceeds ${maxGwei} gwei limit`,
        metadata: { currentGwei, maxGwei },
      };
    }

    return {
      policyType: "gas-limit",
      policyName: "Gas Limit",
      allowed: true,
      reason: `Gas OK: ${currentGwei.toFixed(1)} gwei`,
      metadata: { currentGwei, maxGwei },
    };
  },
};
