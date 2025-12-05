# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2025-12-04

### Added
- Tela de carregamento global para operações assíncronas
- Overlay com blur e spinner durante "Abrindo projeto...", "Atualizando projeto..." e "Enviando arquivos..."

### Changed
- Seletor de origem de arquivos redesenhado com cards visuais interativos
- Lista de traduções refatorada de cards para tabela
- Tabela com colunas: Status, Chave, Valor, Ações
- Indicadores de status visuais (✓ revisado, ! problemas, ○ pendente)
- Header da tabela fixo durante scroll
- Botões de ação em formato de ícone compacto

## [2.0.0] - 2025-12-04

### Added
- Sistema de gerenciamento de projetos de tradução
- Suporte para múltiplos projetos com persistência
- Dois modos de fonte de arquivos: diretório local ou upload
- Auto-detecção de idiomas a partir dos arquivos no diretório
- Modais para criação de projeto, upload de arquivos e confirmação
- Estatísticas por projeto (total de chaves, idiomas)
- Serviço dedicado para gerenciamento de projetos (`project-service.js`)
- Armazenamento de projetos em `data/projects.json`
- Upload de arquivos por projeto em `data/uploads/<project-id>/`

### Changed
- Arquitetura refatorada para ser orientada a projetos
- Fluxo de trabalho agora inicia com seleção/criação de projeto
- Interface genérica, removidas referências específicas ao JactoConnect
- Abas de Editor, Revisão e Comparação agora dependem de projeto ativo
- Auto-detecção de locales substituiu lista hardcoded

### Removed
- Carregamento direto de diretório sem projeto
- Dependência de estrutura específica do JactoConnect

## [1.1.0] - 2025-12-04

### Added
- Sistema de upload de arquivos JSON de tradução
- Funcionalidade de revisão com marcação de itens revisados
- Detecção automática de problemas (vazios, não traduzidos, placeholders)
- Filtros por status: todos, com problemas, revisados, não revisados
- Aba de comparação entre idiomas
- Aba de revisão com lista de problemas consolidada
- Barra de progresso de revisão
- Exportação de traduções

### Changed
- Interface reorganizada em abas funcionais
- Melhorias visuais nos cards de tradução

## [1.0.0] - 2025-12-04

### Added
- Editor de traduções i18n básico
- Suporte para múltiplos idiomas
- Busca por chave e valor
- Paginação de resultados
- Modal de edição de traduções
- Notificações toast
