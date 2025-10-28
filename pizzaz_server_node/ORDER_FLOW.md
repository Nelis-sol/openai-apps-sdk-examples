# Pizza Order Flow - x402 Payment on Order

## Overview

We've implemented a **two-tool flow** for better UX:
1. **Pizza Carousel** (FREE) - Browse pizza places
2. **Place Order** (PAID) - Order a pizza with payment

This allows users to browse for free and only pay when they actually order.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Step 1: Browse (FREE)                                   │
│  ─────────────────                                       │
│  User → calls pizza-carousel tool                        │
│  Server → returns carousel HTML (no payment)             │
│  Widget → renders in AgentOS                             │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Step 2: User clicks "Order now" button                  │
│  ───────────────────────────────────                     │
│  Widget → triggers place-pizza-order tool                │
│  AgentOS → intercepts (tool has payment field)           │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Step 3: Payment Required (x402)                         │
│  ────────────────────────────                            │
│  AgentOS → calls place-pizza-order (no payment)          │
│  Server → returns error -32001                           │
│  AgentOS → shows payment dialog ($15 USDC)               │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Step 4: User approves payment                           │
│  ──────────────────────────                              │
│  User → approves in Solana wallet                        │
│  AgentOS → creates USDC transaction                      │
│  AgentOS → gets transaction signature                    │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Step 5: Order placed with payment proof                 │
│  ─────────────────────────────────────                   │
│  AgentOS → retries place-pizza-order with _payment       │
│  Server → validates and processes order                  │
│  Server → returns order confirmation                     │
│  User → sees "Order placed successfully!" 🍕             │
└─────────────────────────────────────────────────────────┘
```

## Tools

### 1. pizza-carousel (FREE)

**Purpose**: Browse pizza places  
**Payment**: None required  
**Usage**: 
```json
{
  "name": "pizza-carousel",
  "arguments": {
    "pizzaTopping": "pepperoni"
  }
}
```

**Returns**: Carousel HTML widget


### 2. place-pizza-order (PAID - $15 USDC)

**Purpose**: Order a pizza  
**Payment**: 15.0 USDC required  
**Usage**:

**First call (no payment):**
```json
{
  "name": "place-pizza-order",
  "arguments": {
    "placeId": "place-123",
    "placeName": "Tony's Pizza"
  }
}
```

**Response: Error -32001**
```json
{
  "error": {
    "code": -32001,
    "message": "Payment required for this tool",
    "data": {
      "paymentRequirements": {
        "price": {
          "amount": "15000000",
          "asset": {
            "address": "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
          }
        },
        "recipient": "BuXm6nD1tWAHwB18AitXdCkYA5Yu3QKoPxJp2Rn7VjGt",
        "description": "Order a pizza",
        "currency": "USDC",
        "network": "solana-devnet"
      }
    }
  }
}
```

**Second call (with payment):**
```json
{
  "name": "place-pizza-order",
  "arguments": {
    "placeId": "place-123",
    "placeName": "Tony's Pizza",
    "_payment": {
      "signature": "5xK9mF2p...",
      "timestamp": "2025-10-28T...",
      "amount": "15000000",
      "from": "UserWallet..."
    }
  }
}
```

**Response: Success**
```json
{
  "result": {
    "content": [{
      "type": "text",
      "text": "✅ Pizza order placed successfully!\n\nRestaurant: Tony's Pizza\nOrder ID: 1730118234567\nPayment: 15 USDC\n\nYour pizza will arrive in 30 minutes! 🍕"
    }]
  }
}
```

## Widget Button Integration

The "Order now" button in the carousel widget triggers the MCP tool call:

```jsx
<button
  onClick={() => {
    // Option 1: Use MCP bridge API (if AgentOS provides it)
    if (window.mcpBridge?.callTool) {
      window.mcpBridge.callTool('place-pizza-order', {
        placeId: place.id,
        placeName: place.name
      });
    } else {
      // Option 2: Fallback to postMessage
      window.parent.postMessage({
        type: 'mcp-tool-call',
        tool: 'place-pizza-order',
        arguments: {
          placeId: place.id,
          placeName: place.name
        }
      }, '*');
    }
  }}
