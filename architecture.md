
# 0xVisor: Proposed Project Specification

## Document Purpose


## Part 1: Problem Space & Solution Discovery

### The Problem with Current Permissions

MetaMask Advanced Permissions (ERC-7715) allows users to grant dApps the ability to execute transactions on their behalf. This is powerful but introduces a critical gap:

**Current state:** Permission granted = transactions executed blindly. Once you give a dApp permission to spend your tokens, you have zero runtime control. The dApp can execute whenever it wants, at any gas price, for any amount up to the limit.

**The missing layer:** There's no policy evaluation between "permission exists" and "transaction executes." Users need guardrails.

### How We Arrived at 0xVisor

We explored several approaches before landing on the final architecture:

**Initial exploration:** We considered building a simple DCA bot or subscription service on top of Advanced Permissions. But these are just consumer apps—they don't solve the underlying control problem.

**Key insight:** The real opportunity isn't building another automation app. It's building the infrastructure layer that sits between permissions and execution. Other apps execute blindly; 0xVisor evaluates first.

**Model consideration:** We debated B2B (0xVisor as infrastructure for other dApps) vs B2C (users come directly to 0xVisor). For the hackathon, we chose B2C because:
- Simpler to demo
- Full control over the experience
- Can pitch B2B as future vision

### The Three Pillars Framework

We developed a mental model to explain 0xVisor's value:

| Pillar | Role | Question Answered |
|--------|------|-------------------|
| **Adapters** | Define automation logic | WHAT should we execute? |
| **Policies** | Define safety rules | WHEN is it safe to execute? |
| **Signals** | Provide external data | WITH WHAT context do we decide? |

This framework emerged from asking: "What does a user need to trust an automation system?"
- They need to know what it will do (Adapters)
- They need control over when it acts (Policies)
- They need the system to be aware of real-world conditions (Signals)

### Key Questions We Resolved

Before finalizing the architecture, we worked through several critical questions:

**Q1: Who controls the session account keys?**
- Options: User holds keys | 0xVisor holds keys | Shared custody
- Resolution: **0xVisor holds keys** (encrypted in database)
- Rationale: This is the intended design per MetaMask documentation. The session account is a delegate that acts on behalf of the user. 0xVisor needs the keys to sign UserOperations when adapters trigger.

**Q2: What's the permission grant flow?**
- Options: Grant during adapter install | Grant lazily on first execution | Separate UI step
- Resolution: **Separate UI step**
- Rationale: Demo-friendly, makes the permission grant visible and explicit, better UX clarity

**Q3: Should we do real swaps or mock them?**
- Options: Real Uniswap swaps | Mock contract | Simulated responses
- Resolution: **Real testnet swaps** (with fallback to mock if liquidity issues)
- Rationale: More impressive for judges, verifiable on-chain, proves the system actually works

**Q4: How do we store session keys for multi-user access?**
- Options: Environment variables | Encrypted in SQLite | External key management
- Resolution: **Encrypted in SQLite**
- Rationale: Dynamic (supports multiple users), works with serverless (Vercel), judges can test without sharing env vars

**Q5: Adapter marketplace model?**
- Options: Open third-party marketplace | Curated adapters | Hardcoded system adapters
- Resolution: **Hardcoded "System Adapters"** for hackathon
- Rationale: Scope control. Third-party marketplace is future vision, not MVP.

**Q6: Do we need a rules marketplace?**
- Resolution: **No**
- Rationale: Built-in template suggestions are sufficient. A marketplace adds complexity without demo value.

---

## Part 2: Architecture Specification

### Core Concept (One Paragraph)

0xVisor is a policy-aware automation platform for MetaMask Advanced Permissions. Users connect their wallet, and 0xVisor generates a session account (an EOA that 0xVisor controls). Users grant ERC-7715 permissions to this session account, then install automation adapters (like SwapBot or DCA Bot). When an adapter triggers, it proposes a transaction. Before executing, 0xVisor's policy engine evaluates the proposal against user-configured rules (gas limits, time windows, amount caps, security alerts). Only if all policies pass does 0xVisor execute the transaction via the session account. Every decision is logged, and Envio indexes on-chain events for monitoring and alerts.

