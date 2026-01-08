import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useWallet } from '../App';

const API_URL = 'http://localhost:3001/api';

function Offers() {
  const navigate = useNavigate();
  const { wallet } = useWallet();
  
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOffers();
  }, [wallet]);

  const loadOffers = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('📡 Fetching offers for:', wallet.address);
      
      const response = await axios.get(`${API_URL}/projects/offers/${wallet.address}`);
      
      console.log('✅ Response received:', response.data);
      
      setOffers(response.data.offers || []);
      
      console.log('📊 Total offers found:', response.data.offers?.length || 0);
      
    } catch (error) {
      console.error('❌ Error loading offers:', error);
      console.error('Error details:', error.response?.data);
      setError(error.response?.data?.error || error.message || 'Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (projectId) => {
    setAccepting(projectId);
    
    try {
      console.log('✅ Accepting project:', projectId);
      
      await axios.post(`${API_URL}/projects/${projectId}/accept`, {
        freelancerAddress: wallet.address
      });
      
      console.log('✅ Project accepted successfully');
      
      // Remove from offers list
      setOffers(offers.filter(o => o.id !== projectId));
      
      alert('✅ Project accepted! You can now view it in your dashboard.');
      navigate('/dashboard');
    } catch (error) {
      console.error('❌ Error accepting offer:', error);
      console.error('Error details:', error.response?.data);
      alert('Failed to accept project: ' + (error.response?.data?.error || error.message));
    } finally {
      setAccepting(null);
    }
  };

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
          <p style={{ marginTop: '1rem' }}>Loading offers...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh', paddingBottom: '4rem' }}>
      <div className="container">
        <div className="badge" style={{ marginBottom: '2rem' }}>
          <span>📬</span>
          Project Offers
        </div>
        
        <h1 style={{ marginBottom: '1rem' }}>Your Offers</h1>
        <p style={{ marginBottom: '3rem', fontSize: '1.125rem', color: 'var(--text-muted)' }}>
          Escrow projects where you've been invited as the freelancer
        </p>

        {/* Error Message */}
        {error && (
          <div style={{
            background: 'rgba(255, 71, 87, 0.1)',
            border: '1px solid rgba(255, 71, 87, 0.3)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem',
            color: '#FF4757'
          }}>
            <strong>⚠️ Error:</strong> {error}
            <button
              onClick={loadOffers}
              className="btn btn-secondary"
              style={{ marginTop: '1rem', fontSize: '0.9rem' }}
            >
              🔄 Retry
            </button>
          </div>
        )}

        {offers.length === 0 ? (
          <div style={{
            background: 'var(--secondary)',
            borderRadius: 'var(--radius-lg)',
            padding: '4rem',
            textAlign: 'center',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📭</div>
            <h3 style={{ marginBottom: '1rem' }}>No Pending Offers</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
              When clients create projects with your wallet address, they'll appear here.
            </p>
            <div style={{
              marginTop: '2rem',
              padding: '1.5rem',
              background: 'rgba(0, 229, 204, 0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(0, 229, 204, 0.2)',
              textAlign: 'left',
              maxWidth: '600px',
              margin: '2rem auto 0'
            }}>
              <div style={{ 
                fontSize: '1rem', 
                fontWeight: 600, 
                color: 'var(--accent)', 
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                💡 How to test the Offers feature:
              </div>
              <ol style={{ 
                marginLeft: '1.5rem', 
                fontSize: '0.95rem',
                lineHeight: '1.8',
                color: 'var(--text-muted)'
              }}>
                <li>Copy your wallet address: <code style={{ 
                  background: 'rgba(0, 229, 204, 0.1)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  color: 'var(--accent)',
                  fontFamily: 'monospace'
                }}>{wallet?.address?.slice(0, 20)}...</code></li>
                <li>Open a <strong>new incognito/private window</strong></li>
                <li>Create or connect a different wallet (this will be the "client")</li>
                <li>Go to "New Project" and paste YOUR address as the freelancer</li>
                <li>Create the project with milestones</li>
                <li>Return to this window and refresh - the offer will appear!</li>
              </ol>
            </div>
            
            <button
              onClick={loadOffers}
              className="btn btn-secondary"
              style={{ marginTop: '2rem' }}
            >
              🔄 Refresh Offers
            </button>
          </div>
        ) : (
          <>
            <div style={{
              background: 'rgba(0, 229, 204, 0.05)',
              border: '1px solid rgba(0, 229, 204, 0.2)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <span style={{ fontSize: '1.5rem' }}>🎉</span>
              <div>
                <strong style={{ color: 'var(--accent)' }}>
                  {offers.length} project offer{offers.length !== 1 ? 's' : ''} waiting for you!
                </strong>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                  Review the details and accept projects you want to work on.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {offers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  onAccept={handleAccept}
                  accepting={accepting === offer.id}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function OfferCard({ offer, onAccept, accepting }) {
  const totalAmount = offer.milestones.reduce((sum, m) => sum + parseFloat(m.amount), 0);

  return (
    <div style={{
      padding: '2rem',
      background: 'rgba(26, 31, 58, 0.6)',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      transition: 'all 0.3s ease'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = 'var(--accent)';
      e.currentTarget.style.transform = 'translateY(-2px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
      e.currentTarget.style.transform = 'translateY(0)';
    }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{offer.title}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.6' }}>{offer.description}</p>
        </div>
        
        <div style={{
          background: 'rgba(255, 170, 0, 0.1)',
          border: '1px solid var(--warning)',
          borderRadius: '50px',
          padding: '0.5rem 1rem',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--warning)',
          whiteSpace: 'nowrap',
          marginLeft: '1rem'
        }}>
          🔔 New Offer
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem',
        marginBottom: '1.5rem',
        padding: '1.5rem',
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '12px'
      }}>
        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            Client
          </div>
          <div style={{ 
            fontSize: '0.95rem', 
            fontWeight: 600,
            fontFamily: 'monospace',
            color: 'var(--text)'
          }}>
            {offer.clientAddress.slice(0, 8)}...{offer.clientAddress.slice(-6)}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            Total Value
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--accent)' }}>
            {totalAmount.toFixed(2)} RLUSD
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            Milestones
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>
            {offer.milestones.length}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            Created
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 600 }}>
            {new Date(offer.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Milestones Preview */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ 
          fontSize: '0.875rem', 
          fontWeight: 600, 
          marginBottom: '1rem',
          color: 'var(--text-muted)'
        }}>
          Milestones Breakdown:
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {offer.milestones.map((milestone, index) => (
            <div 
              key={index}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 1rem',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: 'var(--primary)'
                }}>
                  {index + 1}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{milestone.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Due: {new Date(milestone.deadline).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div style={{ 
                fontSize: '1.25rem', 
                fontWeight: 700, 
                color: 'var(--accent)' 
              }}>
                {milestone.amount} RLUSD
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button
          onClick={() => onAccept(offer.id)}
          disabled={accepting}
          className="btn btn-primary"
          style={{ flex: 1, fontSize: '1.125rem', padding: '1rem' }}
        >
          {accepting ? '⏳ Accepting...' : '✅ Accept Project'}
        </button>
      </div>

      <div style={{
        marginTop: '1rem',
        padding: '1rem',
        background: 'rgba(0, 229, 204, 0.05)',
        borderRadius: '8px',
        fontSize: '0.875rem',
        color: 'var(--text-muted)',
        lineHeight: '1.6'
      }}>
        💡 <strong style={{ color: 'var(--accent)' }}>Note:</strong> By accepting this project, you agree to complete the milestones by their deadlines. Funds are locked in RLUSDL escrow and will be released upon client approval.
      </div>
    </div>
  );
}

export default Offers;