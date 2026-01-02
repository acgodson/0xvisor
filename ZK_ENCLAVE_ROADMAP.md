# 0xvisor ZK + Enclave Architecture: Future Roadmap

**Document Status**: Research & Planning (Post-Hackathon Implementation)
**Created**: 2026-01-01
**Last Updated**: 2026-01-01

---

## Executive Summary

This document outlines the **production-grade security architecture** for 0xvisor, combining Zero-Knowledge proofs with Trusted Execution Environments (TEEs). This represents the future evolution beyond the hackathon MVP.

**Current MVP Scope** (Hackathon):
- ✅ Policy engine with traditional backend evaluation
- ✅ Session keys encrypted in database
- ✅ Policy-based transaction approval

**Future Architecture** (This Document):
- 🔮 Zero-Knowledge policy proofs (client-side)
- 🔮 AWS Nitro Enclaves for key custody
- 🔮 Cryptographic + hardware-enforced policies
- 🔮 Trustless automation platform

---

## Industry Validation

### Turnkey: Policy Engine for Web3

**Reference**: [Turnkey Policy Engine - Guardrails for Web3 Transactions](https://www.turnkey.com/blog/turnkey-policy-engine-guardrails-web3-transactions?utm_source=chatgpt.com)

**Key Insights**:
- Leading custody provider building policy engines
- Validates market need for policy-based transaction control
- Shows institutional demand for programmatic guardrails
- 0xvisor + ZK + Enclave = next evolution beyond Turnkey's approach

**What Turnkey Does**:
- Policy rules for transaction approval
- Multi-party approval workflows
- Spending limits and velocity controls

**What 0xvisor Adds**:
- ✅ Zero-knowledge policy privacy
- ✅ Hardware-isolated key custody (enclaves)
- ✅ Cryptographically enforced policies
- ✅ Decentralized automation (vs centralized custody)

---

## Problem Statement

### Current Limitations (Hackathon MVP)

**Architecture**:
```
User → Backend (stores policies + keys) → Signs transaction
```

**Security Issues**:
1. Backend holds encrypted session keys
2. Backend can decrypt keys anytime
3. Database breach exposes encrypted keys
4. Policy enforcement is code-based (can be bypassed)
5. Backend operators can see all policy configurations
6. Users must trust backend not to misuse keys

### Real-World Breach Examples

**3Commas API Key Leak (October 2022)**:
- Trading bot platform
- Database compromised → API keys leaked
- **$14.8 million stolen**
- Similar architecture to our current system

**Slope Wallet Private Key Exposure (August 2022)**:
- Mobile wallet stored keys on backend
- Logs exposed → 9,000+ wallets compromised
- **$8 million stolen**
- Validates: backend key storage = eventual breach

**Pattern**: Backend storage of sensitive data → inevitable breach → user harm

---

## The Solution: ZK Proofs + Trusted Execution Environments

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  User's Browser (Untrusted)                             │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Private Policy Storage                          │   │
│  │ - maxGwei: 50        (localStorage only)        │   │
│  │ - maxAmount: 10 ETH  (never sent to backend)    │   │
│  │ - whitelist: [0xA, 0xB, 0xC]                    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ZK Proof Generator (Noir.js)                    │   │
│  │ Proves: "My PRIVATE policies are satisfied"     │   │
│  │ Without revealing: actual threshold values      │   │
│  └─────────────────────────────────────────────────┘   │
└────────────────┬────────────────────────────────────────┘
                 │ Send: { proof, publicInputs, txData }
                 │
┌────────────────▼────────────────────────────────────────┐
│  Backend API (Untrusted)                                │
│  - Does NOT store policies                              │
│  - Does NOT have private keys                           │
│  - Cannot decrypt keys                                  │
│  - Cannot bypass policies                               │
│  - Just relays requests to enclave                      │
└────────────────┬────────────────────────────────────────┘
                 │ Forward via vsock
                 │
┌────────────────▼────────────────────────────────────────┐
│  AWS Nitro Enclave (Trusted Hardware)                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Proof Verifier (Rust)                           │   │
│  │ - Loads verification key                        │   │
│  │ - Verifies ZK proof cryptographically           │   │
│  │ - If valid → proceed to signing                 │   │
│  │ - If invalid → reject (cannot bypass)           │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Session Key Storage                             │   │
│  │ - Private keys ONLY in enclave memory           │   │
│  │ - Never exported                                │   │
│  │ - Never in database                             │   │
│  │ - Never accessible to backend                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Transaction Signer                              │   │
│  │ - Signs ONLY if proof verified                  │   │
│  │ - Returns signature to backend                  │   │
│  └─────────────────────────────────────────────────┘   │
└────────────────┬────────────────────────────────────────┘
                 │ Return signature
                 │
┌────────────────▼────────────────────────────────────────┐
│  Blockchain                                             │
│  - Transaction submitted with signature                 │
│  - Executed on-chain                                    │
└─────────────────────────────────────────────────────────┘
```

---

## Component Specifications

### 1. Zero-Knowledge Policy Circuits (Noir)

**Purpose**: Prove policy satisfaction without revealing thresholds

#### Circuit 1: Recipient Whitelist

**File**: `packages/circuits/whitelist/src/main.nr`

```noir
// Proves: recipient is in user's PRIVATE whitelist
fn main(
    recipient: pub Field,              // Public: who we're sending to
    whitelist: [Field; 50],            // Private: approved addresses
    whitelist_size: Field,             // Private: actual count
) {
    let mut found = false;
    for i in 0..50 {
        if (i < whitelist_size) {
            if (whitelist[i] == recipient) {
                found = true;
            }
        }
    }
    assert(found);  // Recipient must be in whitelist
}
```

**Privacy Guarantee**: Backend learns "Alice is approved" but NOT the other 49 addresses in whitelist

#### Circuit 2: Max Amount

**File**: `packages/circuits/max_amount/src/main.nr`

```noir
// Proves: transaction amount within user's PRIVATE limit
fn main(
    tx_amount: pub Field,        // Public: amount being sent
    user_max_amount: Field,      // Private: user's limit
) {
    assert(tx_amount <= user_max_amount);
}
```

**Privacy Guarantee**: Backend learns "this transaction is allowed" but NOT the actual limit value

#### Circuit 3: Combined Policy

**File**: `packages/circuits/policy_combined/src/main.nr`

```noir
// Proves: ALL policies satisfied (AND logic)
fn main(
    // Public inputs
    current_gas: pub u32,
    tx_amount: pub Field,
    recipient: pub Field,

    // Private policy thresholds
    max_gas: u32,
    max_amount: Field,
    whitelist: [Field; 50],
    whitelist_size: Field,
) {
    // Verify gas policy
    assert(current_gas <= max_gas);

    // Verify amount policy
    assert(tx_amount <= max_amount);

    // Verify whitelist policy
    let mut found = false;
    for i in 0..50 {
        if (i < whitelist_size) {
            if (whitelist[i] == recipient) {
                found = true;
            }
        }
    }
    assert(found);
}
```

**Privacy Guarantee**: Backend learns "all policies passed" but NOT which policies exist or their values

---

### 2. Proof Generation (TypeScript/Browser)

**File**: `packages/web/src/lib/zk/prover.ts`

```typescript
import { Noir } from '@noir-lang/noir_js';
import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';

export async function generatePolicyProof(
    privateInputs: {
        maxGas: number;
        maxAmount: bigint;
        whitelist: string[];
    },
    publicInputs: {
        currentGas: number;
        txAmount: bigint;
        recipient: string;
    }
) {
    // Load compiled circuit
    const circuit = await fetch('/circuits/policy.json').then(r => r.json());

    const backend = new BarretenbergBackend(circuit);
    const noir = new Noir(circuit, backend);

    // Generate proof
    const { proof, publicInputs: outputs } = await noir.generateProof({
        // Private (never sent to backend)
        max_gas: privateInputs.maxGas.toString(),
        max_amount: privateInputs.maxAmount.toString(),
        whitelist: privateInputs.whitelist.map(addr => addr.toLowerCase()),
        whitelist_size: privateInputs.whitelist.length.toString(),

        // Public (verifiable)
        current_gas: publicInputs.currentGas.toString(),
        tx_amount: publicInputs.txAmount.toString(),
        recipient: publicInputs.recipient.toLowerCase(),
    });

    return { proof, publicInputs: outputs };
}
```

**Security**: All private inputs stay in browser memory, never transmitted

---

### 3. Backend Relay (Node.js)

**File**: `packages/web/src/trpc/routers/execute.ts`

```typescript
import { forwardToEnclave } from '@/lib/enclave/vsock-client';

export const executeRouter = createTRPCRouter({
    zkExecute: baseProcedure
        .input(z.object({
            userAddress: z.string(),
            txData: z.object({
                target: z.string(),
                value: z.string(),
                data: z.string(),
            }),
            zkProof: z.object({
                proof: z.any(),
                publicInputs: z.array(z.string()),
            }),
        }))
        .mutation(async ({ input }) => {
            // Backend does NOT:
            // - Verify proof (enclave does this)
            // - Have keys (enclave has these)
            // - Know policy values (never received)

            // Backend ONLY forwards to enclave
            const response = await forwardToEnclave({
                command: 'sign_with_proof',
                txData: input.txData,
                proof: input.zkProof.proof,
                publicInputs: input.zkProof.publicInputs,
            });

            if (response.signature) {
                // Enclave verified proof and signed
                return {
                    success: true,
                    signature: response.signature,
                };
            } else {
                // Enclave refused (proof invalid)
                return {
                    success: false,
                    reason: response.error,
                };
            }
        }),
});
```

**Security**: Backend is just a relay, cannot bypass policies or access keys

---

### 4. Enclave Verifier + Signer (Rust)

**File**: `enclave/src/main.rs`

```rust
use noir_verifier::BarretenbergVerifier;
use ethers::signers::{LocalWallet, Signer};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct SignRequest {
    tx_data: TransactionData,
    proof: Vec<u8>,
    public_inputs: Vec<String>,
}

#[derive(Serialize)]
struct SignResponse {
    signature: Option<String>,
    error: Option<String>,
}

fn main() {
    println!("Nitro Enclave starting...");

    // Load verification key (embedded in enclave at build time)
    let vk_bytes = include_bytes!("../circuits/policy.vk");
    let verifier = BarretenbergVerifier::new(vk_bytes)
        .expect("Failed to initialize verifier");

    // Load session private key from secure storage
    // Key is generated IN enclave and NEVER exported
    let session_key = load_or_generate_session_key();
    let wallet = LocalWallet::from_bytes(&session_key)
        .expect("Failed to load wallet");

    println!("Session address: {:?}", wallet.address());

    // Listen on vsock for requests from parent instance
    let listener = VsockListener::bind(VSOCK_CID, VSOCK_PORT)
        .expect("Failed to bind vsock");

    println!("Enclave ready, listening on vsock...");

    for stream in listener.incoming() {
        let mut stream = stream.expect("Failed to accept connection");

        // Read request from backend
        let request: SignRequest = read_json(&mut stream)
            .expect("Failed to parse request");

        println!("Received signing request");

        // CRITICAL: Verify ZK proof
        let proof_valid = verifier.verify(
            &request.proof,
            &request.public_inputs,
        );

        if proof_valid {
            println!("✅ Proof valid - policies satisfied");

            // Policies satisfied → sign transaction
            let tx = parse_transaction(&request.tx_data);
            let signature = wallet.sign_transaction(&tx)
                .await
                .expect("Failed to sign");

            // Return signature
            write_json(&mut stream, &SignResponse {
                signature: Some(signature.to_string()),
                error: None,
            });

            println!("✅ Transaction signed");

        } else {
            println!("❌ Proof invalid - refusing to sign");

            // Proof invalid → refuse to sign
            write_json(&mut stream, &SignResponse {
                signature: None,
                error: Some("Invalid proof - policy not satisfied".to_string()),
            });
        }
    }
}

fn load_or_generate_session_key() -> Vec<u8> {
    // Check if key exists in enclave's secure storage
    if let Ok(key) = read_secure_storage("/enclave/session.key") {
        return key;
    }

    // Generate new key (only happens once per enclave)
    let key = generate_random_key();

    // Store in enclave-only storage (never exported)
    write_secure_storage("/enclave/session.key", &key)
        .expect("Failed to store key");

    key
}
```

**Security**:
- Proof verification in hardware-isolated environment
- Private keys never leave enclave memory
- No way to bypass verification logic
- Attestation proves exact code running

---

### 5. Attestation & Trust

**File**: `packages/web/src/lib/enclave/attestation.ts`

```typescript
import { verifyNitroAttestation } from '@aws/nitro-attestation';

export async function verifyEnclaveIntegrity(
    enclaveEndpoint: string
): Promise<{
    verified: boolean;
    codeHash: string;
    timestamp: Date;
}> {
    // Request attestation document from enclave
    const attestation = await fetch(`${enclaveEndpoint}/attestation`)
        .then(r => r.json());

    // Verify attestation signature (signed by AWS Nitro hardware)
    const isValidSignature = await verifyNitroAttestation(attestation);

    if (!isValidSignature) {
        throw new Error('Attestation signature invalid - enclave compromised?');
    }

    // Extract PCR values (code measurements)
    const pcrs = attestation.pcrs;

    // PCR0 = hash of enclave code
    const actualCodeHash = pcrs.pcr0;

    // PCR1 = hash of kernel
    const actualKernelHash = pcrs.pcr1;

    // PCR2 = hash of application
    const actualAppHash = pcrs.pcr2;

    // Compare against expected values (published on GitHub)
    const expectedCodeHash = await fetch('/enclave/expected-pcr0.txt')
        .then(r => r.text());

    if (actualCodeHash !== expectedCodeHash) {
        throw new Error('Code hash mismatch - running different code than expected!');
    }

    return {
        verified: true,
        codeHash: actualCodeHash,
        timestamp: new Date(attestation.timestamp),
    };
}
```

**Usage**:
```typescript
// User verifies before trusting enclave
const attestation = await verifyEnclaveIntegrity('https://api.0xvisor.com');

if (attestation.verified) {
    // ✅ Enclave is running OUR code
    // ✅ Can trust it to verify proofs correctly
    // ✅ Can trust it won't leak keys
    await executeWithEnclave();
} else {
    // ❌ Don't trust this enclave
    throw new Error('Enclave verification failed');
}
```

---

## Security Analysis

### Threat Model

| Threat | Traditional System | ZK + Enclave System |
|--------|-------------------|-------------------|
| **Database Breach** | ❌ Keys encrypted but accessible | ✅ No keys in database |
| **Backend Compromise** | ❌ Attacker gets keys | ✅ Keys in enclave only |
| **Insider Threat** | ❌ Admin can access keys | ✅ Admin cannot access enclave |
| **Policy Bypass** | ❌ Code can be modified | ✅ Cryptographically enforced |
| **Key Theft** | ❌ Decrypt from database | ✅ Impossible without enclave access |
| **Policy Leak** | ❌ Policies in database | ✅ Policies client-side only |

### What Attacker Needs

**To compromise traditional system**:
1. Breach database → get encrypted keys
2. Breach environment variables → get encryption key
3. Decrypt session keys
4. Steal funds

**Difficulty**: Medium (2 steps)

**To compromise ZK + Enclave system**:
1. Physically compromise AWS Nitro hardware (impossible)
2. OR find vulnerability in Nitro attestation (none known)
3. AND bypass ZK proof verification (cryptographically impossible)
4. AND extract keys from enclave memory

**Difficulty**: Effectively impossible

---

## Implementation Roadmap

### Phase 1: Circuit Development (Week 1-2)

**Tasks**:
- [ ] Set up Noir development environment
- [ ] Implement whitelist circuit
- [ ] Implement max amount circuit
- [ ] Implement combined policy circuit
- [ ] Write circuit tests
- [ ] Benchmark proof generation time
- [ ] Optimize for browser performance

**Deliverables**:
- Compiled circuits (.json)
- Verification keys (.vk)
- Test suite with >90% coverage

---

### Phase 2: Enclave Development (Week 3-4)

**Tasks**:
- [ ] Set up AWS Nitro Enclave environment
- [ ] Implement Rust verifier service
- [ ] Integrate Barretenberg verification
- [ ] Implement session key management
- [ ] Implement vsock communication
- [ ] Build enclave image (EIF)
- [ ] Deploy to AWS EC2 Nitro instance
- [ ] Test attestation flow

**Deliverables**:
- Rust enclave binary
- Enclave image (.eif)
- Deployment scripts
- Attestation documentation

---

### Phase 3: Frontend Integration (Week 5-6)

**Tasks**:
- [ ] Integrate Noir.js proof generation
- [ ] Build policy storage (localStorage)
- [ ] Implement proof generation UI
- [ ] Add attestation verification
- [ ] Build execution flow with proofs
- [ ] Add error handling
- [ ] Performance optimization

**Deliverables**:
- ZK proof generation library
- Updated UI components
- User documentation

---

### Phase 4: Backend Integration (Week 7-8)

**Tasks**:
- [ ] Implement vsock client
- [ ] Update TRPC routers
- [ ] Add enclave health monitoring
- [ ] Implement failover logic
- [ ] Add comprehensive logging
- [ ] Integration testing

**Deliverables**:
- Updated backend API
- Monitoring dashboard
- Integration tests

---

### Phase 5: Security Audit & Testing (Week 9-10)

**Tasks**:
- [ ] Third-party security audit
- [ ] Penetration testing
- [ ] Formal verification of circuits
- [ ] Attestation security review
- [ ] Load testing
- [ ] Failover testing

**Deliverables**:
- Security audit report
- Test coverage report
- Performance benchmarks

---

### Phase 6: Production Deployment (Week 11-12)

**Tasks**:
- [ ] Multi-region enclave deployment
- [ ] Monitoring & alerting setup
- [ ] Disaster recovery procedures
- [ ] User migration plan
- [ ] Documentation
- [ ] Launch

**Deliverables**:
- Production system
- Operations runbooks
- User migration completed

---

## Performance Considerations

### Proof Generation Time

**Expected**:
- Whitelist circuit: ~2-3 seconds
- Max amount circuit: ~1-2 seconds
- Combined circuit: ~3-5 seconds

**Optimization strategies**:
- Web Worker for proof generation (non-blocking)
- Proof caching where applicable
- Progressive proof generation UI

### Enclave Response Time

**Expected**:
- Proof verification: ~50-100ms
- Transaction signing: ~10-20ms
- Total enclave time: ~100-150ms

**Optimization strategies**:
- Pre-load verification keys
- Connection pooling for vsock
- Async signing pipeline

---

## Cost Analysis

### AWS Nitro Enclave Costs

**EC2 Instance** (required for enclave):
- c6a.xlarge (4 vCPU, 8 GB): ~$150/month
- c6a.2xlarge (8 vCPU, 16 GB): ~$300/month

**Enclave Resources**:
- 2 vCPU allocated to enclave
- 4 GB memory allocated to enclave
- No additional cost beyond EC2 instance

**Estimated monthly cost**: $300-500 for production setup

**Comparison**:
- AWS KMS: $1/key/month + $0.03/10k requests = $100-300/month
- Fireblocks: $10k-50k/year
- **ZK + Enclave**: $300-500/month (full control)

---

## Alternative Approaches Considered

### 1. Policy-Based Encryption (ABE)

**Concept**: Encrypt keys under policy conditions

**Pros**:
- Purely cryptographic
- No hardware dependency

**Cons**:
- Complex implementation
- Limited library support
- Performance concerns

**Status**: Considered but too complex for v1

---

### 2. Threshold Signatures (MPC)

**Concept**: Split key across multiple parties

**Pros**:
- No single point of failure
- Proven in production (Fireblocks)

**Cons**:
- Requires multiple signers online
- Complex coordination
- Latency overhead

**Status**: Potential v2 enhancement

---

### 3. Smart Account Validation

**Concept**: Session account is smart contract, validates proofs on-chain

**Pros**:
- Fully on-chain
- No backend at all

**Cons**:
- High gas costs
- Slow proof verification on-chain
- UX challenges

**Status**: Future research direction

---

## Success Metrics

### Security Metrics

- [ ] Zero key exposure incidents
- [ ] Zero policy bypass incidents
- [ ] 100% attestation verification success
- [ ] <1% failed proof generation rate

### Performance Metrics

- [ ] <5s proof generation time (p95)
- [ ] <200ms enclave response time (p95)
- [ ] >99.9% enclave uptime
- [ ] <1% transaction failure rate

### Adoption Metrics

- [ ] 50+ DAOs using whitelist policies
- [ ] 1000+ transactions executed via ZK proofs
- [ ] 10+ institutional users onboarded

---

## Research Questions

### Open Questions

1. **Circuit Composition**: Can we compose multiple small circuits instead of one large circuit?
2. **Proof Aggregation**: Can we aggregate proofs from multiple policies into single proof?
3. **Privacy Analysis**: What information still leaks through transaction timing/patterns?
4. **Formal Verification**: Can we formally verify circuit correctness?
5. **Cross-Chain**: How to adapt this architecture for multi-chain support?

### Future Research Directions

1. **Recursive Proofs**: Use recursive SNARKs for unbounded policy composition
2. **FHE Integration**: Combine with Fully Homomorphic Encryption for computation on encrypted data
3. **ZK Rollups**: Move policy verification to ZK rollup for cost reduction
4. **On-Chain Attestation**: Verify enclave attestation on-chain for full trustlessness

---

## References

### Industry Examples

- **Turnkey**: [Policy Engine for Web3](https://www.turnkey.com/blog/turnkey-policy-engine-guardrails-web3-transactions?utm_source=chatgpt.com)
- **Fireblocks**: MPC + Policy Engine
- **Lit Protocol**: TEE-based access control
- **NuCypher**: Proxy re-encryption + policies

### Technical Documentation

- **AWS Nitro Enclaves**: https://docs.aws.amazon.com/enclaves/
- **Noir Language**: https://noir-lang.org/
- **Barretenberg**: https://github.com/AztecProtocol/barretenberg
- **ERC-7715**: https://eips.ethereum.org/EIPS/eip-7715

### Academic Papers

- "Attribute-Based Encryption" (Sahai & Waters, 2005)
- "Recursive SNARKs" (Bitansky et al., 2013)
- "Secure Enclaves" (Costan & Devadas, 2016)

---

## Appendix: Glossary

**ABE (Attribute-Based Encryption)**: Encryption scheme where decryption depends on attributes matching policy

**Attestation**: Cryptographic proof that specific code is running in a TEE

**Enclave**: Hardware-isolated execution environment (AWS Nitro, Intel SGX, AMD SEV)

**PCR (Platform Configuration Register)**: Hash of code/data loaded in enclave

**TEE (Trusted Execution Environment)**: Secure area of processor that guarantees code/data confidentiality

**vsock**: Virtual socket for communication between host and enclave

**ZK (Zero-Knowledge)**: Cryptographic proof that reveals no information beyond validity

---

## Current Action: Focus on MVP

**For Hackathon** (Today):
- ✅ Perfect policy engine UI
- ✅ Enhance policy configuration flows
- ✅ Improve execution visualization
- ✅ Polish demo flow
- ❌ **NOT** building ZK circuits today
- ❌ **NOT** building enclaves today

**This document**: Reference for post-hackathon roadmap

**Demo pitch**: "Here's what we're building next" (show vision)

---

**Document Owner**: 0xvisor Team
**Status**: Planning
**Next Review**: Post-Hackathon
