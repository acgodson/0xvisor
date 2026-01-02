# 0xvisor Envio Indexer

Monitors MetaMask DelegationManager events on Sepolia for anomaly detection and real-time alerts.

## Setup

### 1. DelegationManager Address

The DelegationManager address for Sepolia is already configured in `config.yaml`:

`0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3`

To verify or get it programmatically:
```bash
cd packages/indexer
node get-address.mjs
```

### 2. Get Recent Block Number

Visit https://sepolia.etherscan.io/ and use current block - 1000

Update `start_block` in `config.yaml`.

### 3. Install Envio CLI

```bash
npm install -g envio
```

### 4. Set Environment Variables

Create `.env` in this directory:

```bash
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

**Get Telegram credentials:**
1. Talk to @BotFather on Telegram
2. Create bot, get token
3. Add bot to group, get chat ID via @getidsbot

### 5. Test Locally

```bash
cd packages/indexer
envio dev
```

Visit http://localhost:8080 to test GraphQL queries.

**Note:** The handler uses `import { DelegationManager } from "../generated"` which works with Envio's build system.

### 6. Update Main App

Add to `web/.env.local`:

```bash
ENVIO_GRAPHQL_URL=https://indexer.bigdevenergy.link/YOUR_ID/v1/graphql
```

## GraphQL Queries

### Recent Redemptions
```graphql
query {
  Redemption(limit: 10, order_by: {timestamp: desc}) {
    rootDelegator
    redeemer
    timestamp
    transactionHash
  }
}
```

### Global Stats
```graphql
query {
  Stats(where: {id: {_eq: "global"}}) {
    totalRedemptions
    totalEnabled
    totalDisabled
    lastUpdated
  }
}
```

### User Activity
```graphql
query UserActivity($address: String!) {
  Redemption(
    where: {rootDelegator: {_eq: $address}}
    order_by: {timestamp: desc}
  ) {
    redeemer
    timestamp
    transactionHash
  }
}
```

## Testing Your Setup

### Local Testing (Before Deployment)

1. **Start local indexer:**
```bash
cd packages/indexer
envio dev
```

2. **Verify GraphQL is running:**
Visit http://localhost:8080 - you should see the GraphQL Playground

3. **Test basic query:**
```graphql
query {
  Stats(where: {id: {_eq: "global"}}) {
    totalRedemptions
    totalEnabled
    totalDisabled
  }
}
```

4. **Check historical events:**
If `start_block` is set correctly, you should see historical redemptions:
```graphql
query {
  Redemption(limit: 5, order_by: {timestamp: desc}) {
    rootDelegator
    redeemer
    timestamp
  }
}
```

5. **Monitor console:**
Watch for "Processing block..." messages and event captures

### Production Testing (After Deployment)

1. **Test GraphQL endpoint:**
```bash
curl -X POST YOUR_ENVIO_GRAPHQL_URL \
  -H "Content-Type: application/json" \
  -d '{"query":"{ Stats(where: {id: {_eq: \"global\"}}) { totalRedemptions } }"}'
```

2. **Verify Telegram alerts:**
- Create a test delegation on Sepolia
- Check your Telegram group for alert within 1-2 minutes
- Alert should include transaction link

3. **Test from 0xvisor app:**
Add to `packages/agent/src/signals/envio-signal.ts` for debugging:
```typescript
console.log('Envio response:', data);
```

Run agent and check logs show recent redemptions

### Troubleshooting Tests

**No historical data:**
- Start block may be too recent
- Run: `envio codegen` to regenerate types
- Check contract address matches actual deployment

**Telegram not sending:**
- Verify env vars: `echo $TELEGRAM_BOT_TOKEN`
- Test bot manually with curl
- Check `INDEXER_START_TIME` logic (only alerts new events)

**GraphQL errors:**
- Restart indexer: `envio dev` or redeploy
- Check schema matches EventHandlers
- Verify network connectivity

## How It Works

1. Envio watches DelegationManager contract 24/7
2. Captures all permission grants/redemptions/revocations
3. Sends Telegram alerts for new events
4. Provides GraphQL API for querying
5. 0xvisor backend queries for anomaly detection

## Troubleshooting

**"Contract not found"**
- Update DelegationManager address in config.yaml

**"No events indexed"**
- Check start_block is not too recent
- Verify events are being emitted on-chain

**"Telegram not working"**
- Verify bot token and chat ID
- Ensure bot is added to group/channel
