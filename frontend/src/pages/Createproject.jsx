import React, { useState } from 'react';
import axios from 'axios';
import { useWallet } from '../App';

const API_URL = 'http://localhost:3001/api';

function CreateProject() {
  const { wallet, refreshBalance } = useWallet();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    freelancerAddress: '',
    milestones: [
      { name: '', amount: '', deadline: '' }
    ]
  });

  // ✅ ADDED: XRPL address validation
  const isValidXRPLAddress = (address) => {
    return /^r[1-9A-HJ-NP-Za-km-z]{25,34}$/.test(address);
  };

  const addMilestone = () => {
    setFormData({
      ...formData,
      milestones: [...formData.milestones, { name: '', amount: '', deadline: '' }]
    });
  };

  const removeMilestone = (index) => {
    const newMilestones = formData.milestones.filter((_, i) => i !== index);
    setFormData({ ...formData, milestones: newMilestones });
  };

  const updateMilestone = (index, field, value) => {
    const newMilestones = [...formData.milestones];
    newMilestones[index][field] = value;
    setFormData({ ...formData, milestones: newMilestones });
  };

  const totalCost = formData.milestones.reduce((sum, m) => {
    return sum + (parseFloat(m.amount) || 0);
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    // ✅ ADDED: Validate freelancer address
    if (!isValidXRPLAddress(formData.freelancerAddress)) {
      setError('Invalid XRPL address format. Address must start with "r" and be 25-34 characters long.');
      setLoading(false);
      return;
    }

    const now = new Date();
    for (let i = 0; i < formData.milestones.length; i++) {
      const deadline = new Date(formData.milestones[i].deadline);
      if (deadline <= now) {
        setError(`Milestone ${i + 1} deadline must be in the future.`);
        setLoading(false);
        return;
      }
    }

    try {
      const response = await axios.post(`${API_URL}/projects/create-with-wallet`, {
        clientSeed: wallet.seed,
        title: formData.title,
        description: formData.description,
        freelancerAddress: formData.freelancerAddress,
        milestones: formData.milestones
      });

      console.log('Project created:', response.data);
      setSuccess(true);
      await refreshBalance();

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
    <div style={{ 
      paddingTop: '140px', // ✅ INCREASED from 80px to 140px
      minHeight: '100vh',
      paddingBottom: '4rem',
      background: 'linear-gradient(180deg, #0A0E27 0%, #1A1F3A 100%)'
    }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        {/* Header Section */}
        <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <h1 style={{ 
            marginBottom: '1rem',
            fontSize: '3rem',
            background: 'linear-gradient(135deg, var(--accent), #00C9B7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Create Project
          </h1>
          <p style={{ 
            fontSize: '1.125rem',
            color: 'var(--text-muted)',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Set up a new project with milestone-based escrow payments on XRPL
          </p>
        </div>
        
        <h1 style={{ marginBottom: '1rem' }}>Create Project</h1>
        <p style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>
          Set up a new project with milestone-based escrow payments on XRPL
        </p>

        {/* Wallet Info */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(0, 229, 204, 0.1), rgba(0, 201, 183, 0.05))',
          border: '1px solid rgba(0, 229, 204, 0.3)',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '3rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ flex: '1', minWidth: '250px' }}>
            <div style={{ 
              fontSize: '0.875rem', 
              color: 'var(--text-muted)', 
              marginBottom: '0.5rem',
              fontWeight: 500
            }}>
              Creating project from wallet:
            </div>
            <div style={{ 
              fontFamily: 'monospace', 
              fontSize: '1rem', 
              fontWeight: 600,
              color: 'var(--accent)',
              wordBreak: 'break-all'
            }}>
              {wallet.address}
            </div>
          </div>
          <div style={{ 
            textAlign: 'right',
            padding: '1rem 1.5rem',
            background: 'rgba(0, 229, 204, 0.1)',
            borderRadius: '12px',
            border: '1px solid rgba(0, 229, 204, 0.2)'
          }}>
            <div style={{ 
              fontSize: '0.875rem', 
              color: 'var(--text-muted)', 
              marginBottom: '0.25rem',
              fontWeight: 500
            }}>
              Available Balance
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>
              {wallet.balance} XRP
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(0, 214, 143, 0.15), rgba(0, 214, 143, 0.05))',
            border: '1px solid var(--success)',
            borderRadius: '16px',
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
            background: 'linear-gradient(135deg, rgba(255, 71, 87, 0.15), rgba(255, 71, 87, 0.05))',
            border: '1px solid var(--error)',
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '2rem',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'start', gap: '1rem' }}>
              <span style={{ fontSize: '1.5rem' }}>⚠️</span>
              <div>
                <h3 style={{ color: 'var(--error)', marginBottom: '0.5rem', fontSize: '1.25rem' }}>
                  Error
                </h3>
                <p style={{ fontSize: '0.95rem', color: '#FF4757' }}>{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{
          background: 'rgba(26, 31, 58, 0.6)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '3rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
        }}>
          
          {/* Project Title */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.75rem', 
              fontWeight: 600,
              fontSize: '1rem',
              color: 'var(--text)'
            }}>
              Project Title <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Website Redesign"
              style={{
                width: '100%',
                padding: '1rem 1.25rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: 'var(--text)',
                fontSize: '1rem',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--accent)';
                e.target.style.background = 'rgba(255, 255, 255, 0.08)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.75rem', 
              fontWeight: 600,
              fontSize: '1rem',
              color: 'var(--text)'
            }}>
              Description <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the project requirements, deliverables, and expectations..."
              rows={4}
              style={{
                width: '100%',
                padding: '1rem 1.25rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: 'var(--text)',
                fontSize: '1rem',
                fontFamily: 'inherit',
                resize: 'vertical',
                lineHeight: '1.6',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--accent)';
                e.target.style.background = 'rgba(255, 255, 255, 0.08)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
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
                padding: '1rem 1.25rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: 'var(--text)',
                fontSize: '1rem',
                fontFamily: 'monospace',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--accent)';
                e.target.style.background = 'rgba(255, 255, 255, 0.08)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
            />
            <small style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem', display: 'block' }}>
              Enter the freelancer's XRPL wallet address (must start with 'r')
            </small>
          </div>

          {/* Milestones Section */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '1.5rem',
              paddingBottom: '1rem',
              borderBottom: '2px solid rgba(0, 229, 204, 0.2)'
            }}>
              <div>
                <h3 style={{ 
                  fontWeight: 600, 
                  fontSize: '1.5rem',
                  margin: 0,
                  marginBottom: '0.25rem'
                }}>
                  Milestones <span style={{ color: 'var(--error)' }}>*</span>
                </h3>
                <p style={{ 
                  fontSize: '0.9rem', 
                  color: 'var(--text-muted)',
                  margin: 0
                }}>
                  Break down the project into payment milestones
                </p>
              </div>
              <button
                type="button"
                onClick={addMilestone}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, var(--accent), #00C9B7)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'var(--primary)',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(0, 229, 204, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(0, 229, 204, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(0, 229, 204, 0.3)';
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
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  padding: '2rem',
                  marginBottom: '1.5rem',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0, 229, 204, 0.3)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: '1.5rem' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--accent), #00C9B7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: 'var(--primary)'
                    }}>
                      {index + 1}
                    </div>
                    <h4 style={{ margin: 0, fontSize: '1.125rem' }}>Milestone {index + 1}</h4>
                  </div>
                  {formData.milestones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMilestone(index)}
                      style={{
                        background: 'rgba(255, 71, 87, 0.1)',
                        border: '1px solid rgba(255, 71, 87, 0.3)',
                        borderRadius: '8px',
                        padding: '0.5rem 1rem',
                        color: 'var(--error)',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(255, 71, 87, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(255, 71, 87, 0.1)';
                      }}
                    >
                      🗑️ Remove
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
                  {/* Milestone Name */}
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '0.5rem', 
                      fontSize: '0.9rem',
                      fontWeight: 600
                    }}>
                      Milestone Name
                    </label>
                    <input
                      type="text"
                      required
                      value={milestone.name}
                      onChange={(e) => updateMilestone(index, 'name', e.target.value)}
                      placeholder="e.g. Design Phase"
                      style={{
                        width: '100%',
                        padding: '0.875rem 1rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: 'var(--text)',
                        fontSize: '0.95rem',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--accent)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
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
                        padding: '0.875rem 1rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: 'var(--text)',
                        fontSize: '0.95rem',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--accent)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      }}
                    />
                  </div>

                  {/* Deadline */}
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '0.5rem', 
                      fontSize: '0.9rem',
                      fontWeight: 600
                    }}>
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
                        padding: '0.875rem 1rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: 'var(--text)',
                        fontSize: '0.95rem',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--accent)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total Cost Summary */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(0, 229, 204, 0.15), rgba(0, 201, 183, 0.05))',
            border: '1px solid rgba(0, 229, 204, 0.4)',
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '2.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Total Project Cost
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent)' }}>
                  {totalCost.toFixed(2)} XRP
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  {formData.milestones.length} Milestone{formData.milestones.length !== 1 ? 's' : ''}
                </div>
                {totalCost > parseFloat(wallet.balance) && (
                  <div style={{ 
                    color: 'var(--error)', 
                    fontSize: '0.95rem', 
                    marginTop: '0.5rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    justifyContent: 'flex-end'
                  }}>
                    <span>⚠️</span> Insufficient balance
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              type="submit"
              disabled={loading || success || totalCost > parseFloat(wallet.balance)}
              className="btn btn-primary"
              style={{ 
                flex: 1, 
                minWidth: '200px',
                fontSize: '1.125rem', 
                padding: '1.25rem 2rem',
                background: loading || success || totalCost > parseFloat(wallet.balance) 
                  ? 'var(--text-muted)' 
                  : 'linear-gradient(135deg, var(--accent), #00C9B7)',
                cursor: loading || success || totalCost > parseFloat(wallet.balance) ? 'not-allowed' : 'pointer',
                opacity: loading || success || totalCost > parseFloat(wallet.balance) ? 0.5 : 1,
                border: 'none',
                borderRadius: '12px',
                fontWeight: 700,
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 20px rgba(0, 229, 204, 0.3)'
              }}
            >
              {loading ? '⏳ Creating Escrows...' : success ? '✅ Created!' : '🚀 Create Project'}
            </button>
            
            <a 
              href="/dashboard" 
              className="btn btn-secondary" 
              style={{ 
                padding: '1.25rem 2rem',
                fontSize: '1.125rem',
                minWidth: '150px',
                textAlign: 'center',
                textDecoration: 'none'
              }}
            >
              Cancel
            </a>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default CreateProject;