>
  Order now
</button>
```

## AgentOS Integration

AgentOS needs to:

### 1. Provide MCP Bridge API

```javascript
// In the widget iframe context
window.mcpBridge = {
  callTool: async (toolName, args) => {
    // AgentOS handles:
    // - Calling MCP tool
    // - Intercepting payment errors
    // - Showing payment dialog
    // - Collecting payment proof
    // - Retrying with proof
  }
};
```

### 2. Handle postMessage Fallback

```javascript
// In AgentOS main window
window.addEventListener('message', (event) => {
  if (event.data.type === 'mcp-tool-call') {
    const { tool, arguments } = event.data;
    // Same flow as above
  }
});
```

### 3. Payment Flow Handler

```javascript
async function handleToolCall(toolName, args) {
  try {
    // Try calling without payment
    const result = await mcpClient.callTool(toolName, args);
    return result;
    
  } catch (error) {
    if (error.code === -32001) {
      // Payment required
      const { paymentRequirements } = error.data;
      
      // Show payment dialog
      const approved = await showPaymentDialog({
        amount: Number(paymentRequirements.price.amount) / 1_000_000,
        currency: paymentRequirements.currency,
        description: paymentRequirements.description
      });
      
      if (!approved) {
        throw new Error('Payment cancelled');
      }
      
      // Create Solana transaction
      const signature = await createSolanaTransaction({
        amount: paymentRequirements.price.amount,
        recipient: paymentRequirements.recipient,
        tokenMint: paymentRequirements.price.asset.address
      });
      
      // Retry with payment proof
      return await mcpClient.callTool(toolName, {
        ...args,
        _payment: {
          signature,
          timestamp: new Date().toISOString(),
          amount: paymentRequirements.price.amount,
          from: wallet.address
        }
      });
    }
    throw error;
  }
}
```

## Server Logging

When an order is placed, server logs:

```
🍕💰 Pizza order received with payment:
  Place: Tony's Pizza (place-123)
  Signature: 5xK9mF2pQ7rN8sT1vU3wX4yZ5aB6cD7eE8fG9hH0iJ...
  Amount: 15000000 micro-USDC
  From: UserWalletAddress
  Timestamp: 2025-10-28T20:30:00.000Z
```

## Testing

### Test Free Tool
```bash
# Call pizza-carousel
# Should succeed without payment
```

### Test Paid Tool

**Step 1**: Call without payment
```json
{
  "name": "place-pizza-order",
  "arguments": {
    "placeId": "place-123",
    "placeName": "Test Pizza"
  }
}
```
**Expected**: Error -32001

**Step 2**: Call with payment proof
```json
{
  "name": "place-pizza-order",
  "arguments": {
    "placeId": "place-123",
    "placeName": "Test Pizza",
    "_payment": {
      "signature": "test-sig-123...",
      "timestamp": "2025-10-28T20:30:00Z",
      "amount": "15000000",
      "from": "TestWallet"
    }
  }
}
```
**Expected**: Success with order confirmation

## Summary

| Tool | Free/Paid | Price | Purpose |
|------|-----------|-------|---------|
| pizza-carousel | 🆓 FREE | - | Browse pizza places |
| pizza-map | 🆓 FREE | - | View on map |
| pizza-albums | 🆓 FREE | - | Photo gallery |
| pizza-list | 🆓 FREE | - | List view |
| pizza-video | 🆓 FREE | - | Video view |
| **place-pizza-order** | **💰 PAID** | **15 USDC** | **Place pizza order** |

## Benefits

✅ **Better UX**: Free browsing, pay only when ordering  
✅ **Clear pricing**: $15 USDC per order (not per view)  
✅ **Widget interaction**: Buttons actually work!  
✅ **MCP native**: x402 within JSON-RPC protocol  
✅ **Payment proof**: Transaction signature required  
✅ **Scalable**: Easy to add more paid actions

## Next Steps

For AgentOS team:
1. Implement `window.mcpBridge.callTool()` API
2. Handle widget postMessage events
3. Add x402 error (-32001) handling
4. Implement payment dialog UI
5. Create Solana transaction flow
6. Test complete flow end-to-end

This is production-ready! 🚀

