#!/usr/bin/env node

/**
 * Simple CLI Test for MCP x402 Payment Protocol
 * 
 * This demonstrates what the requests/responses look like
 * without needing a full MCP client implementation.
 */

console.log('🧪 MCP x402 Payment Protocol - Simple Test\n');
console.log('='.repeat(70));

console.log('\n📝 This test demonstrates the x402 protocol flow');
console.log('   (Simplified - shows expected requests/responses)\n');

// Simulate the flow
console.log('='.repeat(70));
console.log('\n📋 TEST 1: Call pizza-carousel WITHOUT payment\n');

console.log('Request to server:');
const request1 = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: {
    name: 'pizza-carousel',
    arguments: {
      pizzaTopping: 'pepperoni'
    }
  }
};
console.log(JSON.stringify(request1, null, 2));

console.log('\n❌ Expected Response (Error -32001):');
const response1 = {
  jsonrpc: '2.0',
  id: 1,
  error: {
    code: -32001,
    message: 'Payment required for this tool',
    data: {
      paymentRequirements: {
        price: {
          amount: '10000',
          asset: {
            address: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'
          }
        },
        recipient: 'BuXm6nD1tWAHwB18AitXdCkYA5Yu3QKoPxJp2Rn7VjGt',
        description: 'Order pizza from the carousel',
        currency: 'USDC',
        network: 'solana-devnet'
      }
    }
  }
};
console.log(JSON.stringify(response1, null, 2));

console.log('\n💰 Payment Required:');
console.log(`   Amount: 0.01 USDC`);
console.log(`   Recipient: BuXm6nD1tWAHwB18AitX...`);
console.log(`   Description: Order pizza from the carousel`);

console.log('\n='.repeat(70));
console.log('\n📋 TEST 2: User pays with Solana wallet\n');

const mockPayment = {
  signature: '5xK9mF2pQ7rN8sT1vU3wX4yZ5aB6cD7eE8fG9hH0iJ1kL2mN3oP4qR5sT6uV7wX8yZ',
  timestamp: new Date().toISOString(),
  amount: '10000',
  from: 'UserWallet123456789'
};

console.log('Payment Transaction:');
console.log(`   ✅ Signature: ${mockPayment.signature.substring(0, 30)}...`);
console.log(`   ✅ Timestamp: ${mockPayment.timestamp}`);
console.log(`   ✅ Amount: ${mockPayment.amount} micro-USDC (0.01 USDC)`);
console.log(`   ✅ From: ${mockPayment.from}`);

console.log('\n='.repeat(70));
console.log('\n📋 TEST 3: Retry with payment proof\n');

console.log('Request to server (with _payment):');
const request2 = {
  jsonrpc: '2.0',
  id: 2,
  method: 'tools/call',
  params: {
    name: 'pizza-carousel',
    arguments: {
      pizzaTopping: 'pepperoni',
      _payment: mockPayment
    }
  }
};
console.log(JSON.stringify(request2, null, 2));

console.log('\n✅ Expected Response (Success):');
const response2 = {
  jsonrpc: '2.0',
  id: 2,
  result: {
    content: [
      {
        type: 'text',
        text: 'Rendered a pizza carousel!'
      }
    ],
    structuredContent: {
      pizzaTopping: 'pepperoni'
    },
    _meta: {
      'openai/outputTemplate': 'ui://widget/pizza-carousel.html',
      'openai/toolInvocation/invoking': 'Carousel some spots',
      'openai/toolInvocation/invoked': 'Served a fresh carousel',
      'openai/widgetAccessible': true,
      'openai/resultCanProduceWidget': true
    }
  }
};
console.log(JSON.stringify(response2, null, 2));

console.log('\n🍕 Content returned! Pizza carousel rendered!');

console.log('\n='.repeat(70));
console.log('\n📊 Protocol Flow Summary\n');

console.log('Step 1: Call without payment');
console.log('   → Server returns error -32001');
console.log('   → Includes payment requirements\n');

console.log('Step 2: User pays');
console.log('   → Creates Solana USDC transaction');
console.log('   → Gets transaction signature\n');

console.log('Step 3: Retry with proof');
console.log('   → Includes _payment in arguments');
console.log('   → Server logs payment (optional verify)');
console.log('   → Returns content\n');

console.log('='.repeat(70));
console.log('\n🧪 To test with REAL server:\n');

console.log('1. Server is running on http://localhost:8000');
console.log('2. Connect your MCP client');
console.log('3. Try calling pizza-carousel');
console.log('4. Should get error -32001');
console.log('5. Retry with _payment proof');
console.log('6. Should succeed\n');

console.log('📝 For AgentOS integration:');
console.log('   - Intercept error code -32001');
console.log('   - Show payment dialog');
console.log('   - Create Solana transaction');
console.log('   - Retry with _payment proof\n');

console.log('='.repeat(70));
console.log('\n✨ MCP x402 Protocol Implementation Complete! ✨\n');

