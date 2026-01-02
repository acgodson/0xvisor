export const securityPauseRule = {
    type: "security-pause",
    name: "Security Pause",
    description: "Pause execution when Envio detects suspicious on-chain activity or security alerts",
    defaultConfig: {
        pauseOnAnyAlert: true,
        alertSeverities: ["high", "critical"],
        enableAnomalyDetection: true,
    },
    async evaluate(context, config) {
        const { pauseOnAnyAlert = true, alertSeverities = ["high", "critical"], enableAnomalyDetection = true, } = config;
        const envioSignal = context.signals.envio;
        // If Envio is not connected, allow by default (fail-open for availability)
        if (!envioSignal || !envioSignal.envioConnected) {
            return {
                policyType: "security-pause",
                policyName: "Security Pause",
                allowed: true,
                reason: "Envio monitoring unavailable - allowing by default",
            };
        }
        // Check for anomalous activity detected by Envio signal
        if (enableAnomalyDetection && envioSignal.suspiciousActivity) {
            return {
                policyType: "security-pause",
                policyName: "Security Pause",
                allowed: false,
                reason: `Suspicious on-chain activity: ${envioSignal.suspiciousReason}`,
                metadata: {
                    anomalyDetected: true,
                    totalRedemptions: envioSignal.totalRedemptions,
                },
            };
        }
        // Check for manual security alerts (if implemented)
        const activeAlerts = envioSignal.alerts || [];
        if (activeAlerts.length > 0) {
            const relevantAlerts = pauseOnAnyAlert
                ? activeAlerts
                : activeAlerts.filter((a) => alertSeverities.includes(a.severity));
            if (relevantAlerts.length > 0) {
                const alertMessages = relevantAlerts
                    .slice(0, 3)
                    .map((a) => `${a.severity}: ${a.message}`)
                    .join("; ");
                return {
                    policyType: "security-pause",
                    policyName: "Security Pause",
                    allowed: false,
                    reason: `Security alert active: ${alertMessages}`,
                    metadata: { alertCount: relevantAlerts.length, alerts: relevantAlerts },
                };
            }
        }
        // All checks passed
        return {
            policyType: "security-pause",
            policyName: "Security Pause",
            allowed: true,
            reason: `No anomalies detected (${envioSignal.totalRedemptions || 0} total redemptions monitored)`,
        };
    },
};
