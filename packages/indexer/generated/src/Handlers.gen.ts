/* TypeScript file generated from Handlers.res by genType. */

/* eslint-disable */
/* tslint:disable */

const HandlersJS = require('./Handlers.res.js');

import type {DelegationManager_DisabledDelegation_eventFilters as Types_DelegationManager_DisabledDelegation_eventFilters} from './Types.gen';

import type {DelegationManager_DisabledDelegation_event as Types_DelegationManager_DisabledDelegation_event} from './Types.gen';

import type {DelegationManager_EnabledDelegation_eventFilters as Types_DelegationManager_EnabledDelegation_eventFilters} from './Types.gen';

import type {DelegationManager_EnabledDelegation_event as Types_DelegationManager_EnabledDelegation_event} from './Types.gen';

import type {DelegationManager_RedeemedDelegation_eventFilters as Types_DelegationManager_RedeemedDelegation_eventFilters} from './Types.gen';

import type {DelegationManager_RedeemedDelegation_event as Types_DelegationManager_RedeemedDelegation_event} from './Types.gen';

import type {HandlerTypes_eventConfig as Types_HandlerTypes_eventConfig} from './Types.gen';

import type {chain as Types_chain} from './Types.gen';

import type {contractRegistrations as Types_contractRegistrations} from './Types.gen';

import type {fnWithEventConfig as Types_fnWithEventConfig} from './Types.gen';

import type {genericContractRegisterArgs as Internal_genericContractRegisterArgs} from 'envio/src/Internal.gen';

import type {genericContractRegister as Internal_genericContractRegister} from 'envio/src/Internal.gen';

import type {genericHandlerArgs as Internal_genericHandlerArgs} from 'envio/src/Internal.gen';

import type {genericHandlerWithLoader as Internal_genericHandlerWithLoader} from 'envio/src/Internal.gen';

import type {genericHandler as Internal_genericHandler} from 'envio/src/Internal.gen';

import type {genericLoaderArgs as Internal_genericLoaderArgs} from 'envio/src/Internal.gen';

import type {genericLoader as Internal_genericLoader} from 'envio/src/Internal.gen';

import type {handlerContext as Types_handlerContext} from './Types.gen';

import type {loaderContext as Types_loaderContext} from './Types.gen';

import type {onBlockArgs as Envio_onBlockArgs} from 'envio/src/Envio.gen';

import type {onBlockOptions as Envio_onBlockOptions} from 'envio/src/Envio.gen';

export const DelegationManager_RedeemedDelegation_contractRegister: Types_fnWithEventConfig<Internal_genericContractRegister<Internal_genericContractRegisterArgs<Types_DelegationManager_RedeemedDelegation_event,Types_contractRegistrations>>,Types_HandlerTypes_eventConfig<Types_DelegationManager_RedeemedDelegation_eventFilters>> = HandlersJS.DelegationManager.RedeemedDelegation.contractRegister as any;

export const DelegationManager_RedeemedDelegation_handler: Types_fnWithEventConfig<Internal_genericHandler<Internal_genericHandlerArgs<Types_DelegationManager_RedeemedDelegation_event,Types_handlerContext,void>>,Types_HandlerTypes_eventConfig<Types_DelegationManager_RedeemedDelegation_eventFilters>> = HandlersJS.DelegationManager.RedeemedDelegation.handler as any;

export const DelegationManager_RedeemedDelegation_handlerWithLoader: <loaderReturn>(_1:Internal_genericHandlerWithLoader<Internal_genericLoader<Internal_genericLoaderArgs<Types_DelegationManager_RedeemedDelegation_event,Types_loaderContext>,loaderReturn>,Internal_genericHandler<Internal_genericHandlerArgs<Types_DelegationManager_RedeemedDelegation_event,Types_handlerContext,loaderReturn>>,Types_DelegationManager_RedeemedDelegation_eventFilters>) => void = HandlersJS.DelegationManager.RedeemedDelegation.handlerWithLoader as any;

export const DelegationManager_EnabledDelegation_contractRegister: Types_fnWithEventConfig<Internal_genericContractRegister<Internal_genericContractRegisterArgs<Types_DelegationManager_EnabledDelegation_event,Types_contractRegistrations>>,Types_HandlerTypes_eventConfig<Types_DelegationManager_EnabledDelegation_eventFilters>> = HandlersJS.DelegationManager.EnabledDelegation.contractRegister as any;

export const DelegationManager_EnabledDelegation_handler: Types_fnWithEventConfig<Internal_genericHandler<Internal_genericHandlerArgs<Types_DelegationManager_EnabledDelegation_event,Types_handlerContext,void>>,Types_HandlerTypes_eventConfig<Types_DelegationManager_EnabledDelegation_eventFilters>> = HandlersJS.DelegationManager.EnabledDelegation.handler as any;

export const DelegationManager_EnabledDelegation_handlerWithLoader: <loaderReturn>(_1:Internal_genericHandlerWithLoader<Internal_genericLoader<Internal_genericLoaderArgs<Types_DelegationManager_EnabledDelegation_event,Types_loaderContext>,loaderReturn>,Internal_genericHandler<Internal_genericHandlerArgs<Types_DelegationManager_EnabledDelegation_event,Types_handlerContext,loaderReturn>>,Types_DelegationManager_EnabledDelegation_eventFilters>) => void = HandlersJS.DelegationManager.EnabledDelegation.handlerWithLoader as any;

