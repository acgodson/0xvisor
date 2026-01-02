import { DelegationManager } from "../generated";

declare const fetch: any;

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const INDEXER_START_TIME = Math.floor(Date.now() / 1000);

// Anomaly detection thresholds
const ANOMALY_WINDOW_SECONDS = 3600; // 1 hour
const MAX_REDEMPTIONS_PER_HOUR = 10;
const MAX_REDEMPTIONS_PER_USER_HOUR = 5;

async function sendTelegramAlert(message: string) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;

  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "Markdown",
      }),
    });
  } catch (error) {
    console.error("Failed to send Telegram alert:", error);
  }
}

async function checkRedemptionAnomalies(event: any, context: any) {
  const currentTimestamp = BigInt(event.block.timestamp);
  const windowStart = currentTimestamp - BigInt(ANOMALY_WINDOW_SECONDS);

  // Count recent redemptions globally
  const recentRedemptions = await context.Redemption.getAll();
  const recentCount = recentRedemptions.filter((r: any) =>
    r.timestamp >= windowStart
  ).length;

  // Count recent redemptions for this user
  const userRecentCount = recentRedemptions.filter((r: any) =>
    r.timestamp >= windowStart && r.rootDelegator === event.params.rootDelegator
  ).length;

  // Check global anomaly
  if (recentCount >= MAX_REDEMPTIONS_PER_HOUR) {
    const alertId = `high-frequency-${currentTimestamp}`;
    const existingAlert = await context.SecurityAlert.get(alertId);

    if (!existingAlert) {
      await context.SecurityAlert.create({
        id: alertId,
        alertType: "high-frequency-redemptions",
        severity: "high",
        message: `Unusual redemption activity: ${recentCount} redemptions in the last hour`,
        userAddress: null,
        triggerCount: BigInt(recentCount),
        isActive: true,
        createdAt: currentTimestamp,
        resolvedAt: null,
        metadata: JSON.stringify({ windowSeconds: ANOMALY_WINDOW_SECONDS, threshold: MAX_REDEMPTIONS_PER_HOUR }),
      });

      await sendTelegramAlert(
        `⚠️ *Security Alert*\n` +
        `Type: High-frequency redemptions\n` +
        `Count: ${recentCount} in last hour\n` +
        `Threshold: ${MAX_REDEMPTIONS_PER_HOUR}\n` +
        `*Automation paused for safety*`
      );
    }
  }

  // Check user-specific anomaly
  if (userRecentCount >= MAX_REDEMPTIONS_PER_USER_HOUR) {
    const userAlertId = `user-high-frequency-${event.params.rootDelegator}-${currentTimestamp}`;
    const existingUserAlert = await context.SecurityAlert.get(userAlertId);

    if (!existingUserAlert) {
      await context.SecurityAlert.create({
        id: userAlertId,
        alertType: "user-high-frequency",
        severity: "critical",
        message: `User ${event.params.rootDelegator.slice(0, 10)}... has ${userRecentCount} redemptions in the last hour`,
        userAddress: event.params.rootDelegator,
        triggerCount: BigInt(userRecentCount),
        isActive: true,
        createdAt: currentTimestamp,
        resolvedAt: null,
        metadata: JSON.stringify({ windowSeconds: ANOMALY_WINDOW_SECONDS, threshold: MAX_REDEMPTIONS_PER_USER_HOUR }),
      });

      await sendTelegramAlert(
        `🚨 *Critical Security Alert*\n` +
        `User: \`${event.params.rootDelegator.slice(0, 10)}...\`\n` +
        `Redemptions: ${userRecentCount} in last hour\n` +
        `This user's automation is paused`
      );
    }
  }
}

DelegationManager.RedeemedDelegation.handler(async ({ event, context }: any) => {
  const id = `${event.transaction.hash}-${event.logIndex}`;

  await context.Redemption.create({
    id,
    rootDelegator: event.params.rootDelegator,
    redeemer: event.params.redeemer,
    delegationHash: event.params.delegationHash,
    blockNumber: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    transactionHash: event.transaction.hash,
  });

  const stats = await context.Stats.get("global");
  await context.Stats.set({
    id: "global",
    totalRedemptions: (stats?.totalRedemptions || 0n) + 1n,
    totalEnabled: stats?.totalEnabled || 0n,
    totalDisabled: stats?.totalDisabled || 0n,
    lastUpdated: BigInt(event.block.timestamp),
  });

  // Check for anomalies
  await checkRedemptionAnomalies(event, context);

  if (event.block.timestamp > INDEXER_START_TIME) {
    const delegator = event.params.rootDelegator.slice(0, 10);
    const redeemer = event.params.redeemer.slice(0, 10);
    const txUrl = `https://sepolia.etherscan.io/tx/${event.transaction.hash}`;

    await sendTelegramAlert(
      `🔄 *Permission Redeemed*\n` +
      `Delegator: \`${delegator}...\`\n` +
      `Redeemer: \`${redeemer}...\`\n` +
      `[View Transaction](${txUrl})`
    );
  }
});

DelegationManager.EnabledDelegation.handler(async ({ event, context }: any) => {
  const id = `${event.transaction.hash}-${event.logIndex}`;

  await context.EnabledDelegation.create({
    id,
    delegationHash: event.params.delegationHash,
    blockNumber: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    transactionHash: event.transaction.hash,
  });

  const stats = await context.Stats.get("global");
  await context.Stats.set({
    id: "global",
    totalRedemptions: stats?.totalRedemptions || 0n,
    totalEnabled: (stats?.totalEnabled || 0n) + 1n,
    totalDisabled: stats?.totalDisabled || 0n,
    lastUpdated: BigInt(event.block.timestamp),
  });

  if (event.block.timestamp > INDEXER_START_TIME) {
    const hash = event.params.delegationHash.slice(0, 10);
    const txUrl = `https://sepolia.etherscan.io/tx/${event.transaction.hash}`;

    await sendTelegramAlert(
      `✅ *Permission Granted*\n` +
      `Hash: \`${hash}...\`\n` +
      `[View Transaction](${txUrl})`
    );
  }
});

DelegationManager.DisabledDelegation.handler(async ({ event, context }: any) => {
  const id = `${event.transaction.hash}-${event.logIndex}`;

  await context.DisabledDelegation.create({
    id,
    delegationHash: event.params.delegationHash,
    blockNumber: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    transactionHash: event.transaction.hash,
  });

  const stats = await context.Stats.get("global");
  await context.Stats.set({
    id: "global",
    totalRedemptions: stats?.totalRedemptions || 0n,
    totalEnabled: stats?.totalEnabled || 0n,
    totalDisabled: (stats?.totalDisabled || 0n) + 1n,
    lastUpdated: BigInt(event.block.timestamp),
  });

  if (event.block.timestamp > INDEXER_START_TIME) {
    const hash = event.params.delegationHash.slice(0, 10);
    const txUrl = `https://sepolia.etherscan.io/tx/${event.transaction.hash}`;

    await sendTelegramAlert(
      `🔒 *Permission Revoked*\n` +
      `Hash: \`${hash}...\`\n` +
      `[View Transaction](${txUrl})`
    );
  }
});
