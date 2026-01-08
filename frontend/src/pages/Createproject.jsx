import React, { useState } from 'react';
import axios from 'axios';
import { useWallet } from '../App';

const API_URL = 'http://localhost:3001/api';

/**
 * Create Project Page
 * Form to create new escrow project with milestones using connected wallet
 */
function CreateProject() {
  const { Wallet } = useWallet();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const { wallet, refreshBalance } = useWallet();
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    freelancerAddress: '',
    milestones: [
      { name: '', amount: '', deadline: '' }
    ]
  });

  // Add new milestone
  const addMilestone = () => {
    setFormData({
      ...formData,
      milestones: [...formData.milestones, { name: '', amount: '', deadline: '' }]
    });
  };

  // Remove milestone
  const removeMilestone = (index) => {
    const newMilestones = formData.milestones.filter((_, i) => i !== index);
    setFormData({ ...formData, milestones: newMilestones });
  };

  // Update milestone field
  const updateMilestone = (index, field, value) => {
    const newMilestones = [...formData.milestones];
    newMilestones[index][field] = value;
    setFormData({ ...formData, milestones: newMilestones });
  };

  // Calculate total project cost
  const totalCost = formData.milestones.reduce((sum, m) => {
    return sum + (parseFloat(m.amount) || 0);
  }, 0);

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Use connected wallet seed
      const response = await axios.post(`${API_URL}/projects/create-with-wallet`, {
        clientSeed: wallet.seed,
        title: formData.title,
        description: formData.description,
        freelancerAddress: formData.freelancerAddress,
        milestones: formData.milestones
      });

      console.log('Project created:', response.data);
      setSuccess(true);

      // Refresh balance
      if (refreshBalance) {
        await refreshBalance();
      }

      // Reset form after 2 seconds
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);

    } catch (err) {
      console.error('Error creating project:', err);
      setError(err.response?.data?.error || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <div className="badge" style={{ marginBottom: '2rem' }}>
          <span>✨</span>
          New Escrow Project
        </div>
        
        <h1 style={{ marginBottom: '1rem' }}>Create Project</h1>
        <p style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>
          Set up a new project with milestone-based escrow payments on XRPL
        </p>

        {/* Wallet Info */}
        <div style={{
          background: 'rgba(0, 229, 204, 0.1)',
          border: '1px solid rgba(0, 229, 204, 0.3)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '3rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              Creating project from wallet:
            </div>
            <div style={{ 
              fontFamily: 'monospace', 
              fontSize: '0.95rem', 
              fontWeight: 600,
              color: 'var(--accent)'
            }}>
              {wallet.address}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              Available Balance:
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>
              {wallet.balance} XRP
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div style={{
            background: 'rgba(0, 214, 143, 0.1)',
            border: '1px solid var(--success)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}>
            <h3 style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>
              ✅ Project Created Successfully!
            </h3>
            <p style={{ fontSize: '0.9rem' }}>
              Escrows have been created on XRPL. Redirecting to dashboard...
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            background: 'rgba(255, 71, 87, 0.1)',
            border: '1px solid var(--error)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}>
            <h3 style={{ color: 'var(--error)', marginBottom: '0.5rem' }}>
              ❌ Error
            </h3>
            <p style={{ fontSize: '0.9rem' }}>{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{
          background: 'var(--secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '3rem',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          
          {/* Project Title */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Project Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Website Redesign"
              style={{
                width: '100%',
                padding: '1rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text)',
                fontSize: '1rem'
              }}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Description *
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the project..."
              rows={4}
              style={{
                width: '100%',
                padding: '1rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text)',
                fontSize: '1rem',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Freelancer Address */}
          <div style={{ marginBottom: '3rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Freelancer XRPL Address *
            </label>
            <input
              type="text"
              required
              value={formData.freelancerAddress}
              onChange={(e) => setFormData({ ...formData, freelancerAddress: e.target.value })}
              placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
              style={{
                width: '100%',
                padding: '1rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text)',
                fontSize: '1rem',
                fontFamily: 'monospace'
              }}
            />
            <small style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem', display: 'block' }}>
              Enter the freelancer's XRPL wallet address
            </small>
          </div>

          {/* Milestones */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <label style={{ fontWeight: 600, fontSize: '1.125rem' }}>
                Milestones *
              </label>
              <button
                type="button"
                onClick={addMilestone}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(0, 229, 204, 0.1)',
                  border: '1px solid var(--accent)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--accent)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 600
                }}
              >
                + Add Milestone
              </button>
            </div>

            {formData.milestones.map((milestone, index) => (
              <div
                key={index}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.5rem',
                  marginBottom: '1rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ margin: 0 }}>Milestone {index + 1}</h4>
                  {formData.milestones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMilestone(index)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--error)',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                    >
                      🗑️ Remove
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
                  {/* Milestone Name */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      value={milestone.name}
                      onChange={(e) => updateMilestone(index, 'name', e.target.value)}
                      placeholder="e.g. Design Phase"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text)',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>

                  {/* Amount */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                      Amount (XRP)
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="0.01"
                      value={milestone.amount}
                      onChange={(e) => updateMilestone(index, 'amount', e.target.value)}
                      placeholder="100"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text)',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>

                  {/* Deadline */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                      Deadline
                    </label>
                    <input
                      type="date"
                      required
                      value={milestone.deadline}
                      onChange={(e) => updateMilestone(index, 'deadline', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text)',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total Cost Summary */}
          <div style={{
            background: 'rgba(0, 229, 204, 0.1)',
            border: '1px solid rgba(0, 229, 204, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  Total Project Cost
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent)' }}>
                  {totalCost.toFixed(2)} XRP
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  {formData.milestones.length} Milestone{formData.milestones.length !== 1 ? 's' : ''}
                </div>
                {totalCost > parseFloat(wallet.balance) && (
                  <div style={{ color: 'var(--error)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                    ⚠️ Insufficient balance
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="submit"
              disabled={loading || success || totalCost > parseFloat(wallet.balance)}
              className="btn btn-primary"
              style={{ flex: 1, fontSize: '1.125rem', padding: '1.25rem' }}
            >
              {loading ? '⏳ Creating Escrows...' : success ? '✅ Created!' : '🚀 Create Project'}
            </button>
            
            <a href="/dashboard" className="btn btn-secondary" style={{ padding: '1.25rem 2rem' }}>
              Cancel
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateProject;