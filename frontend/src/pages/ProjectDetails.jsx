import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useWallet } from '../App';

const API_URL = 'http://localhost:3001/api';

/**
 * Project Details Page
 * View project status, milestones, submit work, approve work, and release payments
 */
function ProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { wallet, refreshBalance } = useWallet();
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [releasingMilestone, setReleasingMilestone] = useState(null);
  const [approvingMilestone, setApprovingMilestone] = useState(null);

  // Load project details
  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/projects/${projectId}`);
      setProject(response.data.project);
    } catch (err) {
      console.error('Error loading project:', err);
      setError('Project not found');
    } finally {
      setLoading(false);
    }
  };

  // Submit work for a milestone
  const handleSubmitWork = async (milestoneIndex, submission) => {
    setError('');

    try {
      await axios.post(`${API_URL}/milestones/submit`, {
        projectId: project.id,
        milestoneIndex,
        submission
      });

      alert('✅ Work submitted successfully!');
      await loadProject();
    } catch (err) {
      console.error('Error submitting work:', err);
      setError(err.response?.data?.error || 'Failed to submit work');
    }
  };

  // Approve work (client only)
  const handleApproveWork = async (milestoneIndex) => {
    if (!window.confirm('Are you sure you want to approve this work? The freelancer will then be able to release the payment.')) {
      return;
    }

    setApprovingMilestone(milestoneIndex);
    setError('');

    try {
      await axios.post(`${API_URL}/milestones/approve-work`, {
        projectId: project.id,
        milestoneIndex,
        clientAddress: wallet.address
      });

      alert('✅ Work approved! Freelancer can now release payment.');
      await loadProject();
    } catch (err) {
      console.error('Error approving work:', err);
      setError(err.response?.data?.error || 'Failed to approve work');
    } finally {
      setApprovingMilestone(null);
    }
  };

  // Release milestone payment (freelancer only, after approval)
  const handleReleaseMilestone = async (milestoneIndex) => {
    if (!window.confirm('Are you sure you want to release this milestone payment?')) {
      return;
    }

    setReleasingMilestone(milestoneIndex);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/milestones/approve`, {
        projectId: project.id,
        milestoneIndex: milestoneIndex,
        freelancerSeed: wallet.seed
      });

      console.log('Milestone released:', response.data);
      
      // Refresh balance after releasing payment
      if (refreshBalance) {
        await refreshBalance();
      }

      // Reload project to show updated status
      await loadProject();
      
      alert('✅ Milestone payment released successfully! Your balance has been updated.');
    } catch (err) {
      console.error('Error releasing milestone:', err);
      setError(err.response?.data?.error || 'Failed to release milestone');
    } finally {
      setReleasingMilestone(null);
    }
  };

  // Calculate project statistics
  const calculateStats = () => {
    if (!project) return { total: 0, released: 0, pending: 0, completed: 0, progress: 0 };

    const total = project.milestones.reduce((sum, m) => sum + parseFloat(m.amount), 0);
    const releasedMilestones = project.milestones.filter(m => m.status === 'released');
    const released = releasedMilestones.reduce((sum, m) => sum + parseFloat(m.amount), 0);
    const pending = total - released;
    const completed = releasedMilestones.length;
    const progress = (completed / project.milestones.length) * 100;

    return { total, released, pending, completed, progress };
  };

  const stats = calculateStats();
  const isClient = project && wallet.address === project.clientAddress;
  const isFreelancer = project && wallet.address === project.freelancerAddress;

  if (loading) {
    return (
      <div style={{ paddingTop: '100px', minHeight: '100vh' }}>
        <div className="container" style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="loading" style={{ 
            width: '40px', 
            height: '40px', 
            margin: '0 auto',
            border: '4px solid rgba(0, 229, 204, 0.1)',
            borderTop: '4px solid var(--accent)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ marginTop: '1rem' }}>Loading project...</p>
        </div>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div style={{ paddingTop: '100px', minHeight: '100vh' }}>
        <div className="container" style={{ textAlign: 'center', padding: '4rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
          <h2>Project Not Found</h2>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>{error}</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="btn btn-primary"
            style={{ marginTop: '2rem' }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh', paddingBottom: '4rem' }}>
      <div className="container" style={{ maxWidth: '1200px' }}>
        {/* Header */}
        <div style={{ marginBottom: '3rem' }}>
          <button 
            onClick={() => navigate('/dashboard')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent)',
              cursor: 'pointer',
              fontSize: '1rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            ← Back to Dashboard
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <h1 style={{ marginBottom: '0.5rem' }}>{project.title}</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                {project.description}
              </p>
            </div>
            
            <div style={{
              background: stats.progress === 100 ? 'rgba(0, 214, 143, 0.1)' : 'rgba(0, 229, 204, 0.1)',
              border: `1px solid ${stats.progress === 100 ? 'var(--success)' : 'var(--accent)'}`,
              borderRadius: '50px',
              padding: '0.5rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: stats.progress === 100 ? 'var(--success)' : 'var(--accent)'
            }}>
              {stats.progress === 100 ? '✅ Completed' : `⏳ ${Math.round(stats.progress)}% Complete`}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: 'rgba(255, 71, 87, 0.1)',
            border: '1px solid rgba(255, 71, 87, 0.3)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '2rem',
            color: '#FF4757'
          }}>
            <strong>⚠️ Error:</strong> {error}
          </div>
        )}

        {/* Project Info */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem'
        }}>
          <InfoCard 
            label="Client"
            value={project.clientAddress.slice(0, 8) + '...' + project.clientAddress.slice(-6)}
            sublabel={isClient ? '(You)' : ''}
            mono
          />
          <InfoCard 
            label="Freelancer"
            value={project.freelancerAddress.slice(0, 8) + '...' + project.freelancerAddress.slice(-6)}
            sublabel={isFreelancer ? '(You)' : ''}
            mono
          />
          <InfoCard 
            label="Created"
            value={new Date(project.createdAt).toLocaleDateString()}
          />
          <InfoCard 
            label="Project ID"
            value={project.id}
            mono
          />
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem'
        }}>
          <StatCard 
            label="Total Value"
            value={`${stats.total.toFixed(2)} XRP`}
            color="var(--accent)"
          />
          <StatCard 
            label="Released"
            value={`${stats.released.toFixed(2)} XRP`}
            color="var(--success)"
          />
          <StatCard 
            label="Pending"
            value={`${stats.pending.toFixed(2)} XRP`}
            color="var(--warning)"
          />
          <StatCard 
            label="Milestones"
            value={`${stats.completed}/${project.milestones.length}`}
            color="var(--accent)"
          />
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '3rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '0.5rem',
            fontSize: '0.9rem',
            color: 'var(--text-muted)'
          }}>
            <span>Overall Progress</span>
            <span>{Math.round(stats.progress)}%</span>
          </div>
          <div style={{
            width: '100%',
            height: '12px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '50px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${stats.progress}%`,
              height: '100%',
              background: `linear-gradient(90deg, var(--accent), var(--success))`,
              borderRadius: '50px',
              transition: 'width 0.5s ease'
            }}></div>
          </div>
        </div>

        {/* Milestones */}
        <div>
          <h2 style={{ marginBottom: '1.5rem' }}>Milestones</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {project.milestones.map((milestone, index) => (
              <MilestoneCard
                key={index}
                milestone={milestone}
                index={index}
                isFreelancer={isFreelancer}
                isClient={isClient}
                onSubmitWork={(submission) => handleSubmitWork(index, submission)}
                onApproveWork={() => handleApproveWork(index)}
                onRelease={() => handleReleaseMilestone(index)}
                releasing={releasingMilestone === index}
                approving={approvingMilestone === index}
              />
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          marginTop: '3rem',
          padding: '2rem',
          background: 'rgba(26, 31, 58, 0.6)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{ marginBottom: '1rem' }}>Quick Actions</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <a
              href={`https://testnet.xrpl.org/accounts/${project.clientAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              🔍 View Client on Explorer
            </a>
            <a
              href={`https://testnet.xrpl.org/accounts/${project.freelancerAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              🔍 View Freelancer on Explorer
            </a>
            <button
              onClick={loadProject}
              className="btn btn-secondary"
            >
              🔄 Refresh Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Info Card Component
 */
function InfoCard({ label, value, sublabel, mono }) {
  return (
    <div style={{
      padding: '1.5rem',
      background: 'rgba(26, 31, 58, 0.6)',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <div style={{
        fontSize: '0.85rem',
        color: 'var(--text-muted)',
        marginBottom: '0.5rem'
      }}>
        {label}
      </div>
      <div style={{
        fontSize: '1.1rem',
        fontWeight: 600,
        color: 'var(--text)',
        fontFamily: mono ? 'monospace' : 'inherit',
        wordBreak: 'break-all'
      }}>
        {value}
      </div>
      {sublabel && (
        <div style={{
          fontSize: '0.85rem',
          color: 'var(--accent)',
          marginTop: '0.25rem'
        }}>
          {sublabel}
        </div>
      )}
    </div>
  );
}

/**
 * Stat Card Component
 */
function StatCard({ label, value, color }) {
  return (
    <div style={{
      padding: '1.5rem',
      background: 'rgba(26, 31, 58, 0.6)',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      textAlign: 'center'
    }}>
      <div style={{
        fontSize: '0.85rem',
        color: 'var(--text-muted)',
        marginBottom: '0.5rem'
      }}>
        {label}
      </div>
      <div style={{
        fontSize: '2rem',
        fontWeight: 700,
        color: color
      }}>
        {value}
      </div>
    </div>
  );
}

/**
 * Milestone Card Component
 */
function MilestoneCard({ 
  milestone, 
  index, 
  isFreelancer, 
  isClient, 
  onSubmitWork, 
  onApproveWork,
  onRelease, 
  releasing,
  approving 
}) {
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [submissionData, setSubmissionData] = useState({
    description: '',
    fileUrl: ''
  });

  const isPending = milestone.status === 'pending';
  const isSubmitted = milestone.status === 'submitted';
  const isApproved = milestone.status === 'approved';
  const isReleased = milestone.status === 'released';
  
  const deadline = new Date(milestone.deadline);
  const isPastDeadline = new Date() > deadline;

  const handleSubmit = () => {
    if (!submissionData.description.trim()) {
      alert('Please add a description of your work');
      return;
    }
    
    onSubmitWork(submissionData);
    setShowSubmitForm(false);
    setSubmissionData({ description: '', fileUrl: '' });
  };

  return (
    <div style={{
      padding: '2rem',
      background: 'rgba(26, 31, 58, 0.6)',
      borderRadius: '16px',
      border: `2px solid ${isReleased ? 'var(--success)' : isApproved ? 'rgba(0, 229, 204, 0.5)' : isSubmitted ? 'rgba(255, 170, 0, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
      opacity: isReleased ? 0.7 : 1,
      transition: 'all 0.3s ease'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: isReleased ? 'var(--success)' : isApproved ? 'var(--accent)' : isSubmitted ? 'var(--warning)' : 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--primary)'
            }}>
              {isReleased ? '✓' : index + 1}
            </div>
            <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{milestone.name}</h3>
          </div>
        </div>

        <div style={{
          background: isReleased ? 'rgba(0, 214, 143, 0.1)' : isApproved ? 'rgba(0, 229, 204, 0.1)' : isSubmitted ? 'rgba(255, 170, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)',
          border: `1px solid ${isReleased ? 'var(--success)' : isApproved ? 'var(--accent)' : isSubmitted ? 'var(--warning)' : 'rgba(255, 255, 255, 0.1)'}`,
          borderRadius: '50px',
          padding: '0.5rem 1rem',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: isReleased ? 'var(--success)' : isApproved ? 'var(--accent)' : isSubmitted ? 'var(--warning)' : 'var(--text-muted)'
        }}>
          {isReleased ? '✅ Released' : isApproved ? '👍 Approved' : isSubmitted ? '📝 Submitted' : '⏳ Pending'}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
            Amount
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--accent)' }}>
            {milestone.amount} XRP
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
            Deadline
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
            {deadline.toLocaleDateString()}
          </div>
        </div>

        {milestone.escrow && (
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              Escrow Sequence
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, fontFamily: 'monospace' }}>
              #{milestone.escrow.escrowSequence}
            </div>
          </div>
        )}
      </div>

      {/* Submitted Work Display */}
      {milestone.submission && (
        <div style={{
          padding: '1.5rem',
          background: 'rgba(255, 170, 0, 0.05)',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          border: '1px solid rgba(255, 170, 0, 0.2)'
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <strong style={{ color: 'var(--warning)' }}>📝 Work Submission</strong>
          </div>
          <div style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>
            <strong>Description:</strong>
            <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>
              {milestone.submission.description}
            </p>
          </div>
          {milestone.submission.fileUrl && (
            <div style={{ fontSize: '0.95rem' }}>
              <strong>File:</strong>
              <a 
                href={milestone.submission.fileUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  color: 'var(--accent)', 
                  marginLeft: '0.5rem',
                  textDecoration: 'underline'
                }}
              >
                View Submitted Work →
              </a>
            </div>
          )}
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
            Submitted: {new Date(milestone.submission.submittedAt).toLocaleString()}
          </div>
        </div>
      )}

      {/* Freelancer: Submit Work Form */}
      {isFreelancer && isPending && !showSubmitForm && (
        <button
          onClick={() => setShowSubmitForm(true)}
          className="btn btn-primary"
          style={{ width: '100%', marginBottom: '1rem' }}
        >
          📤 Submit Work
        </button>
      )}

      {isFreelancer && isPending && showSubmitForm && (
        <div style={{
          padding: '1.5rem',
          background: 'rgba(0, 229, 204, 0.05)',
          borderRadius: '12px',
          border: '1px solid rgba(0, 229, 204, 0.2)',
          marginBottom: '1rem'
        }}>
          <h4 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>Submit Your Work</h4>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
              Description *
            </label>
            <textarea
              value={submissionData.description}
              onChange={(e) => setSubmissionData({ ...submissionData, description: e.target.value })}
              placeholder="Describe what you've completed for this milestone..."
              rows={4}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'var(--text)',
                fontSize: '0.95rem',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
              File URL (Optional)
            </label>
            <input
              type="url"
              value={submissionData.fileUrl}
              onChange={(e) => setSubmissionData({ ...submissionData, fileUrl: e.target.value })}
              placeholder="https://drive.google.com/... or https://github.com/..."
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'var(--text)',
                fontSize: '0.95rem',
                fontFamily: 'monospace'
              }}
            />
            <small style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem', display: 'block' }}>
              Link to your deliverables (Google Drive, GitHub, Figma, etc.)
            </small>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={handleSubmit}
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              ✅ Submit Work
            </button>
            <button
              onClick={() => {
                setShowSubmitForm(false);
                setSubmissionData({ description: '', fileUrl: '' });
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Client: Approve Work Button */}
      {isClient && isSubmitted && (
        <div style={{
          padding: '1.5rem',
          background: 'rgba(0, 229, 204, 0.05)',
          borderRadius: '12px',
          border: '1px solid rgba(0, 229, 204, 0.2)',
          marginBottom: '1rem'
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <strong style={{ color: 'var(--accent)' }}>Review Required</strong>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              The freelancer has submitted their work. Please review and approve to allow payment release.
            </p>
          </div>
          <button
            onClick={onApproveWork}
            disabled={approving}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            {approving ? '⏳ Approving...' : '✅ Approve Work'}
          </button>
        </div>
      )}

      {/* Freelancer: Release Payment Button */}
      {isFreelancer && isApproved && (
        <div style={{
          padding: '1.5rem',
          background: 'rgba(0, 229, 204, 0.05)',
          borderRadius: '8px',
          border: '1px solid rgba(0, 229, 204, 0.2)'
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <strong style={{ color: 'var(--accent)' }}>Ready to Release</strong>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              The client has approved your work. You can now claim this milestone payment.
            </p>
          </div>
          <button
            onClick={onRelease}
            disabled={releasing}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            {releasing ? '⏳ Releasing...' : '💰 Release Payment'}
          </button>
        </div>
      )}

      {/* Released Status */}
      {isReleased && milestone.releasedAt && (
        <div style={{
          padding: '1rem',
          background: 'rgba(0, 214, 143, 0.05)',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            Released on {new Date(milestone.releasedAt).toLocaleString()}
          </div>
          {milestone.releaseHash && (
            <a
              href={`https://testnet.xrpl.org/transactions/${milestone.releaseHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '0.85rem',
                color: 'var(--success)',
                textDecoration: 'none',
                fontFamily: 'monospace'
              }}
            >
              🔗 View Transaction: {milestone.releaseHash.slice(0, 16)}...
            </a>
          )}
        </div>
      )}

      {/* Client Info Messages */}
      {isClient && isPending && (
        <div style={{
          padding: '1rem',
          background: 'rgba(255, 170, 0, 0.05)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 170, 0, 0.2)',
          fontSize: '0.9rem',
          color: 'var(--text-muted)'
        }}>
          ℹ️ Waiting for freelancer to submit work. Funds are locked in escrow.
        </div>
      )}

      {isClient && isApproved && (
        <div style={{
          padding: '1rem',
          background: 'rgba(0, 229, 204, 0.05)',
          borderRadius: '8px',
          border: '1px solid rgba(0, 229, 204, 0.2)',
          fontSize: '0.9rem',
          color: 'var(--text-muted)'
        }}>
          ℹ️ Work approved. Waiting for freelancer to release payment from escrow.
        </div>
      )}
    </div>
  );
}

export default ProjectDetails;