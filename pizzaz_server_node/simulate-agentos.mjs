#!/usr/bin/env node

/**
 * Simulate AgentOS behavior for testing
 * 
 * This shows what AgentOS should do when a widget calls a tool:
 * 1. Call tool without payment
 * 2. If error -32001, show payment dialog (simulated)
 * 3. Create payment proof (mock)
 * 4. Retry with payment
 */

console.log('🧪 Simulating AgentOS MCP Bridge Behavior\n');
console.log('='.repeat(70));

// Simulate what happens when user clicks "Order now" button
async function simulateWidgetButtonClick() {
  console.log('📱 Widget: User clicked "Order now" button');
  console.log('📱 Widget: Calling window.mcpBridge.callTool()...\n');
  
  // This is what AgentOS should implement
  const mcpBridge = {
    async callTool(toolName, args) {
      console.log(`🔧 AgentOS: Received tool call: ${toolName}`);
      console.log(`🔧 AgentOS: Arguments:`, JSON.stringify(args, null, 2));
      
      try {
        // Step 1: Try calling without payment
        console.log('\n📡 AgentOS: Calling MCP server...');
        const result = await callMcpTool(toolName, args);
        console.log('✅ AgentOS: Tool succeeded without payment');
        return result;
        
      } catch (error) {
        if (error.code === -32001) {
          console.log('\n💰 AgentOS: Payment required!');
          console.log(`💰 AgentOS: Amount: ${Number(error.data.paymentRequirements.price.amount) / 1_000_000} ${error.data.paymentRequirements.currency}`);
          console.log(`💰 AgentOS: Description: ${error.data.paymentRequirements.description}`);
          
          // Step 2: Show payment dialog (simulated)
          console.log('\n💳 AgentOS: Showing payment dialog to user...');
          const paymentApproved = await simulatePaymentDialog(error.data.paymentRequirements);
          
          if (!paymentApproved) {
            throw new Error('Payment cancelled by user');
          }
          
          // Step 3: Create payment proof (mock)
          console.log('\n🔐 AgentOS: Creating Solana transaction...');
          const paymentProof = await createMockPayment(error.data.paymentRequirements);
          
          // Step 4: Retry with payment
          console.log('\n📡 AgentOS: Retrying with payment proof...');
          const result = await callMcpTool(toolName, { ...args, _payment: paymentProof });
          console.log('✅ AgentOS: Order placed successfully!');
          return result;
          
        } else {
          throw error;
        }
      }
    }
  };
  
  // Simulate the widget call
  try {
    const result = await mcpBridge.callTool('place-pizza-order', {
      placeId: 'place-123',
      placeName: "Tony's Pizza"
    });
    
    console.log('\n🎉 Widget: Received result:');
    console.log(result.content[0].text);
    
  } catch (error) {
    console.log('\n❌ Widget: Error:', error.message);
  }
}

// Mock MCP tool call (simulates what AgentOS does)
async function callMcpTool(toolName, args) {
  // This simulates the actual MCP call to your server
  if (toolName === 'place-pizza-order') {
    if (!args._payment) {
      // Simulate server response without payment
      const error = new Error('Payment required for this tool');
      error.code = -32001;
      error.data = {
        paymentRequirements: {
          price: {
            amount: '15000000',
            asset: {
              address: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'
            }
          },
          recipient: 'BuXm6nD1tWAHwB18AitXdCkYA5Yu3QKoPxJp2Rn7VjGt',
          description: 'Order a pizza',
          currency: 'USDC',
          network: 'solana-devnet'
        }
      };
      throw error;
    } else {
      // Simulate server response with payment
      return {
        content: [{
          type: 'text',
          text: `✅ Pizza order placed successfully!\n\nRestaurant: ${args.placeName}\nOrder ID: ${Date.now()}\nPayment: ${Number(args._payment.amount) / 1_000_000} USDC\n\nYour pizza will arrive in 30 minutes! 🍕`
        }]
      };
    }
  }
}

// Simulate payment dialog
async function simulatePaymentDialog(requirements) {
  console.log('💳 Payment Dialog:');
  console.log(`   Amount: ${Number(requirements.price.amount) / 1_000_000} ${requirements.currency}`);
  console.log(`   Description: ${requirements.description}`);
  console.log(`   Recipient: ${requirements.recipient.substring(0, 20)}...`);
  console.log('   [Cancel] [Pay Now]');
  
  // Simulate user clicking "Pay Now"
  console.log('👤 User: Clicks "Pay Now"');
  return true; // Approved
}

// Create mock payment proof
async function createMockPayment(requirements) {
  console.log('🔐 Creating Solana transaction...');
  console.log('🔐 Signing transaction...');
  console.log('🔐 Transaction submitted to blockchain...');
  
  return {
    signature: '5xK9mF2pQ7rN8sT1vU3wX4yZ5aB6cD7eE8fG9hH0iJ1kL2mN3oP4qR5sT6uV7wX8yZ',
    timestamp: new Date().toISOString(),
    amount: requirements.price.amount,
    from: 'UserWallet123456789'
  };
}

// Run the simulation
simulateWidgetButtonClick().then(() => {
  console.log('\n' + '='.repeat(70));
  console.log('\n📝 Summary: What AgentOS Needs to Implement\n');
  
  console.log('1. Provide window.mcpBridge.callTool() API in widget context');
  console.log('2. Handle MCP tool calls from widgets');
  console.log('3. Intercept error -32001 (payment required)');
  console.log('4. Show payment dialog to user');
  console.log('5. Create Solana transaction when approved');
  console.log('6. Retry tool call with payment proof');
  console.log('7. Return result to widget');
  
  console.log('\n🎯 Current Status:');
  console.log('   ✅ Server ready (MCP x402 implemented)');
  console.log('   ✅ Widget button calls mcpBridge.callTool()');
  console.log('   ⚠️  AgentOS needs to implement mcpBridge API');
  
  console.log('\n✨ Once AgentOS implements this, the button will work! ✨\n');
});

