import { createPublicClient, http, formatGwei } from "viem";
import { sepolia } from "viem/chains";
import type { Signal, SignalData } from "./types.js";

const client = createPublicClient({
  chain: sepolia,
  transport: http(process.env.RPC_URL),
});

export const gasSignal: Signal = {
  name: "gas",
  description: "Current gas prices from the network",

  async fetch(): Promise<SignalData> {
    try {
      const gasPrice = await client.getGasPrice();
      const block = await client.getBlock();
      const baseFee = block.baseFeePerGas || 0n;

      return {
        timestamp: new Date(),
        standard: Number(formatGwei(gasPrice)),
        baseFee: Number(formatGwei(baseFee)),
        raw: gasPrice.toString(),
      };
    } catch (error) {
      console.error("Failed to fetch gas signal:", error);
      return {
        timestamp: new Date(),
        standard: null,
        baseFee: null,
        error: String(error),
      };
    }
  },
};
