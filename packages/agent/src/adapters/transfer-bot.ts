import { z } from "zod";
import { encodeFunctionData, parseUnits } from "viem";
import type {
  Adapter,
  AdapterContext,
  ProposedTransaction,
  TriggerConfig,
} from "./types.js";


const ERC20_ABI = [
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

// Sepolia USDC
const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

const configSchema = z.object({
  tokenAddress: z.string().default(USDC_ADDRESS),
  recipient: z.string().optional(), // Optional: can be set in config for scheduled transfers or passed at runtime
  amountPerTransfer: z.string().default("0.1"), // Amount to transfer each time
  decimals: z.number().default(6), // USDC has 6 decimals
  schedule: z.string().default("0 9 * * *"), // Daily at 9am
});

export type TransferBotConfig = z.infer<typeof configSchema>;

export const transferBotAdapter: Adapter = {
  id: "transfer-bot",
  name: "TransferBot",
  description:
    "Automatically transfer tokens to a recipient on a schedule. Simple and safe.",
  icon: "💸",
  version: "1.0.0",
  author: "0xVisor",
  requiredPermissions: ["erc20-token-periodic"],

  triggers: [
    { type: "cron", schedule: "0 9 * * *" },
    { type: "manual" },
  ] as TriggerConfig[],

  configSchema,

  validateConfig(config: unknown): boolean {
    try {
      configSchema.parse(config);
      return true;
    } catch {
      return false;
    }
  },

  async proposeTransaction(
    context: AdapterContext
  ): Promise<ProposedTransaction | null> {
    const config = configSchema.parse(context.config);

    const recipient = context.runtimeParams?.recipient || config.recipient;

    if (!recipient) {
      throw new Error("Recipient address is required (either in config or as runtime parameter)");
    }

    const amount = parseUnits(config.amountPerTransfer, config.decimals);


    const callData = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [recipient as `0x${string}`, amount],
    });

    return {
      target: config.tokenAddress as `0x${string}`,
      value: 0n,
      callData,
      description: `Transfer ${config.amountPerTransfer} tokens to ${recipient.slice(0, 6)}...${recipient.slice(-4)}`,
      tokenAddress: config.tokenAddress,
      tokenAmount: amount,
      recipient, // Include recipient in proposed transaction for policy validation
    };
  },
};
