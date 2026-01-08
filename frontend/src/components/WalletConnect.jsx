import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

/**
 * WalletConnect Component
 * Initial page for users to connect their wallet using seed
 * Implements DID-based authentication
 */
function WalletConnect({ onConnect }) {
  const [seed, setSeed] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateWallet, setShowCreateWallet] = useState(false);

  // Connect existing wallet with seed
  const handleConnect = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate seed format (basic check)
      if (!seed.startsWith('s')) {
        throw new Error('Invalid seed format. XRPL seeds start with "s"');
      }

      // Get wallet info from backend
      const response = await axios.post(`${API_URL}/wallet/verify`, {
        seed: seed
      });

      if (response.data.success) {
        // Store wallet info and connect
        const walletData = {
          address: response.data.wallet.address,
          seed: seed,
          publicKey: response.data.wallet.publicKey,
          balance: response.data.wallet.balance
        };

        // Save to localStorage for session persistence
        localStorage.setItem('wallet', JSON.stringify(walletData));
        
        onConnect(walletData);
      }
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError(err.response?.data?.error || err.message || 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  // Create new wallet
  const handleCreateWallet = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/wallet/create`);
      
      if (response.data.success) {
        const newWallet = response.data.wallet;
        
        // Show the new wallet details to user
        alert(`✅ Wallet Created!\n\nAddress: ${newWallet.address}\n\nSeed: ${newWallet.seed}\n\n⚠️ IMPORTANT: Save your seed securely! You'll need it to access your wallet.`);
        
        // Auto-fill the seed
        setSeed(newWallet.seed);
        setShowCreateWallet(false);
      }
    } catch (err) {
      console.error('Error creating wallet:', err);
      setError(err.response?.data?.error || 'Failed to create wallet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0A0E27 0%, #1A1F3A 100%)',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background */}
      <div style={{
        position: 'absolute',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        background: 'radial-gradient(circle at 20% 50%, rgba(0, 229, 204, 0.1), transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 107, 157, 0.1), transparent 50%)',
        animation: 'float 8s ease-in-out infinite',
        pointerEvents: 'none'
      }}></div>

      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: '500px'
      }}>
        {/* Logo */}
        <div style={{
          textAlign: 'center',
          marginBottom: '3rem'
        }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem',
            animation: 'fadeInDown 0.8s ease-out'
          }}>
            🔒
          </div>
          <h1 style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: '2.5rem',
            marginBottom: '0.5rem',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'fadeInDown 0.8s ease-out 0.1s both'
          }}>
            Frescrow
          </h1>
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '1.1rem',
            animation: 'fadeInDown 0.8s ease-out 0.2s both'
          }}>
            Trust-Free Freelance Payments
          </p>
        </div>

        {/* Connection Card */}
        <div style={{
          background: 'rgba(26, 31, 58, 0.8)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '3rem',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          animation: 'fadeInUp 0.8s ease-out 0.3s both'
        }}>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{
              display: 'inline-block',
              background: 'rgba(0, 229, 204, 0.1)',
              border: '1px solid rgba(0, 229, 204, 0.3)',
              borderRadius: '50px',
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--accent)',
              marginBottom: '1rem'
            }}>
              🆔 DID Authentication
            </div>
            <h2 style={{ marginBottom: '0.5rem', fontSize: '1.75rem' }}>
              Connect Your Wallet
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Enter your XRPL wallet seed to access the platform
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              background: 'rgba(255, 71, 87, 0.1)',
              border: '1px solid rgba(255, 71, 87, 0.3)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.5rem',
              color: '#FF4757'
            }}>
              <strong>⚠️ Error:</strong> {error}
            </div>
          )}

          {/* Connect Form */}
          <form onSubmit={handleConnect}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: 600,
                fontSize: '0.95rem'
              }}>
                Wallet Seed
              </label>
              <input
                type="password"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                placeholder="sXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                required
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: 'var(--text)',
                  fontSize: '0.95rem',
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
              <small style={{
                display: 'block',
                marginTop: '0.5rem',
                color: 'var(--text-muted)',
                fontSize: '0.85rem'
              }}>
                🔒 Your seed is never stored on our servers
              </small>
            </div>

            <button
              type="submit"
              disabled={loading || !seed}
              style={{
                width: '100%',
                padding: '1.25rem',
                background: loading ? 'var(--text-muted)' : 'linear-gradient(135deg, var(--accent), #00C9B7)',
                border: 'none',
                borderRadius: '12px',
                color: 'var(--primary)',
                fontSize: '1.1rem',
                fontWeight: 700,
                cursor: loading || !seed ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                opacity: loading || !seed ? 0.6 : 1,
                transform: 'translateY(0)',
                boxShadow: '0 4px 20px rgba(0, 229, 204, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (!loading && seed) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 30px rgba(0, 229, 204, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 20px rgba(0, 229, 204, 0.3)';
              }}
            >
              {loading ? '⏳ Connecting...' : '🚀 Connect Wallet'}
            </button>
          </form>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '2rem 0',
            gap: '1rem'
          }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }}></div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }}></div>
          </div>

          {/* Create Wallet Button */}
          <button
            onClick={handleCreateWallet}
            disabled={loading}
            style={{
              width: '100%',
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              color: 'var(--text)',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              opacity: loading ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                e.target.style.borderColor = 'var(--accent)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.05)';
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            ✨ Create New Wallet (Testnet)
          </button>

          {/* Info Box */}
          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            background: 'rgba(0, 229, 204, 0.05)',
            border: '1px solid rgba(0, 229, 204, 0.2)',
            borderRadius: '12px'
          }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              💡 <strong style={{ color: 'var(--accent)' }}>New here?</strong> Create a testnet wallet to get started with 1000 XRP for testing. Your wallet seed is your private key—keep it safe!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '2rem',
          color: 'var(--text-muted)',
          fontSize: '0.875rem',
          animation: 'fadeIn 1s ease-out 0.5s both'
        }}>
          <p>Powered by XRPL • Testnet Environment</p>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
        
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default WalletConnect;