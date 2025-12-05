const express = require('express');
const path = require('path');
const multer = require('multer');
const fileService = require('./services/file-service');
const projectService = require('./services/project-service');

const app = express();
const PORT = process.env.PORT || 3333;

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/projects', (req, res) => {
  try {
    const projects = projectService.getProjects();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/projects/:id', (req, res) => {
  try {
    const project = projectService.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projects', (req, res) => {
  try {
    const project = projectService.createProject(req.body);
    res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/projects/:id', (req, res) => {
  try {
    const project = projectService.updateProject(req.params.id, req.body);
    res.json(project);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/projects/:id', (req, res) => {
  try {
    const result = projectService.deleteProject(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/projects/:id/select', (req, res) => {
  try {
    const project = fileService.setCurrentProject(req.params.id);
    res.json(project);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/projects/:id/activate', (req, res) => {
  try {
    const project = fileService.setCurrentProject(req.params.id);
    const locales = fileService.getAvailableLocales();
    const stats = fileService.getStats();
    res.json({ 
      project, 
      locales,
      stats
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/projects/:id/refresh', (req, res) => {
  try {
    const project = projectService.refreshProject(req.params.id);
    res.json(project);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/projects/:id/upload', upload.array('files', 10), (req, res) => {
  try {
    const results = projectService.processUploadedFiles(req.params.id, req.files);
    res.json(results);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/current-project', (req, res) => {
  try {
    const project = fileService.getCurrentProject();
    res.json(project || { selected: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/locales', (req, res) => {
  try {
    const locales = fileService.getAvailableLocales();
    res.json(locales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/translations/:locale', (req, res) => {
  try {
    const translations = fileService.loadTranslations(req.params.locale);
    res.json(translations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/translations/:locale', (req, res) => {
  try {
    const { key, value } = req.body;
    const result = fileService.updateTranslation(req.params.locale, key, value);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/translations/:locale/bulk', (req, res) => {
  try {
    const { translations } = req.body;
    const result = fileService.bulkUpdateTranslations(req.params.locale, translations);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/export/:locale', (req, res) => {
  try {
    const filePath = fileService.exportTranslations(req.params.locale);
    res.json({ success: true, path: filePath });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/compare', (req, res) => {
  try {
    const comparison = fileService.compareLocales();
    res.json(comparison);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stats', (req, res) => {
  try {
    const stats = fileService.getTranslationStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/review/issues', (req, res) => {
  try {
    const issues = fileService.getReviewIssues();
    res.json(issues);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/review/:locale/mark', (req, res) => {
  try {
    const { keys } = req.body;
    const result = fileService.markAsReviewed(req.params.locale, keys);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/review/:locale/status', (req, res) => {
  try {
    const status = fileService.getReviewStatus(req.params.locale);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n🌐 i18n Editor running at http://localhost:${PORT}`);
  console.log('📁 Ready to manage translation projects\n');
});
