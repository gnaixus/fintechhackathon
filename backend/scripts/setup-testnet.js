import xrplClient from '../src/xrpl-client.js';

/**
 * Setup script for testnet demo
 * Creates client and freelancer wallets with funded accounts
 */

async function setupTestnet() {
  console.log('🚀 Setting up testnet wallets...\n');

  try {
    // Create client wallet
    console.log('Creating CLIENT wallet...');
    const clientWallet = await xrplClient.createWallet();
    console.log('✅ Client Wallet Created:');
    console.log('   Address:', clientWallet.address);
    console.log('   Seed:', clientWallet.seed);
    console.log('   Balance: 1000 XRP (testnet)\n');

    // Create freelancer wallet
    console.log('Creating FREELANCER wallet...');
    const freelancerWallet = await xrplClient.createWallet();
    console.log('✅ Freelancer Wallet Created:');
    console.log('   Address:', freelancerWallet.address);
    console.log('   Seed:', freelancerWallet.seed);
    console.log('   Balance: 1000 XRP (testnet)\n');

    // Create .env file
    const envContent = `# XRPL Configuration
XRPL_NETWORK=wss://s.altnet.rippletest.net:51233
PORT=3001

# Demo Wallets (TESTNET ONLY - DO NOT USE IN PRODUCTION)
CLIENT_ADDRESS=${clientWallet.address}
CLIENT_SEED=${clientWallet.seed}

FREELANCER_ADDRESS=${freelancerWallet.address}
FREELANCER_SEED=${freelancerWallet.seed}
`;

    // Write to .env file
    await import('fs/promises').then(fs => 
      fs.writeFile('/home/claude/freelance-escrow-xrpl/backend/.env', envContent)
    );

    console.log('✅ .env file created with wallet credentials\n');

    console.log('📋 Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Client Address:', clientWallet.address);
    console.log('Freelancer Address:', freelancerWallet.address);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🎉 Setup complete! You can now:');
    console.log('   1. Run: npm run dev');
    console.log('   2. Test creating escrows');
    console.log('   3. View wallets on: https://testnet.xrpl.org/\n');

  } catch (error) {
    console.error('❌ Error during setup:', error);
  } finally {
    await xrplClient.disconnect();
    process.exit(0);
  }
}

setupTestnet();