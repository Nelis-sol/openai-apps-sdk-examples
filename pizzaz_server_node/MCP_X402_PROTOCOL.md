# MCP x402 Payment Protocol

This document describes the **x402 payment protocol implementation for MCP (Model Context Protocol)**.

## Overview

We've implemented x402 payment semantics within the MCP/SSE protocol, allowing paid tools to require payment proof before returning content - all within the native MCP JSON-RPC protocol.

## Architecture

### Traditional x402 (HTTP)
```
Client: GET /resource
Server: 402 Payment Required
Client: Pay + Retry with X-PAYMENT header
Server: Verify + Return content
```

### MCP x402 (JSON-RPC over SSE)
```
Client: tools/call (no payment)
Server: JSON-RPC error -32001 with payment requirements
Client: Pay + Retry with _payment in arguments
Server: Verify (optional) + Return content
```

## Protocol Flow

### 1. Tool Discovery

Tools advertise payment requirements in their definition:

```json
{
  "name": "pizza-carousel",
  "title": "Show Pizza Carousel",
  "inputSchema": { ... },
  "payment": {
    "required": true,
    "price": 0.01,
    "currency": "USDC",
    "description": "Order pizza from the carousel",
    "recipient": "BuXm6nD1tWAHwB18AitXdCkYA5Yu3QKoPxJp2Rn7VjGt"
  }
}
```

### 2. First Call (No Payment)

**Client Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "pizza-carousel",
    "arguments": {
      "pizzaTopping": "pepperoni"
    }
  }
}
```

**Server Response (Payment Required):**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32001,
    "message": "Payment required for this tool",
    "data": {
      "paymentRequirements": {
        "price": {
          "amount": "10000",
          "asset": {
            "address": "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
          }
        },
        "recipient": "BuXm6nD1tWAHwB18AitXdCkYA5Yu3QKoPxJp2Rn7VjGt",
        "description": "Order pizza from the carousel",
        "currency": "USDC",
        "network": "solana-devnet"
      }
    }
  }
}
```

### 3. Client Payment

Client uses Solana wallet to:
1. Create USDC transfer transaction
2. Sign and submit to blockchain
3. Get transaction signature as proof

### 4. Second Call (With Payment Proof)

**Client Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "pizza-carousel",
    "arguments": {
      "pizzaTopping": "pepperoni",
      "_payment": {
        "signature": "5xK9mF2pQ7rN8sT1vU3wX4yZ5aB6cD7eE8fG9hH0iJ1kL2mN3oP4qR5sT6uV7wX8yZ",
        "timestamp": "2025-10-28T20:30:00.000Z",
        "amount": "10000",
        "from": "UserWalletAddressHere"
      }
    }
  }
}
```

**Server Response (Content Returned):**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Rendered a pizza carousel!"
      }
    ],
    "structuredContent": {
      "pizzaTopping": "pepperoni"
    },
    "_meta": { ... }
  }
}
```

## Payment Proof Format

The `_payment` object contains:

| Field | Type | Description |
|-------|------|-------------|
| `signature` | string | Solana transaction signature (base58) |
| `timestamp` | string | ISO 8601 timestamp of payment |
| `amount` | string | Amount in micro-units (e.g., "10000" = $0.01 USDC) |
| `from` | string | Payer's Solana wallet address |

## Server Implementation

### Checking for Payment

```typescript
const args = toolInputParser.parse(request.params.arguments ?? {});
const isPaidTool = widget.id === "pizza-carousel";

if (isPaidTool && !args._payment) {
  // Throw error with payment requirements
  const error: any = new Error("Payment required for this tool");
  error.code = -32001;
  error.data = { paymentRequirements: { ... } };
  throw error;
}
```

### Logging Payment Proof

```typescript
if (args._payment) {
  console.log("💰 Payment received:");
  console.log("  Signature:", args._payment.signature);
  console.log("  Amount:", args._payment.amount);
  console.log("  From:", args._payment.from);
}
```

### Optional: Verify Payment On-Chain

```typescript
// Future enhancement - verify transaction on Solana blockchain
const isValid = await verifyPaymentOnChain({
  signature: args._payment.signature,
  expectedAmount: requiredAmount,
  expectedRecipient: pizzaCarouselPayment.recipient,
  expectedSender: args._payment.from
});

if (!isValid) {
  throw new Error("Invalid payment");
}
```

