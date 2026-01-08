import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../App';

/**
 * Navigation Component
 * Top navigation bar with logo, links, and wallet info
 */
function Navigation() {
  const { wallet, disconnect } = useWallet();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null); // ✅ ADDED: Ref for click outside detection

  const truncateAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleDisconnect = () => {
    if (window.confirm('Are you sure you want to disconnect your wallet?')) {
      disconnect();
    }
  };

  // ✅ ADDED: Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <nav className="nav">
      <div className="nav-content">
        <Link to="/" className="logo">
          Frescrow
        </Link>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link 
            to="/offers" 
            style={{
              color: 'var(--text-muted)',
              textDecoration: 'none',
              fontWeight: 500,
              transition: 'color 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.color = 'var(--accent)'}
            onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
          >
            Offers
          </Link>
          <Link 
            to="/dashboard" 
            style={{
              color: 'var(--text-muted)',
              textDecoration: 'none',
              fontWeight: 500,
              transition: 'color 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.color = 'var(--accent)'}
            onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
          >
            Dashboard
          </Link>
          
          <Link 
            to="/create-project" 
            className="btn btn-primary"
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '0.9rem'
            }}
          >
            New Project
          </Link>

          {/* Wallet Display */}
          <div 
            style={{
              position: 'relative',
              cursor: 'pointer'
            }}
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              background: 'rgba(0, 229, 204, 0.1)',
              border: '1px solid rgba(0, 229, 204, 0.3)',
              borderRadius: '12px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 229, 204, 0.15)';
              e.currentTarget.style.borderColor = 'var(--accent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 229, 204, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(0, 229, 204, 0.3)';
            }}
            >
              <span style={{ fontSize: '1.2rem' }}>👤</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  marginBottom: '0.1rem'
                }}>
                  Connected
                </div>
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--accent)'
                }}>
                  {truncateAddress(wallet?.address)}
                </div>
              </div>
              <span style={{ 
                fontSize: '0.7rem', 
                color: 'var(--text-muted)',
                transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease'
              }}>
                ▼
              </span>
            </div>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 0.5rem)',
                right: 0,
                background: 'var(--secondary)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '0.5rem',
                minWidth: '250px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                zIndex: 1000,
                animation: 'fadeInDown 0.3s ease-out'
              }}>
                {/* Wallet Info */}
                <div style={{
                  padding: '1rem',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    marginBottom: '0.5rem'
                  }}>
                    Wallet Address
                  </div>
                  <div style={{
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    color: 'var(--text)',
                    wordBreak: 'break-all',
                    marginBottom: '1rem'
                  }}>
                    {wallet?.address}
                  </div>
                  
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    marginBottom: '0.5rem'
                  }}>
                    Balance
                  </div>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: 'var(--accent)'
                  }}>
                    {wallet?.balance || '0'} RLUSD
                  </div>
                </div>

                {/* Actions */}
                <a
                  href={`https://testnet.xrpl.org/accounts/${wallet?.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    color: 'var(--text)',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    transition: 'background 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.05)'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  🔍 View on Explorer
                </a>

                <button
                  onClick={handleDisconnect}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    background: 'transparent',
                    border: 'none',
                    color: '#FF4757',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'background 0.3s ease',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(255, 71, 87, 0.1)'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  🚪 Disconnect Wallet
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </nav>
  );
}

export default Navigation;