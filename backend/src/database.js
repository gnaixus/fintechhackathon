/**
 * In-Memory Database Manager for Frescrow Platform
 * Fast, simple storage for hackathon demo
 * For production: Replace with PostgreSQL/MongoDB
 */

class DatabaseManager {
  constructor() {
    this.projects = new Map();
    console.log('✅ In-memory database initialized');
  }

  /**
   * Initialize database (no-op for in-memory)
   */
  initialize() {
    console.log('✅ Database ready (in-memory mode)');
  }

  /**
   * Save project to memory
   */
  saveProject(project) {
    this.projects.set(project.id, project);
    return project;
  }

  /**
   * Get project by ID
   */
  getProject(id) {
    return this.projects.get(id) || null;
  }

  /**
   * Get all projects
   */
  getAllProjects() {
    return Array.from(this.projects.values())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /**
   * Get projects by client address
   */
  getProjectsByClient(clientAddress) {
    return this.getAllProjects()
      .filter(p => p.clientAddress === clientAddress);
  }

  /**
   * Get projects by freelancer address
   */
  getProjectsByFreelancer(freelancerAddress) {
    return this.getAllProjects()
      .filter(p => p.freelancerAddress === freelancerAddress);
  }

  /**
   * Get pending offers for freelancer
   */
  getOffersByFreelancer(freelancerAddress) {
    return this.getAllProjects()
      .filter(p => p.freelancerAddress === freelancerAddress && p.status === 'pending');
  }

  /**
   * Get accepted projects
   */
  getAcceptedProjects() {
    return this.getAllProjects()
      .filter(p => p.status === 'accepted');
  }

  /**
   * Update project status
   */
  updateProjectStatus(id, status, timestamp = null) {
    const project = this.getProject(id);
    if (!project) return null;

    project.status = status;
    
    if (status === 'accepted' && !project.acceptedAt) {
      project.acceptedAt = timestamp || new Date().toISOString();
    }
    
    if (status === 'completed' && !project.completedAt) {
      project.completedAt = timestamp || new Date().toISOString();
    }

    return this.saveProject(project);
  }

  /**
   * Update milestone in project
   */
  updateMilestone(projectId, milestoneIndex, updates) {
    const project = this.getProject(projectId);
    if (!project || !project.milestones[milestoneIndex]) {
      return null;
    }

    Object.assign(project.milestones[milestoneIndex], updates);
    return this.saveProject(project);
  }

  /**
   * Delete project
   */
  deleteProject(id) {
    return this.projects.delete(id);
  }

  /**
   * Get database statistics
   */
  getStats() {
    const all = this.getAllProjects();
    
    return {
      total: all.length,
      pending: all.filter(p => p.status === 'pending').length,
      accepted: all.filter(p => p.status === 'accepted').length,
      completed: all.filter(p => p.status === 'completed').length,
      active: all.filter(p => p.status === 'accepted').length
    };
  }

  /**
   * Clear all data (for testing)
   */
  clear() {
    this.projects.clear();
    console.log('🗑️  Database cleared');
  }

  /**
   * Close database connection (no-op for in-memory)
   */
  close() {
    console.log('❌ Database connection closed');
  }
}

// Export singleton instance
const db = new DatabaseManager();
export default db;