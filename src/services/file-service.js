const fs = require('fs');
const path = require('path');
const projectService = require('./project-service');

const BACKUP_PATH = path.resolve(__dirname, '../backups');
const REVIEW_PATH = path.resolve(__dirname, '../review-data');

let currentProjectId = null;

const REVIEW_ISSUES = {
  EMPTY: 'empty',
  TOO_LONG: 'too_long',
  MISSING_LOCALE: 'missing_locale',
  UNTRANSLATED: 'untranslated',
  SPECIAL_CHARS: 'special_chars',
  PLACEHOLDER_MISMATCH: 'placeholder_mismatch'
};

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function ensureBackupDir(projectId) {
  const backupDir = projectId ? path.join(BACKUP_PATH, projectId) : BACKUP_PATH;
  ensureDir(backupDir);
  return backupDir;
}

function ensureReviewDir(projectId) {
  const reviewDir = projectId ? path.join(REVIEW_PATH, projectId) : REVIEW_PATH;
  ensureDir(reviewDir);
  return reviewDir;
}

function setCurrentProject(projectId) {
  const project = projectService.getProject(projectId);
  if (!project) {
    throw new Error(`Projeto não encontrado: ${projectId}`);
  }
  currentProjectId = projectId;
  return project;
}

function getCurrentProject() {
  if (!currentProjectId) {
    return null;
  }
  return projectService.getProject(currentProjectId);
}

function getCurrentProjectId() {
  return currentProjectId;
}

function getI18nPath() {
  const project = getCurrentProject();
  return project?.sourcePath || null;
}

function getAvailableLocales() {
  const project = getCurrentProject();
  
  if (!project || !project.sourcePath) {
    return [];
  }
  
  if (!fs.existsSync(project.sourcePath)) {
    return [];
  }
  
  const files = fs.readdirSync(project.sourcePath).filter(f => f.endsWith('.json'));
  
  return files.map(f => {
    const code = f.replace('.json', '');
    return {
      code,
      name: projectService.getLocaleName(code),
      file: f,
      exists: true
    };
  });
}

function loadTranslations(locale) {
  const project = getCurrentProject();
  
  if (!project || !project.sourcePath) {
    throw new Error('Nenhum projeto selecionado');
  }
  
  const fileName = `${locale}.json`;
  const filePath = path.join(project.sourcePath, fileName);
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`Arquivo não encontrado: ${fileName}`);
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);
  
  const reviewStatus = getReviewStatus(locale);
  const baseLocale = detectBaseLocale(project);
  
  const entries = Object.entries(data).map(([key, value]) => ({
    key,
    value,
    reviewed: reviewStatus.reviewed.includes(key),
    issues: detectIssues(key, value, locale, baseLocale, project)
  }));
  
  return {
    locale,
    name: projectService.getLocaleName(locale),
    count: entries.length,
    entries,
    reviewProgress: {
      total: entries.length,
      reviewed: reviewStatus.reviewed.length,
      withIssues: entries.filter(e => e.issues.length > 0).length
    }
  };
}

function detectBaseLocale(project) {
  if (!project.sourcePath) return null;
  
  const preferredOrder = ['pt', 'en', 'es', 'ru', 'fr', 'de'];
  
  for (const locale of preferredOrder) {
    const filePath = path.join(project.sourcePath, `${locale}.json`);
    if (fs.existsSync(filePath)) {
      return locale;
    }
  }
  
  const files = fs.readdirSync(project.sourcePath).filter(f => f.endsWith('.json'));
  return files.length > 0 ? files[0].replace('.json', '') : null;
}

function loadLocaleData(locale) {
  const project = getCurrentProject();
  
  if (!project || !project.sourcePath) return {};
  
  try {
    const filePath = path.join(project.sourcePath, `${locale}.json`);
    if (!fs.existsSync(filePath)) return {};
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return {};
  }
}

