import axios from 'axios';
import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import WalletConnect from './components/WalletConnect';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import CreateProject from './pages/CreateProject';
import ProjectDetails from './pages/ProjectDetails';
import Offers from './pages/Offers';
import './styles/App.css';

// In Routes:
<Route path="/offers" element={<Offers />} />
/**
 * Wallet Context for global wallet state
 */
const WalletContext = createContext(null);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};

/**
 * Main App Component
 * Manages wallet connection state and routing
 */
function App() {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing wallet session on mount
  useEffect(() => {
    const savedWallet = localStorage.getItem('wallet');
    if (savedWallet) {
      try {
        setWallet(JSON.parse(savedWallet));
      } catch (error) {
        console.error('Error loading saved wallet:', error);
        localStorage.removeItem('wallet');
      }
    }
    setLoading(false);
  }, []);

  // Handle wallet connection
  const handleConnect = (walletData) => {
    setWallet(walletData);
    localStorage.setItem('wallet', JSON.stringify(walletData));
  };

  // Handle wallet disconnection
  const handleDisconnect = () => {
    setWallet(null);
    localStorage.removeItem('wallet');
  };

  // Refresh wallet balance
  const refreshBalance = async () => {
    if (!wallet) return;
  
    try {
      const response = await axios.get(`http://localhost:3001/api/wallet/${wallet.address}/balance`);
      const newBalance = response.data.balance;
      const updatedWallet = { ...wallet, balance: newBalance };
      setWallet(updatedWallet);
      localStorage.setItem('wallet', JSON.stringify(updatedWallet));
    } catch (error) {
      console.error('Error refreshing balance:', error);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--primary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading" style={{ 
            width: '60px', 
            height: '60px', 
            margin: '0 auto 1rem',
            border: '4px solid rgba(0, 229, 204, 0.1)',
            borderTop: '4px solid var(--accent)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Show wallet connection if not connected
  if (!wallet) {
    return <WalletConnect onConnect={handleConnect} />;
  }

  // Show main app when wallet is connected
  return (
    <WalletContext.Provider value={{ wallet, disconnect: handleDisconnect, refreshBalance }}>
      <Router>
        <div className="app">
          <Navigation />
          
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/create-project" element={<CreateProject />} />
            <Route path="/offers" element={<Offers />} />
            <Route path="/project/:projectId" element={<ProjectDetails />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          <Footer />
        </div>
      </Router>
    </WalletContext.Provider>
  );
}

/**
 * Footer Component
 */
function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
      padding: '3rem 0',
      marginTop: '6rem'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          <div>
            <div className="logo" style={{ marginBottom: '1rem' }}>
              Frescrow
            </div>
            <p style={{ fontSize: '0.9rem' }}>
              Trust-free freelance payments powered by the XRP Ledger.
            </p>
          </div>
          
          <div>
            <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Resources</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <FooterLink href="https://xrpl.org" text="XRPL Documentation" />
              <FooterLink href="https://testnet.xrpl.org" text="Testnet Explorer" />
              <FooterLink href="https://docs.anthropic.com" text="API Docs" />
            </ul>
          </div>
          
          <div>
            <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Built With</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                ⬡ XRPL Escrow
              </li>
              <li style={{ marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                💎 RLUSD
              </li>
              <li style={{ marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                🆔 Decentralized Identity
              </li>
            </ul>
          </div>
        </div>
        
        <div style={{
          paddingTop: '2rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.875rem'
        }}>
          <p>Built for Ripple Hackathon 2025 • MIT License</p>
        </div>
      </div>
    </footer>
  );
}

/**
 * Footer Link Component
 */
function FooterLink({ href, text }) {
  return (
    <li style={{ marginBottom: '0.5rem' }}>
      <a 
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: 'var(--text-muted)',
          textDecoration: 'none',
          fontSize: '0.9rem',
          transition: 'color 0.3s ease'
        }}
        onMouseEnter={(e) => e.target.style.color = 'var(--accent)'}
        onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
      >
        {text} →
      </a>
    </li>
  );
}

export default App;