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

// In-memory storage for demo (use database in production)
// NOTE: This backend is intentionally designed to match the existing frontend
// (no frontend changes needed). Replace with a DB for persistence.
const projects = new Map();
const users = new Map();

/**
 * 🚀 OPTIMIZED FRESCROW BACKEND
 * 
 * XRPL Features Showcased:
 * ✅ Native Escrow (EscrowCreate, EscrowFinish)
 * ✅ Time-locked payments
 * ✅ On-chain memos for metadata
 * ✅ DID-based authentication (wallet addresses)
 * ✅ RLUSD trust lines (future-ready)
 * ✅ Transaction history & reputation
 * 
 * Tech Stack:
 * - Express.js (REST API)
 * - XRPL.js (blockchain integration)
 * - In-memory database (for hackathon demo)
 * - Helmet (security)
 * - Compression (performance)
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Freelance Escrow API is running' });
});

/**
 * Create new wallet
 * POST /api/wallet/create
 */
app.post('/api/wallet/create', async (req, res) => {
  try {
    const wallet = await xrplClient.createWallet();
    // Balance call is optional but nice for UX
    const balance = await xrplClient.getBalance(wallet.address);
    res.json({ success: true, wallet: { ...wallet, balance } });
  } catch (error) {
    console.error('Error creating wallet:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Verify wallet from seed (frontend uses this to "connect")
 * POST /api/wallet/verify
 * Body: { seed: string }
 */
app.post('/api/wallet/verify', async (req, res) => {
  try {
    const { seed } = req.body || {};
    if (!seed || typeof seed !== 'string') {
      return res.status(400).json({ success: false, error: 'Missing seed' });
    }

    // Basic seed sanity check (XRPL seeds typically start with "s")
    if (!seed.startsWith('s')) {
      return res.status(400).json({ success: false, error: 'Invalid seed format' });
    }

    const wallet = xrplClient.getWallet(seed);
    const balance = await xrplClient.getBalance(wallet.address);

    // Keep a lightweight session cache (demo)
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
        balance
      }
    });
  } catch (error) {
    console.error('Error verifying wallet:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get wallet balance
 * GET /api/wallet/:address/balance
 */
app.get('/api/wallet/:address/balance', async (req, res) => {
  try {
    const balance = await xrplClient.getBalance(req.params.address);
    res.json({ success: true, balance });
  } catch (error) {
    console.error('Error getting balance:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Create new project with escrow
 * POST /api/projects/create
 * Body: {
 *   clientSeed: string,
 *   freelancerAddress: string,
 *   title: string,
 *   description: string,
 *   milestones: Array<{name, amount, deadline}>,
 * }
 */
async function createProjectWithEscrows(req, res) {
  try {
    const body = req.body || {};
    // Accept a few common aliases so older Python-oriented payloads still work.
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
    
    // Create escrows for each milestone
    const escrows = [];
    for (const milestone of milestones) {
      const projectData = {
        projectId,
        title,
        description,
        milestoneName: milestone.name,
        milestoneIndex: milestones.indexOf(milestone)
      };

      const finishAfterMs = milestone.deadline ? new Date(milestone.deadline).getTime() : undefined;
      const escrowResult = await xrplClient.createEscrow({
        clientWallet,
        freelancerAddress,
        amount: milestone.amount.toString(),
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
      status: 'pending', // pending, accepted, completed
      milestones: milestones.map((m, idx) => ({
        ...m,
        escrow: escrows[idx],
        status: 'pending', // pending, submitted, approved, released
        submission: null // Will store { description, fileUrl, submittedAt }
      })),
      createdAt: new Date().toISOString()
    };

    projects.set(projectId, project);

    res.json({ 
      success: true, 
      project,
      message: `Created ${escrows.length} escrows for project` 
    });

  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Create new project with escrow (legacy)
 * POST /api/projects/create
 */
app.post('/api/projects/create', createProjectWithEscrows);

/**
 * Create new project with escrow (frontend expects this name)
 * POST /api/projects/create-with-wallet
 */
app.post('/api/projects/create-with-wallet', createProjectWithEscrows);

/**
 * Get project details
 * GET /api/projects/:projectId
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

    // Refresh escrow status from blockchain
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
 * GET /api/escrows/:address
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
 * POST /api/milestones/approve
 * Body: {
 *   projectId: string,
 *   milestoneIndex: number,
 *   freelancerSeed: string
 * }
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
    
    const result = await xrplClient.finishEscrow(
      freelancerWallet,
      project.clientAddress,
      milestone.escrow.escrowSequence
    );

    milestone.status = 'released';
    milestone.releasedAt = new Date().toISOString();
    milestone.releaseHash = result.hash;

    res.json({ 
      success: true, 
      message: 'Milestone approved and funds released',
      result 
    });

  } catch (error) {
    console.error('Error approving milestone:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get user reputation
 * GET /api/reputation/:address
 */
app.get('/api/reputation/:address', async (req, res) => {
  try {
    const history = await xrplClient.getTransactionHistory(req.params.address);
    
    const reputation = {
      address: req.params.address,
      totalProjects: history.completedEscrows,
      totalTransactions: history.totalTransactions,
      // Calculate simple reputation score
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
 * Get all projects (for demo)
 * GET /api/projects
 */

/**
 * Get pending offers for a freelancer
 * GET /api/projects/offers/:freelancerAddress
 */
app.get('/api/projects/offers/:freelancerAddress', (req, res) => {
  try {
    const { freelancerAddress } = req.params;
    
    // Find all projects where this address is the freelancer and status is 'pending'
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
 * POST /api/projects/:projectId/accept
 */
app.post('/api/projects/:projectId/accept', (req, res) => {
  try {
    const { projectId} = req.params;
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

    // Update project status
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
 * POST /api/milestones/submit
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

    // Update milestone with submission
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
 * POST /api/milestones/approve-work
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

    // Approve the work
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

app.get('/api/projects', (req, res) => {
  const allProjects = Array.from(projects.values());
  res.json({ success: true, projects: allProjects });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
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
