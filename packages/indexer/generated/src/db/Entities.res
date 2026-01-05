open Table
open Enums.EntityType
type id = string

type internalEntity = Internal.entity
module type Entity = {
  type t
  let index: int
  let name: string
  let schema: S.t<t>
  let rowsSchema: S.t<array<t>>
  let table: Table.table
  let entityHistory: EntityHistory.t<t>
}
external entityModToInternal: module(Entity with type t = 'a) => Internal.entityConfig = "%identity"
external entityModsToInternal: array<module(Entity)> => array<Internal.entityConfig> = "%identity"
external entitiesToInternal: array<'a> => array<Internal.entity> = "%identity"

@get
external getEntityId: internalEntity => string = "id"

// Use InMemoryTable.Entity.getEntityIdUnsafe instead of duplicating the logic
let getEntityIdUnsafe = InMemoryTable.Entity.getEntityIdUnsafe

//shorthand for punning
let isPrimaryKey = true
let isNullable = true
let isArray = true
let isIndex = true

@genType
type whereOperations<'entity, 'fieldType> = {
  eq: 'fieldType => promise<array<'entity>>,
  gt: 'fieldType => promise<array<'entity>>,
  lt: 'fieldType => promise<array<'entity>>
}

module DisabledDelegation = {
  let name = (DisabledDelegation :> string)
  let index = 0
  @genType
  type t = {
    blockNumber: bigint,
    blockTimestamp: bigint,
    delegate: string,
    delegationHash: string,
    delegator: string,
    id: id,
    logIndex: bigint,
    transactionHash: string,
  }

  let schema = S.object((s): t => {
    blockNumber: s.field("blockNumber", BigInt.schema),
    blockTimestamp: s.field("blockTimestamp", BigInt.schema),
    delegate: s.field("delegate", S.string),
    delegationHash: s.field("delegationHash", S.string),
    delegator: s.field("delegator", S.string),
    id: s.field("id", S.string),
    logIndex: s.field("logIndex", BigInt.schema),
    transactionHash: s.field("transactionHash", S.string),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
  }

  let table = mkTable(
    (name :> string),
    ~fields=[
      mkField(
      "blockNumber", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "blockTimestamp", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "delegate", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
      mkField(
      "delegationHash", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
      mkField(
      "delegator", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
      mkField(
      "id", 
      Text,
      ~fieldSchema=S.string,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "logIndex", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "transactionHash", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema, ~entityIndex=index)

  external castToInternal: t => Internal.entity = "%identity"
}

module EnabledDelegation = {
  let name = (EnabledDelegation :> string)
  let index = 1
  @genType
  type t = {
    blockNumber: bigint,
    blockTimestamp: bigint,
    delegate: string,
    delegationHash: string,
    delegator: string,
    id: id,
    logIndex: bigint,
    transactionHash: string,
  }

  let schema = S.object((s): t => {
    blockNumber: s.field("blockNumber", BigInt.schema),
    blockTimestamp: s.field("blockTimestamp", BigInt.schema),
    delegate: s.field("delegate", S.string),
    delegationHash: s.field("delegationHash", S.string),
    delegator: s.field("delegator", S.string),
    id: s.field("id", S.string),
    logIndex: s.field("logIndex", BigInt.schema),
    transactionHash: s.field("transactionHash", S.string),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
  }

  let table = mkTable(
    (name :> string),
    ~fields=[
      mkField(
      "blockNumber", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "blockTimestamp", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "delegate", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
      mkField(
      "delegationHash", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
      mkField(
      "delegator", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
      mkField(
      "id", 
      Text,
      ~fieldSchema=S.string,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "logIndex", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "transactionHash", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema, ~entityIndex=index)

  external castToInternal: t => Internal.entity = "%identity"
}

module Redemption = {
  let name = (Redemption :> string)
  let index = 2
  @genType
  type t = {
    blockNumber: bigint,
    blockTimestamp: bigint,
    delegationHash: string,
    id: id,
    logIndex: bigint,
    redeemer: string,
    rootDelegator: string,
    transactionHash: string,
  }

  let schema = S.object((s): t => {
    blockNumber: s.field("blockNumber", BigInt.schema),
    blockTimestamp: s.field("blockTimestamp", BigInt.schema),
    delegationHash: s.field("delegationHash", S.string),
    id: s.field("id", S.string),
    logIndex: s.field("logIndex", BigInt.schema),
    redeemer: s.field("redeemer", S.string),
    rootDelegator: s.field("rootDelegator", S.string),
    transactionHash: s.field("transactionHash", S.string),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
  }

  let table = mkTable(
    (name :> string),
    ~fields=[
      mkField(
      "blockNumber", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "blockTimestamp", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "delegationHash", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
      mkField(
      "id", 
      Text,
      ~fieldSchema=S.string,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "logIndex", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "redeemer", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
      mkField(
      "rootDelegator", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
      mkField(
      "transactionHash", 
      Text,
      ~fieldSchema=S.string,
      
      
      
      
      
      ),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema, ~entityIndex=index)

  external castToInternal: t => Internal.entity = "%identity"
}

module Stats = {
  let name = (Stats :> string)
  let index = 3
  @genType
  type t = {
    id: id,
    lastUpdated: bigint,
    totalDisabled: bigint,
    totalEnabled: bigint,
    totalRedemptions: bigint,
  }

  let schema = S.object((s): t => {
    id: s.field("id", S.string),
    lastUpdated: s.field("lastUpdated", BigInt.schema),
    totalDisabled: s.field("totalDisabled", BigInt.schema),
    totalEnabled: s.field("totalEnabled", BigInt.schema),
    totalRedemptions: s.field("totalRedemptions", BigInt.schema),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
  }

  let table = mkTable(
    (name :> string),
    ~fields=[
      mkField(
      "id", 
      Text,
      ~fieldSchema=S.string,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "lastUpdated", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "totalDisabled", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "totalEnabled", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
      mkField(
      "totalRedemptions", 
      Numeric,
      ~fieldSchema=BigInt.schema,
      
      
      
      
      
      ),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema, ~entityIndex=index)

  external castToInternal: t => Internal.entity = "%identity"
}

let userEntities = [
  module(DisabledDelegation),
  module(EnabledDelegation),
  module(Redemption),
  module(Stats),
]->entityModsToInternal

let allEntities =
  userEntities->Js.Array2.concat(
    [module(InternalTable.DynamicContractRegistry)]->entityModsToInternal,
  )

let byName =
  allEntities
  ->Js.Array2.map(entityConfig => {
    (entityConfig.name, entityConfig)
  })
  ->Js.Dict.fromArray
