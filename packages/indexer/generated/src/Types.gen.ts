/* TypeScript file generated from Types.res by genType. */

/* eslint-disable */
/* tslint:disable */

import type {DisabledDelegation_t as Entities_DisabledDelegation_t} from '../src/db/Entities.gen';

import type {EnabledDelegation_t as Entities_EnabledDelegation_t} from '../src/db/Entities.gen';

import type {HandlerContext as $$handlerContext} from './Types.ts';

import type {HandlerWithOptions as $$fnWithEventConfig} from './bindings/OpaqueTypes.ts';

import type {LoaderContext as $$loaderContext} from './Types.ts';

import type {Redemption_t as Entities_Redemption_t} from '../src/db/Entities.gen';

import type {SingleOrMultiple as $$SingleOrMultiple_t} from './bindings/OpaqueTypes';

import type {Stats_t as Entities_Stats_t} from '../src/db/Entities.gen';

import type {entityHandlerContext as Internal_entityHandlerContext} from 'envio/src/Internal.gen';

import type {eventOptions as Internal_eventOptions} from 'envio/src/Internal.gen';

import type {genericContractRegisterArgs as Internal_genericContractRegisterArgs} from 'envio/src/Internal.gen';

import type {genericContractRegister as Internal_genericContractRegister} from 'envio/src/Internal.gen';

import type {genericEvent as Internal_genericEvent} from 'envio/src/Internal.gen';

import type {genericHandlerArgs as Internal_genericHandlerArgs} from 'envio/src/Internal.gen';

import type {genericHandlerWithLoader as Internal_genericHandlerWithLoader} from 'envio/src/Internal.gen';

import type {genericHandler as Internal_genericHandler} from 'envio/src/Internal.gen';

import type {genericLoaderArgs as Internal_genericLoaderArgs} from 'envio/src/Internal.gen';

import type {genericLoader as Internal_genericLoader} from 'envio/src/Internal.gen';

import type {logger as Envio_logger} from 'envio/src/Envio.gen';

import type {t as Address_t} from 'envio/src/Address.gen';

export type id = string;
export type Id = id;

export type contractRegistrations = { readonly log: Envio_logger; readonly addDelegationManager: (_1:Address_t) => void };

export type entityLoaderContext<entity,indexedFieldOperations> = {
  readonly get: (_1:id) => Promise<(undefined | entity)>; 
  readonly getOrThrow: (_1:id, message:(undefined | string)) => Promise<entity>; 
  readonly getWhere: indexedFieldOperations; 
  readonly getOrCreate: (_1:entity) => Promise<entity>; 
  readonly set: (_1:entity) => void; 
  readonly deleteUnsafe: (_1:id) => void
};

export type loaderContext = $$loaderContext;

export type entityHandlerContext<entity> = Internal_entityHandlerContext<entity>;

export type handlerContext = $$handlerContext;

export type disabledDelegation = Entities_DisabledDelegation_t;
export type DisabledDelegation = disabledDelegation;

export type enabledDelegation = Entities_EnabledDelegation_t;
export type EnabledDelegation = enabledDelegation;

export type redemption = Entities_Redemption_t;
export type Redemption = redemption;

export type stats = Entities_Stats_t;
export type Stats = stats;

export type Transaction_t = {};

export type Block_t = {
  readonly number: number; 
  readonly timestamp: number; 
  readonly hash: string
};

export type AggregatedBlock_t = {
  readonly hash: string; 
  readonly number: number; 
  readonly timestamp: number
};

export type AggregatedTransaction_t = {};

export type eventLog<params> = Internal_genericEvent<params,Block_t,Transaction_t>;
export type EventLog<params> = eventLog<params>;

export type SingleOrMultiple_t<a> = $$SingleOrMultiple_t<a>;

export type HandlerTypes_args<eventArgs,context> = { readonly event: eventLog<eventArgs>; readonly context: context };

export type HandlerTypes_contractRegisterArgs<eventArgs> = Internal_genericContractRegisterArgs<eventLog<eventArgs>,contractRegistrations>;

export type HandlerTypes_contractRegister<eventArgs> = Internal_genericContractRegister<HandlerTypes_contractRegisterArgs<eventArgs>>;

export type HandlerTypes_loaderArgs<eventArgs> = Internal_genericLoaderArgs<eventLog<eventArgs>,loaderContext>;

export type HandlerTypes_loader<eventArgs,loaderReturn> = Internal_genericLoader<HandlerTypes_loaderArgs<eventArgs>,loaderReturn>;

export type HandlerTypes_handlerArgs<eventArgs,loaderReturn> = Internal_genericHandlerArgs<eventLog<eventArgs>,handlerContext,loaderReturn>;

export type HandlerTypes_handler<eventArgs,loaderReturn> = Internal_genericHandler<HandlerTypes_handlerArgs<eventArgs,loaderReturn>>;

export type HandlerTypes_loaderHandler<eventArgs,loaderReturn,eventFilters> = Internal_genericHandlerWithLoader<HandlerTypes_loader<eventArgs,loaderReturn>,HandlerTypes_handler<eventArgs,loaderReturn>,eventFilters>;

