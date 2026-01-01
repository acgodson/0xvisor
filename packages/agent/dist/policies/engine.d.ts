import type { ProposedTransaction } from "../adapters/types.js";
import type { PolicyRule, EvaluationResult } from "./types.js";
export declare function getAllPolicyRules(): PolicyRule[];
export declare function getPolicyRule(type: string): PolicyRule | undefined;
declare class PolicyEngine {
    evaluate(userAddress: `0x${string}`, adapterId: string, proposedTx: ProposedTransaction, options: {
        db: any;
        lastExecutionTime?: Date;
    }): Promise<EvaluationResult>;
    private getUserPolicies;
}
export declare const policyEngine: PolicyEngine;
export {};
