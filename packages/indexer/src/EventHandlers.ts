import { DelegationManager } from "../generated";

DelegationManager.RedeemedDelegation.handler(async ({ event, context }) => {
  const id = `${event.block.number}-${event.logIndex}`;
  // Transaction hash is not available in event.transaction by default
  // Using block number and logIndex as fallback for ID
  const transactionHash = `${event.block.number}-${event.logIndex}`;

  await context.Redemption.set({
    id,
    rootDelegator: event.params.rootDelegator,
    redeemer: event.params.redeemer,
    delegationHash: event.params.delegationHash,
    blockNumber: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    transactionHash,
  });

  const stats = await context.Stats.get("global");
  await context.Stats.set({
    id: "global",
    totalRedemptions: (stats?.totalRedemptions || 0n) + 1n,
    totalEnabled: stats?.totalEnabled || 0n,
    totalDisabled: stats?.totalDisabled || 0n,
    lastUpdated: BigInt(event.block.timestamp),
  });
});

DelegationManager.EnabledDelegation.handler(async ({ event, context }) => {
  const id = `${event.block.number}-${event.logIndex}`;
  const transactionHash = `${event.block.number}-${event.logIndex}`;

  await context.EnabledDelegation.set({
    id,
    delegationHash: event.params.delegationHash,
    blockNumber: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    transactionHash,
  });

  const stats = await context.Stats.get("global");
  await context.Stats.set({
    id: "global",
    totalRedemptions: stats?.totalRedemptions || 0n,
    totalEnabled: (stats?.totalEnabled || 0n) + 1n,
    totalDisabled: stats?.totalDisabled || 0n,
    lastUpdated: BigInt(event.block.timestamp),
  });
});

DelegationManager.DisabledDelegation.handler(async ({ event, context }) => {
  const id = `${event.block.number}-${event.logIndex}`;
  const transactionHash = `${event.block.number}-${event.logIndex}`;

  await context.DisabledDelegation.set({
    id,
    delegationHash: event.params.delegationHash,
    blockNumber: BigInt(event.block.number),
    timestamp: BigInt(event.block.timestamp),
    transactionHash,
  });

  const stats = await context.Stats.get("global");
  await context.Stats.set({
    id: "global",
    totalRedemptions: stats?.totalRedemptions || 0n,
    totalEnabled: stats?.totalEnabled || 0n,
    totalDisabled: (stats?.totalDisabled || 0n) + 1n,
    lastUpdated: BigInt(event.block.timestamp),
  });
});
