import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Navigation Component
 * Top navigation bar with logo and links
 */
function Navigation() {
  return (
    <nav className="nav">
      <div className="nav-content">
        <Link to="/" className="logo">
          Escrow
        </Link>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
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
        </div>
      </div>
    </nav>
  );
}

export default Navigation;