### System Components

**Frontend (Next.js, to be hosted on Vercel)**
- Landing page explaining the value proposition
- Dashboard as the main interface showing:
  - Connected wallet and session account info
  - Installed adapters with status and last run time
  - Policy toggles with configuration options
  - Signal status indicators (gas, time, envio connection)
  - Activity feed showing execution history with decisions
- Permission grant flow as a separate, explicit UI step
- Adapter marketplace (hardcoded list for hackathon)
- Adapter configuration modal for setting parameters
- Policy configuration modal for adjusting thresholds

**Backend Agent (Node.js + Express, hosted on Railway)**
- Session Manager: Creates one session account per user, generates EOA keypair, encrypts private key with AES-256-GCM, stores in SQLite, loads wallet client on demand for signing
- Permission Storage: Stores granted ERC-7715 permissions with delegation data, tracks active/expired status
- Adapter Registry: Holds definitions for SwapBot and DCA Bot, each adapter knows how to propose transactions (encode Uniswap calldata), validates its own config schema
- Policy Engine: Loads user's enabled policies (global and per-adapter), fetches current signals, evaluates each policy in sequence, returns ALLOW with reasons or BLOCK with the failing policy and reason
- Signal Fetcher: Queries gas price from RPC, provides current time info, queries Envio for alerts and anomalies
- Executor: Orchestrates the full flow—loads adapter, calls proposeTransaction, runs policy evaluation, logs decision, would submit UserOperation via Pimlico if ALLOW (mocked for hackathon MVP)
- Database: SQLite with Drizzle ORM, tables for session_accounts, permissions, installed_adapters, user_policies, execution_logs, security_alerts

