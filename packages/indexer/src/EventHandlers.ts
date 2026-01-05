import { DelegationManager } from "../generated";
import { keccak256, encodePacked } from "viem";

DelegationManager.RedeemedDelegation.handler(async ({ event, context }) => {
  // Note: RedeemedDelegation event doesn't include the delegation struct,
  // so we create a unique identifier from rootDelegator and redeemer.
  // This is not the actual delegation hash, but serves as a unique ID for this redemption.
  const transactionHash = (event.transaction as any).hash || event.block.hash;
  const id = `${transactionHash}-${event.logIndex}`;
  
  // Since the event doesn't include the delegation struct, we use a hash of
  // rootDelegator + redeemer as a fallback identifier
  const delegationHash = keccak256(
    encodePacked(
      ["address", "address"],
      [
        event.params.rootDelegator as `0x${string}`,
        event.params.redeemer as `0x${string}`,
      ]
    )
  );

  await context.Redemption.set({
    id,
    rootDelegator: event.params.rootDelegator.toLowerCase(),
    redeemer: event.params.redeemer.toLowerCase(),
    delegationHash: delegationHash.toLowerCase(),
    blockNumber: BigInt(event.block.number),
    blockTimestamp: BigInt(event.block.timestamp),
    transactionHash: transactionHash.toLowerCase(),
    logIndex: BigInt(event.logIndex),
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
  const transactionHash = (event.transaction as any).hash || event.block.hash;
  const id = `${transactionHash}-${event.logIndex}`;

  await context.EnabledDelegation.set({
    id,
    delegationHash: event.params.delegationHash.toLowerCase(),
    delegator: event.params.delegator.toLowerCase(),
    delegate: event.params.delegate.toLowerCase(),
    blockNumber: BigInt(event.block.number),
    blockTimestamp: BigInt(event.block.timestamp),
    transactionHash: transactionHash.toLowerCase(),
    logIndex: BigInt(event.logIndex),
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
  const transactionHash = (event.transaction as any).hash || event.block.hash;
  const id = `${transactionHash}-${event.logIndex}`;

  await context.DisabledDelegation.set({
    id,
    delegationHash: event.params.delegationHash.toLowerCase(),
    delegator: event.params.delegator.toLowerCase(),
    delegate: event.params.delegate.toLowerCase(),
    blockNumber: BigInt(event.block.number),
    blockTimestamp: BigInt(event.block.timestamp),
    transactionHash: transactionHash.toLowerCase(),
    logIndex: BigInt(event.logIndex),
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

