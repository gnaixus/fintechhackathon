import { Client, Wallet, xrpToDrops, dropsToXrp } from 'xrpl';

/**
 * XRPL Client for Freelance Escrow Platform
 * 
 * Features:
 * 1. Escrow Creation (EscrowCreate)
 * 2. Escrow Release (EscrowFinish)
 * 3. Escrow Cancellation (EscrowCancel)
 * 4. RLUSD Trust Lines
 * 5. DID Reputation System
 * 6. Memos for Project Metadata
 */

class XRPLClient {
  constructor() {
    this.client = null;
    this.network = process.env.XRPL_NETWORK || 'wss://s.altnet.rippletest.net:51233'; // Testnet
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
   * Create a new wallet on testnet
   * @returns {Object} Wallet with address and seed
   */
  async createWallet() {
    await this.connect();
    
    // Fund wallet on testnet
    const wallet = (await this.client.fundWallet()).wallet;
    
    return {
      address: wallet.address,
      seed: wallet.seed,
      publicKey: wallet.publicKey,
    };
  }

  /**
   * Get wallet from seed
   * @param {string} seed - Wallet seed
   * @returns {Wallet} XRPL Wallet instance
   */
  getWallet(seed) {
    return Wallet.fromSeed(seed);
  }

  /**
   * Get account balance
   * @param {string} address - XRPL address
   * @returns {string} Balance in XRP
   */
  async getBalance(address) {
    await this.connect();
    
    const response = await this.client.request({
      command: 'account_info',
      account: address,
      ledger_index: 'validated'
    });

    return dropsToXrp(response.result.account_data.Balance);
  }

  /**
   * Create RLUSD trust line
   * @param {Wallet} wallet - User's wallet
   * @param {string} issuerAddress - RLUSD issuer address
   * @param {string} limit - Trust line limit (default: 1000000)
   */
  async createTrustLine(wallet, issuerAddress, limit = '1000000') {
    await this.connect();

    const trustSet = {
      TransactionType: 'TrustSet',
      Account: wallet.address,
      LimitAmount: {
        currency: 'RLUSD',
        issuer: issuerAddress,
        value: limit
      }
    };

    const prepared = await this.client.autofill(trustSet);
    const signed = wallet.sign(prepared);
    const result = await this.client.submitAndWait(signed.tx_blob);

    console.log('✅ Trust line created:', result.result.meta.TransactionResult);
    return result;
  }

  /**
   * Create escrow for project milestone
   * @param {Object} params - Escrow parameters
   * @param {Wallet} params.clientWallet - Client's wallet
   * @param {string} params.freelancerAddress - Freelancer's XRPL address
   * @param {string} params.amount - Amount in XRP
   * @param {number} params.finishAfter - Unix timestamp for auto-release
   * @param {Object} params.projectData - Project metadata
   * @returns {Object} Escrow transaction result
   */
  async createEscrow({ clientWallet, freelancerAddress, amount, finishAfter, projectData }) {
    await this.connect();

    const rippleEpoch = 946684800; // January 1, 2000 00:00 UTC
    const finishAfterRipple = finishAfter ? Math.floor(finishAfter / 1000) - rippleEpoch : undefined;

    // Create escrow transaction with memo
    const escrowCreate = {
      TransactionType: 'EscrowCreate',
      Account: clientWallet.address,
      Destination: freelancerAddress,
      Amount: xrpToDrops(amount),
      FinishAfter: finishAfterRipple,
      Memos: [
        {
          Memo: {
            MemoType: Buffer.from('project_data', 'utf8').toString('hex').toUpperCase(),
            MemoData: Buffer.from(JSON.stringify(projectData), 'utf8').toString('hex').toUpperCase()
          }
        }
      ]
    };

    const prepared = await this.client.autofill(escrowCreate);
    const signed = clientWallet.sign(prepared);
    const result = await this.client.submitAndWait(signed.tx_blob);

    console.log('✅ Escrow created:', result.result.hash);
    
    return {
      hash: result.result.hash,
      escrowSequence: prepared.Sequence,
      result: result.result.meta.TransactionResult,
      amount: amount,
      destination: freelancerAddress,
      finishAfter: finishAfter
    };
  }

  /**
   * Get escrow details
   * @param {string} ownerAddress - Escrow owner address
   * @param {number} sequence - Escrow sequence number
   */
  async getEscrow(ownerAddress, sequence) {
    await this.connect();

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

    // Parse memos if present
    let projectData = null;
    if (escrow.Memos && escrow.Memos.length > 0) {
      try {
        const memoData = Buffer.from(escrow.Memos[0].Memo.MemoData, 'hex').toString('utf8');
        projectData = JSON.parse(memoData);
      } catch (e) {
        console.error('Error parsing memo:', e);
      }
    }

    return {
      amount: dropsToXrp(escrow.Amount),
      destination: escrow.Destination,
      finishAfter: escrow.FinishAfter,
      cancelAfter: escrow.CancelAfter,
      projectData: projectData,
      sequence: escrow.Sequence || sequence
    };
  }

  /**
   * Get all escrows for an account
   * @param {string} address - XRPL address
   */
  async getAccountEscrows(address) {
    await this.connect();

    const escrows = await this.client.request({
      command: 'account_objects',
      account: address,
      type: 'escrow'
    });

    return escrows.result.account_objects.map(escrow => {
      let projectData = null;
      if (escrow.Memos && escrow.Memos.length > 0) {
        try {
          const memoData = Buffer.from(escrow.Memos[0].Memo.MemoData, 'hex').toString('utf8');
          projectData = JSON.parse(memoData);
        } catch (e) {
          // Ignore parsing errors
        }
      }

      return {
        amount: dropsToXrp(escrow.Amount),
        destination: escrow.Destination,
        finishAfter: escrow.FinishAfter,
        cancelAfter: escrow.CancelAfter,
        projectData: projectData,
        sequence: escrow.Sequence,
        owner: address
      };
    });
  }

  /**
   * Finish (release) escrow
   * @param {Wallet} freelancerWallet - Freelancer's wallet
   * @param {string} ownerAddress - Escrow owner (client) address
   * @param {number} escrowSequence - Escrow sequence number
   */
  async finishEscrow(freelancerWallet, ownerAddress, escrowSequence) {
    await this.connect();

    const escrowFinish = {
      TransactionType: 'EscrowFinish',
      Account: freelancerWallet.address,
      Owner: ownerAddress,
      OfferSequence: escrowSequence
    };

    const prepared = await this.client.autofill(escrowFinish);
    const signed = freelancerWallet.sign(prepared);
    const result = await this.client.submitAndWait(signed.tx_blob);

    console.log('✅ Escrow finished:', result.result.hash);
    
    return {
      hash: result.result.hash,
      result: result.result.meta.TransactionResult
    };
  }

  /**
   * Cancel escrow (if CancelAfter time has passed)
   * @param {Wallet} wallet - Any wallet (client or freelancer)
   * @param {string} ownerAddress - Escrow owner (client) address
   * @param {number} escrowSequence - Escrow sequence number
   */
  async cancelEscrow(wallet, ownerAddress, escrowSequence) {
    await this.connect();

    const escrowCancel = {
      TransactionType: 'EscrowCancel',
      Account: wallet.address,
      Owner: ownerAddress,
      OfferSequence: escrowSequence
    };

    const prepared = await this.client.autofill(escrowCancel);
    const signed = wallet.sign(prepared);
    const result = await this.client.submitAndWait(signed.tx_blob);

    console.log('✅ Escrow cancelled:', result.result.hash);
    
    return {
      hash: result.result.hash,
      result: result.result.meta.TransactionResult
    };
  }

  /**
   * Store DID reputation record
   * @param {Wallet} wallet - User's wallet
   * @param {Object} reputationData - Reputation data
   */
  async storeReputation(wallet, reputationData) {
    await this.connect();

    // Store reputation as account memo
    const accountSet = {
      TransactionType: 'AccountSet',
      Account: wallet.address,
      Memos: [
        {
          Memo: {
            MemoType: Buffer.from('reputation', 'utf8').toString('hex').toUpperCase(),
            MemoData: Buffer.from(JSON.stringify(reputationData), 'utf8').toString('hex').toUpperCase()
          }
        }
      ]
    };

    const prepared = await this.client.autofill(accountSet);
    const signed = wallet.sign(prepared);
    const result = await this.client.submitAndWait(signed.tx_blob);

    console.log('✅ Reputation stored:', result.result.hash);
    return result;
  }

  /**
   * Get transaction history for reputation calculation
   * @param {string} address - XRPL address
   */
  async getTransactionHistory(address) {
    await this.connect();

    const transactions = await this.client.request({
      command: 'account_tx',
      account: address,
      ledger_index_min: -1,
      ledger_index_max: -1,
      limit: 100
    });

    // Filter for completed escrows
    const completedEscrows = transactions.result.transactions.filter(tx => 
      tx.tx.TransactionType === 'EscrowFinish' && 
      tx.meta.TransactionResult === 'tesSUCCESS'
    );

    return {
      totalTransactions: transactions.result.transactions.length,
      completedEscrows: completedEscrows.length,
      transactions: completedEscrows
    };
  }
}

// Export singleton instance
const xrplClient = new XRPLClient();
export default xrplClient;