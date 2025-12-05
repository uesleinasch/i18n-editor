const fs = require('fs');
const path = require('path');

const DATA_PATH = path.resolve(__dirname, '../data');
const PROJECTS_FILE = path.join(DATA_PATH, 'projects.json');
const UPLOADS_PATH = path.resolve(__dirname, '../uploads');

function ensureDataDir() {
  if (!fs.existsSync(DATA_PATH)) {
    fs.mkdirSync(DATA_PATH, { recursive: true });
  }
}

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_PATH)) {
    fs.mkdirSync(UPLOADS_PATH, { recursive: true });
  }
}

function loadProjects() {
  ensureDataDir();
  
  if (!fs.existsSync(PROJECTS_FILE)) {
    return [];
  }
  
  try {
    const content = fs.readFileSync(PROJECTS_FILE, 'utf8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

function saveProjects(projects) {
  ensureDataDir();
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf8');
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function getProjects() {
  return loadProjects();
}

function getProject(id) {
  const projects = loadProjects();
  return projects.find(p => p.id === id);
}

function createProject(data) {
  const projects = loadProjects();
  
  const project = {
    id: generateId(),
    name: data.name,
    description: data.description || '',
    sourceType: data.sourceType,
    sourcePath: data.sourcePath || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    locales: [],
    stats: {}
  };
  
  if (project.sourceType === 'upload') {
    ensureUploadsDir();
    project.sourcePath = path.join(UPLOADS_PATH, project.id);
    fs.mkdirSync(project.sourcePath, { recursive: true });
  }
  
  if (project.sourcePath && project.sourceType === 'directory') {
    const resolvedPath = path.resolve(project.sourcePath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Diretório não encontrado: ${resolvedPath}`);
    }
    project.sourcePath = resolvedPath;
  }
  
  if (project.sourcePath && fs.existsSync(project.sourcePath)) {
    project.locales = detectLocales(project.sourcePath);
    project.stats = calculateProjectStats(project);
  }
  
  projects.push(project);
  saveProjects(projects);
  
  return project;
}

function updateProject(id, data) {
  const projects = loadProjects();
  const index = projects.findIndex(p => p.id === id);
  
  if (index === -1) {
    throw new Error(`Projeto não encontrado: ${id}`);
  }
  
  const project = projects[index];
  
  if (data.name !== undefined) project.name = data.name;
  if (data.description !== undefined) project.description = data.description;
  if (data.sourcePath !== undefined) {
    const resolvedPath = path.resolve(data.sourcePath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Diretório não encontrado: ${resolvedPath}`);
    }
    project.sourcePath = resolvedPath;
    project.sourceType = 'directory';
  }
  
  project.updatedAt = new Date().toISOString();
  
  if (project.sourcePath && fs.existsSync(project.sourcePath)) {
    project.locales = detectLocales(project.sourcePath);
    project.stats = calculateProjectStats(project);
  }
  
  projects[index] = project;
  saveProjects(projects);
  
  return project;
}

function deleteProject(id) {
  const projects = loadProjects();
  const project = projects.find(p => p.id === id);
  
  if (!project) {
    throw new Error(`Projeto não encontrado: ${id}`);
  }
  
  if (project.sourceType === 'upload' && project.sourcePath) {
    try {
      fs.rmSync(project.sourcePath, { recursive: true, force: true });
    } catch {
    }
  }
  
  const reviewPath = path.resolve(__dirname, '../review-data', id);
  if (fs.existsSync(reviewPath)) {
    try {
      fs.rmSync(reviewPath, { recursive: true, force: true });
    } catch {
    }
  }
  
  const filtered = projects.filter(p => p.id !== id);
  saveProjects(filtered);
  
  return { success: true };
}

function detectLocales(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));
  
  return files.map(f => {
    const code = f.replace('.json', '');
    const filePath = path.join(dirPath, f);
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    return {
      code,
      name: getLocaleName(code),
      file: f,
      keys: Object.keys(data).length
    };
  });
}

function getLocaleName(code) {
  const names = {
    pt: 'Português (Brasil)',
    en: 'English',
    es: 'Español',
    ru: 'Русский',
    fr: 'Français',
    de: 'Deutsch',
    it: 'Italiano',
    ja: '日本語',
    zh: '中文',
    ko: '한국어',
    ar: 'العربية',
    hi: 'हिन्दी'
  };
  return names[code.toLowerCase()] || code.toUpperCase();
}

function calculateProjectStats(project) {
  if (!project.sourcePath || !fs.existsSync(project.sourcePath)) {
    return { totalKeys: 0, locales: {} };
  }
  
  const allKeys = new Set();
  const localeStats = {};
  
  project.locales.forEach(locale => {
    const filePath = path.join(project.sourcePath, locale.file);
    if (!fs.existsSync(filePath)) return;
    
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    const entries = Object.entries(data);
    
    entries.forEach(([k]) => allKeys.add(k));
    
    const emptyCount = entries.filter(([, v]) => !v || String(v).trim() === '').length;
    const completion = Math.round(((entries.length - emptyCount) / entries.length) * 100) || 0;
    
    localeStats[locale.code] = {
      keys: entries.length,
      empty: emptyCount,
      completion
    };
  });
  
  return {
    totalKeys: allKeys.size,
    locales: localeStats
  };
}

function processUploadedFiles(projectId, files) {
  const project = getProject(projectId);
  
  if (!project) {
    throw new Error(`Projeto não encontrado: ${projectId}`);
  }
  
  if (project.sourceType !== 'upload') {
    throw new Error('Este projeto não aceita uploads');
  }
  
  ensureUploadsDir();
  
  if (!project.sourcePath) {
    project.sourcePath = path.join(UPLOADS_PATH, projectId);
  }
  
  if (!fs.existsSync(project.sourcePath)) {
    fs.mkdirSync(project.sourcePath, { recursive: true });
  }
  
  const results = [];
  
  files.forEach(file => {
    try {
      const content = file.buffer.toString('utf8');
      const data = JSON.parse(content);
      
      const destPath = path.join(project.sourcePath, file.originalname);
      fs.writeFileSync(destPath, JSON.stringify(data, null, 2), 'utf8');
      
      results.push({
        filename: file.originalname,
        success: true,
        keys: Object.keys(data).length
      });
    } catch (error) {
      results.push({
        filename: file.originalname,
        success: false,
        error: error.message
      });
    }
  });
  
  const projects = loadProjects();
  const index = projects.findIndex(p => p.id === projectId);
  if (index !== -1) {
    projects[index].locales = detectLocales(project.sourcePath);
    projects[index].stats = calculateProjectStats(projects[index]);
    projects[index].updatedAt = new Date().toISOString();
    saveProjects(projects);
  }
  
  return { results, project: getProject(projectId) };
}

function refreshProject(id) {
  const projects = loadProjects();
  const index = projects.findIndex(p => p.id === id);
  
  if (index === -1) {
    throw new Error(`Projeto não encontrado: ${id}`);
  }
  
  const project = projects[index];
  
  if (project.sourcePath && fs.existsSync(project.sourcePath)) {
    project.locales = detectLocales(project.sourcePath);
    project.stats = calculateProjectStats(project);
    project.updatedAt = new Date().toISOString();
    projects[index] = project;
    saveProjects(projects);
  }
  
  return project;
}

module.exports = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  processUploadedFiles,
  refreshProject,
  getLocaleName
};
