import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import CreateProject from './pages/CreateProject';
import './styles/App.css';

/**
 * Main App Component
 * Sets up routing and layout
 */
function App() {
  return (
    <Router>
      <div className="app">
        <Navigation />
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create-project" element={<CreateProject />} />
        </Routes>
        
        <Footer />
      </div>
    </Router>
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
              Escrow
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
              <FooterLink href="https://docs.claude.com" text="API Docs" />
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