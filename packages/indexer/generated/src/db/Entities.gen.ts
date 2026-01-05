/* TypeScript file generated from Entities.res by genType. */

/* eslint-disable */
/* tslint:disable */

export type id = string;

export type whereOperations<entity,fieldType> = {
  readonly eq: (_1:fieldType) => Promise<entity[]>; 
  readonly gt: (_1:fieldType) => Promise<entity[]>; 
  readonly lt: (_1:fieldType) => Promise<entity[]>
};

export type DisabledDelegation_t = {
  readonly blockNumber: bigint; 
  readonly blockTimestamp: bigint; 
  readonly delegate: string; 
  readonly delegationHash: string; 
  readonly delegator: string; 
  readonly id: id; 
  readonly logIndex: bigint; 
  readonly transactionHash: string
};

export type DisabledDelegation_indexedFieldOperations = {};

export type EnabledDelegation_t = {
  readonly blockNumber: bigint; 
  readonly blockTimestamp: bigint; 
  readonly delegate: string; 
  readonly delegationHash: string; 
  readonly delegator: string; 
  readonly id: id; 
  readonly logIndex: bigint; 
  readonly transactionHash: string
};

export type EnabledDelegation_indexedFieldOperations = {};

export type Redemption_t = {
  readonly blockNumber: bigint; 
  readonly blockTimestamp: bigint; 
  readonly delegationHash: string; 
  readonly id: id; 
  readonly logIndex: bigint; 
  readonly redeemer: string; 
  readonly rootDelegator: string; 
  readonly transactionHash: string
};

export type Redemption_indexedFieldOperations = {};

export type Stats_t = {
  readonly id: id; 
  readonly lastUpdated: bigint; 
  readonly totalDisabled: bigint; 
  readonly totalEnabled: bigint; 
  readonly totalRedemptions: bigint
};

export type Stats_indexedFieldOperations = {};
