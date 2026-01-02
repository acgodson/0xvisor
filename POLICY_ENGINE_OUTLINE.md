# 0xVisor Policy Engine: Implementation Outline

## Overview

The 0xVisor Policy Engine is a declarative system for controlling automated transaction execution through policies. It operates at two layers: the **agent package** (policy logic) and the **web API** (policy management).

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                   │
│  - Policy Builder UI                                    │
│  - Policy Preview                                       │
│  - Adapter Installation                                 │
└────────────────┬────────────────────────────────────────┘
                 │ tRPC API calls
┌────────────────▼────────────────────────────────────────┐
│                  Web API Layer (tRPC)                   │
│  - /api/policies.compile                                │
│  - /api/policies.getRules                               │
│  - /api/policies.getTemplates                           │
│  - /api/policies.set                                    │
└────────────────┬────────────────────────────────────────┘
                 │ imports from @0xvisor/agent
┌────────────────▼────────────────────────────────────────┐
│              Agent Package (Policy Engine)              │
│  - Policy DSL Compiler                                  │
│  - Policy Rules (6 types)                               │
│  - Policy Engine (evaluator)                            │
│  - Signals (gas, time, security)                        │
└─────────────────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│                   Postgres Database                     │
│  - user_policies                                        │
│  - installed_adapters                                   │
│  - execution_logs                                       │
└─────────────────────────────────────────────────────────┘
```

---

## Part 1: Agent Package (`packages/agent/src/policies/`)

### 1.1 Policy DSL (Domain-Specific Language)

**Location**: `packages/agent/src/policies/dsl/`

#### Core Types (`types.ts`)
```typescript
interface PolicyDocument {
  version: "2024-01-01";
  name: string;
  description?: string;

  // REQUIRED: Spending limits
  limits: {
    amount: string;        // "100"
    currency: string;      // "USDC"
    period: "daily" | "weekly" | "monthly";
  };

  // OPTIONAL: Safety conditions (AND logic)
  conditions?: {
    timeWindow?: {...};
    signals?: {
      gas?: { maxGwei: number };
      security?: { maxAlertCount: number };
    };
    recipients?: {
      allowed?: string[];
      blocked?: string[];
    };
    cooldown?: { seconds: number };
  };
}

interface CompiledPolicy {
  valid: boolean;
  policy: PolicyDocument;
  permission: MetaMaskPermission;  // For ERC-7715
  rules: RuleConfig[];            // For 0xVisor engine
  summary: string;
  errors?: string[];
}
```

#### Policy Compiler (`compiler.ts`)
```typescript
class PolicyCompiler {
  compile(policyDoc: unknown): CompiledPolicy {
    // 1. Validate schema with Zod
    const policy = PolicyDocumentSchema.parse(policyDoc);

    // 2. Generate MetaMask permission (ERC-7715)
    const permission = this.toMetaMaskPermission(policy);

    // 3. Generate 0xVisor policy rules
    const rules = this.toVisorRules(policy);

    // 4. Generate human-readable summary
    const summary = this.generateSummary(policy);

    return { valid: true, policy, permission, rules, summary };
  }

  private toMetaMaskPermission(policy: PolicyDocument): MetaMaskPermission {
    // Maps limits to erc20-token-periodic enforcer
    // Returns: { type, data: { token, allowance, period, start, end } }
  }

  private toVisorRules(policy: PolicyDocument): RuleConfig[] {
    // Maps conditions to policy rules
    // Always includes max-amount from limits
    // Adds optional rules based on conditions
  }
}
```

**Key Insight**: The compiler is the bridge between human-readable policies and machine-executable rules.

#### Token Registry (`tokens.ts`)
```typescript
const SUPPORTED_TOKENS = {
  USDC: {
    address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",  // Sepolia
    decimals: 6,
    symbol: "USDC"
  },
  USDT: {...},
  DAI: {...},
  WETH: {...}
};

