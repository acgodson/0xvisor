const ENVIO_GRAPHQL_URL = process.env.ENVIO_GRAPHQL_URL;
export const envioSignal = {
    name: "envio",
    description: "On-chain events from Envio",
    async fetch() {
        let recentRedemptions = [];
        let envioConnected = false;
        if (ENVIO_GRAPHQL_URL) {
            try {
                const response = await fetch(ENVIO_GRAPHQL_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        query: `
              query RecentRedemptions {
                Redemption(limit: 50, order_by: {timestamp: desc}) {
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
            }
            catch (error) {
                console.error("Failed to fetch from Envio:", error);
            }
        }
        return {
            timestamp: new Date(),
            recentRedemptions,
            envioConnected,
        };
    },
};