function detectIssues(key, value, locale, baseLocale, project) {
  const issues = [];
  
  if (!value || String(value).trim() === '') {
    issues.push({ type: REVIEW_ISSUES.EMPTY, message: 'Valor vazio' });
  }
  
  if (value && String(value).length > 500) {
    issues.push({ type: REVIEW_ISSUES.TOO_LONG, message: `Texto muito longo (${String(value).length} caracteres)` });
  }
  
  if (value && baseLocale && locale !== baseLocale) {
    const baseData = loadLocaleData(baseLocale);
    const baseValue = baseData[key];
    if (baseValue && value === baseValue) {
      issues.push({ type: REVIEW_ISSUES.UNTRANSLATED, message: `Possivelmente não traduzido (igual ao ${baseLocale.toUpperCase()})` });
    }
  }
  
  if (value && baseLocale) {
    const baseData = loadLocaleData(baseLocale);
    const baseValue = baseData[key];
    if (baseValue) {
      const placeholders = String(value).match(/\{\{[^}]+\}\}|\{[^}]+\}/g) || [];
      const basePlaceholders = String(baseValue).match(/\{\{[^}]+\}\}|\{[^}]+\}/g) || [];
      if (placeholders.length !== basePlaceholders.length) {
        issues.push({ type: REVIEW_ISSUES.PLACEHOLDER_MISMATCH, message: 'Placeholders diferentes do original' });
      }
    }
  }
  
  return issues;
}

function updateTranslation(locale, key, newValue) {
  const project = getCurrentProject();
  
  if (!project || !project.sourcePath) {
    throw new Error('Nenhum projeto selecionado');
  }
  
  const fileName = `${locale}.json`;
  const filePath = path.join(project.sourcePath, fileName);
  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);

  if (!(key in data)) {
    throw new Error(`Key "${key}" not found in ${locale}`);
  }

  const oldValue = data[key];
  data[key] = newValue;

  createBackup(locale);
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');

  return { 
    success: true, 
    key, 
    oldValue, 
    newValue,
    locale 
  };
}

function createBackup(locale) {
  const project = getCurrentProject();
  const backupDir = ensureBackupDir(currentProjectId);
  
  if (!project || !project.sourcePath) return null;
  
  const fileName = `${locale}.json`;
  const sourcePath = path.join(project.sourcePath, fileName);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = `${locale}_${timestamp}.json`;
  const backupPath = path.join(backupDir, backupFile);
  
  fs.copyFileSync(sourcePath, backupPath);
  
  return backupPath;
}

function exportTranslations(locale) {
  const project = getCurrentProject();
  
  if (!project || !project.sourcePath) {
    throw new Error('Nenhum projeto selecionado');
  }
  
  const fileName = `${locale}.json`;
  return path.join(project.sourcePath, fileName);
}

function compareLocales() {
  const project = getCurrentProject();
  
  if (!project || !project.sourcePath) {
    return { totalKeys: 0, locales: [], entries: [] };
  }
  
  const allKeys = new Set();
  const localeData = {};
  const locales = getAvailableLocales();

  locales.forEach(localeInfo => {
    const filePath = path.join(project.sourcePath, localeInfo.file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      localeData[localeInfo.code] = data;
      Object.keys(data).forEach(key => allKeys.add(key));
    }
  });

  const comparison = [];
  allKeys.forEach(key => {
    const entry = { key, values: {} };
    locales.forEach(localeInfo => {
      entry.values[localeInfo.code] = localeData[localeInfo.code]?.[key] || null;
    });
    
    const hasAllLocales = Object.values(entry.values).every(v => v !== null);
    if (!hasAllLocales) {
      entry.missing = Object.entries(entry.values)
        .filter(([, v]) => v === null)
        .map(([k]) => k);
    }
    
    comparison.push(entry);
  });

  return {
    totalKeys: allKeys.size,
    locales: locales.map(l => l.code),
    entries: comparison
  };
}