## Client Implementation (AgentOS)

AgentOS needs to:

1. **Detect payment requirement** from tool definition
2. **Show payment UI** when tool is called
3. **Handle 402 error** (error code -32001)
4. **Create Solana transaction**:
   - Transfer USDC to recipient
   - Get transaction signature
5. **Retry tool call** with `_payment` proof
6. **Display content** when successful

## Error Codes

| Code | Meaning | Data |
|------|---------|------|
| `-32001` | Payment Required | `{ paymentRequirements: {...} }` |
| `-32002` | Invalid Payment | `{ reason: string }` |

## Security Considerations

### Current Implementation (Basic)
- ✅ Payment proof is required
- ✅ Transaction signature logged
- ❌ No on-chain verification (honor system)

### Recommended for Production
- ✅ Verify transaction signature on-chain
- ✅ Check correct amount was paid
- ✅ Verify recipient matches
- ✅ Check transaction timestamp (prevent replay)
- ✅ Rate limiting per wallet address

## USDC Addresses

| Network | Mint Address |
|---------|-------------|
| Devnet | `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` |
| Mainnet | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` |

## Comparison with HTTP x402

| Feature | HTTP x402 | MCP x402 |
|---------|-----------|----------|
| Protocol | HTTP | JSON-RPC over SSE |
| Payment Required | 402 status code | Error code -32001 |
| Payment Proof | X-PAYMENT header | _payment in arguments |
| Verification | Server-side via facilitator | Server-side (optional) |
| Client | Browser fetch interceptor | MCP client library |

## Benefits of MCP x402

1. **Protocol Native**: No need for separate HTTP endpoints
2. **Type Safe**: Full TypeScript types for payment proof
3. **Stateful**: SSE connection maintained throughout
4. **Flexible**: Can verify payments optionally
5. **Consistent**: Same JSON-RPC flow for all tools

## Example Implementations

### Server: Making Any Tool Paid

```typescript
const paidTools = new Set(["pizza-carousel", "premium-data"]);
const isPaidTool = paidTools.has(widget.id);

if (isPaidTool && !args._payment) {
  const error: any = new Error("Payment required");
  error.code = -32001;
  error.data = {
    paymentRequirements: getPaymentRequirements(widget.id)
  };
  throw error;
}
```

### Client: Handling Payment Flow

```typescript
async function callPaidTool(toolName: string, args: any) {
  // Try calling without payment first
  try {
    return await mcpClient.callTool(toolName, args);
  } catch (error) {
    if (error.code === -32001) {
      // Payment required
      const { paymentRequirements } = error.data;
      
      // Show payment UI and get approval
      const approved = await showPaymentDialog(paymentRequirements);
      if (!approved) return;
      
      // Create and submit Solana transaction
      const signature = await createPaymentTransaction(paymentRequirements);
      
      // Retry with payment proof
      const payment = {
        signature,
        timestamp: new Date().toISOString(),
        amount: paymentRequirements.price.amount,
        from: wallet.address
      };
      
      return await mcpClient.callTool(toolName, { ...args, _payment: payment });
    }
    throw error;
  }
}
```

## Testing

### Test Payment Flow

1. Start server: `npm start`
2. Connect MCP client to `http://localhost:8000/mcp`
3. Call `pizza-carousel` without payment → Should get error -32001
4. Extract payment requirements from error
5. Create test transaction on Solana devnet
6. Call `pizza-carousel` with payment proof → Should succeed
7. Check server logs for payment confirmation

### Test Tools

- Free tools (map, albums, list, video) - work without payment
- Paid tool (carousel) - requires payment proof

## Future Enhancements

- [ ] On-chain payment verification
- [ ] Payment caching (don't require payment every time)
- [ ] Subscription models (pay once, use many times)
- [ ] Refund mechanism
- [ ] Multiple payment currencies (SOL, BONK)
- [ ] Payment session tracking
- [ ] Analytics dashboard

## References

- [x402 Protocol Specification](https://github.com/payainetwork/x402-solana)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)
- [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification)

## License

MIT

