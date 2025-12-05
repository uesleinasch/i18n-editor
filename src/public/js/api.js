const API = {
  async getProjects() {
    const response = await fetch('/api/projects');
    if (!response.ok) throw new Error('Failed to load projects');
    return response.json();
  },

  async getProject(id) {
    const response = await fetch(`/api/projects/${id}`);
    if (!response.ok) throw new Error('Failed to load project');
    return response.json();
  },

  async createProject(data) {
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create project');
    }
    return response.json();
  },

  async updateProject(id, data) {
    const response = await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update project');
    }
    return response.json();
  },

  async deleteProject(id) {
    const response = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete project');
    return response.json();
  },

  async selectProject(id) {
    const response = await fetch(`/api/projects/${id}/select`, { method: 'POST' });
    if (!response.ok) throw new Error('Failed to select project');
    return response.json();
  },

  async activateProject(id) {
    const response = await fetch(`/api/projects/${id}/activate`, { method: 'POST' });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to activate project');
    }
    return response.json();
  },

  async refreshProject(id) {
    const response = await fetch(`/api/projects/${id}/refresh`);
    if (!response.ok) throw new Error('Failed to refresh project');
    return response.json();
  },

  async uploadFiles(projectId, files) {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    
    const response = await fetch(`/api/projects/${projectId}/upload`, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) throw new Error('Failed to upload files');
    return response.json();
  },

  async uploadToProject(projectId, files) {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    
    const response = await fetch(`/api/projects/${projectId}/upload`, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) throw new Error('Failed to upload files');
    return response.json();
  },

  async getCurrentProject() {
    const response = await fetch('/api/current-project');
    if (!response.ok) throw new Error('Failed to get current project');
    return response.json();
  },

  async getLocales() {
    const response = await fetch('/api/locales');
    if (!response.ok) throw new Error('Failed to load locales');
    return response.json();
  },

  async getTranslations(locale) {
    const response = await fetch(`/api/translations/${locale}`);
    if (!response.ok) throw new Error('Failed to load translations');
    return response.json();
  },

  async updateTranslation(locale, key, value) {
    const response = await fetch(`/api/translations/${locale}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value })
    });
    if (!response.ok) throw new Error('Failed to update translation');
    return response.json();
  },

  async exportTranslations(locale) {
    const response = await fetch(`/api/export/${locale}`, { method: 'POST' });
    if (!response.ok) throw new Error('Failed to export translations');
    return response.json();
  },

  async compareLocales() {
    const response = await fetch('/api/compare');
    if (!response.ok) throw new Error('Failed to compare locales');
    return response.json();
  },

  async getStats() {
    const response = await fetch('/api/stats');
    if (!response.ok) throw new Error('Failed to get stats');
    return response.json();
  },

  async getReviewIssues() {
    const response = await fetch('/api/review/issues');
    if (!response.ok) throw new Error('Failed to get review issues');
    return response.json();
  },

  async markAsReviewed(locale, keys) {
    const response = await fetch(`/api/review/${locale}/mark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys })
    });
    if (!response.ok) throw new Error('Failed to mark as reviewed');
    return response.json();
  }
};
