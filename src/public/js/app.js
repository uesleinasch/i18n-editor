document.addEventListener('DOMContentLoaded', async () => {
  UI.init();
  await App.init();
});

const App = {
  compareData: null,
  uploadedFiles: [],

  async init() {
    await this.loadProjects();
    this.bindEvents();
  },

  async loadProjects() {
    try {
      const projects = await API.getProjects();
      State.setProjects(projects);
      UI.renderProjects(projects);
    } catch (error) {
      UI.showToast('Erro ao carregar projetos', 'error');
    }
  },

  async createProject() {
    const name = UI.elements.projectName.value.trim();
    const description = UI.elements.projectDescription.value.trim();
    const sourceType = document.querySelector('input[name="source-type"]:checked').value;
    const sourcePath = UI.elements.projectPath.value.trim();
    
    if (!name) {
      UI.showToast('Nome do projeto é obrigatório', 'error');
      return;
    }
    
    if (sourceType === 'directory' && !sourcePath) {
      UI.showToast('Caminho do diretório é obrigatório', 'error');
      return;
    }
    
    try {
      const project = await API.createProject({ name, description, sourceType, sourcePath });
      State.addProject(project);
      UI.renderProjects(State.projects);
      UI.closeProjectModal();
      UI.showToast('Projeto criado com sucesso!', 'success');
      
      if (sourceType === 'upload') {
        this.openUploadModal(project.id);
      }
    } catch (error) {
      UI.showToast(error.message || 'Erro ao criar projeto', 'error');
    }
  },

  async selectProject(projectId) {
    UI.showGlobalLoading('Abrindo projeto...');
    
    try {
      const result = await API.activateProject(projectId);
      const project = State.projects.find(p => p.id === projectId);
      
      if (project) {
        project.locales = result.locales;
        project.stats = result.stats;
      }
      
      State.setProject(project);
      UI.updateCurrentProject(project);
      UI.populateLocales(result.locales);
      
      if (result.locales.length > 0) {
        const firstExisting = result.locales.find(l => l.exists);
        if (firstExisting) {
          State.setLocale(firstExisting.code);
          UI.elements.localeSelect.value = firstExisting.code;
        }
      }
      
      UI.switchTab('editor');
      await this.loadTranslations();
    } catch (error) {
      UI.showToast(error.message || 'Erro ao abrir projeto', 'error');
    } finally {
      UI.hideGlobalLoading();
    }
  },

  async refreshProject(projectId) {
    UI.showGlobalLoading('Atualizando projeto...');
    
    try {
      const result = await API.activateProject(projectId);
      const project = State.projects.find(p => p.id === projectId);
      
      if (project) {
        project.locales = result.locales;
        project.stats = result.stats;
      }
      
      UI.renderProjects(State.projects);
      UI.showToast('Projeto atualizado!', 'success');
    } catch (error) {
      UI.showToast(error.message || 'Erro ao atualizar projeto', 'error');
    } finally {
      UI.hideGlobalLoading();
    }
  },

  confirmDeleteProject(projectId) {
    UI.openConfirmModal('Tem certeza que deseja excluir este projeto?', async () => {
      await this.deleteProject(projectId);
    });
  },

  async deleteProject(projectId) {
    try {
      await API.deleteProject(projectId);
      State.removeProject(projectId);
      UI.renderProjects(State.projects);
      
      if (State.currentProject && State.currentProject.id === projectId) {
        State.setProject(null);
        UI.updateCurrentProject(null);
        UI.switchTab('projects');
      }
      
      UI.showToast('Projeto excluído!', 'success');
    } catch (error) {
      UI.showToast(error.message || 'Erro ao excluir projeto', 'error');
    }
  },

  openUploadModal(projectId) {
    State.setUploadProjectId(projectId);
    UI.openUploadModal();
  },

  async processUploadedFiles() {
    if (this.uploadedFiles.length === 0) {
      UI.showToast('Nenhum arquivo selecionado', 'error');
      return;
    }
    
    const projectId = State.uploadProjectId;
    if (!projectId) {
      UI.showToast('Projeto não selecionado', 'error');
      return;
    }

    UI.closeUploadModal();
    UI.showGlobalLoading('Enviando arquivos...');

    try {
      const result = await API.uploadToProject(projectId, this.uploadedFiles);
      const successful = result.results.filter(r => r.success);
      const failed = result.results.filter(r => !r.success);
      
      if (successful.length > 0) {
        UI.showToast(`${successful.length} arquivo(s) carregado(s) com sucesso!`, 'success');
        await this.loadProjects();
      }
      
      if (failed.length > 0) {
        UI.showToast(`${failed.length} arquivo(s) falharam: ${failed.map(f => f.filename).join(', ')}`, 'error');
      }
      
      this.uploadedFiles = [];
    } catch (error) {
      UI.showToast('Erro ao processar arquivos', 'error');
    } finally {
      UI.hideGlobalLoading();
    }
  },

  async loadTranslations() {
    if (!State.currentProject) {
      UI.showToast('Selecione um projeto primeiro', 'error');
      return;
    }
    
    UI.showLoading(true);
    
    try {
      const data = await API.getTranslations(State.currentLocale);
      State.setTranslations(data);
      UI.renderTranslations();
    } catch (error) {
      UI.showToast('Erro ao carregar traduções', 'error');
    } finally {
      UI.showLoading(false);
    }
  },

  async saveTranslation() {
    const item = State.getEditingItem();
    if (!item) return;

    const newValue = UI.elements.editValue.value;
    const shouldMarkReviewed = UI.elements.markReviewed.checked;

    try {
      await API.updateTranslation(State.currentLocale, item.key, newValue);
      State.updateTranslationValue(item.key, newValue);
      
      if (shouldMarkReviewed && !item.reviewed) {
        await API.markAsReviewed(State.currentLocale, [item.key]);
        State.markItemReviewed(item.key);
      }
      
      UI.closeEditModal();
      UI.renderTranslations();
      UI.showToast('Tradução salva com sucesso!', 'success');
    } catch (error) {
      UI.showToast('Erro ao salvar tradução', 'error');
    }
  },

  async markAsReviewed(key) {
    try {
      await API.markAsReviewed(State.currentLocale, [key]);
      State.markItemReviewed(key);
      UI.renderTranslations();
      UI.showToast('Marcado como revisado!', 'success');
    } catch (error) {
      UI.showToast('Erro ao marcar como revisado', 'error');
    }
  },

  async exportTranslations() {
    try {
      const result = await API.exportTranslations(State.currentLocale);
      UI.showToast(`Arquivo salvo em: ${result.path}`, 'success');
    } catch (error) {
      UI.showToast('Erro ao exportar traduções', 'error');
    }
  },

  async loadCompare() {
    if (!State.currentProject) {
      UI.showToast('Selecione um projeto primeiro', 'error');
      return;
    }
    
    UI.showCompareLoading(true);
    
    try {
      this.compareData = await API.compareLocales();
      const missingOnly = UI.elements.showMissingOnly.checked;
      UI.renderCompare(this.compareData, missingOnly);
    } catch (error) {
      UI.showToast('Erro ao comparar idiomas', 'error');
    } finally {
      UI.showCompareLoading(false);
    }
  },

  async loadReviewIssues() {
    if (!State.currentProject) {
      UI.showToast('Selecione um projeto primeiro', 'error');
      return;
    }
    
    UI.showIssuesLoading(true);
    
    try {
      const issues = await API.getReviewIssues();
      UI.renderIssues(issues);
    } catch (error) {
      UI.showToast('Erro ao carregar problemas', 'error');
    } finally {
      UI.showIssuesLoading(false);
    }
  },

  bindEvents() {
    UI.elements.newProjectBtn.addEventListener('click', () => UI.openProjectModal());
    UI.elements.closeProjectModal.addEventListener('click', () => UI.closeProjectModal());
    UI.elements.cancelProject.addEventListener('click', () => UI.closeProjectModal());
    UI.elements.saveProject.addEventListener('click', () => this.createProject());
    
    UI.elements.projectModal.addEventListener('click', (e) => {
      if (e.target === UI.elements.projectModal) {
        UI.closeProjectModal();
      }
    });

    UI.elements.closeUploadModal.addEventListener('click', () => UI.closeUploadModal());
    UI.elements.cancelUpload.addEventListener('click', () => UI.closeUploadModal());
    UI.elements.confirmUpload.addEventListener('click', () => this.processUploadedFiles());

    UI.elements.fileUpload.addEventListener('change', (e) => {
      this.uploadedFiles = Array.from(e.target.files);
      UI.updateUploadPreview(this.uploadedFiles);
    });

    UI.elements.uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      UI.elements.uploadArea.classList.add('dragover');
    });

    UI.elements.uploadArea.addEventListener('dragleave', () => {
      UI.elements.uploadArea.classList.remove('dragover');
    });

    UI.elements.uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      UI.elements.uploadArea.classList.remove('dragover');
      this.uploadedFiles = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.json'));
      UI.updateUploadPreview(this.uploadedFiles);
    });
    
    UI.elements.uploadModal.addEventListener('click', (e) => {
      if (e.target === UI.elements.uploadModal) {
        UI.closeUploadModal();
      }
    });

    UI.elements.confirmNo.addEventListener('click', () => UI.closeConfirmModal());
    UI.elements.confirmModal.addEventListener('click', (e) => {
      if (e.target === UI.elements.confirmModal) {
        UI.closeConfirmModal();
      }
    });

    UI.elements.localeSelect.addEventListener('change', async (e) => {
      State.setLocale(e.target.value);
      UI.elements.searchInput.value = '';
      UI.elements.filterMode.value = 'all';
      await this.loadTranslations();
    });

    UI.elements.filterMode.addEventListener('change', (e) => {
      State.setFilterMode(e.target.value);
      UI.renderTranslations();
    });

    UI.elements.searchBtn.addEventListener('click', () => {
      State.setSearchTerm(UI.elements.searchInput.value);
      UI.renderTranslations();
    });

    UI.elements.searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        State.setSearchTerm(UI.elements.searchInput.value);
        UI.renderTranslations();
      }
    });

    UI.elements.clearBtn.addEventListener('click', () => {
      UI.elements.searchInput.value = '';
      State.clearSearch();
      UI.renderTranslations();
    });

    UI.elements.exportBtn.addEventListener('click', () => this.exportTranslations());

    [UI.elements.prevPage, UI.elements.prevPageBottom].forEach(btn => {
      btn.addEventListener('click', () => {
        State.prevPage();
        UI.renderTranslations();
      });
    });

    [UI.elements.nextPage, UI.elements.nextPageBottom].forEach(btn => {
      btn.addEventListener('click', () => {
        State.nextPage();
        UI.renderTranslations();
      });
    });

    UI.elements.saveEdit.addEventListener('click', () => this.saveTranslation());
    UI.elements.cancelEdit.addEventListener('click', () => UI.closeEditModal());
    UI.elements.modalClose.addEventListener('click', () => UI.closeEditModal());

    UI.elements.editModal.addEventListener('click', (e) => {
      if (e.target === UI.elements.editModal) {
        UI.closeEditModal();
      }
    });

    UI.elements.tabs.forEach(tab => {
      tab.addEventListener('click', async () => {
        if (tab.disabled) return;
        
        const tabName = tab.dataset.tab;
        UI.switchTab(tabName);
        
        if (tabName === 'editor' && State.translations.length === 0 && State.currentProject) {
          await this.loadTranslations();
        }
      });
    });

    UI.elements.loadCompare.addEventListener('click', () => this.loadCompare());
    UI.elements.loadIssues.addEventListener('click', () => this.loadReviewIssues());

    UI.elements.showMissingOnly.addEventListener('change', () => {
      if (this.compareData) {
        UI.renderCompare(this.compareData, UI.elements.showMissingOnly.checked);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (UI.elements.editModal.style.display === 'flex') {
          UI.closeEditModal();
        } else if (UI.elements.projectModal.style.display === 'flex') {
          UI.closeProjectModal();
        } else if (UI.elements.uploadModal.style.display === 'flex') {
          UI.closeUploadModal();
        } else if (UI.elements.confirmModal.style.display === 'flex') {
          UI.closeConfirmModal();
        }
      }
    });
  }
};
