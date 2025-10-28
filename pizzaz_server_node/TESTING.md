# Testing MCP x402 Payment Protocol

## Quick Test

Run the demonstration script:

```bash
npm start  # In one terminal (server)
node test-x402-simple.mjs  # In another terminal (shows expected flow)
```

## What the Test Shows

The test demonstrates the complete x402 payment flow:

### 1. Call Without Payment → Error -32001

**Request:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "pizza-carousel",
    "arguments": { "pizzaTopping": "pepperoni" }
  }
}
```

**Response:**
```json
{
  "error": {
    "code": -32001,
    "message": "Payment required for this tool",
    "data": {
      "paymentRequirements": {
        "price": { "amount": "10000", ... },
        "recipient": "BuXm6nD1t...",
        "description": "Order pizza from the carousel"
      }
    }
  }
}
```

### 2. User Pays with Solana Wallet

- Shows payment dialog
- Creates USDC transfer transaction
- Gets transaction signature

### 3. Retry With Payment Proof → Success

**Request:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "pizza-carousel",
    "arguments": {
      "pizzaTopping": "pepperoni",
      "_payment": {
        "signature": "5xK9mF2p...",
        "timestamp": "2025-10-28T...",
        "amount": "10000",
        "from": "UserWallet..."
      }
    }
  }
}
```

**Response:**
```json
{
  "result": {
    "content": [{ "type": "text", "text": "Rendered a pizza carousel!" }],
    ...
  }
}
```

## Testing with MCP Inspector

If you have MCP Inspector or a compatible MCP client:

1. **Connect to server**: `http://localhost:8000/mcp`

2. **List tools**: Should show `pizza-carousel` with payment field

3. **Call pizza-carousel without payment**:
   ```json
   {
     "name": "pizza-carousel",
     "arguments": { "pizzaTopping": "pepperoni" }
   }
   ```
   **Expected**: Error -32001 with payment requirements

4. **Call with payment proof**:
   ```json
   {
     "name": "pizza-carousel",
     "arguments": {
       "pizzaTopping": "pepperoni",
       "_payment": {
         "signature": "test123...",
         "timestamp": "2025-10-28T20:30:00Z",
         "amount": "10000",
         "from": "TestWallet"
       }
     }
   }
   ```
   **Expected**: Success with carousel HTML

5. **Check server logs**: Should show payment details logged

## Testing Free Tools

Free tools (pizza-map, pizza-albums, etc.) should work without payment:

```json
{
  "name": "pizza-map",
  "arguments": { "pizzaTopping": "mushroom" }
}
```

**Expected**: Immediate success, no payment required

## Server Logs

When payment is received, you'll see:

```
💰 Payment received for pizza-carousel:
  Signature: 5xK9mF2pQ7rN8sT1vU3wX4yZ5aB6cD7eE8fG9hH0iJ1k...
  Amount: 10000
  From: UserWalletAddress
  Timestamp: 2025-10-28T20:30:00.000Z
```

## Verification

✅ **What works**:
- Error -32001 returned without payment
- Payment requirements included in error
- Payment proof accepted via `_payment` argument
- Content returned after payment
- Payment details logged

⚠️ **What's optional (not implemented)**:
- On-chain transaction verification
- Payment amount validation
- Replay attack prevention
- Rate limiting

## For Production

Add verification:

```typescript
import { Connection, PublicKey } from '@solana/web3.js';

async function verifyPayment(payment, requirements) {
  const connection = new Connection('https://api.devnet.solana.com');
  const tx = await connection.getTransaction(payment.signature);
  
  // Verify transaction exists, amount, recipient, etc.
  return isValid;
}
```

Then in the tool handler:

```typescript
if (args._payment) {
  const isValid = await verifyPayment(args._payment, pizzaCarouselPayment);
  if (!isValid) {
    throw new Error("Invalid payment");
  }
}
```

## Integration Checklist for AgentOS

- [ ] Detect error code `-32001`
- [ ] Extract `paymentRequirements` from error data
- [ ] Show payment dialog with amount/description
- [ ] Create Solana USDC transaction
- [ ] Get transaction signature
- [ ] Retry tool call with `_payment` object
- [ ] Display returned content

## Error Codes

| Code | Meaning | When |
|------|---------|------|
| `-32001` | Payment Required | Paid tool called without payment |
| `-32002` | Invalid Payment | Payment verification failed (if implemented) |

## Summary

The MCP x402 implementation:

1. ✅ Returns error -32001 for unpaid calls to paid tools
2. ✅ Includes payment requirements in error response
3. ✅ Accepts payment proof in `_payment` argument
4. ✅ Logs payment transactions
5. ✅ Returns content after payment
6. ✅ Works within native MCP protocol (JSON-RPC over SSE)
7. ✅ No separate HTTP endpoints needed

**This is a protocol-native x402 implementation for MCP!** 🎉

