import { decodeFunctionData } from "viem";
import type { PolicyRule, PolicyContext, PolicyResult } from "../types.js";

/**
 * ERC20 Transfer ABI for decoding calldata
 */
const ERC20_TRANSFER_ABI = [
  {
    name: "transfer",
    type: "function",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

/**
 * Extract recipient address from transaction
 *
 * For ERC20 transfers, decodes the calldata to get the 'to' parameter
 *
 * @param proposedTx Transaction to analyze
 * @returns Recipient address or null if cannot be determined
 */
function extractRecipient(
  proposedTx: PolicyContext["proposedTx"]
): `0x${string}` | null {
  try {
    // For ERC20 transfers, the recipient is in the calldata
    const { args } = decodeFunctionData({
      abi: ERC20_TRANSFER_ABI,
      data: proposedTx.callData,
    });

    // args[0] is the 'to' address
    if (!args || args.length === 0) {
      return null;
    }
    return args[0] as `0x${string}`;
  } catch (error) {
    // If decoding fails, we can't determine the recipient
    console.warn("Failed to decode recipient from calldata:", error);
    return null;
  }
}

/**
 * Recipient Whitelist/Blacklist Rule
 *
 * Enforces that transactions only go to approved addresses (whitelist)
 * or blocks transactions to specific addresses (blacklist)
 */
export const recipientWhitelistRule: PolicyRule = {
  type: "recipient-whitelist",
  name: "Recipient Whitelist",
  description: "Only allow transfers to whitelisted addresses or block specific addresses",
  defaultConfig: { allowed: [], blocked: [] },

  async evaluate(
    context: PolicyContext,
    config: Record<string, any>
  ): Promise<PolicyResult> {
    const { allowed = [], blocked = [] } = config;
    const { proposedTx } = context;

    // Extract recipient from transaction
    const recipient = extractRecipient(proposedTx);

    if (!recipient) {
      // If we can't determine the recipient, be conservative and block
      return {
        policyType: "recipient-whitelist",
        policyName: "Recipient Whitelist",
        allowed: false,
        reason: "Unable to determine transaction recipient",
      };
    }

    // Normalize addresses to lowercase for comparison
    const recipientLower = recipient.toLowerCase();
    const allowedLower = allowed.map((addr: string) => addr.toLowerCase());
    const blockedLower = blocked.map((addr: string) => addr.toLowerCase());

    // Check blacklist first (takes precedence)
    if (blockedLower.length > 0 && blockedLower.includes(recipientLower)) {
      return {
        policyType: "recipient-whitelist",
        policyName: "Recipient Whitelist",
        allowed: false,
        reason: `Recipient ${recipient} is in the blocked list`,
        metadata: { recipient, blocked },
      };
    }

    // Check whitelist (if configured)
    if (allowedLower.length > 0) {
      if (allowedLower.includes(recipientLower)) {
        return {
          policyType: "recipient-whitelist",
          policyName: "Recipient Whitelist",
          allowed: true,
          reason: `Recipient ${recipient} is whitelisted`,
          metadata: { recipient, allowed },
        };
      } else {
        return {
          policyType: "recipient-whitelist",
          policyName: "Recipient Whitelist",
          allowed: false,
          reason: `Recipient ${recipient} is not in the whitelist`,
          metadata: { recipient, allowed },
        };
      }
    }

    // No restrictions configured - allow all
    return {
      policyType: "recipient-whitelist",
      policyName: "Recipient Whitelist",
      allowed: true,
      reason: "No recipient restrictions configured",
      metadata: { recipient },
    };
  },
};