export type HandlerTypes_eventConfig<eventFilters> = Internal_eventOptions<eventFilters>;

export type fnWithEventConfig<fn,eventConfig> = $$fnWithEventConfig<fn,eventConfig>;

export type handlerWithOptions<eventArgs,loaderReturn,eventFilters> = fnWithEventConfig<HandlerTypes_handler<eventArgs,loaderReturn>,HandlerTypes_eventConfig<eventFilters>>;

export type contractRegisterWithOptions<eventArgs,eventFilters> = fnWithEventConfig<HandlerTypes_contractRegister<eventArgs>,HandlerTypes_eventConfig<eventFilters>>;

export type DelegationManager_chainId = 11155111;

export type DelegationManager_RedeemedDelegation_eventArgs = { readonly rootDelegator: Address_t; readonly redeemer: Address_t };

export type DelegationManager_RedeemedDelegation_block = Block_t;

export type DelegationManager_RedeemedDelegation_transaction = Transaction_t;

export type DelegationManager_RedeemedDelegation_event = {
  /** The parameters or arguments associated with this event. */
  readonly params: DelegationManager_RedeemedDelegation_eventArgs; 
  /** The unique identifier of the blockchain network where this event occurred. */
  readonly chainId: DelegationManager_chainId; 
  /** The address of the contract that emitted this event. */
  readonly srcAddress: Address_t; 
  /** The index of this event's log within the block. */
  readonly logIndex: number; 
  /** The transaction that triggered this event. Configurable in `config.yaml` via the `field_selection` option. */
  readonly transaction: DelegationManager_RedeemedDelegation_transaction; 
  /** The block in which this event was recorded. Configurable in `config.yaml` via the `field_selection` option. */
  readonly block: DelegationManager_RedeemedDelegation_block
};

export type DelegationManager_RedeemedDelegation_loaderArgs = Internal_genericLoaderArgs<DelegationManager_RedeemedDelegation_event,loaderContext>;

export type DelegationManager_RedeemedDelegation_loader<loaderReturn> = Internal_genericLoader<DelegationManager_RedeemedDelegation_loaderArgs,loaderReturn>;

export type DelegationManager_RedeemedDelegation_handlerArgs<loaderReturn> = Internal_genericHandlerArgs<DelegationManager_RedeemedDelegation_event,handlerContext,loaderReturn>;

export type DelegationManager_RedeemedDelegation_handler<loaderReturn> = Internal_genericHandler<DelegationManager_RedeemedDelegation_handlerArgs<loaderReturn>>;

export type DelegationManager_RedeemedDelegation_contractRegister = Internal_genericContractRegister<Internal_genericContractRegisterArgs<DelegationManager_RedeemedDelegation_event,contractRegistrations>>;

export type DelegationManager_RedeemedDelegation_eventFilter = { readonly rootDelegator?: SingleOrMultiple_t<Address_t>; readonly redeemer?: SingleOrMultiple_t<Address_t> };

export type DelegationManager_RedeemedDelegation_eventFiltersArgs = { 
/** The unique identifier of the blockchain network where this event occurred. */
readonly chainId: DelegationManager_chainId; 
/** Addresses of the contracts indexing the event. */
readonly addresses: Address_t[] };

export type DelegationManager_RedeemedDelegation_eventFiltersDefinition = 
    DelegationManager_RedeemedDelegation_eventFilter
  | DelegationManager_RedeemedDelegation_eventFilter[];

export type DelegationManager_RedeemedDelegation_eventFilters = 
    DelegationManager_RedeemedDelegation_eventFilter
  | DelegationManager_RedeemedDelegation_eventFilter[]
  | ((_1:DelegationManager_RedeemedDelegation_eventFiltersArgs) => DelegationManager_RedeemedDelegation_eventFiltersDefinition);

export type DelegationManager_EnabledDelegation_eventArgs = {
  readonly delegationHash: string; 
  readonly delegator: Address_t; 
  readonly delegate: Address_t
};

export type DelegationManager_EnabledDelegation_block = Block_t;

export type DelegationManager_EnabledDelegation_transaction = Transaction_t;

export type DelegationManager_EnabledDelegation_event = {
  /** The parameters or arguments associated with this event. */
  readonly params: DelegationManager_EnabledDelegation_eventArgs; 
  /** The unique identifier of the blockchain network where this event occurred. */
  readonly chainId: DelegationManager_chainId; 
  /** The address of the contract that emitted this event. */
  readonly srcAddress: Address_t; 
  /** The index of this event's log within the block. */
  readonly logIndex: number; 
  /** The transaction that triggered this event. Configurable in `config.yaml` via the `field_selection` option. */
  readonly transaction: DelegationManager_EnabledDelegation_transaction; 
  /** The block in which this event was recorded. Configurable in `config.yaml` via the `field_selection` option. */
  readonly block: DelegationManager_EnabledDelegation_block
};

export type DelegationManager_EnabledDelegation_loaderArgs = Internal_genericLoaderArgs<DelegationManager_EnabledDelegation_event,loaderContext>;

