import { formatUnits } from "viem";
import type { PolicyRule, PolicyContext, PolicyResult } from "../types.js";

export const maxAmountRule: PolicyRule = {
  type: "max-amount",
  name: "Max Transaction Amount",
  description: "Limit the maximum amount per transaction",
  defaultConfig: { maxAmount: 100, decimals: 6 },

  async evaluate(
    context: PolicyContext,
    config: Record<string, any>
  ): Promise<PolicyResult> {
    const { maxAmount = 100, decimals = 6 } = config;
    const { proposedTx } = context;

    if (!proposedTx.tokenAmount) {
      return {
        policyType: "max-amount",
        policyName: "Max Transaction Amount",
        allowed: true,
        reason: "No token amount in transaction",
      };
    }

    const amount = Number(formatUnits(proposedTx.tokenAmount, decimals));

    if (amount > maxAmount) {
      return {
        policyType: "max-amount",
        policyName: "Max Transaction Amount",
        allowed: false,
        reason: `Amount too high: ${amount} exceeds ${maxAmount} limit`,
        metadata: { amount, maxAmount },
      };
    }

    return {
      policyType: "max-amount",
      policyName: "Max Transaction Amount",
      allowed: true,
      reason: `Amount OK: ${amount}`,
      metadata: { amount, maxAmount },
    };
  },
};
