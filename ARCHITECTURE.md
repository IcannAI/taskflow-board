# TaskFlow — Architecture

## Audience

This document is for **contributors who will read, write, or review code**.
It covers internal structure, component contracts, state schema, and known technical debt.

For a high-level overview intended for non-contributors, see
[README.md → System Architecture](./README.md#️-system-architecture).

---

## Quick Reference

| Topic | Location |
|:---|:---|
| Live Demo | [taskflow-board-six.vercel.app](https://taskflow-board-six.vercel.app) |
| High-level architecture diagram | [README.md → System Architecture](./README.md#️-system-architecture) |
| Tech stack rationale | [README.md → Tech Stack](./README.md#️-tech-stack) |
| Design decisions (summary) | [README.md → Design Decisions](./README.md#-design-decisions) |
| Formal ADRs | `docs/adr/` — planned, not yet created (see [ADR Index](#adr-index)) |
| Roadmap | [README.md → Roadmap](./README.md#️-roadmap) |
| Known issues | [README.md → Known Issues](./README.md#-known-issues) |

---

## Directory Structure

```
taskflow-board/
│
├── api/
│   └── gemini.ts                  # Vercel Edge Function
│                                  # Proxies requests to Gemini API
│                                  # API key lives here (server-side env var only)
│                                  # Runtime: edge (see API Proxy section)
│
├── components/
│   ├── kanban/
│   │   ├── KanbanBoard.tsx        # ⚠️ God component ~500 LOC — planned split in v0.2
│   │   │                          # Handles: drag-and-drop, modal state, AI integration,
│   │   │                          # task CRUD, multi-view rendering
│   │   └── TaskCard.tsx           # Task card UI — currently tightly coupled to KanbanBoard
│   │
│   ├── Dashboard.tsx              # Recharts pie + bar charts for task statistics
│   ├── Layout.tsx                 # Top navigation bar, sidebar, keyboard shortcut listeners
│   └── ui/
│       └── CommandPalette.tsx     # ⌘K overlay — Fuse.js fuzzy search + command dispatch
│
├── fixtures/
│   └── mockData.ts                # Development seed data (Task[])
│                                  # Gated by import.meta.env.DEV
│                                  # Tree-shaken from production builds
│
├── services/
│   └── geminiService.ts           # Calls POST /api/gemini
│                                  # Holds no API key — proxy handles auth
│                                  # Falls back to mock AIPlanningResult on any error
│
├── store/
│   └── useTaskStore.ts            # Zustand store + persist middleware
│                                  # Only tasks[] is written to localStorage
│                                  # See: State Management section
│
├── lib/
│   └── utils.ts                   # cn() = clsx + tailwind-merge
│                                  # Single utility — keeps className logic consistent
│
├── types.ts                       # All shared TypeScript types and interfaces
│                                  # Single source of truth — never duplicate types elsewhere
│
├── App.tsx                        # Global coordinator
│                                  # Manages view state and modal ref wiring
│                                  # ⚠️ Tech debt: useRef passes openModal across siblings
│
├── index.tsx                      # React 19 entry point (createRoot)
├── index.css                      # Tailwind base + custom CSS variables
│
├── .github/
│   └── workflows/
│       └── ci.yml                 # GitHub Actions: npm ci → tsc → build → audit
│
├── .env.example                   # Committed template — placeholder values only
├── .env                           # Local secrets — gitignored, never committed
├── vite.config.ts                 # Vite config — no define block (key removed)
└── tsconfig.json                  # Strict mode enabled
```

---

## Component Props Reference

### `<KanbanBoard />`

```ts
interface KanbanBoardProps {
  openModalRef: React.MutableRefObject<((taskId?: string) => void) | null>
  // Receives a ref from App.tsx
  // KanbanBoard assigns its internal openModal() to this ref on mount
  // Allows Layout and CommandPalette to trigger modal from outside KanbanBoard
  //
  // ⚠️ Tech debt (App.tsx:31-33, 57, 74)
  // This pattern breaks if KanbanBoard unmounts
  // Fix in v0.2: move modalOpen + openModal into useTaskStore
}
```

**Internal state (not yet extracted to store):**

```ts
// Inside KanbanBoard — planned migration to useTaskStore in v0.2
const [modalOpen, setModalOpen] = useState(false)
const [editingTask, setEditingTask] = useState<Task | null>(null)
const [aiResult, setAiResult] = useState<AIPlanningResult | null>(null)
const [currentView, setCurrentView] = useState<'kanban' | 'list'>('kanban')
```

---

### `<TaskCard />`

```ts
// ⚠️ No isolated interface yet — currently inlined inside KanbanBoard column render
// Planned extraction in v0.2 as a standalone component with explicit props:

// Anticipated interface after v0.2 refactor:
interface TaskCardProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onDragStart: (e: React.DragEvent, taskId: string) => void
}
```

---

### `<CommandPalette />`

```ts
interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onOpenModal: (() => void) | null
  // Receives openModal via ref from App.tsx
  // Same coupling issue as KanbanBoard — resolved together in v0.2
}
```

---

### `<Layout />`

```ts
interface LayoutProps {
  children: React.ReactNode
  onOpenModal: (() => void) | null
  currentView: string
  onViewChange: (view: string) => void
}
```

---

### `<Dashboard />`

```ts
// No external props — reads directly from useTaskStore
// Derives all chart data from tasks[] via selector
const tasks = useTaskStore(state => state.tasks)
```

---

## State Management

### Zustand Store — Full Schema

```ts
// store/useTaskStore.ts

interface TaskState {
  // ── Persisted to localStorage ──────────────────────────────
  tasks: Task[]                  // source of truth for all task data

  // ── Actions ────────────────────────────────────────────────
  addTask: (task: Task) => void
  updateTaskStatus: (id: string, status: TaskStatus) => void
  deleteTask: (id: string) => void
  updateTaskGitInfo: (
    id: string,
    commits: number,
    lastMsg: string
  ) => void
}
```

### Persistence Behaviour

```ts
persist(
  (set) => ({ ... }),
  {
    name: 'taskflow-storage',       // localStorage key
    partialize: (state) => ({
      tasks: state.tasks,           // only tasks[] is written to disk
    }),
    // UI state must never be added to partialize
    // (would cause stale modal states on page load)
  }
)
```

| Scenario | Behaviour |
|:---|:---|
| First load, empty storage | Initialises from `fixtures/mockData.ts` (DEV only) |
| First load, production | Initialises with `[]` — no mock data |
| Page refresh with existing data | Rehydrates `tasks` from `taskflow-storage` key |
| `addTask` / `deleteTask` | Zustand auto-syncs to localStorage via persist middleware |

### Planned v0.2 Store Additions

```ts
// To be added when openModal is migrated from useRef to store:
modalOpen: boolean
editingTaskId: string | null
openModal: (taskId?: string) => void
closeModal: () => void

// partialize update — these must NOT be persisted:
partialize: (state) => ({ tasks: state.tasks })
// modalOpen, editingTaskId stay excluded
```

---

## API Proxy

### Overview

```
Browser (geminiService.ts)
  │
  │  POST /api/gemini
  │  Body: Gemini-format JSON
  │  No Authorization header
  ▼
Vercel Edge Function (api/gemini.ts)
  │
  │  Injects x-goog-api-key from process.env.GEMINI_API_KEY
  │  Forwards body unchanged
  ▼
Google Gemini API
  │
  │  Returns candidates[] JSON
  ▼
Edge Function passes response to browser
```

### Request Format

```http
POST /api/gemini
Content-Type: application/json

{
  "contents": [
    {
      "parts": [
        {
          "text": "Act as a senior engineering lead. I have a task: \"...\". \nBreak this down into 3-5 technical subtasks..."
        }
      ]
    }
  ]
}
```

### Response Format

```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "{ \"subtasks\": [...], \"branchNameSuggestion\": \"feat/...\", \"estimatedHours\": 4 }"
          }
        ]
      }
    }
  ]
}
```

### Parsed Result (`AIPlanningResult`)

```ts
interface AIPlanningResult {
  subtasks: string[]              // 3–5 technical subtasks
  branchNameSuggestion: string    // e.g. "feat/implement-auth-middleware"
  estimatedHours: number          // e.g. 4
}
```

### Error Handling

| Scenario | Edge Function Response | Client Behaviour |
|:---|:---|:---|
| Missing `GEMINI_API_KEY` | `500 { error: 'API key not configured' }` | Falls back to mock result |
| Non-POST method | `405 { error: 'Method not allowed' }` | Shows error state |
| Gemini API failure | `500 { error: 'Proxy request failed' }` | Falls back to mock result |
| Network timeout | Edge timeout (default 30s) | Falls back to mock result |

### Edge Runtime Config

```ts
// api/gemini.ts — required for req.json() and new Response() Web APIs
export const config = {
  runtime: 'edge',
}
```

> Without this config, the function runs on Node.js runtime where
> `req.json()` does not exist, causing a 504 timeout.

---

## Environment Variables

| Variable | Required | Used In | Description |
|:---|:---|:---|:---|
| `GEMINI_API_KEY` | No | `api/gemini.ts` (server only) | Google Gemini API key |

### Rules

```
✅ Store in:   .env (local)  +  Vercel Dashboard (deployed)
❌ Never in:   any .ts / .tsx file
❌ Never in:   vite.config.ts define block (bakes into JS bundle)
❌ Never in:   .env.example (use placeholder: your_api_key_here)
❌ Never in:   git history
```

### Local Development

```bash
# Option A — with Edge Function (recommended)
cp .env.example .env
# fill in GEMINI_API_KEY
npx vercel dev          # injects .env into /api/gemini at runtime

# Option B — frontend only
npm run dev             # AI features use fallback mock data
```

### Vercel Deployment

```
Vercel Dashboard
→ Project → Settings → Environment Variables
→ Key:   GEMINI_API_KEY
→ Value: AIza...
→ Environments: ✅ Production  ✅ Preview  ✅ Development
```

---

## Known Technical Debt

| ID | File | Location | Issue | Severity | Fix Version |
|:---|:---|:---|:---|:---|:---|
| TD-01 | `App.tsx` | Lines 31–33, 57, 74 | `useRef` passes `openModal()` across sibling components — breaks if KanbanBoard unmounts | 🟡 Medium | v0.2 |
| TD-02 | `components/kanban/KanbanBoard.tsx` | Entire file (~500 LOC) | God component — handles drag-and-drop, modal, AI, CRUD, and multi-view rendering in one file | 🟡 Medium | v0.2 |
| TD-03 | `components/kanban/TaskCard.tsx` | Line 6 | Imports `ASSIGNEE_COLORS` from `KanbanBoard` — wrong direction of dependency | 🟡 Medium | v0.2 |
| TD-04 | `fixtures/mockData.ts` | Line 3+ | `new Date()` called at import time — produces non-deterministic timestamps, causes hydration instability | 🟢 Low | v0.2 |
| TD-05 | `types.ts` | `CommandType` enum | TypeScript `enum` prevents tree-shaking — replace with `as const` object | 🟢 Low | v0.2 |
| TD-06 | `types.ts` | `User` interface | Defined but never used in codebase — dead type | 🟢 Low | v0.4 (when backend is added) |
| TD-07 | `store/useTaskStore.ts` | All | Zero test coverage — no unit tests for any store actions | 🟡 Medium | v0.3 |
| TD-08 | Project root | — | No test runner configured — `npm test` has no script | 🟡 Medium | v0.3 |

---

## ADR Index

> Formal ADR files are planned under `docs/adr/` (directory not yet created).
> The table below serves as a placeholder until individual ADR documents are written.

| ID | Decision | Status | Notes |
|:---|:---|:---|:---|
| ADR-001 | Use Zustand over Redux or Jotai | Accepted | Zero boilerplate; persist middleware built-in |
| ADR-002 | Use Vercel Edge Function over Cloudflare Worker | Accepted | Same repo, zero-config deployment |
| ADR-003 | Use localStorage over IndexedDB for persistence | Accepted | Sufficient for MVP; under 20-line change |
| ADR-004 | Use Fuse.js over Algolia or backend search | Accepted | No backend required; 24kb bundle |
| ADR-005 | Use Tailwind CSS + `cn()` over CSS Modules | Accepted | Compatible with shadcn/ui ecosystem |
| ADR-006 | Defer backend (Hono + Turso) to v0.4 | Accepted | Frontend prototype validates UX before investing in infra |
| ADR-007 | Use `partialize` to exclude UI state from persistence | Accepted | Prevents stale modal state on page load |