function getTranslationStats() {
  const project = getCurrentProject();
  
  if (!project || !project.sourcePath) {
    return { locales: [], totalKeys: 0 };
  }
  
  const stats = {
    locales: [],
    totalKeys: 0
  };
  
  const allKeys = new Set();
  const locales = getAvailableLocales();
  
  locales.forEach(localeInfo => {
    const filePath = path.join(project.sourcePath, localeInfo.file);
    if (!fs.existsSync(filePath)) {
      stats.locales.push({ code: localeInfo.code, name: localeInfo.name, exists: false, count: 0, completion: 0 });
      return;
    }
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const entries = Object.entries(data);
    entries.forEach(([k]) => allKeys.add(k));
    
    const emptyCount = entries.filter(([, v]) => !v || String(v).trim() === '').length;
    const completion = Math.round(((entries.length - emptyCount) / entries.length) * 100) || 0;
    
    stats.locales.push({
      code: localeInfo.code,
      name: localeInfo.name,
      exists: true,
      count: entries.length,
      emptyCount,
      completion
    });
  });
  
  stats.totalKeys = allKeys.size;
  return stats;
}

function getReviewIssues() {
  const issues = [];
  const locales = getAvailableLocales();
  
  locales.forEach(localeInfo => {
    try {
      const data = loadTranslations(localeInfo.code);
      data.entries.forEach(entry => {
        if (entry.issues && entry.issues.length > 0) {
          issues.push({
            locale: localeInfo.code,
            key: entry.key,
            value: entry.value,
            issues: entry.issues
          });
        }
      });
    } catch {
    }
  });
  
  return { total: issues.length, issues };
}

function getReviewStatus(locale) {
  const reviewDir = ensureReviewDir(currentProjectId);
  const statusFile = path.join(reviewDir, `${locale}-review.json`);
  
  if (!fs.existsSync(statusFile)) {
    return { reviewed: [], lastUpdate: null };
  }
  
  try {
    return JSON.parse(fs.readFileSync(statusFile, 'utf8'));
  } catch {
    return { reviewed: [], lastUpdate: null };
  }
}

function markAsReviewed(locale, keys) {
  const reviewDir = ensureReviewDir(currentProjectId);
  const statusFile = path.join(reviewDir, `${locale}-review.json`);
  
  let status = getReviewStatus(locale);
  const keysArray = Array.isArray(keys) ? keys : [keys];
  
  keysArray.forEach(key => {
    if (!status.reviewed.includes(key)) {
      status.reviewed.push(key);
    }
  });
  
  status.lastUpdate = new Date().toISOString();
  fs.writeFileSync(statusFile, JSON.stringify(status, null, 2), 'utf8');
  
  return { success: true, reviewed: status.reviewed.length };
}

function bulkUpdateTranslations(locale, translations) {
  const project = getCurrentProject();
  
  if (!project || !project.sourcePath) {
    throw new Error('Nenhum projeto selecionado');
  }
  
  const fileName = `${locale}.json`;
  const filePath = path.join(project.sourcePath, fileName);
  
  const content = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(content);
  
  createBackup(locale);
  
  let updated = 0;
  translations.forEach(({ key, value }) => {
    if (key in data) {
      data[key] = value;
      updated++;
    }
  });
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  
  return { success: true, updated };
}

function getStats() {
  const locales = getAvailableLocales();
  const stats = {};
  let totalKeys = 0;
  
  locales.forEach(locale => {
    if (locale.exists) {
      const data = loadTranslations(locale.code);
      stats[locale.code] = {
        total: data.entries.length,
        reviewed: data.reviewProgress?.reviewed || 0,
        withIssues: data.entries.filter(e => e.issues && e.issues.length > 0).length
      };
      if (data.entries.length > totalKeys) {
        totalKeys = data.entries.length;
      }
    }
  });
  
  return {
    locales: stats,
    totalKeys,
    localeCount: locales.filter(l => l.exists).length
  };
}

module.exports = {
  setCurrentProject,
  getCurrentProject,
  getCurrentProjectId,
  getI18nPath,
  getAvailableLocales,
  loadTranslations,
  updateTranslation,
  exportTranslations,
  compareLocales,
  getTranslationStats,
  getReviewIssues,
  getReviewStatus,
  markAsReviewed,
  bulkUpdateTranslations,
  getStats
};
