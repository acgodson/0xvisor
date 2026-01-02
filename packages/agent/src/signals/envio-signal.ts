import type { Signal, SignalData } from "./types.js";

const ENVIO_GRAPHQL_URL = process.env.ENVIO_GRAPHQL_URL;

export const envioSignal: Signal = {
  name: "envio",
  description: "On-chain events and security alerts from Envio",

  async fetch(): Promise<SignalData> {
    let recentRedemptions: any[] = [];
    let alerts: any[] = [];
    let stats: any = null;
    let envioConnected = false;

    if (ENVIO_GRAPHQL_URL) {
      try {
        const response = await fetch(ENVIO_GRAPHQL_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `
              query EnvioSignalData {
                Redemption(limit: 50, order_by: {timestamp: desc}) {
                  id
                  rootDelegator
                  redeemer
                  delegationHash
                  blockNumber
                  timestamp
                  transactionHash
                }
                SecurityAlert(
                  where: {isActive: {_eq: true}}
                  order_by: {createdAt: desc}
                ) {
                  id
                  alertType
                  severity
                  message
                  userAddress
                  triggerCount
                  createdAt
                  metadata
                }
                Stats(where: {id: {_eq: "global"}}) {
                  totalRedemptions
                  totalEnabled
                  totalDisabled
                  lastUpdated
                }
              }
            `,
          }),
        });

        const data = await response.json();
        recentRedemptions = data.data?.Redemption || [];
        alerts = data.data?.SecurityAlert || [];
        stats = data.data?.Stats?.[0] || null;
        envioConnected = true;
      } catch (error) {
        console.error("Failed to fetch from Envio:", error);
      }
    }

    return {
      timestamp: new Date(),
      recentRedemptions,
      alerts,
      stats,
      envioConnected,
      alertCount: alerts.length,
    };
  },
};