export const DelegationManager_DisabledDelegation_contractRegister: Types_fnWithEventConfig<Internal_genericContractRegister<Internal_genericContractRegisterArgs<Types_DelegationManager_DisabledDelegation_event,Types_contractRegistrations>>,Types_HandlerTypes_eventConfig<Types_DelegationManager_DisabledDelegation_eventFilters>> = HandlersJS.DelegationManager.DisabledDelegation.contractRegister as any;

export const DelegationManager_DisabledDelegation_handler: Types_fnWithEventConfig<Internal_genericHandler<Internal_genericHandlerArgs<Types_DelegationManager_DisabledDelegation_event,Types_handlerContext,void>>,Types_HandlerTypes_eventConfig<Types_DelegationManager_DisabledDelegation_eventFilters>> = HandlersJS.DelegationManager.DisabledDelegation.handler as any;

export const DelegationManager_DisabledDelegation_handlerWithLoader: <loaderReturn>(_1:Internal_genericHandlerWithLoader<Internal_genericLoader<Internal_genericLoaderArgs<Types_DelegationManager_DisabledDelegation_event,Types_loaderContext>,loaderReturn>,Internal_genericHandler<Internal_genericHandlerArgs<Types_DelegationManager_DisabledDelegation_event,Types_handlerContext,loaderReturn>>,Types_DelegationManager_DisabledDelegation_eventFilters>) => void = HandlersJS.DelegationManager.DisabledDelegation.handlerWithLoader as any;

/** Register a Block Handler. It'll be called for every block by default. */
export const onBlock: (_1:Envio_onBlockOptions<Types_chain>, _2:((_1:Envio_onBlockArgs<Types_handlerContext>) => Promise<void>)) => void = HandlersJS.onBlock as any;

export const DelegationManager: {
  EnabledDelegation: {
    handlerWithLoader: <loaderReturn>(_1:Internal_genericHandlerWithLoader<Internal_genericLoader<Internal_genericLoaderArgs<Types_DelegationManager_EnabledDelegation_event,Types_loaderContext>,loaderReturn>,Internal_genericHandler<Internal_genericHandlerArgs<Types_DelegationManager_EnabledDelegation_event,Types_handlerContext,loaderReturn>>,Types_DelegationManager_EnabledDelegation_eventFilters>) => void; 
    handler: Types_fnWithEventConfig<Internal_genericHandler<Internal_genericHandlerArgs<Types_DelegationManager_EnabledDelegation_event,Types_handlerContext,void>>,Types_HandlerTypes_eventConfig<Types_DelegationManager_EnabledDelegation_eventFilters>>; 
    contractRegister: Types_fnWithEventConfig<Internal_genericContractRegister<Internal_genericContractRegisterArgs<Types_DelegationManager_EnabledDelegation_event,Types_contractRegistrations>>,Types_HandlerTypes_eventConfig<Types_DelegationManager_EnabledDelegation_eventFilters>>
  }; 
  DisabledDelegation: {
    handlerWithLoader: <loaderReturn>(_1:Internal_genericHandlerWithLoader<Internal_genericLoader<Internal_genericLoaderArgs<Types_DelegationManager_DisabledDelegation_event,Types_loaderContext>,loaderReturn>,Internal_genericHandler<Internal_genericHandlerArgs<Types_DelegationManager_DisabledDelegation_event,Types_handlerContext,loaderReturn>>,Types_DelegationManager_DisabledDelegation_eventFilters>) => void; 
    handler: Types_fnWithEventConfig<Internal_genericHandler<Internal_genericHandlerArgs<Types_DelegationManager_DisabledDelegation_event,Types_handlerContext,void>>,Types_HandlerTypes_eventConfig<Types_DelegationManager_DisabledDelegation_eventFilters>>; 
    contractRegister: Types_fnWithEventConfig<Internal_genericContractRegister<Internal_genericContractRegisterArgs<Types_DelegationManager_DisabledDelegation_event,Types_contractRegistrations>>,Types_HandlerTypes_eventConfig<Types_DelegationManager_DisabledDelegation_eventFilters>>
  }; 
  RedeemedDelegation: {
    handlerWithLoader: <loaderReturn>(_1:Internal_genericHandlerWithLoader<Internal_genericLoader<Internal_genericLoaderArgs<Types_DelegationManager_RedeemedDelegation_event,Types_loaderContext>,loaderReturn>,Internal_genericHandler<Internal_genericHandlerArgs<Types_DelegationManager_RedeemedDelegation_event,Types_handlerContext,loaderReturn>>,Types_DelegationManager_RedeemedDelegation_eventFilters>) => void; 
    handler: Types_fnWithEventConfig<Internal_genericHandler<Internal_genericHandlerArgs<Types_DelegationManager_RedeemedDelegation_event,Types_handlerContext,void>>,Types_HandlerTypes_eventConfig<Types_DelegationManager_RedeemedDelegation_eventFilters>>; 
    contractRegister: Types_fnWithEventConfig<Internal_genericContractRegister<Internal_genericContractRegisterArgs<Types_DelegationManager_RedeemedDelegation_event,Types_contractRegistrations>>,Types_HandlerTypes_eventConfig<Types_DelegationManager_RedeemedDelegation_eventFilters>>
  }
} = HandlersJS.DelegationManager as any;
