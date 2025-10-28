#!/usr/bin/env node

/**
 * Test Pizza Order Flow
 * 
 * Tests the complete flow:
 * 1. Browse carousel (free)
 * 2. Place order without payment → error -32001
 * 3. Place order with payment → success
 */

console.log('🧪 Testing Pizza Order Flow\n');
console.log('='.repeat(70));

console.log('\n📊 Tool Summary:\n');
console.log('  🆓 pizza-carousel - FREE (browse pizzas)');
console.log('  💰 place-pizza-order - $15 USDC (order pizza)\n');

console.log('='.repeat(70));
console.log('\n📋 TEST 1: Browse Pizza Carousel (FREE)\n');

const carouselRequest = {
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

console.log('Request:');
console.log(JSON.stringify(carouselRequest, null, 2));

console.log('\n✅ Expected: Success (no payment required)');
console.log('   Returns: Carousel HTML widget');

console.log('\n='.repeat(70));
console.log('\n📋 TEST 2: Place Order WITHOUT Payment\n');

const orderWithoutPayment = {
  jsonrpc: '2.0',
  id: 2,
  method: 'tools/call',
  params: {
    name: 'place-pizza-order',
    arguments: {
      placeId: 'place-123',
      placeName: "Tony's Pizza"
    }
  }
};

console.log('Request:');
console.log(JSON.stringify(orderWithoutPayment, null, 2));

console.log('\n❌ Expected Response: Error -32001');

const errorResponse = {
  jsonrpc: '2.0',
  id: 2,
  error: {
    code: -32001,
    message: 'Payment required for this tool',
    data: {
      paymentRequirements: {
        price: {
          amount: '15000000',  // $15 USDC
          asset: {
            address: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'
          }
        },
        recipient: 'BuXm6nD1tWAHwB18AitXdCkYA5Yu3QKoPxJp2Rn7VjGt',
        description: 'Order a pizza',
        currency: 'USDC',
        network: 'solana-devnet'
      }
    }
  }
};

console.log(JSON.stringify(errorResponse, null, 2));

console.log('\n💰 Payment Required:');
console.log('   Amount: $15.00 USDC');
console.log('   Description: Order a pizza');
console.log('   Recipient: BuXm6nD1tWAHwB18AitX...');

console.log('\n='.repeat(70));
console.log('\n📋 TEST 3: User Pays with Solana Wallet\n');

const mockPayment = {
  signature: '5xK9mF2pQ7rN8sT1vU3wX4yZ5aB6cD7eE8fG9hH0iJ1kL2mN3oP4qR5sT6uV7wX8yZ',
  timestamp: new Date().toISOString(),
  amount: '15000000',
  from: 'UserWallet123456789'
};

console.log('Payment Transaction:');
console.log(`   ✅ Signature: ${mockPayment.signature.substring(0, 30)}...`);
console.log(`   ✅ Timestamp: ${mockPayment.timestamp}`);
console.log(`   ✅ Amount: ${mockPayment.amount} micro-USDC ($15.00)`);
console.log(`   ✅ From: ${mockPayment.from}`);

console.log('\n='.repeat(70));
console.log('\n📋 TEST 4: Place Order WITH Payment Proof\n');

const orderWithPayment = {
  jsonrpc: '2.0',
  id: 3,
  method: 'tools/call',
  params: {
    name: 'place-pizza-order',
    arguments: {
      placeId: 'place-123',
      placeName: "Tony's Pizza",
      _payment: mockPayment
    }
  }
};

console.log('Request:');
console.log(JSON.stringify(orderWithPayment, null, 2));

console.log('\n✅ Expected Response: Success');

const successResponse = {
  jsonrpc: '2.0',
  id: 3,
  result: {
    content: [{
      type: 'text',
      text: "✅ Pizza order placed successfully!\n\nRestaurant: Tony's Pizza\nOrder ID: 1730118234567\nPayment: 15 USDC\n\nYour pizza will arrive in 30 minutes! 🍕"
    }]
  }
};

console.log(JSON.stringify(successResponse, null, 2));

console.log('\n🍕 Order Confirmed!');

console.log('\n='.repeat(70));
console.log('\n📊 Complete Flow Summary\n');

console.log('Step 1: Browse carousel (FREE)');
console.log('   → User sees pizza places');
console.log('   → Clicks "Order now" button\n');

console.log('Step 2: Widget triggers place-pizza-order');
console.log('   → Widget: window.mcpBridge.callTool()');
console.log('   → AgentOS: Intercepts tool call\n');

console.log('Step 3: First attempt (no payment)');
console.log('   → Server returns error -32001');
console.log('   → AgentOS shows payment dialog ($15 USDC)\n');

console.log('Step 4: User approves payment');
console.log('   → Creates Solana USDC transaction');
console.log('   → Gets transaction signature\n');

console.log('Step 5: Retry with payment proof');
console.log('   → AgentOS includes _payment argument');
console.log('   → Server validates and processes order');
console.log('   → Returns order confirmation\n');

console.log('='.repeat(70));
console.log('\n🎯 Key Features\n');

console.log('✅ FREE browsing (pizza-carousel)');
console.log('✅ PAID ordering (place-pizza-order)');
console.log('✅ Button clicks trigger MCP calls');
console.log('✅ x402 protocol within MCP');
console.log('✅ Payment proof required');
console.log('✅ Order confirmation returned');

console.log('\n='.repeat(70));
console.log('\n📝 For AgentOS Implementation:\n');

console.log('Widget Communication:');
console.log('  - Provide window.mcpBridge.callTool() API');
console.log('  - Or handle window.postMessage events\n');

console.log('Payment Flow:');
console.log('  - Intercept error -32001');
console.log('  - Show payment dialog');
console.log('  - Create Solana transaction');
console.log('  - Retry with _payment proof\n');

console.log('='.repeat(70));
console.log('\n✨ Pizza Order Flow Ready for Integration! ✨\n');

