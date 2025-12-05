# TickTask - AI Coding Guidelines

## Architecture Overview
TickTask is an Electron desktop app for task management with time tracking. It uses a **main process** (Node.js) for database operations and Notion sync, and a **renderer process** (React) for the UI.

- **Main Process** (`src/main/`): Handles SQLite database, Notion API integration, IPC handlers, window management
- **Renderer Process** (`src/renderer/src/`): React app with components, pages, hooks, and Zustand stores
- **Shared Types** (`src/shared/types.ts`): TypeScript interfaces for Task, TimeEntry, etc.
- **Data Flow**: Local SQLite ↔ Optional Notion sync via IPC communication

## Key Patterns & Conventions

### State Management
- Use **Zustand stores** for global state (e.g., `src/renderer/src/stores/timerStore.ts`)
- Use **React hooks** for component logic (e.g., `src/renderer/src/hooks/useTasks.ts`)
- Avoid prop drilling; prefer stores for cross-component state

### IPC Communication
- Main process exposes handlers via `ipcMain.handle()` (e.g., `'task:create'`, `'task:start'`)
- Renderer calls via `window.api` (typed in `src/renderer/src/env.d.ts`)
- Auto-sync to Notion happens in background on task changes

### Component Structure
- **shadcn/ui components** in `src/renderer/src/components/ui/`
- Custom components in `src/renderer/src/components/` (e.g., `TaskCard.tsx`)
- Pages in `src/renderer/src/pages/` with React Router navigation

### Database & Sync
- SQLite via `better-sqlite3` in `src/main/database.ts`
- Notion integration in `src/main/notion.ts` (optional, user-configured)
- Tasks have status (`inbox`, `executando`, etc.) and category (`urgente`, `normal`)

### Timer Functionality
- Active timer managed by `timerStore` with 1-second intervals
- Floating window (`FloatTimerPage`) shows when main window minimized
- Time leak notifications for `time_leak` category tasks after 1 hour

## Development Workflows

### Building & Running
- `npm run dev`: Start development with hot reload
- `npm run build`: Build for production
- `npm run build:linux`: Package for Linux (AppImage + .deb)
- Database initializes automatically in `app.getPath('userData')`

### Adding Features
1. Define types in `src/shared/types.ts`
2. Add IPC handler in `src/main/index.ts` if needed
3. Create/update components in `src/renderer/src/components/`
4. Use hooks/stores for state management
5. Test with `npm run dev`

### Notion Integration
- Configure via Settings page (API key + auto-sync)
- Database "GTD APP" created automatically with required properties
- Sync triggers on task CRUD operations if enabled

## Common Patterns
- **Error Handling**: Use try/catch in IPC handlers; show notifications via `window.api.showNotification()`
- **Async Operations**: IPC calls are async; use `await` in renderer
- **Event Communication**: Use `eventEmitter` in `App.tsx` for component-to-component events
- **Styling**: Tailwind CSS classes; shadcn components for consistency

Reference: `README.md`, `package.json`, `src/main/index.ts`, `src/renderer/src/App.tsx`

## CONSTRAINTS ABSOLUTELY
- Focus on SOLID principles.
- Focus on simple and understandable code.
- Only modify what is necessary.
- Use inline comments only for critical changes.
- Do not include explanations before/after the code.
