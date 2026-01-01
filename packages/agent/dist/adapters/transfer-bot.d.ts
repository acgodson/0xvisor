import { z } from "zod";
import type { Adapter } from "./types.js";
declare const configSchema: z.ZodObject<{
    tokenAddress: z.ZodDefault<z.ZodString>;
    recipient: z.ZodOptional<z.ZodString>;
    amountPerTransfer: z.ZodDefault<z.ZodString>;
    decimals: z.ZodDefault<z.ZodNumber>;
    schedule: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    tokenAddress: string;
    decimals: number;
    amountPerTransfer: string;
    schedule: string;
    recipient?: string | undefined;
}, {
    tokenAddress?: string | undefined;
    recipient?: string | undefined;
    decimals?: number | undefined;
    amountPerTransfer?: string | undefined;
    schedule?: string | undefined;
}>;
export type TransferBotConfig = z.infer<typeof configSchema>;
export declare const transferBotAdapter: Adapter;
export {};
