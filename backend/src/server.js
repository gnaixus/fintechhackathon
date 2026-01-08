import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import compression from 'compression';
import helmet from 'helmet';
import xrplClient from './xrpl-client.js';
import db from './database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

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

// ==================== MIDDLEWARE ====================

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Allow CORS
  crossOriginEmbedderPolicy: false
}));

// CORS - allow frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Compression for faster responses
app.use(compression());

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ==================== HEALTH & INFO ====================

/**
 * Health check endpoint
 * GET /api/health
 */
app.get('/api/health', async (req, res) => {
  try {
    // Check XRPL connection
    await xrplClient.connect();
    const isXrplConnected = xrplClient.client && xrplClient.client.isConnected();
    
    // Get database stats
    const dbStats = db.getStats();
    
    res.json({
      status: 'ok',
      message: 'Frescrow API is running',
      timestamp: new Date().toISOString(),
      connections: {
        xrpl: isXrplConnected ? 'connected' : 'disconnected',
        database: 'connected'
      },
      stats: dbStats,
      version: '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// ==================== WALLET MANAGEMENT ====================

/**
 * Create new wallet on testnet
 * POST /api/wallet/create
 */
app.post('/api/wallet/create', async (req, res) => {
  try {
    console.log('🎯 Creating new wallet...');
    const wallet = await xrplClient.createWallet();
    
    console.log('✅ Wallet created:', wallet.address);
    res.json({ 
      success: true, 
      wallet 
    });
  } catch (error) {
    console.error('❌ Wallet creation error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Verify wallet and get info
 * POST /api/wallet/verify
 */
app.post('/api/wallet/verify', async (req, res) => {
  try {
    const { seed } = req.body;
    
    if (!seed || !seed.startsWith('s')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid seed format. XRPL seeds start with "s"'
      });
    }

    console.log('🔍 Verifying wallet...');
    const wallet = xrplClient.getWallet(seed);
    const balance = await xrplClient.getBalance(wallet.address);

    console.log('✅ Wallet verified:', wallet.address);
    res.json({
      success: true,
      wallet: {
        address: wallet.address,
        publicKey: wallet.publicKey,
        balance: balance
      }
    });
  } catch (error) {
    console.error('❌ Wallet verification error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Get wallet balance
 * GET /api/wallet/:address/balance
 */
app.get('/api/wallet/:address/balance', async (req, res) => {
  try {
    const { address } = req.params;
    
    console.log('💰 Fetching balance for:', address);
    const balance = await xrplClient.getBalance(address);
    
    res.json({ 
      success: true, 
      balance 
    });
  } catch (error) {
    console.error('❌ Balance query error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ==================== PROJECT MANAGEMENT ====================

/**
 * Create new project with escrows
 * POST /api/projects/create-with-wallet
 */
app.post('/api/projects/create-with-wallet', async (req, res) => {
  try {
    const { clientSeed, title, description, freelancerAddress, milestones } = req.body;

    // Validation
    if (!clientSeed || !freelancerAddress || !milestones || milestones.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        error: 'Project title and description are required'
      });
    }

    // ✅ ADDED: Validate XRPL address format
    const xrplAddressRegex = /^r[1-9A-HJ-NP-Za-km-z]{25,34}$/;
    if (!xrplAddressRegex.test(freelancerAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid freelancer XRPL address format. Address must start with "r" and be 25-34 characters long.'
      });
    }

    // ✅ ADDED: Validate deadlines are in the future
    const now = new Date();
    for (let i = 0; i < milestones.length; i++) {
      const deadline = new Date(milestones[i].deadline);
      if (deadline <= now) {
        return res.status(400).json({
          success: false,
          error: `Milestone ${i + 1} ("${milestones[i].name}"): Deadline must be in the future`
        });
      }
      
      // ✅ ADDED: Validate amount is positive
      if (!milestones[i].amount || parseFloat(milestones[i].amount) <= 0) {
        return res.status(400).json({
          success: false,
          error: `Milestone ${i + 1} ("${milestones[i].name}"): Amount must be greater than 0`
        });
      }
    }

    // Get client wallet
    const clientWallet = xrplClient.getWallet(clientSeed);
    const projectId = `proj_${Date.now()}`;
    
    console.log('📝 Creating project:', title);
    console.log('👤 Client:', clientWallet.address);
    console.log('💼 Freelancer:', freelancerAddress);
    console.log('🎯 Milestones:', milestones.length);
    
    // Create escrows for each milestone
    const escrows = [];
    for (let i = 0; i < milestones.length; i++) {
      const milestone = milestones[i];
      
      const projectData = {
        projectId,
        title,
        description,
        milestoneName: milestone.name,
        milestoneIndex: i
      };

      console.log(`🔒 Creating escrow ${i + 1}/${milestones.length}: ${milestone.name} (${milestone.amount} XRP)`);

      try {
        const escrowResult = await xrplClient.createEscrow({
          clientWallet,
          freelancerAddress,
          amount: milestone.amount.toString(),
          finishAfter: new Date(milestone.deadline).getTime(),
          projectData
        });

        console.log(`✅ Escrow created: ${escrowResult.hash}`);

        escrows.push({
          ...escrowResult,
          milestoneName: milestone.name,
          status: 'pending'
        });
      } catch (escrowError) {
        console.error(`❌ Escrow creation failed for milestone ${i + 1}:`, escrowError);
        throw new Error(`Failed to create escrow for "${milestone.name}": ${escrowError.message}`);
      }
    }

    // Create project object
    const project = {
      id: projectId,
      title,
      description,
      clientAddress: clientWallet.address,
      freelancerAddress,
      status: 'pending',
      milestones: milestones.map((m, idx) => ({
        ...m,
        escrow: escrows[idx],
        status: 'pending',
        submission: null
      })),
      createdAt: new Date().toISOString()
    };

    // Save to database
    db.saveProject(project);

    console.log('✅ Project created successfully:', projectId);
    console.log(`💰 Total locked: ${milestones.reduce((sum, m) => sum + parseFloat(m.amount), 0)} XRP`);

    res.json({ 
      success: true, 
      project,
      message: `Project created with ${escrows.length} escrows on XRPL`
    });

  } catch (error) {
    console.error('❌ Project creation error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Get all projects
 * GET /api/projects
 */
app.get('/api/projects', (req, res) => {
  try {
    const projects = db.getAllProjects();
    res.json({ 
      success: true, 
      projects 
    });
  } catch (error) {
    console.error('❌ Error fetching projects:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Get specific project
 * GET /api/projects/:projectId
 */
app.get('/api/projects/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = db.getProject(projectId);
    
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        error: 'Project not found' 
      });
    }

    // Refresh escrow status from blockchain
    for (const milestone of project.milestones) {
      if (milestone.escrow && milestone.status !== 'released') {
        const escrowData = await xrplClient.getEscrow(
          project.clientAddress, 
          milestone.escrow.escrowSequence
        );
        
        // If escrow not found on blockchain, it was released
        if (!escrowData) {
          milestone.status = 'released';
          db.saveProject(project); // Update in database
        }
      }
    }

    res.json({ 
      success: true, 
      project 
    });
  } catch (error) {
    console.error('❌ Error fetching project:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Get pending offers for freelancer
 * GET /api/projects/offers/:freelancerAddress
 */
app.get('/api/projects/offers/:freelancerAddress', (req, res) => {
  try {
    const { freelancerAddress } = req.params;
    
    console.log('📬 Fetching offers for:', freelancerAddress);
    const offers = db.getOffersByFreelancer(freelancerAddress);
    
    console.log(`✅ Found ${offers.length} pending offers`);
    res.json({ 
      success: true, 
      offers 
    });
  } catch (error) {
    console.error('❌ Error fetching offers:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Accept project offer
 * POST /api/projects/:projectId/accept
 */
app.post('/api/projects/:projectId/accept', (req, res) => {
  try {
    const { projectId } = req.params;
    const { freelancerAddress } = req.body;

    const project = db.getProject(projectId);
    
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        error: 'Project not found' 
      });
    }

    if (project.freelancerAddress !== freelancerAddress) {
      return res.status(403).json({ 
        success: false, 
        error: 'Not authorized. This project is assigned to a different freelancer.' 
      });
    }

    if (project.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Project has already been accepted'
      });
    }

    // Update project status
    project.status = 'accepted';
    project.acceptedAt = new Date().toISOString();
    db.saveProject(project);

    console.log('✅ Project accepted:', projectId);

    res.json({ 
      success: true, 
      message: 'Project accepted successfully',
      project 
    });
  } catch (error) {
    console.error('❌ Error accepting project:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ==================== MILESTONE MANAGEMENT ====================

/**
 * Submit work for milestone
 * POST /api/milestones/submit
 */
app.post('/api/milestones/submit', (req, res) => {
  try {
    const { projectId, milestoneIndex, submission } = req.body;
    
    const project = db.getProject(projectId);
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

    if (milestone.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Milestone has already been submitted'
      });
    }

    // Validate submission has description
    if (!submission.description || submission.description.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Submission description is required'
      });
    }

    // Update milestone
    milestone.status = 'submitted';
    milestone.submission = {
      ...submission,
      submittedAt: new Date().toISOString()
    };
    
    db.saveProject(project);

    console.log('📝 Work submitted for:', milestone.name);

    res.json({ 
      success: true, 
      message: 'Work submitted successfully',
      milestone 
    });
  } catch (error) {
    console.error('❌ Error submitting work:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Approve submitted work (client only)
 * POST /api/milestones/approve-work
 */
app.post('/api/milestones/approve-work', (req, res) => {
  try {
    const { projectId, milestoneIndex, clientAddress } = req.body;
    
    const project = db.getProject(projectId);
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        error: 'Project not found' 
      });
    }

    // Authorization check
    if (project.clientAddress !== clientAddress) {
      return res.status(403).json({ 
        success: false, 
        error: 'Only the client can approve work' 
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
        error: 'Work must be submitted before approval' 
      });
    }

    // Approve the work
    milestone.status = 'approved';
    milestone.approvedAt = new Date().toISOString();
    
    db.saveProject(project);

    console.log('✅ Work approved for:', milestone.name);

    res.json({ 
      success: true, 
      message: 'Work approved! Freelancer can now release payment.',
      milestone 
    });
  } catch (error) {
    console.error('❌ Error approving work:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Release escrow payment (freelancer only, after approval)
 * POST /api/milestones/approve
 */
app.post('/api/milestones/approve', async (req, res) => {
  try {
    const { projectId, milestoneIndex, freelancerSeed } = req.body;
    
    const project = db.getProject(projectId);
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

    // Get freelancer wallet
    const freelancerWallet = xrplClient.getWallet(freelancerSeed);
    
    // Verify this is the correct freelancer
    if (freelancerWallet.address !== project.freelancerAddress) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized. You are not the assigned freelancer for this project.'
      });
    }

    console.log('💰 Releasing payment for:', milestone.name);
    console.log('📤 Escrow sequence:', milestone.escrow.escrowSequence);

    // Release escrow on blockchain
    const result = await xrplClient.finishEscrow(
      freelancerWallet,
      project.clientAddress,
      milestone.escrow.escrowSequence
    );

    // Update milestone
    milestone.status = 'released';
    milestone.releasedAt = new Date().toISOString();
    milestone.releaseHash = result.hash;

    db.saveProject(project);

    // ✅ ADDED: Check if all milestones are complete
    const allReleased = project.milestones.every(m => m.status === 'released');
    if (allReleased && project.status !== 'completed') {
      db.updateProjectStatus(project.id, 'completed');
      console.log('🎉 All milestones released! Project marked as completed.');
    }

    console.log('✅ Payment released! Hash:', result.hash);

    res.json({ 
      success: true, 
      message: 'Payment released successfully',
      result,
      milestone,
      projectCompleted: allReleased
    });

  } catch (error) {
    console.error('❌ Error releasing payment:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ==================== UTILITY ENDPOINTS ====================

/**
 * Get all escrows for an address
 * GET /api/escrows/:address
 */
app.get('/api/escrows/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const escrows = await xrplClient.getAccountEscrows(address);
    
    res.json({ 
      success: true, 
      escrows 
    });
  } catch (error) {
    console.error('❌ Error fetching escrows:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Get user reputation
 * GET /api/reputation/:address
 */
app.get('/api/reputation/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const history = await xrplClient.getTransactionHistory(address);
    
    const reputation = {
      address: address,
      totalProjects: history.completedEscrows,
      totalTransactions: history.totalTransactions,
      score: Math.min(5, 1 + (history.completedEscrows / 10) * 4),
      lastUpdated: new Date().toISOString()
    };

    res.json({ 
      success: true, 
      reputation 
    });
  } catch (error) {
    console.error('❌ Error getting reputation:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Get database statistics
 * GET /api/stats
 */
app.get('/api/stats', (req, res) => {
  try {
    const stats = db.getStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('❌ Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// ==================== SERVER STARTUP ====================

app.listen(PORT, async () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 FRESCROW BACKEND - XRPL ESCROW PLATFORM');
  console.log('='.repeat(60));
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`🔗 XRPL Network: ${xrplClient.network}`);
  console.log('='.repeat(60));
  
  try {
    console.log('📡 Connecting to XRPL...');
    await xrplClient.connect();
    console.log('✅ XRPL connected successfully');
    
    const stats = db.getStats();
    console.log(`💾 Database: ${stats.total} projects (${stats.pending} pending, ${stats.active} active)`);
    
    console.log('\n✨ Ready to accept requests!\n');
  } catch (error) {
    console.error('❌ Failed to connect to XRPL:', error.message);
    console.log('⚠️  Server running but XRPL connection failed');
  }
});

// ==================== GRACEFUL SHUTDOWN ====================

const gracefulShutdown = async (signal) => {
  console.log(`\n\n🛑 Received ${signal}. Shutting down gracefully...`);
  
  try {
    await xrplClient.disconnect();
    db.close();
    console.log('✅ Cleanup complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

export default app;