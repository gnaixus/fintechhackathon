import { Client, Wallet, xrpToDrops, dropsToXrp } from 'xrpl';

/**
 * XRPL Client for Freelance Escrow Platform - RLUSD VERSION
 * 
 * Features:
 * 1. RLUSD Trust Lines
 * 2. Escrow Creation (using XRP for locking, RLUSD for accounting)
 * 3. RLUSD Payments
 * 4. Hybrid escrow approach
 */

// RLUSD Issuer on Testnet (you may need to update this)
const RLUSD_ISSUER = 'rN7n7otQDd6FczFgLdlqtyMVrn3HMfXpKN'; // Testnet RLUSD issuer
const XRP_TO_RLUSD_RATE = 2.5; // Example: 1 XRP = 2.5 RLUSD (configurable)

class XRPLClient {
  constructor() {
    this.client = null;
    this.network = process.env.XRPL_NETWORK || 'wss://s.altnet.rippletest.net:51233';
    this.rlusdIssuer = RLUSD_ISSUER;
  }

  /**
   * Connect to XRPL network
   */
  async connect() {
    if (this.client && this.client.isConnected()) {
      return;
    }

    this.client = new Client(this.network);
    await this.client.connect();
    console.log('✅ Connected to XRPL:', this.network);
  }

  /**
   * Disconnect from XRPL network
   */
  async disconnect() {
    if (this.client && this.client.isConnected()) {
      await this.client.disconnect();
      console.log('❌ Disconnected from XRPL');
    }
  }

  /**
   * Create a new wallet on testnet with RLUSD trust line
   */
  async createWallet() {
    await this.connect();
    
    const wallet = (await this.client.fundWallet()).wallet;
    
    // Automatically create RLUSD trust line
    try {
      await this.createTrustLine(wallet, this.rlusdIssuer, '1000000');
      console.log('✅ RLUSD trust line created for new wallet');
    } catch (error) {
      console.error('⚠️ Could not create RLUSD trust line:', error.message);
    }
    
    return {
      address: wallet.address,
      seed: wallet.seed,
      publicKey: wallet.publicKey,
    };
  }

  /**
   * Get wallet from seed
   */
  getWallet(seed) {
    return Wallet.fromSeed(seed);
  }

  /**
   * Get account balance (returns both XRP and RLUSD)
   */
  async getBalance(address) {
    await this.connect();
    
    try {
      const response = await this.client.request({
        command: 'account_info',
        account: address,
        ledger_index: 'validated'
      });

      const xrpBalance = dropsToXrp(response.result.account_data.Balance);
      
      // Get RLUSD balance
      let rlusdBalance = '0';
      try {
        const linesResponse = await this.client.request({
          command: 'account_lines',
          account: address,
          ledger_index: 'validated'
        });
        
        const rlusdLine = linesResponse.result.lines.find(
          line => line.currency === 'RLUSD' || line.currency === '525553440000000000000000000000000000000000'
        );
        
        if (rlusdLine) {
          rlusdBalance = rlusdLine.balance;
        }
      } catch (error) {
        console.log('No RLUSD balance found or error:', error.message);
      }

      return {
        xrp: xrpBalance,
        rlusd: rlusdBalance,
        // For display purposes, convert XRP to RLUSD equivalent
        rlusdEquivalent: (parseFloat(xrpBalance) * XRP_TO_RLUSD_RATE).toFixed(2)
      };
    } catch (error) {
      console.error('Error getting balance:', error);
      return { xrp: '0', rlusd: '0', rlusdEquivalent: '0' };
    }
  }

  /**
   * Create RLUSD trust line
   */
  async createTrustLine(wallet, issuerAddress = null, limit = '1000000') {
    await this.connect();

    const issuer = issuerAddress || this.rlusdIssuer;

    const trustSet = {
      TransactionType: 'TrustSet',
      Account: wallet.address,
      LimitAmount: {
        currency: 'RLUSD',
        issuer: issuer,
        value: limit
      }
    };

    try {
      const prepared = await this.client.autofill(trustSet);
      const signed = wallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      console.log('✅ RLUSD trust line created:', result.result.meta.TransactionResult);
      return result;
    } catch (error) {
      console.error('Error creating trust line:', error);
      throw error;
    }
  }