**Indexer (Envio HyperIndex, hosted on Envio's free tier)**
- Watches DelegationManager contract on Sepolia
- Indexes three event types: RedeemedDelegation, EnabledDelegation, DisabledDelegation
- Stores events with block number, timestamp, transaction hash, involved addresses
- Tracks statistics: total redemptions, per-user activity, delegation counts
- Detects anomalies: flags if more than 10 redemptions per hour (configurable)
- Sends Telegram alerts for new events (not historical sync)
- Exposes GraphQL API for dashboard queries and signal fetching

**Blockchain Interactions (Sepolia Testnet)**
- DelegationManager: Retrieved dynamically via MetaMask SDK's getDeleGatorEnvironment(sepolia.id).DelegationManager
- Uniswap V3 Router: 0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E for real swaps
- USDC: 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238 (Circle's testnet USDC)
- WETH: 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14
- Pimlico: Bundler service for submitting UserOperations

### Adapters (Detailed)

**SwapBot**
- Purpose: Automatically swap tokens on a schedule
- Trigger: Cron (default: daily at 9 AM UTC) or manual
- Configuration: tokenIn address, tokenOut address, amount per swap, decimals, slippage tolerance, custom schedule
- Proposes: Uniswap V3 exactInputSingle call with encoded parameters
- Required permission: erc20-token-periodic

**DCA Bot**
- Purpose: Dollar-cost average into a target token
- Trigger: Cron (daily, weekly, biweekly, or monthly) or manual
- Configuration: stablecoin address (input), target token address (output), amount per purchase, frequency
- Proposes: Same Uniswap V3 call structure as SwapBot
- Required permission: erc20-token-periodic

Both adapters propose transactions but never execute them directly. They return a ProposedTransaction object containing target address, value, calldata, description, and token metadata. The executor handles everything after proposal.

### Policies (Detailed)

**Gas Limit Policy**
- Purpose: Prevent execution when gas prices are high
- Default config: maxGwei = 50
- Evaluation: Fetches gas signal, compares current gas price to threshold
- Block reason example: "Gas too high: 120.5 gwei exceeds 50 gwei limit"
- Allow reason example: "Gas OK: 32.1 gwei"

**Time Window Policy**
- Purpose: Only allow execution during specific hours and days
- Default config: startHour = 9, endHour = 17, daysOfWeek = [1,2,3,4,5] (weekdays), timezone = UTC
- Evaluation: Fetches time signal, checks if current hour is within window and current day is allowed
- Block reason example: "Outside time window: 22:00 UTC not in 9:00-17:00"
- Block reason example: "Not a valid day: Sat not in allowed days"

**Max Amount Policy**
- Purpose: Limit the size of any single transaction
- Default config: maxAmount = 100 (in token units), decimals = 6
- Evaluation: Extracts token amount from proposed transaction, compares to threshold
- Block reason example: "Amount too high: 150 exceeds 100 limit"

**Security Pause Policy**
- Purpose: Halt all execution when security alerts are active
- Default config: pauseOnAnyAlert = true, alertSeverities = ["high", "critical"]
- Evaluation: Fetches envio signal, checks for active alerts matching criteria
- Block reason example: "Security alert active: high: Unusual redemption frequency detected"

Policies are evaluated in sequence. The first policy that returns BLOCK stops evaluation. All policies must pass for execution to proceed.

### Signals (Detailed)

**Gas Signal**
- Source: Sepolia RPC via viem's getGasPrice and getBlock
- Returns: standard (gwei), baseFee (gwei), raw (wei as string), timestamp
- Used by: Gas Limit Policy

**Time Signal**
- Source: System clock
- Returns: now (ISO string), hour (0-23 UTC), dayOfWeek (0-6), dayOfMonth, month, year, isWeekend (boolean), timestamp
- Used by: Time Window Policy

**Envio Signal**
- Source: Local database for alerts, Envio GraphQL API for on-chain data
- Returns: alerts array (active security alerts), recentRedemptions array (from indexer), envioConnected (boolean), alertCount, timestamp
- Used by: Security Pause Policy

Signals are fetched fresh for each policy evaluation. Failed signal fetches return null/error state, and policies handle missing signals gracefully (typically by allowing execution with a note).

### Data Flows (Narrative Form)

**User Onboarding:**
User visits the landing page, clicks "Launch App," arrives at dashboard. Dashboard prompts wallet connection. User clicks "Connect," MetaMask popup appears, user approves. Frontend receives user's address, calls POST /api/session with this address. Backend checks if session exists for this user. If not, generates new EOA keypair, encrypts private key, stores in session_accounts table, returns session account address. Frontend displays: "Your wallet: 0x1234... | Session account: 0xABCD..."

**Permission Granting:**
User clicks "Grant Permission" button. Modal opens showing permission details: token (USDC), amount limit, time period. User clicks "Approve." Frontend triggers MetaMask interaction (simplified for hackathon—full ERC-7715 flow would use wallet_invokeSnap). User confirms in MetaMask. Frontend receives confirmation, calls POST /api/permissions with user address, permission type, token address, session address, amount, period. Backend generates delegation hash, stores permission data, returns success. Frontend updates UI to show permission granted.

**Adapter Installation:**
User clicks "Add Adapter" or browses marketplace. Sees SwapBot and DCA Bot cards with descriptions. Clicks "Install" on SwapBot. Modal opens for configuration: token pair (USDC → WETH), amount per swap (1 USDC), schedule (daily at 9 AM). User configures and clicks "Install." Frontend calls POST /api/adapters/install with user address, adapter ID, config object, permission ID to link. Backend validates config against adapter's schema, stores in installed_adapters table, returns success. Frontend updates dashboard to show SwapBot card as installed and active.

**Policy Configuration:**
Dashboard shows policy section with toggles. Gas Limit shows as enabled with "Max: 50 gwei." User clicks configure icon. Modal opens with slider for maxGwei. User adjusts to 75, clicks save. Frontend calls POST /api/policies with user address, policy type, enabled status, config object. Backend upserts policy in user_policies table. Toggle updates to show new value.

**Execution (ALLOW scenario):**
Cron fires at 9 AM UTC (or user clicks manual trigger). Executor loads SwapBot for this user, retrieves config. Calls swapBotAdapter.proposeTransaction() which encodes Uniswap swap for 1 USDC → WETH. Executor fetches all signals: gas is 35 gwei, time is 9:15 AM Monday, no active alerts. Policy engine evaluates: Gas Limit passes (35 < 50), Time Window passes (9:15 is within 9-17, Monday is weekday), Max Amount passes (1 < 100), Security Pause passes (no alerts). All pass → ALLOW. Executor logs to execution_logs: decision=ALLOW, reason="All policies passed." In production, would build UserOperation and submit via Pimlico. For hackathon MVP, logs mock txHash. Updates adapter's lastRun timestamp. User sees in activity feed: "✓ SwapBot - Transaction approved - 9:15 AM"

**Execution (BLOCK scenario):**
Same flow, but gas signal returns 120 gwei. Policy engine evaluates Gas Limit first: 120 > 50 → BLOCK. Engine stops evaluation, returns blocking policy and reason. Executor logs to execution_logs: decision=BLOCK, reason="Gas too high: 120 gwei exceeds 50 gwei limit." No transaction submitted. User sees in activity feed: "✗ SwapBot - Blocked: Gas too high - 9:15 AM"

**Envio Monitoring:**
Indexer is running on Envio hosted service, watching DelegationManager contract. New block contains RedeemedDelegation event. Event handler triggers: extracts delegator, redeemer, delegation hash, block number, timestamp, tx hash. Stores in Redemption entity. Checks if this is new event (timestamp > indexer start time). If new, calls sendTelegramAlert with formatted message. User's Telegram shows: "🔄 Permission Redeemed - Delegator: 0x1234... Redeemer: 0xABCD... [View Transaction]". Dashboard queries indexer GraphQL for stats, displays total redemptions, recent activity.

### Database Schema (Narrative)

**session_accounts:** Each row links a user's wallet address to their 0xVisor session account. Stores the session account's address and its encrypted private key. One session per user, created on first connection.

**permissions:** Each row represents a granted ERC-7715 permission. Links to user address, stores permission type, token address if applicable, delegation hash for on-chain reference, full delegation data as JSON, grant timestamp, optional expiry, active flag.

**installed_adapters:** Each row represents an adapter a user has installed. Links to user address and adapter ID (e.g., "swap-bot"), stores config JSON, links to permission ID, tracks active status and last run timestamp.

**user_policies:** Each row is a policy configuration for a user. Stores policy type, enabled flag, config JSON, optional adapter ID (null means global, specific ID means only for that adapter).

**execution_logs:** Audit trail of every execution attempt. Stores user address, adapter ID, proposed transaction JSON, decision (ALLOW/BLOCK/ERROR), reason text, policy results JSON, optional tx hash, timestamp.

**security_alerts:** Active alerts that feed into Security Pause policy. Stores alert type, severity, message, metadata JSON, active flag, created and resolved timestamps.

### API Endpoints (Complete List)

| Method | Path | Purpose |
|--------|------|---------|
| POST | /api/session | Create or retrieve session account for user |
| GET | /api/session/:userAddress | Get session info for user |
| POST | /api/permissions | Store a new permission grant |
| GET | /api/permissions | Get permissions for user (query param: userAddress) |
| GET | /api/adapters | List all available system adapters |
| GET | /api/adapters/:id | Get single adapter details |
| POST | /api/adapters/install | Install adapter for user |
| GET | /api/adapters/installed/:userAddress | Get user's installed adapters |
| PATCH | /api/adapters/:id/toggle | Enable or disable installed adapter |
| GET | /api/policies/rules | List all available policy rule types |
| GET | /api/policies/:userAddress | Get user's policy configurations |
| POST | /api/policies | Create or update a policy |
| PATCH | /api/policies/:id/toggle | Enable or disable a policy |
| GET | /api/signals | Fetch current data from all signals |
| GET | /api/signals/:name | Fetch specific signal (gas, time, envio) |
| POST | /api/execute | Manually trigger adapter execution |
| GET | /api/activity/:userAddress | Get execution history for user |

### External Dependencies

**Required Accounts (create before development):**
- Pimlico: For bundler service, needed to submit UserOperations. Get API key from dashboard.pimlico.io
- Alchemy or Infura: For Sepolia RPC endpoint. Get API key and RPC URL from their dashboard.
- Envio: For indexer hosting. Sign up via GitHub at envio.dev
- Vercel: For frontend hosting. Sign up via GitHub at vercel.com
- Railway: For backend hosting. Sign up via GitHub at railway.app
- Telegram: For alert bot. Create via @BotFather, get bot token and chat ID.

**Testnet Resources:**
- Sepolia ETH: From faucets.chain.link (0.5 ETH, requires mainnet activity) or sepoliafaucet.com
- Sepolia USDC: From faucet.circle.com (1 USDC per day per address)
- Request tokens early and during breaks to accumulate enough for testing

**NPM Packages (key ones):**
- viem: Ethereum interactions, account generation, calldata encoding
- @metamask/delegation-toolkit: Creating and signing delegations
- permissionless: Pimlico bundler client
- drizzle-orm + better-sqlite3: Database ORM and SQLite driver
- express + cors: API server
- node-cron: Scheduler for adapter triggers
- zod: Config validation

---

## Part 3: Hackathon Strategy

### Target Tracks

| Track | Prize | Our Angle |
|-------|-------|-----------|
| Most Creative Use of Advanced Permissions | $3,000 | We're not building another consumer app (DCA bot, subscription). We're building the infrastructure layer that makes all permission-based apps safer. Other projects use permissions; we govern them. |
| Best Use of Envio | $3,000 | Active monitoring, not passive indexing. We use Envio for: real-time Telegram alerts, anomaly detection feeding back into policy decisions, dashboard stats. The indexer is integral to the security model. |
| Best Feedback | $500 | Submit detailed, constructive feedback on the hackathon experience, tools, documentation. Easy win with effort. |
| Best Social Media | $500 | Tweet thread explaining the problem and solution, demo video, engage with the community. |

**Total target: $7,000**

### Demo Script (3 minutes)

**0:00-0:30 - Introduction:**
Show landing page. "The problem with permissions today: once granted, you have no control. 0xVisor changes that. We sit between permission and execution, evaluating every transaction against your policies."

**0:30-1:00 - Connect & Setup:**
Click Launch App. Connect MetaMask. "0xVisor creates a session account for me—this is the account that will execute on my behalf, but only when I allow it." Point to session account display.

**1:00-1:45 - Grant Permission & Install Adapter:**
Click Grant Permission. Show modal with USDC, amount, period. Approve in MetaMask. "Now I'll install SwapBot to automatically swap USDC to ETH daily." Configure amount, click Install. Show adapter card appear.

**1:45-2:15 - Policy Block Demo:**
"Here's the key differentiator. I've set a gas limit policy at 50 gwei. Let's say gas spikes..." Trigger execution (either wait for high gas or explain the scenario). Show activity feed with "Blocked: Gas too high." "0xVisor protected me. No transaction went through."

**2:15-2:30 - Envio Monitoring:**
Show Telegram alert or dashboard stats. "Every on-chain event is indexed by Envio. I get real-time alerts. If something unusual happens, the Security Pause policy kicks in automatically."

**2:30-3:00 - Wrap-up:**
"0xVisor: Policy-aware automation for Advanced Permissions. Adapters define what. Policies define when. You stay in control." Show links to repo and demo.

### Minimum Viable Demo Checklist

1. User can connect wallet - shows their address
2. Session account created and displayed
3. At least one adapter installable with config
4. At least two policies configurable (gas limit, time window)
5. Manual trigger shows policy evaluation happening
6. At least one BLOCK scenario demonstrated with clear reason
7. Activity feed shows history with decision icons
8. Demo video captures the full flow

### Bonus Points (if time permits)

- Envio alerts actually firing to Telegram
- Real Uniswap swap executing (not mocked)
- Polished UI with animations and loading states
- Comprehensive README with architecture diagrams
- Mobile-responsive design

---

## Part 4: Implementation Roadmap

### Time Budget

| Period | Total Hours | Buffer | Working Hours |
|--------|-------------|--------|---------------|
| Day 1 | 24 hrs | 5 hrs | 19 hrs |
| Day 2 | 24 hrs | 5 hrs | 19 hrs |
| **Total** | **48 hrs** | **10 hrs** | **38 hrs** |

### Pre-Work (Before Day 1 Coding)

**Duration: 1 hour**

Create all accounts:
- Pimlico dashboard → get API key
- Alchemy or Infura → get Sepolia RPC URL
- Envio → sign up with GitHub
- Vercel → sign up with GitHub
- Railway → sign up with GitHub
- Telegram → create bot via @BotFather, get token, create group, get chat ID

Request faucet tokens (continue during breaks):
- Sepolia ETH from faucets.chain.link
- Sepolia USDC from faucet.circle.com

Prepare environment variables template with all keys ready to fill in.

### Day 1 Sessions

**Session 1: Foundation Setup (3 hours)**

Goal: Working monorepo with both services running

Tasks:
- Create project directory, initialize git
- Set up pnpm workspace configuration
- Initialize Next.js app in packages/web
- Initialize Node.js app in packages/agent
- Install all dependencies for both packages
- Create database schema with all six tables
- Run Drizzle migrations to create tables
- Create Express server with health check endpoint
- Verify both services start without errors

Done when: pnpm dev:web shows Next.js on port 3000, pnpm dev:agent shows Express on port 3001, health endpoint returns JSON, database file exists with tables.

---

**Session 2: Session Manager (2.5 hours)**

Goal: Session account creation and encrypted storage working

Tasks:
- Create encryption utility using Node.js crypto (AES-256-GCM)
- Create SessionManager class with getOrCreateSession method
- Implement EOA generation using viem's generatePrivateKey
- Encrypt private key before storing in database
- Implement wallet client loading on demand
- Create POST /api/session endpoint
- Create GET /api/session/:userAddress endpoint
- Test that same user always gets same session (idempotent)

Done when: Can create session via API, same user returns same session, private keys are encrypted in database (verify by inspecting), can retrieve session info.

---

**Session 3: Permission Integration (3 hours)**

Goal: Frontend wallet connection and permission storage

Tasks:
- Create useWallet hook for MetaMask connection
- Handle account changes and chain switching
- Add Sepolia network switching helper
- Create useSession hook to call session API
- Create usePermission hook for permission operations
- Create POST /api/permissions endpoint
- Create GET /api/permissions endpoint with user filter
- Store permissions with mock delegation hash (real ERC-7715 simplified for hackathon)
- Display session account in frontend

Done when: Wallet connects in browser, session creates on connect, permissions can be stored and retrieved, frontend shows wallet address and session account.

---

**Session 4: Adapters (3 hours)**

Goal: Two adapters that can propose valid transactions

Tasks:
- Define TypeScript interfaces for adapters, contexts, proposed transactions
- Create SwapBot adapter with Uniswap V3 calldata encoding
- Create DCA Bot adapter with similar structure, different config options
- Create adapter registry to hold and retrieve adapters
- Create GET /api/adapters endpoint to list adapters
- Create POST /api/adapters/install endpoint
- Create GET /api/adapters/installed/:userAddress endpoint
- Implement Zod validation for adapter configs
- Store installed adapters in database

Done when: API returns both adapters, can install adapter for user, can retrieve installed adapters, calling proposeTransaction returns valid calldata structure.

---

**Session 5: Policy Engine (3.5 hours)**

Goal: All four policies evaluating correctly

Tasks:
- Define TypeScript interfaces for policies, contexts, results
- Implement Gas Limit rule with configurable threshold
- Implement Time Window rule with hour and day checks
- Implement Max Amount rule with token amount extraction
- Implement Security Pause rule checking alerts
- Create PolicyEngine class with evaluate method
- Load global and adapter-specific policies from database
- Evaluate policies in sequence, stop on first BLOCK
- Return detailed results with reasons
- Create GET /api/policies/rules endpoint
- Create POST /api/policies endpoint (upsert)
- Create GET /api/policies/:userAddress endpoint
- Create PATCH /api/policies/:id/toggle endpoint

Done when: All four rules evaluate correctly, policy engine returns ALLOW or BLOCK with reasons, can CRUD policies via API, first failing policy stops evaluation.

---

**Session 6: Signals (2 hours)**

Goal: Three signals returning real data

Tasks:
- Define TypeScript interface for signals
- Implement Gas Signal fetching from Sepolia RPC
- Implement Time Signal using system clock
- Implement Envio Signal querying local alerts table (GraphQL stub for later)
- Create signal registry
- Create GET /api/signals endpoint returning all signals
- Create GET /api/signals/:name endpoint for specific signal
- Integrate signal fetching into policy engine

Done when: Gas signal returns actual Sepolia gas price, time signal returns current UTC time, envio signal returns alerts from database, policy engine uses fresh signals.

---

**Session 7: Executor (2 hours)**

Goal: End-to-end execution flow working

Tasks:
- Create Executor class with executeAdapter method
- Load installed adapter and its config
- Call adapter's proposeTransaction method
- Pass proposed transaction to policy engine
- Log decision to execution_logs table with all details
- Create POST /api/execute endpoint for manual trigger
- Create GET /api/activity/:userAddress endpoint for history
- Test full flow with curl commands
- Verify ALLOW and BLOCK scenarios work

Done when: Manual trigger runs full flow, policies evaluate correctly, decisions logged to database, activity endpoint returns history, can demonstrate both ALLOW and BLOCK.

---

### Day 2 Sessions

**Session 8: Frontend Core Pages (4 hours)**

Goal: Basic dashboard UI functional

Tasks:
- Create landing page with hero section, feature cards, how-it-works
- Create dashboard layout with header showing wallet info
- Implement wallet connection button and flow
- Display session account prominently
- Create adapter cards component showing installed adapters
- Create policy toggles component
- Create signal status indicators (connected/disconnected dots)
- Apply dark theme styling with Tailwind
- Connect components to backend API

Done when: Landing page looks professional, dashboard shows all sections, wallet connection works, adapters and policies display correctly.

---

**Session 9: Frontend Features (4 hours)**

Goal: All interactive features working

Tasks:
- Create adapter marketplace view with available adapters
- Implement adapter installation modal with config form
- Create policy configuration modal with sliders/inputs
- Implement toggle functionality for policies
- Create activity feed component with decision icons
- Show execution history with timestamps and reasons
- Add manual execute button on adapter cards
- Connect all actions to backend API calls
- Add loading states for async operations

Done when: Can install adapters from marketplace, can configure adapters, can toggle and configure policies, activity updates after execution, can manually trigger adapters.

---

**Session 10: Permission Grant UI (2 hours)**

Goal: Clear permission granting experience

Tasks:
- Create permission grant modal/page
- Show permission details (token, amount, period)
- Integrate MetaMask approval (simplified for hackathon)
- Display permission status after grant
- Link permission to adapter during installation
- Handle and display errors gracefully

Done when: Clear flow for granting permissions, MetaMask interaction works, permission appears in UI after grant.

---

**Session 11: Envio Indexer (3 hours)**

Goal: Indexer deployed and alerting

Tasks:
- Create config.yaml for Sepolia DelegationManager
- Define GraphQL schema for Redemption, EnabledDelegation, DisabledDelegation entities
- Implement event handlers storing events
- Add global and per-user stats tracking
- Implement Telegram alert function
- Test locally with envio dev command
- Deploy to Envio hosted service
- Update backend envio signal to query deployed GraphQL
- Verify alerts fire for new events

Done when: Indexer config validates, handlers process events correctly, Telegram receives alerts, deployed and accessible via GraphQL URL.

---

**Session 12: Polish and Deploy (3 hours)**

Goal: Production deployment working

Tasks:
- Polish UI (spacing, colors, responsive design)
- Add error boundaries and error messages
- Add loading spinners for async operations
- Deploy frontend to Vercel
- Configure Vercel environment variables
- Deploy backend to Railway
- Configure Railway environment variables
- Update frontend to use production API URL
- Test complete flow on production URLs
- Fix any production-only issues

Done when: Frontend accessible via Vercel URL, backend accessible via Railway URL, full flow works in production, no console errors.

---

**Session 13: Demo and Submission (3 hours)**

Goal: Hackathon submission complete

Tasks:
- Write word-for-word demo script
- Practice demo flow
- Record 3-minute demo video
- Write comprehensive README with setup instructions
- Add architecture section to README
- Create submission on hackathon platform
- Fill out all required fields
- Write Twitter thread about the project
- Post demo video on social media
- Submit feedback form for $500 track

Done when: Demo video uploaded, README complete, hackathon submission submitted, social posts published.

---

### Session Summary

| Session | Duration | Day | Cumulative |
|---------|----------|-----|------------|
| Pre-work | 1 hr | Before | 1 hr |
| 1. Foundation | 3 hrs | Day 1 | 4 hrs |
| 2. Session Manager | 2.5 hrs | Day 1 | 6.5 hrs |
| 3. Permission Integration | 3 hrs | Day 1 | 9.5 hrs |
| 4. Adapters | 3 hrs | Day 1 | 12.5 hrs |
| 5. Policy Engine | 3.5 hrs | Day 1 | 16 hrs |
| 6. Signals | 2 hrs | Day 1 | 18 hrs |
| 7. Executor | 2 hrs | Day 1 | 20 hrs |
| 8. Frontend Core | 4 hrs | Day 2 | 24 hrs |
| 9. Frontend Features | 4 hrs | Day 2 | 28 hrs |
| 10. Permission UI | 2 hrs | Day 2 | 30 hrs |
| 11. Envio Indexer | 3 hrs | Day 2 | 33 hrs |
| 12. Polish & Deploy | 3 hrs | Day 2 | 36 hrs |
| 13. Demo & Submit | 3 hrs | Day 2 | 39 hrs |

**Total working time: 39 hours**
**Buffer remaining: 9 hours**

---

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| better-sqlite3 native module build failures | Switch to libsql or turso, or use PostgreSQL on Railway |
| MetaMask ERC-7715 flow too complex | Simplify with mock delegation for demo, explain full flow in pitch |
| Envio deployment issues | Have backup: manual alerts via backend polling |
| Time overrun on frontend | Prioritize core demo flow, skip polish, use minimal styling |
| Sepolia gas consistently high | Adjust demo gas limit threshold to be above current gas |
| Faucet limits blocking testing | Request tokens early, use multiple test wallets |
| Uniswap liquidity issues on Sepolia | Have fallback mock swap contract ready |

---

## Part 5: Documentation References

### MetaMask Delegation Framework
- https://docs.metamask.io/delegation-toolkit/get-started/quickstart/
- https://docs.metamask.io/delegation-toolkit/how-to/create-delegation/
- https://docs.metamask.io/delegation-toolkit/how-to/redeem-delegation/
- https://docs.metamask.io/smart-accounts-kit/reference/delegation/
- https://docs.metamask.io/delegation-toolkit/changelog/0.13.0
- https://github.com/MetaMask/delegation-framework

### Pimlico (Bundler)
- https://docs.pimlico.io/guides/how-to/accounts/use-metamask-account

### Uniswap
- https://docs.uniswap.org/contracts/v3/reference/deployments/
- https://docs.uniswap.org/contracts/v3/reference/deployments/ethereum-deployments
- https://sepolia.etherscan.io/address/0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E
- https://support.uniswap.org/hc/en-us/articles/14580495154445-Testnets-on-Uniswap

### Envio
- https://docs.envio.dev/
- https://docs.envio.dev/docs/HyperIndex/overview
- https://docs.envio.dev/docs/HyperIndex/getting-started
- https://docs.envio.dev/docs/HyperIndex/configuration-file
- https://docs.envio.dev/docs/HyperIndex/event-handlers
- https://docs.envio.dev/docs/HyperIndex/schema
- https://docs.envio.dev/docs/HyperIndex/deployment

### Faucets
- https://faucet.circle.com/ (USDC)
- https://faucets.chain.link/ (ETH + tokens)
- https://sepoliafaucet.com/ (ETH)

### ERC Standards
- ERC-7715 (Permissions)
- ERC-7710 (Delegations)

