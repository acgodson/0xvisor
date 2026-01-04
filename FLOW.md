┌─────────────────────────────────────────────────────────────────────────────┐
  │                         0XVISOR SYSTEM ARCHITECTURE                         │
  └─────────────────────────────────────────────────────────────────────────────┘

  ═══════════════════════════════════════════════════════════════════════════════
   PHASE 1: ADAPTER INSTALLATION & POLICY SETUP
  ═══════════════════════════════════════════════════════════════════════════════

  ┌──────────────┐
  │ User Wallet  │ (MetaMask - 0x123...)
  └──────┬───────┘
         │ 1. Browse adapters
         ├─────────────────────────────────────────────────────┐
         │                                                     │
         ▼                                                     ▼
  ┌────────────────────┐                            ┌──────────────────┐
  │ /adapters page     │                            │ Adapter Registry │
  │ (Next.js)          │◄───────────────────────────│ (@0xvisor/agent) │
  └────────┬───────────┘  2. List available         └──────────────────┘
           │              adapters metadata           - transfer-bot
           │                                           - swap-bot
           │ 3. Select "transfer-bot"                  - dca-bot
           │ Click "Install Adapter"
           ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ /adapters/transfer-bot/policy (Policy Builder)                             │
  │                                                                             │
  │  ┌─────────────────┐        ┌──────────────────┐                          │
  │  │ Template Grid   │        │ Policy Form      │                          │
  │  │ - Conservative  │───────▶│ - Token: USDC    │                          │
  │  │ - Balanced      │        │ - Amount: 0.1    │                          │
  │  │ - Aggressive    │        │ - Period: daily  │                          │
  │  └─────────────────┘        │ - Conditions:    │                          │
  │                             │   * Time window  │                          │
  │  4. User fills form         │   * Gas limit    │                          │
  │                             │   * Security     │                          │
  │                             └────────┬─────────┘                          │
  │                                      │ 5. Real-time compilation            │
  │                                      ▼                                     │
  │                             ┌──────────────────┐                          │
  │                             │ Policy Compiler  │                          │
  │                             │ (dsl/compiler.ts)│                          │
  │                             └────────┬─────────┘                          │
  │                                      │                                     │
  └──────────────────────────────────────┼─────────────────────────────────────┘
                                         │
                                         ▼
                          ┌──────────────────────────────┐
                          │ Compiled Policy Output       │
                          │                              │
                          │ MetaMask Permission:         │
                          │  - type: erc20-token-periodic│
                          │  - token: 0x1c7D...          │
                          │  - allowance: 100000         │
                          │  - period: 86400             │
                          │                              │
                          │ 0xVisor Rules:               │
                          │  - amount-limit: 0.1 USDC    │
                          │  - time-window: 9am-5pm      │
                          │  - gas-limit: 50 gwei        │
                          │  - security-pause: enabled   │
                          └──────────────┬───────────────┘
                                         │ 6. Store in localStorage
                                         │ Redirect to /dashboard
                                         ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ /dashboard (Permission Grant)                                              │
  │                                                                             │
  │  ┌────────────────────────────────────────────────────────────────┐        │
  │  │ Grant Permission Card                                          │        │
  │  │  Policy: "Daily USDC Transfer"                                 │        │
  │  │  Summary: Transfer 0.1 USDC daily, 9am-5pm, max 50 gwei       │        │
  │  │                                                                 │        │
  │  │  [ Grant Permission ] ◄── 7. User clicks                       │        │
  │  └─────────────────────────────┬──────────────────────────────────┘        │
  └─────────────────────────────────┼─────────────────────────────────────────┘
                                    │
                                    ▼
                      ┌─────────────────────────────┐
                      │ usePermission hook          │
                      │ hooks/usePermission.ts:58   │
                      └─────────────┬───────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
  ┌──────────────┐        ┌──────────────────┐      ┌─────────────────┐
  │ 8a. Create   │        │ 8b. MetaMask     │      │ 8c. Store in DB │
  │ Session      │        │ Wallet Signature │      │ - Permission    │
  │ Account      │        │ (ERC-7715)       │      │ - Session       │
  │              │        │                  │      │ - UserPolicy    │
  │ session/     │        │ DelegationManager│      │                 │
  │ manager.ts   │        │ 0xdb9B...        │      │ web/db/         │
  └──────────────┘        └──────────────────┘      └─────────────────┘
        │                           │                           │
        │ Returns:                  │ Returns:                  │
        │ sessionAddress:           │ delegationHash:           │
        │ 0xABC... (Smart Account)  │ 0x789...                  │
        └───────────────────────────┴───────────────────────────┘
                                    │
                                    ▼
                      ┌─────────────────────────────┐
                      │ 9. Install Adapter          │
                      │ tRPC: adapters.install      │
                      │ routers/adapters.ts:40      │
                      └─────────────┬───────────────┘
                                    │
                                    ▼
                            ┌───────────────┐
                            │ installed_    │
                            │ adapters      │
                            │ table         │
                            │               │
                            │ - id: 1       │
                            │ - userAddress │
                            │ - adapterId   │
                            │ - config      │
                            │ - permissionId│
                            │ - isActive    │
                            └───────────────┘

  ═══════════════════════════════════════════════════════════════════════════════
   PHASE 2: SIGNAL MONITORING (Continuous Background Process)
  ═══════════════════════════════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────────────────────────────┐
  │ On-Chain Events (Sepolia Testnet)                                       │
  └──────────────────────────────────────────────────────────────────────────┘
             │
             │ RedeemedDelegation, EnabledDelegation, DisabledDelegation
             ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ Envio Indexer (HyperIndex)                                             │
  │ packages/indexer/                                                       │
  │                                                                         │
  │  ┌────────────────────────────────────────────────────────────┐        │
  │  │ EventHandlers.ts                                           │        │
  │  │                                                             │        │
  │  │  1. Capture events                                         │        │
  │  │  2. Store in database (Redemption, Stats)                 │        │
  │  │  3. Anomaly Detection:                                     │        │
  │  │     - Check global frequency (>10/hour)                   │        │
  │  │     - Check user frequency (>5/hour)                      │        │
  │  │  4. Create SecurityAlert if threshold exceeded            │        │
  │  │  5. Send Telegram notification                            │        │
  │  └────────────────────────────────────────────────────────────┘        │
  │                                                                         │
  │  GraphQL API: https://indexer.dev.hyperindex.xyz/.../v1/graphql       │
  └─────────────────────────────────────────────────────────────────────────┘
             │
             │ Exposed via GraphQL
             ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ Signal System (packages/agent/src/signals/)                            │
  │                                                                         │
  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────┐ │
  │  │ Gas Signal   │  │ Time Signal  │  │ Envio Signal                 │ │
  │  │              │  │              │  │                              │ │
  │  │ - Sepolia RPC│  │ - Current UTC│  │ - Query Envio GraphQL       │ │
  │  │ - Base fee   │  │ - Hour       │  │ - Fetch SecurityAlert       │ │
  │  │ - Standard   │  │ - Weekend?   │  │ - Fetch Stats               │ │
  │  └──────────────┘  └──────────────┘  │ - Fetch recent Redemptions  │ │
  │                                      │                              │ │
  │                                      │ Client-side anomaly check    │ │
  │                                      └──────────────────────────────┘ │
  └─────────────────────────────────────────────────────────────────────────┘
             │
             │ fetchAllSignals()
             ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ Dashboard UI (Auto-refresh every 10s)                                  │
  │ components/SignalStatusWidget.tsx                                      │
  │                                                                         │
  │  ┌──────────────────────────────────────────────────────────┐          │
  │  │ ● Gas Price: 2.45 gwei (Base: 0.0012)                   │          │
  │  │ ● Current Time: 14:32 UTC (Weekday)                     │          │
  │  │ ● Envio Indexer: Connected                              │          │
  │  │                                                          │          │
  │  │   Stats: 142 Redemptions | 98 Granted | 44 Revoked     │          │
  │  │                                                          │          │
  │  │   ● 2 Active Alerts                                     │          │
  │  │   CRITICAL: User 0x123... has 6 redemptions in last hour│          │
  │  │   HIGH: Unusual activity - 12 redemptions globally      │          │
  │  └──────────────────────────────────────────────────────────┘          │
  └─────────────────────────────────────────────────────────────────────────┘

  ═══════════════════════════════════════════════════════════════════════════════
   PHASE 3: EXECUTION FLOW (Manual or Scheduled)
  ═══════════════════════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────────────────────────────┐
  │ Execution Trigger                                                       │
  ├─────────────────────────────────────────────────────────────────────────┤
  │                                                                         │
  │  Option A: Manual (Adapter Playground)                                 │
  │  ┌────────────────────────────────────────┐                            │
  │  │ AdapterPlayground Component            │                            │
  │  │  Recipient: [0x456...]                 │                            │
  │  │  [Execute Transfer] ◄── User clicks    │                            │
  │  └────────────────────────────────────────┘                            │
  │                                                                         │
  │  Option B: Scheduled (Future: Cron job)                                │
  │  ┌────────────────────────────────────────┐                            │
  │  │ Cron Scheduler (not yet implemented)   │                            │
  │  │  "0 9 * * *" → trigger at 9am daily    │                            │
  │  └────────────────────────────────────────┘                            │
  └─────────────────────────────────────────────────────────────────────────┘
             │
             │ Both routes lead to same execution flow
             ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ tRPC Execute Router                                                     │
  │ web/src/trpc/routers/execute.ts:20                                     │
  │                                                                         │
  │  Input: { userAddress, adapterId, runtimeParams: { recipient } }      │
  └─────────────────────────────────────────────────────────────────────────┘
             │
             ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ STEP 1: Validate Installation                                          │
  │ execute.ts:42-56                                                        │
  │                                                                         │
  │  DB Query: installedAdapters                                           │
  │   WHERE userAddress = 0x123...                                         │
  │     AND adapterId = "transfer-bot"                                     │
  │     AND isActive = true                                                │
  │                                                                         │
  │  ✓ Found → Continue                                                    │
  │  ✗ Not found → Return ERROR                                            │
  └─────────────────────────────────────────────────────────────────────────┘
             │
             ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ STEP 2: Get Adapter Definition                                         │
  │ execute.ts:58-66                                                        │
  │                                                                         │
  │  getAdapter("transfer-bot") from registry                              │
  │  Returns: Adapter interface with proposeTransaction()                  │
  └─────────────────────────────────────────────────────────────────────────┘
             │
             ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ STEP 3: Validate Permission                                            │
  │ execute.ts:68-81                                                        │
  │                                                                         │
  │  DB Query: permissions WHERE id = installed.permissionId               │
  │                                                                         │
  │  ✓ Found → delegationData available                                    │
  │  ✗ Not found → Return ERROR                                            │
  └─────────────────────────────────────────────────────────────────────────┘
             │
             ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ STEP 4: Validate Session                                               │
  │ execute.ts:84-97                                                        │
  │                                                                         │
  │  DB Query: sessionAccounts                                             │
  │   WHERE userAddress = 0x123...                                         │
  │     AND adapterId = "transfer-bot"                                     │
  │                                                                         │
  │  Returns: { address, encryptedPrivateKey, deployParams }              │
  │                                                                         │
  │  ✓ Found → Session 0xABC... (Smart Account)                           │
  │  ✗ Not found → Return ERROR                                            │
  └─────────────────────────────────────────────────────────────────────────┘
             │
             ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ STEP 5: Propose Transaction                                            │
  │ execute.ts:100-126                                                      │
  │                                                                         │
  │  adapter.proposeTransaction({                                          │
  │    userAddress: 0x123...,                                              │
  │    config: { tokenAddress, amountPerTransfer, decimals },             │
  │    permissionData: delegationData,                                     │
  │    runtimeParams: { recipient: 0x456... }                             │
  │  })                                                                     │
  │                                                                         │
  │  ↓ Adapter Logic (adapters/transfer-bot.ts:62-91)                     │
  │                                                                         │
  │  1. Parse config (USDC address, 0.1 amount, 6 decimals)               │
  │  2. Get recipient from runtimeParams (0x456...)                       │
  │  3. Encode ERC20 transfer call data:                                   │
  │     transfer(0x456..., 100000) // 0.1 USDC = 100000 units             │
  │  4. Return ProposedTransaction:                                        │
  │     {                                                                   │
  │       target: 0x1c7D... (USDC contract),                              │
  │       value: 0,                                                        │
  │       callData: 0xa9059cbb...,                                         │
  │       description: "Transfer 0.1 tokens to 0x456...",                 │
  │       tokenAddress: 0x1c7D...,                                         │
  │       tokenAmount: 100000n,                                            │
  │       recipient: 0x456...                                              │
  │     }                                                                   │
  └─────────────────────────────────────────────────────────────────────────┘
             │
             ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ STEP 6: Fetch All Signals                                              │
  │ execute.ts:139 → policyEngine.evaluate() → engine.ts:44                │
  │                                                                         │
  │  fetchAllSignals() returns:                                            │
  │  {                                                                      │
  │    gas: { standard: 2.45, baseFee: 0.0012 },                          │
  │    time: { now: Date, hour: 14, isWeekend: false },                   │
  │    envio: {                                                            │
  │      envioConnected: true,                                             │
  │      alerts: [                                                         │
  │        {                                                               │
  │          alertType: "user-high-frequency",                            │
  │          severity: "critical",                                         │
  │          message: "User has 6 redemptions in last hour"               │
  │        }                                                               │
  │      ],                                                                │
  │      stats: { totalRedemptions: 142, ... },                           │
  │      recentRedemptions: [...]                                          │
  │    }                                                                    │
  │  }                                                                      │
  └─────────────────────────────────────────────────────────────────────────┘
             │
             ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ STEP 7: Policy Engine Evaluation                                       │
  │ packages/agent/src/policies/engine.ts:29-84                           │
  │                                                                         │
  │  Input:                                                                 │
  │   - userAddress: 0x123...                                              │
  │   - adapterId: "transfer-bot"                                          │
  │   - proposedTx: { target, value, callData, ... }                      │
  │   - signals: { gas, time, envio }                                      │
  │                                                                         │
  │  Process:                                                               │
  │   1. Load user policies from DB (user_policies table)                 │
  │   2. Create evaluation context:                                        │
  │      {                                                                  │
  │        userAddress, adapterId, proposedTx, signals,                   │
  │        timestamp, lastExecutionTime                                    │
  │      }                                                                  │
  │   3. Loop through enabled policies:                                    │
  │                                                                         │
  │  ┌─────────────────────────────────────────────────────────┐           │
  │  │ Policy 1: amount-limit                                 │           │
  │  │ policies/rules/amount-limit.ts                         │           │
  │  │                                                         │           │
  │  │ Check: proposedTx.tokenAmount <= maxAmount            │           │
  │  │ Result: 100000 <= 100000 ✓ ALLOW                      │           │
  │  └─────────────────────────────────────────────────────────┘           │
  │                                                                         │
  │  ┌─────────────────────────────────────────────────────────┐           │
  │  │ Policy 2: time-window                                  │           │
  │  │ policies/rules/time-window.ts                          │           │
  │  │                                                         │           │
  │  │ Check: context.signals.time.hour in [9-17]            │           │
  │  │ Result: 14 in [9-17] ✓ ALLOW                          │           │
  │  └─────────────────────────────────────────────────────────┘           │
  │                                                                         │
  │  ┌─────────────────────────────────────────────────────────┐           │
  │  │ Policy 3: gas-limit                                     │           │
  │  │ policies/rules/gas-limit.ts                            │           │
  │  │                                                         │           │
  │  │ Check: context.signals.gas.standard <= maxGas         │           │
  │  │ Result: 2.45 <= 50 ✓ ALLOW                            │           │
  │  └─────────────────────────────────────────────────────────┘           │
  │                                                                         │
  │  ┌─────────────────────────────────────────────────────────┐           │
  │  │ Policy 4: security-pause                               │           │
  │  │ policies/rules/security-pause.ts:18-56                 │           │
  │  │                                                         │           │
  │  │ Check: context.signals.envio.alerts.length > 0         │           │
  │  │ Result: alerts = [{ severity: "critical", ... }]      │           │
  │  │                                                         │           │
  │  │ Filter by severity: ["high", "critical"]               │           │
  │  │ relevantAlerts = 1 alert found                         │           │
  │  │                                                         │           │
  │  │ Decision: ✗ BLOCK                                      │           │
  │  │ Reason: "Security alert active: CRITICAL - User..."   │           │
  │  └─────────────────────────────────────────────────────────┘           │
  │                                                                         │
  │  Final Result:                                                          │
  │  {                                                                      │
  │    allowed: false,                                                     │
  │    blockingPolicy: "security-pause",                                   │
  │    blockingReason: "Security alert active: CRITICAL...",              │
  │    decisions: [                                                        │
  │      { policyType: "amount-limit", allowed: true },                   │
  │      { policyType: "time-window", allowed: true },                    │
  │      { policyType: "gas-limit", allowed: true },                      │
  │      { policyType: "security-pause", allowed: false }                 │
  │    ]                                                                    │
  │  }                                                                      │
  └─────────────────────────────────────────────────────────────────────────┘
             │
             ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ STEP 8: Log Execution Attempt                                          │
  │ execute.ts:159-166                                                      │
  │                                                                         │
  │  INSERT INTO execution_logs:                                           │
  │  {                                                                      │
  │    userAddress: 0x123...,                                              │
  │    adapterId: "transfer-bot",                                          │
  │    proposedTx: {...},                                                  │
  │    decision: "BLOCK",                                                  │
  │    reason: "Security alert active...",                                 │
  │    policyResults: [...],                                               │
  │    executedAt: 2026-01-03T14:32:00Z                                   │
  │  }                                                                      │
  └─────────────────────────────────────────────────────────────────────────┘
             │
             ├─────────────────────────────────────────────────────────────┐
             │                                                             │
             ▼ If BLOCKED                                                  ▼ If ALLOWED
  ┌──────────────────────────┐                              ┌──────────────────────────┐
  │ STEP 9a: Return BLOCK    │                              │ STEP 9b: Execute on-chain│
  │ execute.ts:169-176        │                              │ execute.ts:181-203       │
  │                           │                              │                          │
  │ Return to user:           │                              │ executor.executeAdapter({│
  │ {                         │                              │   userAddress,           │
  │   success: true,          │                              │   adapter,               │
  │   decision: "BLOCK",      │                              │   session: {             │
  │   reason: "Security..."   │                              │     address: 0xABC...,   │
  │ }                         │                              │     encryptedPrivateKey, │
  │                           │                              │     deployParams         │
  │ User sees yellow warning  │                              │   },                     │
  │ in Adapter Playground     │                              │   installedAdapterData,  │
  └───────────────────────────┘                              │   runtimeParams,         │
                                                             │   permissionDelegationData│
                                                             │ })                       │
                                                             │                          │
                                                             │ ↓ Executor Logic         │
                                                             │   (executor/index.ts)    │
                                                             │                          │
                                                             │ 1. Decrypt session key   │
                                                             │ 2. Create viem client    │
                                                             │ 3. Redeem delegation     │
                                                             │    (ERC-7715)            │
                                                             │ 4. Send transaction      │
                                                             │ 5. Wait for receipt      │
                                                             │                          │
                                                             │ Return:                  │
                                                             │ {                        │
                                                             │   success: true,         │
                                                             │   decision: "ALLOW",     │
                                                             │   txHash: 0xDEF...       │
                                                             │ }                        │
                                                             └──────────┬───────────────┘
                                                                        │
                                                                        ▼
                                                             ┌──────────────────────────┐
                                                             │ On-Chain Transaction     │
                                                             │                          │
                                                             │ From: 0xABC... (Session) │
                                                             │ To: 0x1c7D... (USDC)     │
                                                             │ Data: transfer(0x456...) │
                                                             │                          │
                                                             │ Delegation verified ✓    │
                                                             │ Tx confirmed ✓           │
                                                             └──────────┬───────────────┘
                                                                        │
                                                                        ▼
                                                             ┌──────────────────────────┐
                                                             │ Update execution_logs    │
                                                             │ SET txHash = 0xDEF...    │
                                                             │                          │
                                                             │ Update installed_adapters│
                                                             │ SET lastRun = NOW()      │
                                                             └──────────────────────────┘

  ═══════════════════════════════════════════════════════════════════════════════
   PHASE 4: EVENT MONITORING & FEEDBACK LOOP
  ═══════════════════════════════════════════════════════════════════════════════

                          On-Chain Transaction Confirmed
                                      │
                                      ▼
                          ┌────────────────────────┐
                          │ DelegationManager      │
                          │ emits:                 │
                          │ RedeemedDelegation()   │
                          └────────────┬───────────┘
                                       │
                                       ▼
                          ┌────────────────────────┐
                          │ Envio Indexer          │
                          │ Captures event         │
                          │                        │
                          │ Stores Redemption      │
                          │ Updates Stats          │
                          │ Checks anomalies       │
                          │                        │
                          │ If suspicious:         │
                          │ → Create SecurityAlert │
                          │ → Send Telegram alert  │
                          └────────────┬───────────┘
                                       │
                                       ▼
                          ┌────────────────────────┐
                          │ Next Execution Request │
                          │ fetches signals again  │
                          │                        │
                          │ NEW alerts appear      │
                          │ → May BLOCK future txs │
                          └────────────────────────┘

  ═══════════════════════════════════════════════════════════════════════════════
   DATA FLOW SUMMARY
  ═══════════════════════════════════════════════════════════════════════════════

  Frontend (Next.js)
      ↕
  tRPC API Layer (routers/*)
      ↕
  Backend Services (@0xvisor/agent)
      ├─ Policy Compiler (DSL → Rules)
      ├─ Policy Engine (Evaluate with signals)
      ├─ Session Manager (Create smart accounts)
      ├─ Adapter Registry (Propose transactions)
      ├─ Executor (Execute with ERC-7715)
      └─ Signals (Gas, Time, Envio)
          ↕
  External Services
      ├─ Sepolia RPC (Gas prices, chain state)
      ├─ Envio GraphQL (Security alerts, stats)
      └─ Telegram Bot (Notifications)
          ↕
  Smart Contracts (Sepolia)
      ├─ DelegationManager (0xdb9B...)
      ├─ USDC (0x1c7D...)
      └─ Session Smart Accounts (0xABC...)

  Database (Vercel Postgres)
      ├─ installed_adapters (User installations)
      ├─ permissions (Granted delegations)
      ├─ session_accounts (Per-adapter sessions)
      ├─ user_policies (Compiled rules)
      └─ execution_logs (Audit trail)

  ═══════════════════════════════════════════════════════════════════════════════
   KEY ARCHITECTURE DECISIONS
  ═══════════════════════════════════════════════════════════════════════════════

  1. ONE Session Account per (User + Adapter) combination
     - User 0x123... can have:
       * Session 0xAAA... for transfer-bot (USDC)
       * Session 0xBBB... for transfer-bot (USDT)
       * Session 0xCCC... for dca-bot
     - Each session has isolated permissions

  2. Policy Engine runs BEFORE execution
     - All policies must pass (allowed: true)
     - Any single BLOCK → entire execution blocked
     - Logged to execution_logs for audit

  3. Signals are fetched fresh for each execution
     - Real-time gas prices
     - Current time/date
     - Latest security alerts from Envio
     - No caching to ensure safety

  4. Dual-layer anomaly detection
     - Server-side: Envio indexer creates SecurityAlert entities
     - Client-side: envio-signal.ts validates again (backup)
     - Both feed into security-pause policy rule

  5. Complete audit trail
     - Every execution attempt logged (ALLOW/BLOCK/ERROR)
     - Policy evaluation results stored
     - Transaction hashes linked for forensics

  This flow shows the complete lifecycle f