  /**
   * Send RLUSD payment
   */
  async sendRLUSD(senderWallet, destinationAddress, amount) {
    await this.connect();

    const payment = {
      TransactionType: 'Payment',
      Account: senderWallet.address,
      Destination: destinationAddress,
      Amount: {
        currency: 'RLUSD',
        value: amount.toString(),
        issuer: this.rlusdIssuer
      }
    };

    try {
      const prepared = await this.client.autofill(payment);
      const signed = senderWallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      console.log('✅ RLUSD payment sent:', result.result.hash);
      return {
        hash: result.result.hash,
        result: result.result.meta.TransactionResult,
        amount: amount
      };
    } catch (error) {
      console.error('Error sending RLUSD:', error);
      throw error;
    }
  }

  /**
   * Create escrow for project milestone (HYBRID: XRP escrow + RLUSD accounting)
   * 
   * This uses XRP escrows for the locking mechanism, but we track RLUSD amounts
   * in the memos for accounting purposes
   */
  async createEscrow({ clientWallet, freelancerAddress, amount, finishAfter, projectData }) {
    await this.connect();

    // Convert RLUSD to XRP for the escrow (using conversion rate)
    const xrpAmount = (parseFloat(amount) / XRP_TO_RLUSD_RATE).toFixed(6);
    
    const rippleEpoch = 946684800;
    const finishAfterRipple = finishAfter ? Math.floor(finishAfter / 1000) - rippleEpoch : undefined;

    // Add RLUSD amount to project data
    const enhancedProjectData = {
      ...projectData,
      rlusdAmount: amount,
      xrpAmount: xrpAmount,
      conversionRate: XRP_TO_RLUSD_RATE
    };

    const escrowCreate = {
      TransactionType: 'EscrowCreate',
      Account: clientWallet.address,
      Destination: freelancerAddress,
      Amount: xrpToDrops(xrpAmount),
      FinishAfter: finishAfterRipple,
      Memos: [
        {
          Memo: {
            MemoType: Buffer.from('project_data', 'utf8').toString('hex').toUpperCase(),
            MemoData: Buffer.from(JSON.stringify(enhancedProjectData), 'utf8').toString('hex').toUpperCase()
          }
        },
        {
          Memo: {
            MemoType: Buffer.from('currency', 'utf8').toString('hex').toUpperCase(),
            MemoData: Buffer.from('RLUSD', 'utf8').toString('hex').toUpperCase()
          }
        }
      ]
    };

    try {
      const prepared = await this.client.autofill(escrowCreate);
      const signed = clientWallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      console.log('✅ Escrow created (RLUSD accounting):', result.result.hash);
      
      return {
        hash: result.result.hash,
        escrowSequence: prepared.Sequence,
        result: result.result.meta.TransactionResult,
        amount: amount, // RLUSD amount
        xrpAmount: xrpAmount, // Actual XRP locked
        destination: freelancerAddress,
        finishAfter: finishAfter
      };
    } catch (error) {
      console.error('Error creating escrow:', error);
      throw error;
    }
  }

  /**
   * Get escrow details
   */
  async getEscrow(ownerAddress, sequence) {
    await this.connect();

    try {
      const escrows = await this.client.request({
        command: 'account_objects',
        account: ownerAddress,
        type: 'escrow'
      });

      const escrow = escrows.result.account_objects.find(
        obj => obj.PreviousTxnID || obj.Sequence === sequence
      );

      if (!escrow) {
        return null;
      }

      let projectData = null;
      let rlusdAmount = null;
      
      if (escrow.Memos && escrow.Memos.length > 0) {
        try {
          for (const memo of escrow.Memos) {
            const memoType = Buffer.from(memo.Memo.MemoType, 'hex').toString('utf8');
            const memoData = Buffer.from(memo.Memo.MemoData, 'hex').toString('utf8');
            
            if (memoType === 'project_data') {
              projectData = JSON.parse(memoData);
              rlusdAmount = projectData.rlusdAmount;
            }
          }
        } catch (e) {
          console.error('Error parsing memo:', e);
        }
      }

      const xrpAmount = dropsToXrp(escrow.Amount);
      
      return {
        amount: rlusdAmount || (parseFloat(xrpAmount) * XRP_TO_RLUSD_RATE).toFixed(2), // RLUSD
        xrpAmount: xrpAmount,
        destination: escrow.Destination,
        finishAfter: escrow.FinishAfter,
        cancelAfter: escrow.CancelAfter,
        projectData: projectData,
        sequence: escrow.Sequence || sequence
      };
    } catch (error) {
      console.error('Error getting escrow:', error);
      return null;
    }
  }