export type DelegationManager_EnabledDelegation_loader<loaderReturn> = Internal_genericLoader<DelegationManager_EnabledDelegation_loaderArgs,loaderReturn>;

export type DelegationManager_EnabledDelegation_handlerArgs<loaderReturn> = Internal_genericHandlerArgs<DelegationManager_EnabledDelegation_event,handlerContext,loaderReturn>;

export type DelegationManager_EnabledDelegation_handler<loaderReturn> = Internal_genericHandler<DelegationManager_EnabledDelegation_handlerArgs<loaderReturn>>;

export type DelegationManager_EnabledDelegation_contractRegister = Internal_genericContractRegister<Internal_genericContractRegisterArgs<DelegationManager_EnabledDelegation_event,contractRegistrations>>;

export type DelegationManager_EnabledDelegation_eventFilter = {
  readonly delegationHash?: SingleOrMultiple_t<string>; 
  readonly delegator?: SingleOrMultiple_t<Address_t>; 
  readonly delegate?: SingleOrMultiple_t<Address_t>
};

export type DelegationManager_EnabledDelegation_eventFiltersArgs = { 
/** The unique identifier of the blockchain network where this event occurred. */
readonly chainId: DelegationManager_chainId; 
/** Addresses of the contracts indexing the event. */
readonly addresses: Address_t[] };

export type DelegationManager_EnabledDelegation_eventFiltersDefinition = 
    DelegationManager_EnabledDelegation_eventFilter
  | DelegationManager_EnabledDelegation_eventFilter[];

export type DelegationManager_EnabledDelegation_eventFilters = 
    DelegationManager_EnabledDelegation_eventFilter
  | DelegationManager_EnabledDelegation_eventFilter[]
  | ((_1:DelegationManager_EnabledDelegation_eventFiltersArgs) => DelegationManager_EnabledDelegation_eventFiltersDefinition);

export type DelegationManager_DisabledDelegation_eventArgs = {
  readonly delegationHash: string; 
  readonly delegator: Address_t; 
  readonly delegate: Address_t
};

export type DelegationManager_DisabledDelegation_block = Block_t;

export type DelegationManager_DisabledDelegation_transaction = Transaction_t;

export type DelegationManager_DisabledDelegation_event = {
  /** The parameters or arguments associated with this event. */
  readonly params: DelegationManager_DisabledDelegation_eventArgs; 
  /** The unique identifier of the blockchain network where this event occurred. */
  readonly chainId: DelegationManager_chainId; 
  /** The address of the contract that emitted this event. */
  readonly srcAddress: Address_t; 
  /** The index of this event's log within the block. */
  readonly logIndex: number; 
  /** The transaction that triggered this event. Configurable in `config.yaml` via the `field_selection` option. */
  readonly transaction: DelegationManager_DisabledDelegation_transaction; 
  /** The block in which this event was recorded. Configurable in `config.yaml` via the `field_selection` option. */
  readonly block: DelegationManager_DisabledDelegation_block
};

export type DelegationManager_DisabledDelegation_loaderArgs = Internal_genericLoaderArgs<DelegationManager_DisabledDelegation_event,loaderContext>;

export type DelegationManager_DisabledDelegation_loader<loaderReturn> = Internal_genericLoader<DelegationManager_DisabledDelegation_loaderArgs,loaderReturn>;

export type DelegationManager_DisabledDelegation_handlerArgs<loaderReturn> = Internal_genericHandlerArgs<DelegationManager_DisabledDelegation_event,handlerContext,loaderReturn>;

export type DelegationManager_DisabledDelegation_handler<loaderReturn> = Internal_genericHandler<DelegationManager_DisabledDelegation_handlerArgs<loaderReturn>>;

export type DelegationManager_DisabledDelegation_contractRegister = Internal_genericContractRegister<Internal_genericContractRegisterArgs<DelegationManager_DisabledDelegation_event,contractRegistrations>>;

export type DelegationManager_DisabledDelegation_eventFilter = {
  readonly delegationHash?: SingleOrMultiple_t<string>; 
  readonly delegator?: SingleOrMultiple_t<Address_t>; 
  readonly delegate?: SingleOrMultiple_t<Address_t>
};

export type DelegationManager_DisabledDelegation_eventFiltersArgs = { 
/** The unique identifier of the blockchain network where this event occurred. */
readonly chainId: DelegationManager_chainId; 
/** Addresses of the contracts indexing the event. */
readonly addresses: Address_t[] };

export type DelegationManager_DisabledDelegation_eventFiltersDefinition = 
    DelegationManager_DisabledDelegation_eventFilter
  | DelegationManager_DisabledDelegation_eventFilter[];

export type DelegationManager_DisabledDelegation_eventFilters = 
    DelegationManager_DisabledDelegation_eventFilter
  | DelegationManager_DisabledDelegation_eventFilter[]
  | ((_1:DelegationManager_DisabledDelegation_eventFiltersArgs) => DelegationManager_DisabledDelegation_eventFiltersDefinition);

export type chainId = number;

export type chain = 11155111;
