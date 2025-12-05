# i18n Editor

Editor visual para gerenciamento e revisão de arquivos de tradução i18n.

## Instalação

```bash
cd i18n-editor
npm install
```

## Uso

```bash
npm start
```

Acesse: http://localhost:3333

## Funcionalidades

### 📂 Carregamento de Arquivos
- **Diretório Padrão**: Carrega arquivos automaticamente
- **Diretório Personalizado**: Especifique qualquer diretório contendo arquivos JSON de tradução
- **Upload de Arquivos**: Faça upload de arquivos JSON para revisão temporária (drag & drop suportado)
- **Estatísticas**: Visualize métricas de completude por idioma

### ✏️ Editor de Traduções
- Seleção de idioma (PT, EN, ES, RU + idiomas personalizados)
- Busca por chave ou valor
- Paginação (50 itens por página)
- Edição de valores (chaves são read-only)
- Salvamento direto nos arquivos JSON
- **Filtros avançados**: Todas, Com Problemas, Vazias, Pendentes, Revisadas

### 🔍 Modo de Revisão
- **Detecção automática de problemas**:
  - Traduções vazias
  - Textos muito longos (>500 caracteres)
  - Traduções possivelmente não traduzidas (iguais ao PT)
  - Placeholders incompatíveis com o original
- **Marcação de revisão**: Marque traduções como revisadas
- **Barra de progresso**: Acompanhe o progresso da revisão
- **Navegação rápida**: Clique em um problema para ir diretamente à tradução

### ⚖️ Comparação de Idiomas
- Visualização lado a lado de todos os idiomas
- Filtro para chaves faltantes
- Identificação visual de traduções ausentes

## Estrutura

```
i18n-editor/
├── package.json
├── README.md
├── backups/           # Backups automáticos antes de cada edição
├── review-data/       # Dados de progresso de revisão
├── uploads/           # Arquivos carregados via upload
└── src/
    ├── server.js      # Servidor Express
    ├── services/
    │   └── file-service.js  # Serviço de manipulação de arquivos
    └── public/
        ├── index.html
        ├── css/
        │   └── styles.css
        └── js/
            ├── api.js     # Cliente API
            ├── state.js   # Gerenciamento de estado
            ├── ui.js      # Manipulação da UI
            └── app.js     # Lógica principal
```

## API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/locales` | Lista idiomas disponíveis |
| GET | `/api/translations/:locale` | Carrega traduções de um idioma |
| PUT | `/api/translations/:locale` | Atualiza uma tradução |
| POST | `/api/translations/:locale/bulk` | Atualiza múltiplas traduções |
| POST | `/api/export/:locale` | Exporta arquivo JSON |
| GET | `/api/compare` | Compara todos os idiomas |
| GET | `/api/config` | Retorna configuração atual |
| POST | `/api/config/path` | Define diretório de arquivos |
| POST | `/api/upload` | Upload de arquivos JSON |
| GET | `/api/stats` | Estatísticas dos arquivos |
| GET | `/api/review/issues` | Lista problemas detectados |
| POST | `/api/review/:locale/mark` | Marca traduções como revisadas |
| GET | `/api/review/:locale/status` | Status de revisão de um idioma |

## Backup

Backups são criados automaticamente em `backups/` antes de cada edição.

## Workflow de Revisão

1. **Carregar**: Acesse a aba "Carregar" e selecione o diretório ou faça upload dos arquivos
2. **Analisar**: Vá para "Revisão" para ver todos os problemas detectados automaticamente
3. **Corrigir**: Clique em "Corrigir" para ir diretamente à tradução problemática
4. **Revisar**: Edite a tradução e marque como revisada
5. **Acompanhar**: A barra de progresso mostra o andamento da revisão
