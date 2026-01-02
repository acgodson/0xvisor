import { DelegationManager } from "../generated";

declare const fetch: any;

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const INDEXER_START_TIME = Math.floor(Date.now() / 1000);

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
