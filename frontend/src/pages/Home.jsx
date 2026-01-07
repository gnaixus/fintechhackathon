import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Home Page Component
 * Landing page for Freelance Escrow Platform
 */
function Home() {
  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <div className="badge">
                <span>⚡</span>
                Powered by XRPL
              </div>
              
              <h1 className="hero-title">
                Trust-Free Freelance Payments
              </h1>
              
              <p className="hero-subtitle">
                Secure milestone-based escrow using the XRP Ledger. 
                No middlemen. No fees. Complete transparency.
              </p>
              
              <div className="hero-cta">
                <Link to="/create-project" className="btn btn-primary">
                  Create Project
                </Link>
                <Link to="/dashboard" className="btn btn-secondary">
                  View Dashboard
                </Link>
              </div>
            </div>
            
            <div className="hero-visual">
              <EscrowVisualization />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container">
        <div className="stats">
          <div className="stat">
            <span className="stat-value">$0</span>
            <span className="stat-label">Platform Fees</span>
          </div>
          <div className="stat">
            <span className="stat-value">&lt;1s</span>
            <span className="stat-label">Payment Settlement</span>
          </div>
          <div className="stat">
            <span className="stat-value">100%</span>
            <span className="stat-label">Transparency</span>
          </div>
          <div className="stat">
            <span className="stat-value">∞</span>
            <span className="stat-label">Trust Needed</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <div className="text-center" style={{ marginBottom: '4rem' }}>
            <h2>How It Works</h2>
            <p style={{ fontSize: '1.25rem', marginTop: '1rem' }}>
              Smart escrow powered by the XRP Ledger
            </p>
          </div>
          
          <div className="features-grid">
            <FeatureCard 
              icon="🔒"
              title="Escrow Protection"
              description="Funds are locked on-chain using XRPL's native escrow. Neither party can touch the money until milestones are approved."
            />
            
            <FeatureCard 
              icon="💎"
              title="RLUSD Stable Payments"
              description="Pay in RLUSD for stable, predictable transactions. No volatility, just reliable payments."
            />
            
            <FeatureCard 
              icon="🎯"
              title="Milestone-Based"
              description="Split projects into milestones. Release funds progressively as work is completed and approved."
            />
            
            <FeatureCard 
              icon="⚡"
              title="Instant Settlement"
              description="Payments settle in seconds on XRPL. No waiting days for bank transfers or platform approvals."
            />
            
            <FeatureCard 
              icon="🆔"
              title="DID Reputation"
              description="Build your on-chain reputation. Every completed project adds to your verifiable work history."
            />
            
            <FeatureCard 
              icon="🌐"
              title="Global & Permissionless"
              description="Work with anyone, anywhere. No banks, no borders, no restrictions. Just your wallet."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container" style={{ padding: '6rem 0', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '2rem' }}>Ready to Start?</h2>
        <p style={{ fontSize: '1.25rem', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem' }}>
          Create your first escrow project in minutes. No signup required—just your XRPL wallet.
        </p>
        <Link to="/create-project" className="btn btn-primary" style={{ fontSize: '1.125rem', padding: '1.25rem 3rem' }}>
          Launch Project
        </Link>
      </section>
    </div>
  );
}

/**
 * Feature Card Component
 */
function FeatureCard({ icon, title, description }) {
  return (
    <div className="feature-card">
      <span className="feature-icon">{icon}</span>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

/**
 * Escrow Visualization Component
 * Visual representation of escrow flow
 */
function EscrowVisualization() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(26, 31, 58, 0.6), rgba(37, 43, 74, 0.6))',
      borderRadius: '24px',
      padding: '3rem',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(20px)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Glow effect */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: 'radial-gradient(circle, rgba(0, 229, 204, 0.1), transparent 50%)',
        animation: 'float 6s ease-in-out infinite',
        pointerEvents: 'none'
      }}></div>
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        <EscrowFlow />
      </div>
    </div>
  );
}

/**
 * Escrow Flow Diagram
 */
function EscrowFlow() {
  const steps = [
    { label: 'Client', emoji: '👤', color: '#FF6B9D' },
    { label: 'Escrow', emoji: '🔒', color: '#00E5CC' },
    { label: 'Freelancer', emoji: '💼', color: '#FFAA00' }
  ];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '2rem'
    }}>
      {steps.map((step, index) => (
        <React.Fragment key={step.label}>
          <div style={{
            textAlign: 'center',
            animation: `fadeInUp 0.8s ease-out ${index * 0.2}s both`
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${step.color}, ${step.color}DD)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              marginBottom: '1rem',
              boxShadow: `0 10px 30px ${step.color}33`,
              animation: `pulse 2s ease-in-out ${index * 0.3}s infinite`
            }}>
              {step.emoji}
            </div>
            <div style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 600,
              color: 'var(--text)'
            }}>
              {step.label}
            </div>
          </div>
          
          {index < steps.length - 1 && (
            <div style={{
              flex: 1,
              height: '2px',
              background: `linear-gradient(90deg, ${steps[index].color}, ${steps[index + 1].color})`,
              position: 'relative',
              animation: `fadeIn 1s ease-out ${index * 0.2 + 0.5}s both`
            }}>
              <div style={{
                position: 'absolute',
                right: '0',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '10px',
                height: '10px',
                background: steps[index + 1].color,
                borderRadius: '50%',
                boxShadow: `0 0 20px ${steps[index + 1].color}`
              }}></div>
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default Home;