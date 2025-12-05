const UI = {
  elements: {},

  init() {
    this.elements = {
      tabs: document.querySelectorAll('.tab'),
      projectsTab: document.getElementById('projects-tab'),
      editorTab: document.getElementById('editor-tab'),
      reviewTab: document.getElementById('review-tab'),
      compareTab: document.getElementById('compare-tab'),
      editorTabBtn: document.getElementById('editor-tab-btn'),
      reviewTabBtn: document.getElementById('review-tab-btn'),
      compareTabBtn: document.getElementById('compare-tab-btn'),
      currentProject: document.getElementById('current-project'),
      projectsList: document.getElementById('projects-list'),
      newProjectBtn: document.getElementById('new-project-btn'),
      projectModal: document.getElementById('project-modal'),
      projectModalTitle: document.getElementById('project-modal-title'),
      closeProjectModal: document.getElementById('close-project-modal'),
      projectName: document.getElementById('project-name'),
      projectDescription: document.getElementById('project-description'),
      projectPath: document.getElementById('project-path'),
      pathGroup: document.getElementById('path-group'),
      cancelProject: document.getElementById('cancel-project'),
      saveProject: document.getElementById('save-project'),
      uploadModal: document.getElementById('upload-modal'),
      closeUploadModal: document.getElementById('close-upload-modal'),
      uploadArea: document.getElementById('upload-area'),
      fileUpload: document.getElementById('file-upload'),
      uploadPreview: document.getElementById('upload-preview'),
      cancelUpload: document.getElementById('cancel-upload'),
      confirmUpload: document.getElementById('confirm-upload'),
      confirmModal: document.getElementById('confirm-modal'),
      confirmMessage: document.getElementById('confirm-message'),
      confirmYes: document.getElementById('confirm-yes'),
      confirmNo: document.getElementById('confirm-no'),
      localeSelect: document.getElementById('locale-select'),
      filterMode: document.getElementById('filter-mode'),
      searchInput: document.getElementById('search-input'),
      searchBtn: document.getElementById('search-btn'),
      clearBtn: document.getElementById('clear-btn'),
      exportBtn: document.getElementById('export-btn'),
      stats: document.getElementById('stats'),
      translationsList: document.getElementById('translations-list'),
      loading: document.getElementById('loading'),
      pageInfo: document.getElementById('page-info'),
      pageInfoBottom: document.getElementById('page-info-bottom'),
      prevPage: document.getElementById('prev-page'),
      nextPage: document.getElementById('next-page'),
      prevPageBottom: document.getElementById('prev-page-bottom'),
      nextPageBottom: document.getElementById('next-page-bottom'),
      editModal: document.getElementById('edit-modal'),
      editKey: document.getElementById('edit-key'),
      editValue: document.getElementById('edit-value'),
      editIssues: document.getElementById('edit-issues'),
      markReviewed: document.getElementById('mark-reviewed'),
      saveEdit: document.getElementById('save-edit'),
      cancelEdit: document.getElementById('cancel-edit'),
      modalClose: document.querySelector('#edit-modal .modal-close'),
      toast: document.getElementById('toast'),
      loadCompare: document.getElementById('load-compare'),
      compareList: document.getElementById('compare-list'),
      compareLoading: document.getElementById('compare-loading'),
      showMissingOnly: document.getElementById('show-missing-only'),
      loadIssues: document.getElementById('load-issues'),
      issuesLoading: document.getElementById('issues-loading'),
      issuesSummary: document.getElementById('issues-summary'),
      issuesList: document.getElementById('issues-list'),
      reviewProgress: document.getElementById('review-progress'),
      progressFill: document.getElementById('progress-fill'),
      progressText: document.getElementById('progress-text'),
      globalLoading: document.getElementById('global-loading'),
      loadingMessage: document.getElementById('loading-message')
    };
  },

  showGlobalLoading(message = 'Carregando...') {
    this.elements.loadingMessage.textContent = message;
    this.elements.globalLoading.style.display = 'flex';
  },

  hideGlobalLoading() {
    this.elements.globalLoading.style.display = 'none';
  },

  renderProjects(projects) {
    if (!projects || projects.length === 0) {
      this.elements.projectsList.innerHTML = `
        <div class="no-projects">
          <span>📭</span>
          <p>Nenhum projeto criado</p>
          <p class="hint">Crie um projeto para começar a gerenciar suas traduções</p>
        </div>
      `;
      return;
    }

    this.elements.projectsList.innerHTML = projects.map(project => `
      <div class="project-card" data-id="${project.id}">
        <div class="project-info">
          <h3>${this.escapeHtml(project.name)}</h3>
          ${project.description ? `<p class="project-desc">${this.escapeHtml(project.description)}</p>` : ''}
          <div class="project-meta">
            <span class="meta-item">
              <span class="meta-icon">${project.sourceType === 'upload' ? '📤' : '📁'}</span>
              ${project.sourceType === 'upload' ? 'Upload' : 'Diretório'}
            </span>
            <span class="meta-item">
              <span class="meta-icon">🌐</span>
              ${project.locales?.length || 0} idiomas
            </span>
            <span class="meta-item">
              <span class="meta-icon">🔑</span>
              ${project.stats?.totalKeys || 0} chaves
            </span>
          </div>
          ${project.locales && project.locales.length > 0 ? `
            <div class="project-locales">
              ${project.locales.map(l => `<span class="locale-tag">${l.code.toUpperCase()}</span>`).join('')}
            </div>
          ` : ''}
        </div>
        <div class="project-actions">
          <button class="btn btn-primary select-project-btn">Abrir</button>
          ${project.sourceType === 'upload' ? `<button class="btn btn-secondary upload-project-btn">Upload</button>` : ''}
          <button class="btn btn-outline refresh-project-btn" title="Atualizar">🔄</button>
          <button class="btn btn-outline delete-project-btn" title="Excluir">🗑️</button>
        </div>
      </div>
    `).join('');

    this.elements.projectsList.querySelectorAll('.select-project-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.closest('.project-card').dataset.id;
        App.selectProject(id);
      });
    });

    this.elements.projectsList.querySelectorAll('.upload-project-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.closest('.project-card').dataset.id;
        App.openUploadModal(id);
      });
    });

    this.elements.projectsList.querySelectorAll('.refresh-project-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.closest('.project-card').dataset.id;
        App.refreshProject(id);
      });
    });

    this.elements.projectsList.querySelectorAll('.delete-project-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.closest('.project-card').dataset.id;
        App.confirmDeleteProject(id);
      });
    });
  },

  updateCurrentProject(project) {
    if (project) {
      this.elements.currentProject.innerHTML = `<small>📂 ${this.escapeHtml(project.name)}</small>`;
      this.enableProjectTabs(true);
    } else {
      this.elements.currentProject.innerHTML = '';
      this.enableProjectTabs(false);
    }
  },

  enableProjectTabs(enabled) {
    this.elements.editorTabBtn.disabled = !enabled;
    this.elements.reviewTabBtn.disabled = !enabled;
    this.elements.compareTabBtn.disabled = !enabled;
  },

  populateLocales(locales) {
    this.elements.localeSelect.innerHTML = locales
      .filter(l => l.exists)
      .map(l => `<option value="${l.code}">${l.name} (${l.code})</option>`)
      .join('');
  },

  showLoading(show) {
    this.elements.loading.style.display = show ? 'flex' : 'none';
    this.elements.translationsList.style.display = show ? 'none' : 'block';
  },

  showCompareLoading(show) {
    this.elements.compareLoading.style.display = show ? 'flex' : 'none';
    this.elements.compareList.style.display = show ? 'none' : 'block';
  },

  showIssuesLoading(show) {
    this.elements.issuesLoading.style.display = show ? 'flex' : 'none';
  },

  updateStats() {
    const filtered = State.filteredTranslations.length;
    const total = State.translations.length;
    const showing = State.getCurrentPageItems().length;
    
    this.elements.stats.textContent = State.searchTerm 
      ? `Encontrados: ${filtered} de ${total} | Página: ${showing} itens`
      : `Total: ${total} traduções | Página: ${showing} itens`;
  },

  updateReviewProgress() {
    if (!State.reviewProgress) {
      this.elements.reviewProgress.style.display = 'none';
      return;
    }
    
    this.elements.reviewProgress.style.display = 'flex';
    const { total, reviewed, withIssues } = State.reviewProgress;
    const percentage = Math.round((reviewed / total) * 100) || 0;
    
    this.elements.progressFill.style.width = `${percentage}%`;
    this.elements.progressText.textContent = `Revisadas: ${reviewed}/${total} (${percentage}%) | Com problemas: ${withIssues}`;
  },

  updatePagination() {
    const info = `Página ${State.currentPage} de ${State.totalPages}`;
    this.elements.pageInfo.textContent = info;
    this.elements.pageInfoBottom.textContent = info;

    const isFirst = State.currentPage === 1;
    const isLast = State.currentPage === State.totalPages;

    this.elements.prevPage.disabled = isFirst;
    this.elements.prevPageBottom.disabled = isFirst;
    this.elements.nextPage.disabled = isLast;
    this.elements.nextPageBottom.disabled = isLast;
  },

  renderTranslations() {
    const items = State.getCurrentPageItems();
    
    if (items.length === 0) {
      this.elements.translationsList.innerHTML = `
        <div class="empty-state">
          <span>🔍</span>
          <p>${State.searchTerm ? 'Nenhuma tradução encontrada para a busca.' : 'Nenhuma tradução disponível.'}</p>
        </div>
      `;
      this.updateStats();
      this.updatePagination();
      this.updateReviewProgress();
      return;
    }

    const tableRows = items.map(item => {
      const hasIssues = item.issues && item.issues.length > 0;
      const rowClass = hasIssues ? 'row-issues' : (item.reviewed ? 'row-reviewed' : '');
      const issuesBadges = hasIssues 
        ? item.issues.map(i => `<span class="issue-badge ${i.type}" title="${i.message}">${i.type === 'empty' ? '⚠️' : i.type === 'untranslated' ? '🌐' : '📝'}</span>`).join('')
        : '';
      const statusIcon = item.reviewed ? '<span class="status-icon reviewed" title="Revisado">✓</span>' : 
                        (hasIssues ? '<span class="status-icon issues" title="Com problemas">!</span>' : 
                        '<span class="status-icon pending" title="Pendente">○</span>');
      
      return `
        <tr class="${rowClass}" data-key="${this.escapeHtml(item.key)}">
          <td class="col-status">${statusIcon}</td>
          <td class="col-key">
            <code>${this.escapeHtml(item.key)}</code>
            ${issuesBadges ? `<div class="inline-badges">${issuesBadges}</div>` : ''}
          </td>
          <td class="col-value">
            <div class="value-text">${this.escapeHtml(String(item.value || ''))}</div>
          </td>
          <td class="col-actions">
            <button class="btn-icon review-btn" title="Marcar como revisado" ${item.reviewed ? 'disabled' : ''}>✓</button>
            <button class="btn-icon edit-btn" title="Editar">✏️</button>
          </td>
        </tr>
      `;
    }).join('');

    this.elements.translationsList.innerHTML = `
      <table class="translations-table">
        <thead>
          <tr>
            <th class="col-status"></th>
            <th class="col-key">Chave</th>
            <th class="col-value">Valor</th>
            <th class="col-actions">Ações</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    `;

    this.elements.translationsList.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const key = e.target.closest('tr').dataset.key;
        this.openEditModal(key);
      });
    });

    this.elements.translationsList.querySelectorAll('.review-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        if (btn.disabled) return;
        const key = e.target.closest('tr').dataset.key;
        await App.markAsReviewed(key);
      });
    });

    this.updateStats();
    this.updatePagination();
    this.updateReviewProgress();
  },

  renderIssues(data) {
    this.elements.issuesSummary.style.display = 'block';
    this.elements.issuesSummary.innerHTML = `
      <div class="summary-card">
        <span class="summary-count">${data.total}</span>
        <span class="summary-label">problemas encontrados</span>
      </div>
    `;

    if (data.issues.length === 0) {
      this.elements.issuesList.innerHTML = `
        <div class="no-issues">
          <span>✅</span>
          <p>Nenhum problema encontrado!</p>
        </div>
      `;
      return;
    }

    this.elements.issuesList.innerHTML = data.issues.slice(0, 100).map(item => `
      <div class="issue-item" data-locale="${item.locale}" data-key="${this.escapeHtml(item.key)}">
        <div class="issue-header">
          <span class="issue-locale">${item.locale.toUpperCase()}</span>
          <span class="issue-key">${this.escapeHtml(item.key)}</span>
        </div>
        <div class="issue-value">${this.escapeHtml(String(item.value || '(vazio)'))}</div>
        <div class="issue-tags">
          ${item.issues.map(i => `<span class="issue-tag ${i.type}">${i.message}</span>`).join('')}
        </div>
        <button class="btn btn-small btn-primary fix-issue-btn">Corrigir</button>
      </div>
    `).join('');

    this.elements.issuesList.querySelectorAll('.fix-issue-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const item = e.target.closest('.issue-item');
        const locale = item.dataset.locale;
        const key = item.dataset.key;
        State.setLocale(locale);
        this.elements.localeSelect.value = locale;
        this.switchTab('editor');
        App.loadTranslations().then(() => {
          State.setSearchTerm(key);
          this.elements.searchInput.value = key;
          this.renderTranslations();
        });
      });
    });
  },

  renderCompare(data, missingOnly) {
    let entries = data.entries;
    
    if (missingOnly) {
      entries = entries.filter(e => e.missing && e.missing.length > 0);
    }

    if (entries.length === 0) {
      this.elements.compareList.innerHTML = `
        <div class="compare-item">
          <p style="text-align: center; color: var(--text-secondary);">
            ${missingOnly ? 'Nenhuma chave faltante encontrada. ✅' : 'Nenhuma chave para comparar.'}
          </p>
        </div>
      `;
      return;
    }

    this.elements.compareList.innerHTML = entries.slice(0, 100).map(entry => `
      <div class="compare-item ${entry.missing ? 'missing' : ''}">
        <div class="compare-key">${this.escapeHtml(entry.key)}</div>
        <div class="compare-values">
          ${data.locales.map(locale => `
            <div class="compare-value ${!entry.values[locale] ? 'missing-value' : ''}">
              <div class="locale-badge">${locale}</div>
              <div class="value-text">${this.escapeHtml(String(entry.values[locale] || '⚠️ Faltando'))}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

    if (entries.length > 100) {
      this.elements.compareList.innerHTML += `
        <div class="compare-item">
          <p style="text-align: center; color: var(--text-secondary);">
            Mostrando 100 de ${entries.length} itens.
          </p>
        </div>
      `;
    }
  },

  openProjectModal(editProject = null) {
    this.elements.projectModalTitle.textContent = editProject ? 'Editar Projeto' : 'Novo Projeto';
    this.elements.saveProject.textContent = editProject ? 'Salvar' : 'Criar Projeto';
    
    if (editProject) {
      this.elements.projectName.value = editProject.name;
      this.elements.projectDescription.value = editProject.description || '';
      this.elements.projectPath.value = editProject.sourcePath || '';
      this.selectSourceCard(editProject.sourceType);
    } else {
      this.elements.projectName.value = '';
      this.elements.projectDescription.value = '';
      this.elements.projectPath.value = '';
      this.selectSourceCard('directory');
    }
    
    this.updatePathGroupVisibility();
    this.bindSourceCards();
    this.elements.projectModal.style.display = 'flex';
    this.elements.projectName.focus();
  },

  selectSourceCard(value) {
    document.querySelectorAll('.source-card').forEach(card => {
      const isSelected = card.dataset.value === value;
      card.classList.toggle('selected', isSelected);
      card.querySelector('input[type="radio"]').checked = isSelected;
    });
  },

  bindSourceCards() {
    document.querySelectorAll('.source-card').forEach(card => {
      card.addEventListener('click', () => {
        this.selectSourceCard(card.dataset.value);
        this.updatePathGroupVisibility();
      });
    });
  },

  closeProjectModal() {
    this.elements.projectModal.style.display = 'none';
  },

  updatePathGroupVisibility() {
    const sourceType = document.querySelector('input[name="source-type"]:checked')?.value || 'directory';
    this.elements.pathGroup.style.display = sourceType === 'directory' ? 'block' : 'none';
  },

  openUploadModal() {
    this.elements.uploadModal.style.display = 'flex';
    this.elements.uploadPreview.innerHTML = '';
    this.elements.confirmUpload.disabled = true;
    this.elements.fileUpload.value = '';
  },

  closeUploadModal() {
    this.elements.uploadModal.style.display = 'none';
    State.setUploadProjectId(null);
  },

  updateUploadPreview(files) {
    if (files.length === 0) {
      this.elements.uploadPreview.innerHTML = '';
      this.elements.confirmUpload.disabled = true;
      return;
    }
    
    this.elements.uploadPreview.innerHTML = `
      <div class="file-list">
        ${Array.from(files).map(f => `
          <div class="file-item">
            <span class="file-icon">📄</span>
            <span class="file-name">${f.name}</span>
            <span class="file-size">${(f.size / 1024).toFixed(1)} KB</span>
          </div>
        `).join('')}
      </div>
    `;
    this.elements.confirmUpload.disabled = false;
  },

  openConfirmModal(message, onConfirm) {
    this.elements.confirmMessage.textContent = message;
    this.elements.confirmModal.style.display = 'flex';
    
    const confirmHandler = () => {
      this.elements.confirmModal.style.display = 'none';
      this.elements.confirmYes.removeEventListener('click', confirmHandler);
      onConfirm();
    };
    
    this.elements.confirmYes.addEventListener('click', confirmHandler);
  },

  closeConfirmModal() {
    this.elements.confirmModal.style.display = 'none';
  },

  openEditModal(key) {
    State.setEditing(key);
    const item = State.getEditingItem();
    
    if (!item) return;

    this.elements.editKey.value = item.key;
    this.elements.editValue.value = item.value || '';
    this.elements.markReviewed.checked = item.reviewed || false;
    
    if (item.issues && item.issues.length > 0) {
      this.elements.editIssues.innerHTML = `
        <div class="edit-issues-list">
          ${item.issues.map(i => `<span class="issue-badge ${i.type}">⚠️ ${i.message}</span>`).join('')}
        </div>
      `;
      this.elements.editIssues.style.display = 'block';
    } else {
      this.elements.editIssues.style.display = 'none';
    }
    
    this.elements.editModal.style.display = 'flex';
    this.elements.editValue.focus();
  },

  closeEditModal() {
    State.clearEditing();
    this.elements.editModal.style.display = 'none';
  },

  showToast(message, type = 'success') {
    const toast = this.elements.toast;
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  },

  switchTab(tabName) {
    this.elements.tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    this.elements.projectsTab.classList.toggle('active', tabName === 'projects');
    this.elements.editorTab.classList.toggle('active', tabName === 'editor');
    this.elements.reviewTab.classList.toggle('active', tabName === 'review');
    this.elements.compareTab.classList.toggle('active', tabName === 'compare');
  },

  escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
  }
};
