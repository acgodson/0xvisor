import type { PolicyRule, PolicyContext, PolicyResult } from "../types.js";

export const securityPauseRule: PolicyRule = {
  type: "security-pause",
  name: "Security Pause",
  description: "Pause execution when security alerts are active",
  defaultConfig: {
    pauseOnAnyAlert: true,
    alertSeverities: ["high", "critical"],
  },

  async evaluate(
    context: PolicyContext,
    config: Record<string, any>
  ): Promise<PolicyResult> {
    const { pauseOnAnyAlert = true, alertSeverities = ["high", "critical"] } =
      config;
    const envioSignal = context.signals.envio;

    if (!envioSignal) {
      return {
        policyType: "security-pause",
        policyName: "Security Pause",
        allowed: true,
        reason: "Security monitoring unavailable",
      };
    }

    const activeAlerts = envioSignal.alerts || [];

    if (activeAlerts.length === 0) {
      return {
        policyType: "security-pause",
        policyName: "Security Pause",
        allowed: true,
        reason: "No active security alerts",
      };
    }

    const relevantAlerts = pauseOnAnyAlert
      ? activeAlerts
      : activeAlerts.filter((a: any) => alertSeverities.includes(a.severity));

    if (relevantAlerts.length > 0) {
      const alertMessages = relevantAlerts
        .slice(0, 3)
        .map((a: any) => `${a.severity}: ${a.message}`)
        .join("; ");

      return {
        policyType: "security-pause",
        policyName: "Security Pause",
        allowed: false,
        reason: `Security alert active: ${alertMessages}`,
        metadata: { alertCount: relevantAlerts.length, alerts: relevantAlerts },
      };
    }

    return {
      policyType: "security-pause",
      policyName: "Security Pause",
      allowed: true,
      reason: "No blocking security alerts",
    };
  },
};