  /**
   * Get all escrows for an account
   */
  async getAccountEscrows(address) {
    await this.connect();

    try {
      const escrows = await this.client.request({
        command: 'account_objects',
        account: address,
        type: 'escrow'
      });

      return escrows.result.account_objects.map(escrow => {
        let projectData = null;
        let rlusdAmount = null;
        
        if (escrow.Memos && escrow.Memos.length > 0) {
          try {
            for (const memo of escrow.Memos) {
              const memoType = Buffer.from(memo.Memo.MemoType, 'hex').toString('utf8');
              const memoData = Buffer.from(memo.Memo.MemoData, 'hex').toString('utf8');
              
              if (memoType === 'project_data') {
                projectData = JSON.parse(memoData);
                rlusdAmount = projectData.rlusdAmount;
              }
            }
          } catch (e) {
            // Ignore
          }
        }

        const xrpAmount = dropsToXrp(escrow.Amount);
        
        return {
          amount: rlusdAmount || (parseFloat(xrpAmount) * XRP_TO_RLUSD_RATE).toFixed(2),
          xrpAmount: xrpAmount,
          destination: escrow.Destination,
          finishAfter: escrow.FinishAfter,
          cancelAfter: escrow.CancelAfter,
          projectData: projectData,
          sequence: escrow.Sequence,
          owner: address
        };
      });
    } catch (error) {
      console.error('Error getting account escrows:', error);
      return [];
    }
  }

  /**
   * Finish (release) escrow
   */
  async finishEscrow(freelancerWallet, ownerAddress, escrowSequence) {
    await this.connect();

    const escrowFinish = {
      TransactionType: 'EscrowFinish',
      Account: freelancerWallet.address,
      Owner: ownerAddress,
      OfferSequence: escrowSequence
    };

    try {
      const prepared = await this.client.autofill(escrowFinish);
      const signed = freelancerWallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      console.log('✅ Escrow finished (XRP released, tracked as RLUSD):', result.result.hash);
      
      return {
        hash: result.result.hash,
        result: result.result.meta.TransactionResult
      };
    } catch (error) {
      console.error('Error finishing escrow:', error);
      throw error;
    }
  }

  /**
   * Cancel escrow
   */
  async cancelEscrow(wallet, ownerAddress, escrowSequence) {
    await this.connect();

    const escrowCancel = {
      TransactionType: 'EscrowCancel',
      Account: wallet.address,
      Owner: ownerAddress,
      OfferSequence: escrowSequence
    };

    try {
      const prepared = await this.client.autofill(escrowCancel);
      const signed = wallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      console.log('✅ Escrow cancelled:', result.result.hash);
      
      return {
        hash: result.result.hash,
        result: result.result.meta.TransactionResult
      };
    } catch (error) {
      console.error('Error cancelling escrow:', error);
      throw error;
    }
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(address) {
    await this.connect();

    try {
      const transactions = await this.client.request({
        command: 'account_tx',
        account: address,
        ledger_index_min: -1,
        ledger_index_max: -1,
        limit: 100
      });

      const completedEscrows = transactions.result.transactions.filter(tx => 
        tx.tx.TransactionType === 'EscrowFinish' && 
        tx.meta.TransactionResult === 'tesSUCCESS'
      );

      return {
        totalTransactions: transactions.result.transactions.length,
        completedEscrows: completedEscrows.length,
        transactions: completedEscrows
      };
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return {
        totalTransactions: 0,
        completedEscrows: 0,
        transactions: []
      };
    }
  }

  /**
   * Get conversion rate
   */
  getConversionRate() {
    return XRP_TO_RLUSD_RATE;
  }

  /**
   * Convert XRP to RLUSD
   */
  xrpToRLUSD(xrpAmount) {
    return (parseFloat(xrpAmount) * XRP_TO_RLUSD_RATE).toFixed(2);
  }

  /**
   * Convert RLUSD to XRP
   */
  rlusdToXRP(rlusdAmount) {
    return (parseFloat(rlusdAmount) / XRP_TO_RLUSD_RATE).toFixed(6);
  }
}

// Export singleton instance
const xrplClient = new XRPLClient();
export default xrplClient;