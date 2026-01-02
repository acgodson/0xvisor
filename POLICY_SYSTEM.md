# 0xVisor Policy System: Complete Reference

## Document Purpose

This document consolidates all policy-related specifications, implementation guides, and UI/UX design into a single reference for the 0xVisor policy system. It covers the Policy DSL (Domain Specific Language), the policy builder UI, implementation strategy, and complete checklists.

---

## Table of Contents

1. [Policy DSL Overview](#policy-dsl-overview)
2. [Architecture Philosophy](#architecture-philosophy)
3. [Policy DSL Specification](#policy-dsl-specification)
4. [Compiler Architecture](#compiler-architecture)
5. [Policy Rules](#policy-rules)
6. [UI/UX Design](#uiux-design)
7. [Implementation Checklist](#implementation-checklist)
8. [Testing Strategy](#testing-strategy)

---

## Policy DSL Overview

The 0xVisor Policy DSL is a declarative, user-friendly system for building transaction policies that compile to both:
1. **MetaMask Advanced Permissions** (ERC-7715)
2. **0xVisor Policy Rules** (for runtime validation)

### Key Principles

- **Declarative, not imperative**: Users describe what they want, not how to achieve it
- **Human-readable but machine-compilable**: Natural language with strict schema
- **Preview-first**: Show what will happen before execution
- **Validation at build-time**: Catch errors before permissions are granted

### Inspired By

- **AWS IAM**: Visual editor + JSON editor, policy simulator, template library
- **Stripe Dashboard**: Clean layout, inline editing, smart defaults, contextual help
- **Zapier/IFTTT**: Visual flow builder, plain language, step-by-step wizard
- **Privy.io**: Security-first messaging, minimal UI, clear consequences

---

## Architecture Philosophy

### Policy-First Flow

The system follows a **policy-first** architecture:

1. User selects an adapter (e.g., transfer-bot, swap-bot)
2. User builds a policy using the DSL
3. System derives MetaMask permission from policy
4. User grants permission
5. Executions are validated against policy rules

This is different from the previous flow where permissions were granted before policies were defined.

### Benefits

- **User Control**: Policies are defined upfront, not as afterthoughts
- **Transparency**: Users see exactly what they're allowing
- **Safety**: System can't request broader permissions than policy allows
- **Flexibility**: Easy to modify policies without regranting permissions

---

## Policy DSL Specification

### PolicyDocument Format

```typescript
interface PolicyDocument {
  // Version for schema evolution
  version: "2024-01-01";

  // Human-readable metadata
  name: string;
  description?: string;

  // Core spending limits (REQUIRED)
  limits: {
    amount: string;          // e.g., "100"
    currency: string;        // e.g., "USDC"
    period: "daily" | "weekly" | "monthly";
  };

  // Optional conditions (all use AND logic)
  conditions?: {
    // Time-based restrictions
    timeWindow?: {
      days: number[];        // 0=Sunday, 6=Saturday
      startHour: number;     // 0-23
      endHour: number;       // 0-23
      timezone: string;      // e.g., "America/New_York"
    };

    // Signal-based conditions
    signals?: {
      gas?: {
        maxGwei: number;     // Max gas price in gwei
      };
      security?: {
        maxAlertCount: number;           // Max security alerts
        blockedSeverities?: string[];    // e.g., ["critical", "high"]
      };
    };

    // Recipient restrictions
    recipients?: {
      allowed?: string[];    // Whitelist of addresses
      blocked?: string[];    // Blacklist of addresses
    };

    // Rate limiting
    cooldown?: {
      seconds: number;       // Min seconds between txs
    };
  };
}
```

### Logic Model

**All conditions use AND logic**: Every condition that is specified must be satisfied for a transaction to be allowed.

- If `timeWindow` is set → transaction must be within time window
- If `signals.gas` is set → gas must be below threshold
- If `signals.security` is set → security alerts must be below threshold
- If `recipients.allowed` is set → recipient must be in whitelist
- If `cooldown` is set → enough time must have passed since last execution

This simplifies the mental model - there are no OR operators or complex conditional logic.

### Signal Integration

**Gas Signal** (`/packages/agent/src/signals/gas-signal.ts`):
```typescript
// Returns: { standard: number, baseFee: number, timestamp: Date }
signals?: {
  gas?: { maxGwei: number }  // Compared against signal.standard
}
```

**Security Signal** (`/packages/agent/src/signals/envio-signal.ts`):
```typescript
// Returns: { alerts: Array<{ severity: string }>, timestamp: Date }
signals?: {
  security?: {
    maxAlertCount: number,
    blockedSeverities?: string[]
  }
}
```

**Time Signal** (`/packages/agent/src/signals/time-signal.ts`):
```typescript
// Returns: { hour: number, dayOfWeek: number, timezone: string }
conditions?: {
  timeWindow?: {
    days: number[],
    startHour: number,
    endHour: number
  }
}
```

---

## Compiler Architecture

### Compilation Targets

The compiler translates a PolicyDocument into two outputs:

1. **MetaMask Permission** (for ERC-7715 delegation)
2. **0xVisor Policy Rules** (for transaction validation)

```typescript
interface CompiledPolicy {
  valid: boolean;
  policy: PolicyDocument;
  permission: MetaMaskPermission;
  rules: RuleConfig[];
  summary: string;  // Human-readable description
  errors?: string[];
}
```

### Compilation Process

```typescript
class PolicyCompiler {
  compile(policyDoc: unknown): CompiledPolicy {
    // 1. Validate schema
    const policy = PolicyDocumentSchema.parse(policyDoc);

    // 2. Translate to MetaMask permission
    const permission = this.toMetaMaskPermission(policy);

    // 3. Translate to 0xVisor rules
    const rules = this.toVisorRules(policy);

    // 4. Generate human summary
    const summary = this.generateSummary(policy);

    return { valid: true, policy, permission, rules, summary };
  }
}
```

### MetaMask Permission Derivation

The `limits` section directly maps to MetaMask's `erc20-token-periodic` enforcer:

```typescript
private toMetaMaskPermission(policy: PolicyDocument): MetaMaskPermission {
  const periodSeconds = {
    daily: 86400,
    weekly: 604800,
    monthly: 2592000
  }[policy.limits.period];

  return {
    type: "erc20-token-periodic",
    data: {
      token: this.getTokenAddress(policy.limits.currency),
      allowance: parseUnits(policy.limits.amount, this.getDecimals(policy.limits.currency)),
      period: periodSeconds,
      start: Math.floor(Date.now() / 1000),
      end: 0  // No expiration
    }
  };
}
```

### 0xVisor Rules Derivation

The `conditions` section maps to existing and new policy rules:

```typescript
private toVisorRules(policy: PolicyDocument): RuleConfig[] {
  const rules: RuleConfig[] = [];

  // Always include max-amount from limits
  rules.push({
    policyType: "max-amount",
    isEnabled: true,
    config: {
      maxAmount: policy.limits.amount,
      currency: policy.limits.currency
    }
  });

  // Optional: time window
  if (policy.conditions?.timeWindow) {
    rules.push({
      policyType: "time-window",
      isEnabled: true,
      config: policy.conditions.timeWindow
    });
  }

  // Optional: gas limit
  if (policy.conditions?.signals?.gas) {
    rules.push({
      policyType: "gas-limit",
      isEnabled: true,
      config: { maxGwei: policy.conditions.signals.gas.maxGwei }
    });
  }

  // Optional: security pause
  if (policy.conditions?.signals?.security) {
    rules.push({
      policyType: "security-pause",
      isEnabled: true,
      config: policy.conditions.signals.security
    });
  }

  // Optional: recipient whitelist (NEW RULE)
  if (policy.conditions?.recipients) {
    rules.push({
      policyType: "recipient-whitelist",
      isEnabled: true,
      config: policy.conditions.recipients
    });
  }

  // Optional: cooldown (NEW RULE)
  if (policy.conditions?.cooldown) {
    rules.push({
      policyType: "cooldown",
      isEnabled: true,
      config: { minimumSeconds: policy.conditions.cooldown.seconds }
    });
  }

  return rules;
}
```

---

## Policy Rules

### Existing Rules

#### 1. Gas Limit Rule
- **Purpose**: Prevent execution when gas prices are high
- **Config**: `{ maxGwei: number }`
- **Evaluation**: Fetches gas signal, compares current gas price to threshold
- **Location**: `/packages/agent/src/policies/rules/gas-limit.ts`

#### 2. Time Window Rule
- **Purpose**: Only allow execution during specific hours and days
- **Config**: `{ startHour, endHour, daysOfWeek, timezone }`
- **Evaluation**: Fetches time signal, checks if current time is within window
- **Location**: `/packages/agent/src/policies/rules/time-window.ts`

#### 3. Max Amount Rule
- **Purpose**: Limit the size of any single transaction
- **Config**: `{ maxAmount: string, decimals: number }`
- **Evaluation**: Extracts token amount from proposed transaction
- **Location**: `/packages/agent/src/policies/rules/max-amount.ts`

#### 4. Security Pause Rule
- **Purpose**: Halt all execution when security alerts are active
- **Config**: `{ pauseOnAnyAlert, alertSeverities }`
- **Evaluation**: Fetches envio signal, checks for active alerts
- **Location**: `/packages/agent/src/policies/rules/security-pause.ts`

### New Rules (To Be Implemented)

#### 5. Recipient Whitelist Rule

**Location**: `/packages/agent/src/policies/rules/recipient-whitelist.ts`

**Purpose**: Enforce that transactions only go to approved addresses

**Config Schema**:
```typescript
{
  allowed?: string[];   // Whitelist
  blocked?: string[];   // Blacklist
}
```

**Evaluation Logic**:
- If `allowed` is set and non-empty → recipient must be in list
- If `blocked` is set and non-empty → recipient must NOT be in list
- If both are empty → allow all (no restriction)

**Implementation Notes**:
- Compare addresses case-insensitively
- For ERC20 transfers, decode the `transfer(address,uint256)` calldata to get the recipient
- Handle checksummed vs non-checksummed addresses

#### 6. Cooldown Rule

**Location**: `/packages/agent/src/policies/rules/cooldown.ts`

**Purpose**: Enforce minimum time between transactions

**Config Schema**:
```typescript
{
  minimumSeconds: number;
}
```

**Evaluation Logic**:
- Query `executionLogs` table for last execution by this user+adapter
- Calculate time elapsed since last execution
- If elapsed < minimum → BLOCK
- If no previous execution → ALLOW

**Implementation Notes**:
- Use database to persist execution timestamps
- Use UTC timestamps for consistency
- First transaction always allowed

---

## UI/UX Design

### Design Goals

1. **Accessible to Non-Technical Users**: Anyone should be able to build a policy without understanding smart contracts
2. **Progressive Disclosure**: Show simple options first, reveal complexity only when needed
3. **Instant Feedback**: Real-time validation and preview as users build
4. **Trust Through Transparency**: Always show what's happening under the hood
5. **Mobile-Responsive**: Work well on desktop, tablet, and mobile

### UI Flow

#### Step 1: Adapter Selection

```
┌─────────────────────────────────────────────────────┐
│  Choose an Automation                               │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │ 💸           │  │ 🔄           │  │ 🎯       │ │
│  │ TransferBot  │  │ SwapBot      │  │ DCA Bot  │ │
│  │              │  │              │  │          │ │
│  │ Automatically│  │ Auto-swap    │  │ Dollar-  │ │
│  │ send tokens  │  │ tokens at    │  │ cost     │ │
│  │ on schedule  │  │ target price │  │ average  │ │
│  │              │  │              │  │          │ │
│  │ [Select]     │  │ [Select]     │  │ [Select] │ │
│  └──────────────┘  └──────────────┘  └──────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### Step 2: Template Selection

```
┌─────────────────────────────────────────────────────┐
│  ← Back to Adapters                                 │
├─────────────────────────────────────────────────────┤
│  TransferBot Policy                                 │
│                                                     │
│  Start with a template or build from scratch:       │
│                                                     │
│  ┌─────────────────────────┐  Recommended          │
│  │ 💼 Conservative Daily   │                       │
│  │                         │                       │
│  │ • $50/day limit         │                       │
│  │ • Business hours only   │                       │
│  │ • Low gas required      │                       │
│  │                         │                       │
│  │ [Use Template]          │                       │
│  └─────────────────────────┘                       │
│                                                     │
│  [View All Templates]  [Start from Scratch]        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### Step 3: Basic Settings

```
┌─────────────────────────────────────────────────────┐
│  ← Back        Step 1 of 3: Basic Settings          │
├─────────────────────────────────────────────────────┤
│  Policy Name                                        │
│  ┌─────────────────────────────────────────────┐   │
│  │ Conservative Daily Transfer                 │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  How much can be transferred?                       │
│  ┌──────────┐  ┌──────────────┐  ┌────────────┐   │
│  │   50     │  │  USDC ▼      │  │  per day ▼ │   │
│  └──────────┘  └──────────────┘  └────────────┘   │
│                                                     │
│  💡 This will allow up to $50 USDC to be sent      │
│  every day. The limit resets every 24 hours.        │
│                                                     │
│  [Advanced Settings]              [Next Step →]    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### Step 4: Advanced Settings

```
┌─────────────────────────────────────────────────────┐
│  ← Back to Basic    Step 2 of 3: Advanced Settings │
├─────────────────────────────────────────────────────┤
│  Add optional safety conditions:                    │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ ☑ Only during specific times                │   │
│  │   Days: [✓Mon] [✓Tue] [✓Wed] [✓Thu] [✓Fri] │   │
│  │   Hours: [09:00] to [17:00] EST            │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ ☑ Pause if gas is too high                 │   │
│  │   Maximum gas price: [50] gwei              │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ ☐ Only to specific addresses               │   │
│  │ ☐ Rate limiting (cooldown period)          │   │
│  │ ☐ Security monitoring                       │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  [← Previous]              [Preview Policy →]      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### Step 5: Preview & Confirm

```
┌─────────────────────────────────────────────────────┐
│  ← Edit         Step 3 of 3: Review & Activate     │
├─────────────────────────────────────────────────────┤
│  Policy Summary                                     │
│                                                     │
│  📋 Conservative Daily Transfer                     │
│                                                     │
│  This policy allows TransferBot to:                 │
│  • Transfer up to 50 USDC every 24 hours           │
│  • Only Monday-Friday, 9am-5pm EST                 │
│  • Only when gas is below 50 gwei                  │
│                                                     │
│  🔐 Required Permission                             │
│  Type: ERC20 Token Periodic Transfer               │
│  Token: USDC (0x1c7D...7238)                       │
│  Amount: 50 USDC                                    │
│  Period: 86,400 seconds (1 day)                    │
│                                                     │
│  ⚙️ Active Safeguards                              │
│  1. ✓ Maximum Amount Limit                         │
│  2. ✓ Time Window Restriction                      │
│  3. ✓ Gas Price Protection                         │
│                                                     │
│  [← Edit Policy]         [Grant Permission →]      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Component Architecture

```
PolicyBuilder (main component)
├── PolicyBasicsForm (limits: amount, currency, period)
├── PolicyConditionsForm (optional conditions)
│   ├── TimeWindowInput
│   ├── GasLimitInput
│   ├── SecurityMonitoringInput
│   ├── RecipientWhitelistInput
│   └── CooldownInput
├── PolicyPreview (compiled output, human-readable)
└── PermissionRequestButton (grants MetaMask permission)
```

### Template Library

Pre-built templates for common use cases:

1. **Conservative Daily Transfer**
   - 50 USDC/day
   - Business hours only
   - Low gas only

2. **24/7 Trading Bot**
   - 1000 USDC/day
   - No time restrictions
   - Security monitoring on

3. **Whitelist-Only Transfers**
   - 500 USDC/week
   - Only to 3 approved addresses
   - 1-hour cooldown

4. **Emergency Budget**
   - 10 USDC/day
   - Any time
   - Minimal restrictions

### Design System

**Color Palette**:
```
Primary Blue:    #3B82F6  (buttons, links, selected states)
Success Green:   #10B981  (checkmarks, valid states)
Warning Yellow:  #F59E0B  (warnings, cautions)
Error Red:       #EF4444  (errors, blocks)
Gray 50:         #F9FAFB  (backgrounds)
Gray 200:        #E5E7EB  (borders)
Gray 600:        #4B5563  (secondary text)
Gray 900:        #111827  (primary text)
```

**Typography**:
```
Headings:
  H1: 32px, bold, gray-900
  H2: 24px, semibold, gray-900
  H3: 18px, semibold, gray-900

Body:
  Large: 16px, normal, gray-900
  Regular: 14px, normal, gray-700
  Small: 12px, normal, gray-600
```

**Spacing**: 8px grid system (4px, 8px, 16px, 24px, 32px)

**Recommended Stack**:
- UI Components: shadcn/ui (Radix UI primitives + Tailwind)
- Forms: React Hook Form + Zod
- Styling: Tailwind CSS
- Icons: Heroicons or Lucide

---

## Implementation Checklist

### Phase 1: Backend Foundation (Days 1-3, ~17 hours)

#### 1.1 DSL Types & Schema
- [ ] Create `/packages/agent/src/policies/dsl/types.ts`
- [ ] Define `PolicyDocument` interface
- [ ] Define `CompiledPolicy` interface
- [ ] Create Zod schema `PolicyDocumentSchema`
- [ ] Add schema validation tests

#### 1.2 Policy Compiler
- [ ] Create `/packages/agent/src/policies/dsl/compiler.ts`
- [ ] Implement `PolicyCompiler` class
- [ ] Implement `toMetaMaskPermission()` method
- [ ] Implement `toVisorRules()` method
- [ ] Implement `generateSummary()` method
- [ ] Add error handling and validation

#### 1.3 Token Registry
- [ ] Create `/packages/agent/src/policies/dsl/tokens.ts`
- [ ] Define supported tokens (USDC, USDT, DAI, WETH)
- [ ] Token address mapping (Sepolia testnet)
- [ ] Helper functions: `getTokenAddress()`, `getDecimals()`

#### 1.4 Recipient Whitelist Rule
- [ ] Create `/packages/agent/src/policies/rules/recipient-whitelist.ts`
- [ ] Define `RecipientWhitelistConfig` interface
- [ ] Implement `recipientWhitelistRule`
- [ ] Extract recipient from transaction
- [ ] Implement whitelist/blacklist logic
- [ ] Case-insensitive address comparison

#### 1.5 Cooldown Rule
- [ ] Create `/packages/agent/src/policies/rules/cooldown.ts`
- [ ] Define `CooldownConfig` interface
- [ ] Implement `cooldownRule`
- [ ] Query last execution from database
- [ ] Calculate time elapsed
- [ ] Return appropriate PolicyResult

#### 1.6 Register New Rules
- [ ] Update `/packages/agent/src/policies/rules/index.ts`
- [ ] Import and register `recipientWhitelistRule`
- [ ] Import and register `cooldownRule`

#### 1.7 Unit Tests
- [ ] Create compiler tests
- [ ] Create recipient-whitelist rule tests
- [ ] Create cooldown rule tests

### Phase 2: API Integration (Days 4-5, ~12.5 hours)

#### 2.1 Compilation Endpoint
- [ ] Create `POST /api/policies/compile` endpoint
- [ ] Accept PolicyDocument in request body
- [ ] Validate with Zod schema
- [ ] Return CompiledPolicy response

#### 2.2 Update Adapter Installation
- [ ] Update `POST /api/adapters/install` endpoint
- [ ] Accept optional `policyDocument` in request
- [ ] Compile to get rules if provided
- [ ] Return compiled permission data

#### 2.3 Policy CRUD Endpoints
- [ ] `GET /api/policies/:userAddress/:adapterId`
- [ ] `PUT /api/policies/:userAddress/:adapterId`
- [ ] `DELETE /api/policies/:userAddress/:adapterId`

#### 2.4 Templates Endpoint
- [ ] Create `/packages/agent/src/policies/dsl/templates.ts`
- [ ] Define 4 starter templates
- [ ] Create `GET /api/policies/templates` endpoint

#### 2.5 API Testing
- [ ] Integration tests for all endpoints

### Phase 3: Frontend Basic (Days 6-8, ~19 hours)

#### 3.1 Frontend Types
- [ ] Create `/packages/web/src/types/policy.ts`
- [ ] Define PolicyDocument type
- [ ] Define CompiledPolicy type

#### 3.2 Hooks
- [ ] Create `useCompiler()` hook
- [ ] Create `useTemplates()` hook
- [ ] Integrate with API

#### 3.3 Basic Components
- [ ] Create `PolicyBasicsForm` component
- [ ] Create `PolicyPreview` component
- [ ] Create `PolicyBuilder` page

#### 3.4 Integration
- [ ] Update permission request flow
- [ ] Update adapter installation flow

### Phase 4: Frontend Advanced (Days 9-12, ~30 hours)

#### 4.1 Condition Input Components
- [ ] Create `TimeWindowInput` component
- [ ] Create `GasLimitInput` component
- [ ] Create `SecurityMonitoringInput` component
- [ ] Create `RecipientWhitelistInput` component
- [ ] Create `CooldownInput` component

#### 4.2 Advanced Policy Builder
- [ ] Create `PolicyConditionsForm` component
- [ ] Create `TemplateSelector` component
- [ ] Update PolicyBuilder with multi-step wizard
- [ ] Add progress indicator

#### 4.3 Policy Editing
- [ ] Create `PolicyEditor` page
- [ ] Fetch existing policy
- [ ] Save changes functionality

#### 4.4 UI Polish
- [ ] Design system consistency
- [ ] Accessibility improvements
- [ ] Loading & error states

### Phase 5: Testing & Documentation (Days 13-14, ~23 hours)

#### 5.1 End-to-End Tests
- [ ] Complete flow with transfer-bot
- [ ] Policy blocks transaction scenario
- [ ] Template usage test

#### 5.2 Edge Case Testing
- [ ] Large amounts, zero amounts
- [ ] Invalid addresses
- [ ] Time window edge cases
- [ ] All conditions enabled simultaneously

#### 5.3 Browser Testing
- [ ] Chrome, Firefox, Safari
- [ ] Mobile (iOS Safari, Android Chrome)

#### 5.4 Documentation
- [ ] User documentation
- [ ] Developer documentation
- [ ] API documentation
- [ ] Code comments (JSDoc)

### Phase 6: Deployment (Day 15, ~10 hours)

#### 6.1 Migration & Compatibility
- [ ] Database migration (if needed)
- [ ] Backward compatibility testing

#### 6.2 Performance
- [ ] Benchmark compilation speed
- [ ] Benchmark rule evaluation
- [ ] Frontend Lighthouse audit

#### 6.3 Deployment
- [ ] Environment variables check
- [ ] Build verification
- [ ] Deploy to staging
- [ ] Deploy to production

---

## Testing Strategy

### Unit Tests

```typescript
describe('PolicyCompiler', () => {
  it('compiles basic policy to MetaMask permission', () => {
    const policy = {
      version: "2024-01-01",
      name: "Daily Transfer",
      limits: { amount: "100", currency: "USDC", period: "daily" }
    };

    const compiled = compiler.compile(policy);

    expect(compiled.valid).toBe(true);
    expect(compiled.permission.type).toBe("erc20-token-periodic");
    expect(compiled.permission.data.allowance).toBe(parseUnits("100", 6));
  });

  it('compiles conditions to 0xVisor rules', () => {
    const policy = {
      version: "2024-01-01",
      name: "Business Hours Only",
      limits: { amount: "100", currency: "USDC", period: "daily" },
      conditions: {
        timeWindow: {
          days: [1, 2, 3, 4, 5],
          startHour: 9,
          endHour: 17,
          timezone: "America/New_York"
        }
      }
    };

    const compiled = compiler.compile(policy);

    expect(compiled.rules).toContainEqual(
      expect.objectContaining({
        policyType: "time-window",
        isEnabled: true
      })
    );
  });
});
```

### Integration Tests

```typescript
describe('Policy DSL End-to-End', () => {
  it('complete flow: build → compile → grant → execute', async () => {
    // 1. User builds policy
    const policy = { /* ... */ };

    // 2. Compile
    const compiled = await fetch('/api/policies/compile', {
      method: 'POST',
      body: JSON.stringify(policy)
    });

    // 3. Grant permission
    const permission = await grantPermission(compiled.permission);

    // 4. Install adapter with compiled rules
    await installAdapter(adapterId, compiled.rules);

    // 5. Execute transaction
    const result = await executeAdapter(adapterId);

    expect(result.decision).toBe("ALLOW");
  });
});
```

### Security Considerations

**Input Validation**:
- Zod schema validates all PolicyDocument fields
- Amount limits must be positive
- Time windows must be valid (0-23 hours, 0-6 days)
- Addresses must be valid hex strings

**Permission Scope**:
- MetaMask permission is derived from policy (can't be broader)
- 0xVisor rules further restrict beyond MetaMask
- Users see both layers in preview

**Rate Limiting**:
- Cooldown rule prevents rapid-fire transactions
- Period limits (daily/weekly/monthly) enforced by MetaMask

**Address Validation**:
- Recipient whitelist/blacklist uses checksummed addresses
- Case-insensitive comparison to prevent bypass

---

## Success Criteria

MVP is considered complete when:
- [ ] User can select transfer-bot adapter
- [ ] User can build policy with limits
- [ ] User can add at least 2 optional conditions
- [ ] Policy compiles to valid MetaMask permission
- [ ] Policy compiles to valid 0xVisor rules
- [ ] User can grant permission through MetaMask
- [ ] Adapter execution respects policy rules
- [ ] At least 1 template works end-to-end
- [ ] All unit tests pass
- [ ] At least 1 E2E test passes
- [ ] Documentation covers basic usage

---

## Future Enhancements (Post-MVP)

### 1. Custom Rules
Allow users to write JavaScript rules

### 2. Conditional Limits
Dynamic limits based on conditions

### 3. Multi-Factor Auth (2FA)
Require 2FA for high-value transactions

### 4. AI-Powered Policy Builder
Natural language → PolicyDocument conversion

### 5. Policy Analytics
Dashboard showing policy enforcement history

### 6. Visual Policy Builder
Drag-and-drop flow diagram

### 7. Policy Marketplace
Community-contributed templates

---

## Resources

### External Documentation
- MetaMask Advanced Permissions: https://docs.metamask.io/wallet/concepts/advanced-permissions/
- ERC-7710 Delegation: https://eips.ethereum.org/EIPS/eip-7710
- ERC-7715 Permissions: https://eips.ethereum.org/EIPS/eip-7715
- AWS IAM Policy Grammar: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_grammar.html

### Internal Documentation
- Adapter API: `/packages/agent/src/adapters/types.ts`
- Policy Engine: `/packages/agent/src/policies/engine.ts`
- Policy Rules: `/packages/agent/src/policies/rules/`
- Signals: `/packages/agent/src/signals/`

---

## Conclusion

The Policy DSL transforms 0xVisor from a permission-granting system to a policy-driven automation platform. By putting policy-building first, we empower users to define exactly what they want to allow, and the system automatically derives the necessary technical permissions.

The progressive disclosure UI makes this accessible to non-technical users while still providing power users with fine-grained control. The compiler acts as the bridge between human-readable intent and machine-executable rules.

This architecture positions 0xVisor as a best-in-class solution for secure, user-controlled automation - inspired by AWS IAM but designed for the web3 context.

---

**Last Updated**: 2025-12-30
**Status**: Design & Planning Complete, Implementation In Progress