// Helper functions
getTokenAddress(symbol: string): string
getTokenDecimals(symbol: string): number
isSupportedToken(symbol: string): boolean
```

#### Policy Templates (`templates.ts`)
```typescript
const POLICY_TEMPLATES = {
  "conservative-daily": {
    name: "Conservative Daily Transfer",
    description: "Safe daily transfers with business hours",
    policyDocument: {
      limits: { amount: "50", currency: "USDC", period: "daily" },
      conditions: {
        timeWindow: { days: [1,2,3,4,5], startHour: 9, endHour: 17 }
      }
    }
  },
  "24-7-trading": {...},
  "whitelist-only": {...},
  "emergency-budget": {...}
};
```

### 1.2 Policy Rules (`packages/agent/src/policies/rules/`)

Each rule is a function that evaluates a specific condition:

```typescript
type PolicyRule = (
  context: PolicyContext,
  config: unknown
) => Promise<PolicyResult>;

interface PolicyContext {
  userAddress: string;
  adapterId: string;
  proposedTx: ProposedTransaction;
  signals?: SignalData;
  db?: Database;
}

interface PolicyResult {
  allowed: boolean;
  reason?: string;
  details?: Record<string, unknown>;
}
```

#### Rule 1: Max Amount (`max-amount.ts`)
```typescript
// Limits individual transaction size
config: { maxAmount: string, currency: string }
evaluation: Extracts amount from tx.value/calldata, compares to limit
```

#### Rule 2: Cooldown (`cooldown.ts`)
```typescript
// Minimum time between transactions
config: { minimumSeconds: number }
evaluation: Queries execution_logs for last tx, checks elapsed time
```

#### Rule 3: Gas Limit (`gas-limit.ts`)
```typescript
// Only execute when gas is below threshold
config: { maxGwei: number }
evaluation: Fetches gasSignal, compares current gas to limit
```

#### Rule 4: Time Window (`time-window.ts`)
```typescript
// Only execute during specific days/hours
config: { days: number[], startHour: number, endHour: number, timezone: string }
evaluation: Fetches timeSignal, checks if current time is within window
```

#### Rule 5: Recipient Whitelist (`recipient-whitelist.ts`)
```typescript
// Only allow txs to approved addresses
config: { allowed?: string[], blocked?: string[] }
evaluation: Decodes tx.data to extract recipient, checks lists
```

#### Rule 6: Security Pause (`security-pause.ts`)
```typescript
// Halt execution when security alerts are active
config: { maxAlertCount: number, blockedSeverities?: string[] }
evaluation: Fetches envioSignal, checks for active alerts
```

### 1.3 Policy Engine (`engine.ts`)

The orchestrator that evaluates all rules:

```typescript
class PolicyEngine {
  async evaluate(
    userAddress: string,
    adapterId: string,
    proposedTx: ProposedTransaction,
    db: Database
  ): Promise<EvaluationResult> {
    // 1. Load user's policies from database
    const policies = await this.loadPolicies(userAddress, adapterId, db);

    // 2. Fetch all signals (gas, time, security)
    const signals = await fetchAllSignals();

    // 3. Build evaluation context
    const context = { userAddress, adapterId, proposedTx, signals, db };

    // 4. Evaluate each enabled policy rule
    const results: PolicyResult[] = [];
    for (const policy of policies) {
      if (!policy.isEnabled) continue;

      const rule = getPolicyRule(policy.policyType);
      const result = await rule(context, policy.config);
      results.push(result);

      // Fail-fast: if any rule blocks, stop
      if (!result.allowed) {
        return { allowed: false, reason: result.reason, results };
      }
    }

    // 5. All rules passed
    return { allowed: true, results };
  }
}
```

**Key Insight**: The engine uses AND logic - ALL enabled rules must pass.

### 1.4 Signals (`packages/agent/src/signals/`)

Signals provide real-time data for policy evaluation:

#### Gas Signal (`gas-signal.ts`)
```typescript
interface GasSignalData {
  standard: number;    // Standard gas price in gwei
  baseFee: number;     // Base fee in gwei
  timestamp: Date;
}

// Fetches from Ethereum RPC
gasSignal.fetch() → GasSignalData
```

#### Time Signal (`time-signal.ts`)
```typescript
interface TimeSignalData {
  hour: number;        // 0-23
  dayOfWeek: number;   // 0=Sunday, 6=Saturday
  timezone: string;
  timestamp: Date;
}

// Uses system time
timeSignal.fetch() → TimeSignalData
```

#### Security Signal (`envio-signal.ts`)
```typescript
interface SecuritySignalData {
  alerts: Array<{
    id: string;
    severity: "low" | "medium" | "high" | "critical";
    message: string;
  }>;
  timestamp: Date;
}

// Fetches from Envio monitoring service
envioSignal.fetch() → SecuritySignalData
```

---

## Part 2: Web API Layer (`web/src/trpc/routers/policies.ts`)

### 2.1 Policy Router Endpoints

#### `policies.compile`
```typescript
// Compiles PolicyDocument to MetaMask permission + Visor rules
Input: { policyDocument: PolicyDocument }
Output: CompiledPolicy
Logic: Calls policyCompiler.compile()
```

#### `policies.getRules`
```typescript
// Returns all available policy rule types
Input: none
Output: { rules: Array<{ type, name, description, configSchema }> }
Logic: Calls getAllPolicyRules() from agent package
```

#### `policies.getTemplates`
```typescript
// Returns pre-built policy templates
Input: { adapterId?: string }
Output: { templates: PolicyTemplate[] }
Logic: Calls policyTemplates.getAll() or getByAdapter()
```

#### `policies.set`
```typescript
// Creates or updates a user policy
Input: {
  userAddress: string,
  policyType: string,
  config: Record<string, any>,
  adapterId?: string
}
Output: { policy: { id, policyType, isEnabled, config } }
Logic: Upserts to user_policies table
```

#### `policies.list`
```typescript
// Lists user's policies
Input: { userAddress: string, adapterId?: string }
Output: { policies: Array<...> }
Logic: Queries user_policies table
```

#### `policies.toggle`
```typescript
// Enables/disables a policy
Input: { id: number }
Output: { isEnabled: boolean }
Logic: Updates isEnabled field in user_policies
```

---

## Part 3: Database Schema

### Table: `user_policies`
```sql
CREATE TABLE user_policies (
  id SERIAL PRIMARY KEY,
  user_address TEXT NOT NULL,
  policy_type TEXT NOT NULL,        -- "max-amount", "cooldown", etc.
  is_enabled BOOLEAN DEFAULT true,
  config JSONB NOT NULL,            -- Rule-specific config
  adapter_id TEXT,                  -- Optional: policy for specific adapter
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Example rows**:
```json
[
  {
    "userAddress": "0x742d...",
    "policyType": "max-amount",
    "isEnabled": true,
    "config": { "maxAmount": "100", "currency": "USDC" },
    "adapterId": "transfer-bot"
  },
  {
    "userAddress": "0x742d...",
    "policyType": "time-window",
    "isEnabled": true,
    "config": {
      "days": [1,2,3,4,5],
      "startHour": 9,
      "endHour": 17,
      "timezone": "America/New_York"
    },
    "adapterId": "transfer-bot"
  }
]
```

### Table: `execution_logs`
```sql
CREATE TABLE execution_logs (
  id SERIAL PRIMARY KEY,
  user_address TEXT NOT NULL,
  adapter_id TEXT NOT NULL,
  proposed_tx JSONB NOT NULL,
  decision TEXT NOT NULL,           -- "ALLOW" or "BLOCK"
  reason TEXT,
  policy_results JSONB,             -- Array of PolicyResult
  tx_hash TEXT,
  executed_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose**:
- Audit trail of all executions
- Used by cooldown rule to check last execution time
- Debugging and analytics

---

## Part 4: End-to-End Flow

### Installation Flow
```
1. User selects adapter (e.g., transfer-bot)
   ↓
2. User builds policy using DSL UI
   ├─ Sets limits: 100 USDC/day
   └─ Adds conditions: business hours, low gas
   ↓
3. Frontend calls policies.compile(policyDocument)
   ├─ Compiler validates schema
   ├─ Generates MetaMask permission (ERC-7715)
   └─ Generates Visor rules (max-amount, time-window, gas-limit)
   ↓
4. User reviews compiled output
   ↓
5. User grants permission in MetaMask
   ├─ MetaMask stores delegation
   └─ Web saves to permissions table
   ↓
6. Web calls adapters.install()
   ├─ Saves to installed_adapters table
   └─ Links permissionId
   ↓
7. For each rule in compiled policy:
   Web calls policies.set(userAddress, ruleType, config)
   ├─ Saves to user_policies table
   └─ Links adapterId
   ↓
8. Installation complete ✅
```

### Execution Flow
```
1. Adapter proposes transaction
   ↓
2. Executor calls policyEngine.evaluate()
   ├─ Loads user_policies from DB
   ├─ Fetches signals (gas, time, security)
   └─ Builds PolicyContext
   ↓
3. For each enabled policy:
   ├─ Get rule function (e.g., maxAmountRule)
   ├─ Call rule(context, config)
   └─ Collect result
   ↓
4. If any rule blocks:
   ├─ Log to execution_logs (decision: "BLOCK")
   └─ Return { allowed: false, reason }
   ↓
5. If all rules pass:
   ├─ Execute transaction via session account
   ├─ Log to execution_logs (decision: "ALLOW", txHash)
   └─ Return { allowed: true, txHash }
```

---

## Part 5: Key Design Decisions

### 5.1 Two-Layer System
**Why**: Separation of concerns
- **MetaMask layer**: Enforces spending limits at protocol level (can't be bypassed)
- **Visor layer**: Adds custom conditions (time, gas, recipients, cooldown)

### 5.2 AND Logic for Conditions
**Why**: Simplicity and safety
- All specified conditions must be satisfied
- No OR operators or complex logic
- Easy to reason about: "If timeWindow AND gasLimit are set, both must pass"

### 5.3 Declarative DSL
**Why**: User accessibility
- Non-technical users can build policies
- Compile-time validation catches errors
- Human-readable but machine-compilable

### 5.4 Signals Architecture
**Why**: Real-time data for dynamic policies
- Gas prices change constantly
- Time-based restrictions need current time
- Security alerts can pause execution immediately

### 5.5 Database-Backed Policies
**Why**: Persistence and flexibility
- Policies persist across sessions
- Can be modified without re-granting permissions
- Supports multiple policies per user/adapter

### 5.6 Fail-Fast Evaluation
**Why**: Performance and clarity
- Stop evaluating as soon as one rule blocks
- Clear reason for why transaction was blocked
- Reduces unnecessary signal fetches

---

## Part 6: Frontend Integration

### Policy Builder UI Components

#### `PolicyBasicsForm.tsx`
```typescript
// User inputs:
- Policy name
- Amount limit (number input)
- Currency (dropdown: USDC, USDT, DAI, WETH)
- Period (dropdown: daily, weekly, monthly)

// Builds limits section of PolicyDocument
```

#### `AdvancedConditionsForm.tsx`
```typescript
// User enables/configures optional conditions:
- Time Window (checkboxes for days, time range)
- Gas Limit (number input for max gwei)
- Recipient Whitelist (address list)
- Cooldown (seconds between txs)
- Security Monitoring (alert thresholds)

// Builds conditions section of PolicyDocument
```

#### `PolicyPreview.tsx`
```typescript
// Displays compiled output:
- Human-readable summary
- MetaMask permission details
- Active safeguards (rules)
- JSON view of PolicyDocument

// Calls policies.compile() on change
```

### Hooks

#### `useCompiler.ts`
```typescript
// Debounced compilation
const { compiledPolicy, isCompiling } = useCompiler(policyDocument);

// Calls policies.compile() after 500ms of no changes
// Returns CompiledPolicy with permission + rules + summary
```

#### `useTemplates.ts`
```typescript
// Loads policy templates
const { templates, loadTemplate } = useTemplates(adapterId);

// Calls policies.getTemplates()
// Allows user to start from pre-built template
```

---

## Part 7: Testing & Validation

### Compiler Tests
```typescript
// Test basic policy compilation
test('compiles limits to MetaMask permission', () => {
  const policy = { limits: { amount: "100", currency: "USDC", period: "daily" } };
  const compiled = compiler.compile(policy);
  expect(compiled.permission.type).toBe("erc20-token-periodic");
});

// Test condition compilation
test('compiles conditions to Visor rules', () => {
  const policy = {
    limits: {...},
    conditions: { timeWindow: {...}, signals: { gas: { maxGwei: 50 } } }
  };
  const compiled = compiler.compile(policy);
  expect(compiled.rules).toHaveLength(3); // max-amount, time-window, gas-limit
});
```

### Rule Tests
```typescript
// Test max-amount rule
test('blocks transactions exceeding max amount', async () => {
  const result = await maxAmountRule(context, { maxAmount: "100", currency: "USDC" });
  expect(result.allowed).toBe(false);
});

// Test cooldown rule
test('blocks transactions within cooldown period', async () => {
  const result = await cooldownRule(context, { minimumSeconds: 3600 });
  expect(result.allowed).toBe(false);
  expect(result.reason).toContain("cooldown");
});
```

### Integration Tests
```typescript
// Test end-to-end flow
test('complete flow: build → compile → grant → execute', async () => {
  // 1. Build policy
  const policy = buildPolicy();

  // 2. Compile
  const compiled = await trpc.policies.compile({ policyDocument: policy });

  // 3. Grant permission (mocked)
  await grantPermission(compiled.permission);

  // 4. Install adapter
  await trpc.adapters.install({ config, permissionId });

  // 5. Execute
  const result = await trpc.execute.execute({ userAddress, adapterId });
  expect(result.decision).toBe("ALLOW");
});
```

---

## Part 8: Deployment Considerations

### Build Process
```bash
# 1. Build agent package (creates dist/)
pnpm --filter @0xvisor/agent build

# 2. Build web package (uses agent dist/)
pnpm --filter @0xvisor/web build --webpack
```

**Note**: Using webpack (not Turbopack) for proper pnpm workspace resolution.

### Environment Variables
```bash
# Required for policy engine
POSTGRES_URL=...                    # Database connection
ENCRYPTION_KEY=...                  # For session keys
RPC_URL=...                         # Ethereum RPC
NEXT_PUBLIC_CHAIN_ID=11155111      # Sepolia testnet

# Optional for signals
ENVIO_GRAPHQL_URL=...              # Security monitoring
```

### Vercel Configuration
```json
// vercel.json
{
  "buildCommand": "cd web && pnpm build",
  "installCommand": "pnpm install --frozen-lockfile",
  "outputDirectory": "web/.next"
}

// web/next.config.ts
{
  transpilePackages: ["@0xvisor/agent"]  // Transpile workspace package
}

// web/package.json
{
  "build": "next build --webpack"  // Force webpack (not Turbopack)
}
```

---

## Conclusion

The 0xVisor Policy Engine is a **two-layer security system**:

1. **Protocol Layer** (MetaMask ERC-7715): Enforces spending limits that can't be bypassed
2. **Application Layer** (Visor Rules): Adds custom conditions for safety and control

**Key strengths**:
- ✅ Declarative DSL accessible to non-technical users
- ✅ Real-time signals for dynamic conditions
- ✅ Compile-time validation prevents errors
- ✅ Database-backed persistence
- ✅ Comprehensive audit trail
- ✅ Modular rule system (easy to add new rules)

**Architecture highlights**:
- Clean separation: Agent package (logic) ↔ Web API (management) ↔ Frontend (UX)
- Fail-fast evaluation for performance
- AND logic for simplicity
- Template library for quick starts

**Production-ready features**:
- ✅ All 6 core policy rules implemented
- ✅ Policy DSL compiler functional
- ✅ 4 templates available
- ✅ Full tRPC API
- ✅ Policy builder UI
- ✅ Postgres persistence
- ✅ Vercel deployment working

The system is **fully operational** and ready for users to create sophisticated automation policies with fine-grained control! 🎯
