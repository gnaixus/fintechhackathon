import React from 'react';

/**
 * Create Project Page
 * Form to create new escrow project
 */
function CreateProject() {
  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <div className="badge" style={{ marginBottom: '2rem' }}>
          <span>✨</span>
          New Project
        </div>
        
        <h1 style={{ marginBottom: '1rem' }}>Create Escrow Project</h1>
        <p style={{ marginBottom: '3rem', fontSize: '1.125rem' }}>
          Set up a new project with milestone-based escrow payments
        </p>

        <div style={{
          background: 'var(--secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '3rem',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚧</div>
            <h3 style={{ marginBottom: '1rem' }}>Coming Soon</h3>
            <p>
              The project creation form is being built. Check back soon!
            </p>
            <div style={{ marginTop: '2rem' }}>
              <a href="/dashboard" className="btn btn-secondary">
                Back to Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateProject;