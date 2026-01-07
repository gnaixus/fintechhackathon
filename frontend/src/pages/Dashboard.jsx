import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

/**
 * Dashboard Page
 * View all projects and escrows
 */
function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await axios.get(`${API_URL}/projects`);
      setProjects(response.data.projects || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh' }}>
      <div className="container">
        <div className="badge" style={{ marginBottom: '2rem' }}>
          <span>📊</span>
          Your Projects
        </div>
        
        <h1 style={{ marginBottom: '3rem' }}>Dashboard</h1>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div className="loading" style={{ width: '40px', height: '40px', margin: '0 auto' }}></div>
            <p style={{ marginTop: '1rem' }}>Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div style={{
            background: 'var(--secondary)',
            borderRadius: 'var(--radius-lg)',
            padding: '4rem',
            textAlign: 'center',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📋</div>
            <h3 style={{ marginBottom: '1rem' }}>No Projects Yet</h3>
            <p style={{ marginBottom: '2rem' }}>Create your first escrow project to get started.</p>
            <a href="/create-project" className="btn btn-primary">
              Create Project
            </a>
          </div>
        ) : (
          <div className="features-grid">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Project Card Component
 */
function ProjectCard({ project }) {
  const totalAmount = project.milestones.reduce((sum, m) => sum + parseFloat(m.amount), 0);
  const completedMilestones = project.milestones.filter(m => m.status === 'released').length;
  
  return (
    <div className="feature-card">
      <div style={{ marginBottom: '1rem' }}>
        <span style={{
          background: 'rgba(0, 229, 204, 0.1)',
          color: 'var(--accent)',
          padding: '0.25rem 0.75rem',
          borderRadius: '50px',
          fontSize: '0.75rem',
          fontWeight: 600
        }}>
          {completedMilestones}/{project.milestones.length} Complete
        </span>
      </div>
      
      <h3 style={{ marginBottom: '0.5rem' }}>{project.title}</h3>
      <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>{project.description}</p>
      
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '1rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Total Value</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>
            {totalAmount} XRP
          </div>
        </div>
        
        <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
          View Details
        </button>
      </div>
    </div>
  );
}

export default Dashboard;