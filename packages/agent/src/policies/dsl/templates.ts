import type { PolicyDocument } from "./types.js";

export interface PolicyTemplate {
  id: string;
  name: string;
  description: string;
  icon?: string;
  category?: string;
  policy: PolicyDocument;
}

const policyDocuments: PolicyDocument[] = [
  {
    version: "2024-01-01",
    name: "Conservative Daily Transfer",
    description:
      "Safe daily transfers with business hours and low gas requirements",
    limits: {
      amount: "50",
      currency: "USDC",
      period: "daily",
    },
    conditions: {
      timeWindow: {
        days: [1, 2, 3, 4, 5], // Monday-Friday
        startHour: 9,
        endHour: 17,
        timezone: "America/New_York",
      },
      signals: {
        gas: {
          maxGwei: 50,
        },
      },
    },
  },
  {
    version: "2024-01-01",
    name: "24/7 Trading Bot",
    description: "Higher limits for automated trading around the clock",
    limits: {
      amount: "1000",
      currency: "USDC",
      period: "daily",
    },
  },
  {
    version: "2024-01-01",
    name: "Whitelist-Only Transfers",
    description:
      "Only allow transfers to pre-approved addresses with rate limiting",
    limits: {
      amount: "500",
      currency: "USDC",
      period: "weekly",
    },
    conditions: {
      recipients: {
        allowed: [
          // User will need to customize these addresses
          "0x0000000000000000000000000000000000000001",
          "0x0000000000000000000000000000000000000002",
          "0x0000000000000000000000000000000000000003",
        ],
      },
      cooldown: {
        seconds: 3600, // 1 hour between transfers
      },
    },
  },
  {
    version: "2024-01-01",
    name: "Emergency Budget",
    description: "Minimal spending for emergency situations",
    limits: {
      amount: "10",
      currency: "USDC",
      period: "daily",
    },
    conditions: {
      cooldown: {
        seconds: 21600, // 6 hours between transfers
      },
    },
  },
];

export const policyTemplates: PolicyTemplate[] = policyDocuments.map((doc, index) => ({
  id: `template-${index + 1}`,
  name: doc.name,
  description: doc.description || "",
  icon: ["💼", "🚀", "🔒", "🚨"][index],
  category: "transfer-bot",
  policy: doc,
}));

export function getAllTemplates(): PolicyTemplate[] {
  return policyTemplates;
}

export function getTemplatesByAdapter(adapterId: string): PolicyTemplate[] {
  // TODO: In future, can add adapter-specific filtering
  return policyTemplates;
}

export function getTemplateByName(name: string): PolicyTemplate | undefined {
  return policyTemplates.find((t) => t.name === name);
}
