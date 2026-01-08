import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import xrplClient from './xrpl-client.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage
const projects = new Map();
const users = new Map();

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Freelance Escrow API (RLUSD Edition)',
    currency: 'RLUSD',
    conversionRate: xrplClient.getConversionRate()
  });
});

/**
 * Create new wallet with RLUSD trust line
 */
app.post('/api/wallet/create', async (req, res) => {
  try {
    const wallet = await xrplClient.createWallet();
    const balance = await xrplClient.getBalance(wallet.address);
    
    res.json({ 
      success: true, 
      wallet: { 
        ...wallet, 
        balance: balance.rlusdEquivalent, // Display RLUSD equivalent
        balances: balance
      } 
    });
  } catch (error) {
    console.error('Error creating wallet:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Verify wallet from seed
 */
app.post('/api/wallet/verify', async (req, res) => {
  try {
    const { seed } = req.body || {};
    if (!seed || typeof seed !== 'string') {
      return res.status(400).json({ success: false, error: 'Missing seed' });
    }

    if (!seed.startsWith('s')) {
      return res.status(400).json({ success: false, error: 'Invalid seed format' });
    }

    const wallet = xrplClient.getWallet(seed);
    const balance = await xrplClient.getBalance(wallet.address);

    // Ensure RLUSD trust line exists
    try {
      await xrplClient.createTrustLine(wallet);
    } catch (error) {
      console.log('Trust line may already exist:', error.message);
    }

    users.set(wallet.address, {
      address: wallet.address,
      publicKey: wallet.publicKey,
      lastSeenAt: new Date().toISOString()
    });

    res.json({
      success: true,
      wallet: {
        address: wallet.address,
        publicKey: wallet.publicKey,
        balance: balance.rlusdEquivalent, // Display RLUSD
        balances: balance
      }
    });
  } catch (error) {
    console.error('Error verifying wallet:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get wallet balance (returns RLUSD equivalent)
 */
app.get('/api/wallet/:address/balance', async (req, res) => {
  try {
    const balance = await xrplClient.getBalance(req.params.address);
    res.json({ 
      success: true, 
      balance: balance.rlusdEquivalent, // Primary balance in RLUSD
      balances: balance
    });
  } catch (error) {
    console.error('Error getting balance:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Create new project with escrow (amounts in RLUSD)
 */
async function createProjectWithEscrows(req, res) {
  try {
    const body = req.body || {};
    const clientSeed = body.clientSeed || body.client_seed || body.employer_seed;
    const freelancerAddress = body.freelancerAddress || body.freelancer_address;
    const title = body.title;
    const description = body.description;
    const milestones = Array.isArray(body.milestones) ? body.milestones : [];

    if (!clientSeed || !freelancerAddress || milestones.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    const clientWallet = xrplClient.getWallet(clientSeed);
    const projectId = `proj_${Date.now()}`;
    
    // Create escrows for each milestone (amounts are in RLUSD)
    const escrows = [];
    for (const milestone of milestones) {
      const projectData = {
        projectId,
        title,
        description,
        milestoneName: milestone.name,
        milestoneIndex: milestones.indexOf(milestone)
      };

      const finishAfterMs = Date.now() + 10_000; // 10 seconds from now
      
      // Amount is already in RLUSD, xrpl-client will handle conversion
      const escrowResult = await xrplClient.createEscrow({
        clientWallet,
        freelancerAddress,
        amount: milestone.amount.toString(), // RLUSD amount
        finishAfter: finishAfterMs,
        projectData
      });

      escrows.push({
        ...escrowResult,
        milestoneName: milestone.name,
        status: 'pending'
      });
    }

    // Store project
    const project = {
      id: projectId,
      title,
      description,
      clientAddress: clientWallet.address,
      freelancerAddress,
      status: 'pending',
      currency: 'RLUSD',
      milestones: milestones.map((m, idx) => ({
        ...m,
        escrow: escrows[idx],
        status: 'pending',
        submission: null
      })),
      createdAt: new Date().toISOString()
    };

    projects.set(projectId, project);

    res.json({ 
      success: true, 
      project,
      message: `Created ${escrows.length} escrows for project (RLUSD accounting)` 
    });

  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

app.post('/api/projects/create', createProjectWithEscrows);
app.post('/api/projects/create-with-wallet', createProjectWithEscrows);

/**
 * Get project details
 */
app.get('/api/projects/:projectId', async (req, res) => {
  try {
    const project = projects.get(req.params.projectId);
    
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        error: 'Project not found' 
      });
    }

    // Refresh escrow status
    for (const milestone of project.milestones) {
      if (milestone.escrow && milestone.status === 'pending') {
        const escrowData = await xrplClient.getEscrow(
          project.clientAddress, 
          milestone.escrow.escrowSequence
        );
        
        if (!escrowData) {
          milestone.status = 'released';
        }
      }
    }

    res.json({ success: true, project });
  } catch (error) {
    console.error('Error getting project:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get all escrows for an address
 */
app.get('/api/escrows/:address', async (req, res) => {
  try {
    const escrows = await xrplClient.getAccountEscrows(req.params.address);
    res.json({ success: true, escrows });
  } catch (error) {
    console.error('Error getting escrows:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Approve milestone (release escrow)
 */
app.post('/api/milestones/approve', async (req, res) => {
  try {
    const { projectId, milestoneIndex, freelancerSeed } = req.body;
    
    const project = projects.get(projectId);
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        error: 'Project not found' 
      });
    }

    const milestone = project.milestones[milestoneIndex];
    if (!milestone) {
      return res.status(404).json({ 
        success: false, 
        error: 'Milestone not found' 
      });
    }

    if (milestone.status !== 'approved') {
      return res.status(400).json({ 
        success: false, 
        error: 'Work must be approved by client first' 
      });
    }

    const freelancerWallet = xrplClient.getWallet(freelancerSeed);
    
    console.log(`🔓 Releasing escrow for milestone ${milestoneIndex} - Amount: ${milestone.amount} RLUSD`);
    
    // Get balance before release
    const balanceBefore = await xrplClient.getBalance(freelancerWallet.address);
    console.log(`💼 Freelancer balance BEFORE release: ${balanceBefore.rlusdEquivalent} RLUSD`);
    
    const result = await xrplClient.finishEscrow(
      freelancerWallet,
      project.clientAddress,
      milestone.escrow.escrowSequence
    );

    milestone.status = 'released';
    milestone.releasedAt = new Date().toISOString();
    milestone.releaseHash = result.hash;

    // Wait for ledger to update (2 seconds to ensure transaction is confirmed)
    console.log('⏳ Waiting for ledger to update...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get balance after release
    const balanceAfter = await xrplClient.getBalance(freelancerWallet.address);
    console.log(`💰 Freelancer balance AFTER release: ${balanceAfter.rlusdEquivalent} RLUSD`);
    console.log(`✅ Balance increased by: ${(parseFloat(balanceAfter.rlusdEquivalent) - parseFloat(balanceBefore.rlusdEquivalent)).toFixed(2)} RLUSD`);

    res.json({ 
      success: true, 
      message: `Milestone approved - ${milestone.amount} RLUSD (equivalent) released`,
      result,
      balanceUpdate: {
        before: balanceBefore.rlusdEquivalent,
        after: balanceAfter.rlusdEquivalent,
        increase: (parseFloat(balanceAfter.rlusdEquivalent) - parseFloat(balanceBefore.rlusdEquivalent)).toFixed(2)
      }
    });

  } catch (error) {
    console.error('Error approving milestone:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get user reputation
 */
app.get('/api/reputation/:address', async (req, res) => {
  try {
    const history = await xrplClient.getTransactionHistory(req.params.address);
    
    const reputation = {
      address: req.params.address,
      totalProjects: history.completedEscrows,
      totalTransactions: history.totalTransactions,
      score: Math.min(5, 1 + (history.completedEscrows / 10) * 4),
      lastUpdated: new Date().toISOString()
    };

    res.json({ success: true, reputation });
  } catch (error) {
    console.error('Error getting reputation:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get pending offers for a freelancer
 */
app.get('/api/projects/offers/:freelancerAddress', (req, res) => {
  try {
    const { freelancerAddress } = req.params;
    
    const allProjects = Array.from(projects.values());
    const offers = allProjects.filter(p => 
      p.freelancerAddress === freelancerAddress && 
      p.status === 'pending'
    );

    res.json({ success: true, offers });
  } catch (error) {
    console.error('Error getting offers:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Accept a project offer
 */
app.post('/api/projects/:projectId/accept', (req, res) => {
  try {
    const { projectId } = req.params;
    const { freelancerAddress } = req.body;

    const project = projects.get(projectId);
    
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        error: 'Project not found' 
      });
    }

    if (project.freelancerAddress !== freelancerAddress) {
      return res.status(403).json({ 
        success: false, 
        error: 'Not authorized' 
      });
    }

    project.status = 'accepted';
    project.acceptedAt = new Date().toISOString();
    projects.set(projectId, project);

    res.json({ 
      success: true, 
      message: 'Project accepted',
      project 
    });
  } catch (error) {
    console.error('Error accepting project:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Submit work for a milestone
 */
app.post('/api/milestones/submit', (req, res) => {
  try {
    const { projectId, milestoneIndex, submission } = req.body;
    
    const project = projects.get(projectId);
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        error: 'Project not found' 
      });
    }

    const milestone = project.milestones[milestoneIndex];
    if (!milestone) {
      return res.status(404).json({ 
        success: false, 
        error: 'Milestone not found' 
      });
    }

    milestone.status = 'submitted';
    milestone.submission = {
      ...submission,
      submittedAt: new Date().toISOString()
    };
    
    projects.set(projectId, project);

    res.json({ 
      success: true, 
      message: 'Work submitted successfully',
      milestone 
    });
  } catch (error) {
    console.error('Error submitting work:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Approve milestone submission (client only)
 */
app.post('/api/milestones/approve-work', (req, res) => {
  try {
    const { projectId, milestoneIndex, clientAddress } = req.body;
    
    const project = projects.get(projectId);
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        error: 'Project not found' 
      });
    }

    if (project.clientAddress !== clientAddress) {
      return res.status(403).json({ 
        success: false, 
        error: 'Only client can approve work' 
      });
    }

    const milestone = project.milestones[milestoneIndex];
    if (!milestone) {
      return res.status(404).json({ 
        success: false, 
        error: 'Milestone not found' 
      });
    }

    if (milestone.status !== 'submitted') {
      return res.status(400).json({ 
        success: false, 
        error: 'Milestone has not been submitted' 
      });
    }

    milestone.status = 'approved';
    milestone.approvedAt = new Date().toISOString();
    
    projects.set(projectId, project);

    res.json({ 
      success: true, 
      message: 'Work approved! Freelancer can now release payment.',
      milestone 
    });
  } catch (error) {
    console.error('Error approving work:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get all projects
 */
app.get('/api/projects', (req, res) => {
  const allProjects = Array.from(projects.values());
  res.json({ success: true, projects: allProjects });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('💎 Using RLUSD for accounting (XRP escrows as backing)');
  console.log(`📊 Conversion Rate: 1 XRP = ${xrplClient.getConversionRate()} RLUSD`);
  console.log('📡 Connecting to XRPL...');
  
  try {
    await xrplClient.connect();
    console.log('✅ XRPL connected successfully');
  } catch (error) {
    console.error('❌ Failed to connect to XRPL:', error);
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  await xrplClient.disconnect();
  process.exit(0);
});