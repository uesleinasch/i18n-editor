const State = {
  projects: [],
  currentProject: null,
  currentLocale: null,
  translations: [],
  filteredTranslations: [],
  searchTerm: '',
  currentPage: 1,
  pageSize: 50,
  totalPages: 1,
  editingKey: null,
  filterMode: 'all',
  reviewProgress: null,
  uploadProjectId: null,

  setProjects(projects) {
    this.projects = projects || [];
  },

  addProject(project) {
    this.projects.push(project);
  },

  removeProject(projectId) {
    this.projects = this.projects.filter(p => p.id !== projectId);
    if (this.currentProject && this.currentProject.id === projectId) {
      this.currentProject = null;
    }
  },

  setProject(project) {
    this.currentProject = project;
    this.currentLocale = null;
    this.translations = [];
    this.filteredTranslations = [];
    this.searchTerm = '';
    this.currentPage = 1;
    this.filterMode = 'all';
  },

  setCurrentProject(project) {
    this.currentProject = project;
    this.currentLocale = null;
    this.translations = [];
    this.filteredTranslations = [];
    this.searchTerm = '';
    this.currentPage = 1;
    this.filterMode = 'all';
  },

  setLocale(locale) {
    this.currentLocale = locale;
    this.currentPage = 1;
    this.searchTerm = '';
    this.filterMode = 'all';
  },

  setTranslations(data) {
    this.translations = data.entries || [];
    this.reviewProgress = data.reviewProgress || null;
    this.applyFilter();
  },

  setFilterMode(mode) {
    this.filterMode = mode;
    this.currentPage = 1;
    this.applyFilter();
  },

  applyFilter() {
    const term = this.searchTerm.toLowerCase().trim();
    
    let filtered = [...this.translations];
    
    if (this.filterMode === 'issues') {
      filtered = filtered.filter(item => item.issues && item.issues.length > 0);
    } else if (this.filterMode === 'empty') {
      filtered = filtered.filter(item => !item.value || String(item.value).trim() === '');
    } else if (this.filterMode === 'reviewed') {
      filtered = filtered.filter(item => item.reviewed);
    } else if (this.filterMode === 'pending') {
      filtered = filtered.filter(item => !item.reviewed);
    }
    
    if (term) {
      filtered = filtered.filter(item => 
        item.key.toLowerCase().includes(term) || 
        (item.value && String(item.value).toLowerCase().includes(term))
      );
    }
    
    this.filteredTranslations = filtered;
    this.totalPages = Math.ceil(this.filteredTranslations.length / this.pageSize) || 1;
    
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
  },

  setSearchTerm(term) {
    this.searchTerm = term;
    this.currentPage = 1;
    this.applyFilter();
  },

  clearSearch() {
    this.searchTerm = '';
    this.currentPage = 1;
    this.applyFilter();
  },

  getCurrentPageItems() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredTranslations.slice(start, end);
  },

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  },

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  },

  updateTranslationValue(key, newValue) {
    const item = this.translations.find(t => t.key === key);
    if (item) {
      item.value = newValue;
      this.applyFilter();
    }
  },

  markItemReviewed(key) {
    const item = this.translations.find(t => t.key === key);
    if (item) {
      item.reviewed = true;
      if (this.reviewProgress) {
        this.reviewProgress.reviewed++;
      }
    }
  },

  setEditing(key) {
    this.editingKey = key;
  },

  getEditingItem() {
    if (!this.editingKey) return null;
    return this.translations.find(t => t.key === this.editingKey);
  },

  clearEditing() {
    this.editingKey = null;
  },

  setUploadProjectId(id) {
    this.uploadProjectId = id;
  }
};
