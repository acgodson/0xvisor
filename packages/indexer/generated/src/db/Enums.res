module ContractType = {
  @genType
  type t = 
    | @as("DelegationManager") DelegationManager

  let name = "CONTRACT_TYPE"
  let variants = [
    DelegationManager,
  ]
  let config = Internal.makeEnumConfig(~name, ~variants)
}

module EntityType = {
  @genType
  type t = 
    | @as("DisabledDelegation") DisabledDelegation
    | @as("EnabledDelegation") EnabledDelegation
    | @as("Redemption") Redemption
    | @as("Stats") Stats
    | @as("dynamic_contract_registry") DynamicContractRegistry

  let name = "ENTITY_TYPE"
  let variants = [
    DisabledDelegation,
    EnabledDelegation,
    Redemption,
    Stats,
    DynamicContractRegistry,
  ]
  let config = Internal.makeEnumConfig(~name, ~variants)
}

let allEnums = ([
  ContractType.config->Internal.fromGenericEnumConfig,
  EntityType.config->Internal.fromGenericEnumConfig,
])
