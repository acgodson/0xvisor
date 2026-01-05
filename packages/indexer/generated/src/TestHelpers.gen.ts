/* TypeScript file generated from TestHelpers.res by genType. */

/* eslint-disable */
/* tslint:disable */

const TestHelpersJS = require('./TestHelpers.res.js');

import type {DelegationManager_DisabledDelegation_event as Types_DelegationManager_DisabledDelegation_event} from './Types.gen';

import type {DelegationManager_EnabledDelegation_event as Types_DelegationManager_EnabledDelegation_event} from './Types.gen';

import type {DelegationManager_RedeemedDelegation_event as Types_DelegationManager_RedeemedDelegation_event} from './Types.gen';

import type {t as Address_t} from 'envio/src/Address.gen';

import type {t as TestHelpers_MockDb_t} from './TestHelpers_MockDb.gen';

/** The arguements that get passed to a "processEvent" helper function */
export type EventFunctions_eventProcessorArgs<event> = {
  readonly event: event; 
  readonly mockDb: TestHelpers_MockDb_t; 
  readonly chainId?: number
};

export type EventFunctions_eventProcessor<event> = (_1:EventFunctions_eventProcessorArgs<event>) => Promise<TestHelpers_MockDb_t>;

export type EventFunctions_MockBlock_t = {
  readonly hash?: string; 
  readonly number?: number; 
  readonly timestamp?: number
};

export type EventFunctions_MockTransaction_t = {};

export type EventFunctions_mockEventData = {
  readonly chainId?: number; 
  readonly srcAddress?: Address_t; 
  readonly logIndex?: number; 
  readonly block?: EventFunctions_MockBlock_t; 
  readonly transaction?: EventFunctions_MockTransaction_t
};

export type DelegationManager_RedeemedDelegation_createMockArgs = {
  readonly rootDelegator?: Address_t; 
  readonly redeemer?: Address_t; 
  readonly mockEventData?: EventFunctions_mockEventData
};

export type DelegationManager_EnabledDelegation_createMockArgs = {
  readonly delegationHash?: string; 
  readonly delegator?: Address_t; 
  readonly delegate?: Address_t; 
  readonly mockEventData?: EventFunctions_mockEventData
};

export type DelegationManager_DisabledDelegation_createMockArgs = {
  readonly delegationHash?: string; 
  readonly delegator?: Address_t; 
  readonly delegate?: Address_t; 
  readonly mockEventData?: EventFunctions_mockEventData
};

export const MockDb_createMockDb: () => TestHelpers_MockDb_t = TestHelpersJS.MockDb.createMockDb as any;

export const Addresses_mockAddresses: Address_t[] = TestHelpersJS.Addresses.mockAddresses as any;

export const Addresses_defaultAddress: Address_t = TestHelpersJS.Addresses.defaultAddress as any;

export const DelegationManager_RedeemedDelegation_processEvent: EventFunctions_eventProcessor<Types_DelegationManager_RedeemedDelegation_event> = TestHelpersJS.DelegationManager.RedeemedDelegation.processEvent as any;

export const DelegationManager_RedeemedDelegation_createMockEvent: (args:DelegationManager_RedeemedDelegation_createMockArgs) => Types_DelegationManager_RedeemedDelegation_event = TestHelpersJS.DelegationManager.RedeemedDelegation.createMockEvent as any;

export const DelegationManager_EnabledDelegation_processEvent: EventFunctions_eventProcessor<Types_DelegationManager_EnabledDelegation_event> = TestHelpersJS.DelegationManager.EnabledDelegation.processEvent as any;

export const DelegationManager_EnabledDelegation_createMockEvent: (args:DelegationManager_EnabledDelegation_createMockArgs) => Types_DelegationManager_EnabledDelegation_event = TestHelpersJS.DelegationManager.EnabledDelegation.createMockEvent as any;

export const DelegationManager_DisabledDelegation_processEvent: EventFunctions_eventProcessor<Types_DelegationManager_DisabledDelegation_event> = TestHelpersJS.DelegationManager.DisabledDelegation.processEvent as any;

export const DelegationManager_DisabledDelegation_createMockEvent: (args:DelegationManager_DisabledDelegation_createMockArgs) => Types_DelegationManager_DisabledDelegation_event = TestHelpersJS.DelegationManager.DisabledDelegation.createMockEvent as any;

export const Addresses: { mockAddresses: Address_t[]; defaultAddress: Address_t } = TestHelpersJS.Addresses as any;

export const DelegationManager: {
  EnabledDelegation: {
    processEvent: EventFunctions_eventProcessor<Types_DelegationManager_EnabledDelegation_event>; 
    createMockEvent: (args:DelegationManager_EnabledDelegation_createMockArgs) => Types_DelegationManager_EnabledDelegation_event
  }; 
  DisabledDelegation: {
    processEvent: EventFunctions_eventProcessor<Types_DelegationManager_DisabledDelegation_event>; 
    createMockEvent: (args:DelegationManager_DisabledDelegation_createMockArgs) => Types_DelegationManager_DisabledDelegation_event
  }; 
  RedeemedDelegation: {
    processEvent: EventFunctions_eventProcessor<Types_DelegationManager_RedeemedDelegation_event>; 
    createMockEvent: (args:DelegationManager_RedeemedDelegation_createMockArgs) => Types_DelegationManager_RedeemedDelegation_event
  }
} = TestHelpersJS.DelegationManager as any;

export const MockDb: { createMockDb: () => TestHelpers_MockDb_t } = TestHelpersJS.MockDb as any;
