import { z } from "zod";
// ============================================================================
// Zod Schemas for Validation
// ============================================================================
/**
 * Schema for time window condition
 */
const TimeWindowSchema = z.object({
    days: z
        .array(z.number().min(0).max(6))
        .min(1, "At least one day must be selected")
        .refine((days) => new Set(days).size === days.length, "Duplicate days are not allowed"),
    startHour: z.number().min(0).max(23),
    endHour: z.number().min(0).max(23),
    timezone: z.string().min(1, "Timezone is required"),
}).refine((data) => data.endHour > data.startHour, "End hour must be after start hour");
/**
 * Schema for gas signal condition
 */
const GasSignalSchema = z.object({
    maxGwei: z.number().positive("Gas limit must be positive"),
});
/**
 * Schema for security signal condition
 */
const SecuritySignalSchema = z.object({
    maxAlertCount: z.number().min(0, "Alert count cannot be negative"),
    blockedSeverities: z.array(z.string()).optional(),
});
/**
 * Schema for signals condition
 */
const SignalsSchema = z.object({
    gas: GasSignalSchema.optional(),
    security: SecuritySignalSchema.optional(),
});
/**
 * Schema for recipient restrictions
 */
const RecipientsSchema = z.object({
    allowed: z.array(z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address")).optional(),
    blocked: z.array(z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address")).optional(),
}).refine((data) => !(data.allowed && data.blocked), "Cannot have both allowed and blocked lists");
/**
 * Schema for cooldown condition
 */
const CooldownSchema = z.object({
    seconds: z.number().positive("Cooldown must be positive"),
});
/**
 * Schema for conditions
 */
const ConditionsSchema = z.object({
    timeWindow: TimeWindowSchema.optional(),
    signals: SignalsSchema.optional(),
    recipients: RecipientsSchema.optional(),
    cooldown: CooldownSchema.optional(),
});
/**
 * Schema for limits
 */
const LimitsSchema = z.object({
    amount: z
        .string()
        .min(1, "Amount is required")
        .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Amount must be a positive number"),
    currency: z.string().min(1, "Currency is required"),
    period: z.enum(["daily", "weekly", "monthly"]),
});
/**
 * Main PolicyDocument schema
 */
export const PolicyDocumentSchema = z.object({
    version: z.literal("2024-01-01"),
    name: z.string().min(1, "Policy name is required").max(100, "Policy name too long"),
    description: z.string().max(500, "Description too long").optional(),
    limits: LimitsSchema,
    conditions: ConditionsSchema.optional(),
});
/**
 * Type guard to check if an object is a valid PolicyDocument
 */
export function isPolicyDocument(obj) {
    try {
        PolicyDocumentSchema.parse(obj);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Validate a PolicyDocument and return detailed errors
 */
export function validatePolicyDocument(obj) {
    try {
        PolicyDocumentSchema.parse(obj);
        return { valid: true };
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return { valid: false, errors: error };
        }
        throw error;
    }
}
