import type { ProposedTransaction } from "../adapters/types.js";
export interface PolicyContext {
    userAddress: `0x${string}`;
    adapterId: string;
    proposedTx: ProposedTransaction;
    signals: Record<string, any>;
    timestamp: Date;
    lastExecutionTime?: Date;
}
export interface PolicyResult {
    policyType: string;
    policyName: string;
    allowed: boolean;
    reason: string;
    metadata?: Record<string, any>;
}
export interface PolicyRule {
    type: string;
    name: string;
    description: string;
    defaultConfig: Record<string, any>;
    evaluate: (context: PolicyContext, config: Record<string, any>) => Promise<PolicyResult>;
}
export interface EvaluationResult {
    allowed: boolean;
    decisions: PolicyResult[];
    blockingPolicy?: string;
    blockingReason?: string;
}
