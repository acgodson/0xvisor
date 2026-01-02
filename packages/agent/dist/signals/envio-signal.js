const ENVIO_GRAPHQL_URL = process.env.ENVIO_GRAPHQL_URL;
// Anomaly detection thresholds
const ANOMALY_THRESHOLD_REDEMPTIONS_PER_HOUR = 10;
const ANOMALY_THRESHOLD_REDEMPTIONS_PER_MINUTE = 3;
export const envioSignal = {
    name: "envio",
    description: "On-chain events from Envio with anomaly detection",
    async fetch() {
        let recentRedemptions = [];
        let envioConnected = false;
        let suspiciousActivity = false;
        let suspiciousReason = null;
        if (ENVIO_GRAPHQL_URL) {
            try {
                const response = await fetch(ENVIO_GRAPHQL_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        query: `
              query RecentRedemptions {
                Redemption(limit: 100, order_by: {timestamp: desc}) {
                  id
                  rootDelegator
                  redeemer
                  delegationHash
                  blockNumber
                  timestamp
                  transactionHash
                }
              }
            `,
                    }),
                });
                const data = await response.json();
                recentRedemptions = data.data?.Redemption || [];
                envioConnected = true;
                // ANOMALY DETECTION: Check for high-frequency redemptions
                const now = Math.floor(Date.now() / 1000);
                const oneHourAgo = now - 3600;
                const oneMinuteAgo = now - 60;
                const redemptionsLastHour = recentRedemptions.filter((r) => r.timestamp > oneHourAgo).length;
                const redemptionsLastMinute = recentRedemptions.filter((r) => r.timestamp > oneMinuteAgo).length;
                // Check thresholds
                if (redemptionsLastMinute > ANOMALY_THRESHOLD_REDEMPTIONS_PER_MINUTE) {
                    suspiciousActivity = true;
                    suspiciousReason = `${redemptionsLastMinute} redemptions in last minute (threshold: ${ANOMALY_THRESHOLD_REDEMPTIONS_PER_MINUTE})`;
                }
                else if (redemptionsLastHour > ANOMALY_THRESHOLD_REDEMPTIONS_PER_HOUR) {
                    suspiciousActivity = true;
                    suspiciousReason = `${redemptionsLastHour} redemptions in last hour (threshold: ${ANOMALY_THRESHOLD_REDEMPTIONS_PER_HOUR})`;
                }
                console.log(`[Envio Signal] Recent activity: ${redemptionsLastMinute}/min, ${redemptionsLastHour}/hour`);
                if (suspiciousActivity) {
                    console.warn(`[Envio Signal] ⚠️  ANOMALY DETECTED: ${suspiciousReason}`);
                }
            }
            catch (error) {
                console.error("Failed to fetch from Envio:", error);
            }
        }
        else {
            console.warn("[Envio Signal] ENVIO_GRAPHQL_URL not configured");
        }
        return {
            timestamp: new Date(),
            recentRedemptions,
            envioConnected,
            suspiciousActivity,
            suspiciousReason,
            totalRedemptions: recentRedemptions.length,
        };
    },
};
