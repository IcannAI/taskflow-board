# Contributing to TaskFlow

This document covers how to set up your local environment, submit code, and understand the project's conventions and known constraints.

---

## System Requirements

| Tool | Version | Check |
|:---|:---|:---|
| Node.js | 20.x or above | `node --version` |
| npm | 10.x or above | `npm --version` |
| Git | 2.x or above | `git --version` |
| Vercel CLI | latest | `npx vercel --version` |

---

## Quick Start

```bash
# 1. Fork the repo, then clone your fork
git clone https://github.com/YOUR_USERNAME/taskflow-board.git
cd taskflow-board

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env and fill in GEMINI_API_KEY
# Get one at: https://aistudio.google.com → Get API Key

# 4. Start the development server (includes Edge Function)
npx vercel dev
# or frontend-only (AI features use fallback mock data)
npm run dev

# 5. Verify the build passes
npm run build

# 6. Run type checking
npx tsc --noEmit
```

---

## Project Structure

```
taskflow-board/
├── api/
│   └── gemini.ts              # Vercel Edge Function — Gemini API proxy
│                              # ⚠️ Never put API keys here; use Vercel env vars
│
├── components/
│   ├── kanban/
│   │   └── KanbanBoard.tsx    # ⚠️ Tech debt: ~500 LOC, planned split in v0.2:
│   │                          #   BoardHeader / Column / TaskCard
│   │                          #   TaskModal / AiAssistPanel
│   ├── Dashboard.tsx          # Recharts charts
│   ├── Layout.tsx             # Top nav, sidebar
│   └── ui/
│       └── CommandPalette.tsx # ⌘K search, powered by Fuse.js
│
├── fixtures/
│   └── mockData.ts            # Development mock data
│                              # Gated by import.meta.env.DEV — tree-shaken in production
│
├── services/
│   └── geminiService.ts       # Calls /api/gemini — holds no API key
│                              # Includes fallback mock (graceful degradation)
│
├── store/
│   └── useTaskStore.ts        # Zustand store + persist middleware
│                              # partialize: only tasks are persisted
│
├── lib/
│   └── utils.ts               # cn() = clsx + tailwind-merge
│
├── types.ts                   # Centralized type definitions (Task, TaskStatus, Priority...)
│
├── App.tsx                    # Global state coordinator
│                              # ⚠️ Tech debt: useRef passes openModal — fix in v0.2
├── index.tsx                  # React entry point
├── index.css                  # Tailwind base styles
│
├── .github/
│   └── workflows/
│       └── ci.yml             # GitHub Actions: tsc + build + audit
│
└── .env.example               # Environment variable template (committed with placeholder values)
```

---

## Conventional Commits

All commit messages must follow the [Conventional Commits](https://conventionalcommits.org) specification:

```
<type>(<scope>): <description>

[optional body]
[optional footer]
```

### Type Reference

| Type | When to use | Example |
|:---|:---|:---|
| `feat` | New feature | `feat(kanban): add task priority filter` |
| `fix` | Bug fix | `fix(store): persist middleware not saving on delete` |
| `docs` | Documentation changes | `docs: update Quick Start in README` |
| `refactor` | Code change with no behavior change | `refactor(kanban): extract TaskCard component` |
| `test` | Adding or modifying tests | `test(store): add unit tests for addTask` |
| `chore` | Build process or tooling changes | `chore: update vite to 7.x` |
| `ci` | CI/CD configuration | `ci: add npm audit to workflow` |
| `perf` | Performance improvement | `perf(store): gate mock data with DEV flag` |
| `style` | Formatting only (no logic change) | `style: fix indentation in KanbanBoard` |

### Examples

```bash
# ✅ Correct
git commit -m "feat(ai): add branch name suggestion to task modal"
git commit -m "fix(gemini): handle empty response with fallback mock"
git commit -m "refactor(kanban): extract BoardHeader from KanbanBoard.tsx"

# ❌ Incorrect (too vague)
git commit -m "Update files"
git commit -m "fix bug"
git commit -m "edit"
```

---

## Development Workflow

```bash
# 1. Create a new branch from main
git checkout main
git pull --ff-only origin main
git checkout -b feat/your-feature-name

# 2. Make changes and commit (follow Conventional Commits)
git add .
git commit -m "feat(scope): description"

# 3. Verify before pushing
npx tsc --noEmit                      # type check
npm run build                         # ensure build doesn't break
npm audit --audit-level=high          # no high-severity CVEs

# 4. Push and open a PR
git push origin feat/your-feature-name
```

---

## Running Tests

> ⚠️ **Testing infrastructure does not exist yet** — planned for v0.3.
> Manual verification is the only option for now. See Known Limitations below.

```bash
# Available after v0.3:
npm test              # Vitest unit tests
npm run test:e2e      # Playwright E2E tests
npm run test:coverage # Coverage report
```

---

## Environment Variables

| Variable | Required | Description | How to get |
|:---|:---|:---|:---|
| `GEMINI_API_KEY` | No | Google Gemini API Key | [AI Studio](https://aistudio.google.com) |

- **Without a key**: AI features automatically fall back to mock data; all other features work normally.
- **With a key**: Use `npx vercel dev` to correctly proxy calls through `/api/gemini`.
- **Never** commit a real key to git. The `.env` file is gitignored for this reason.

---

## Known Limitations

Please review these before submitting a PR:

| Limitation | Impact | Expected Fix |
|:---|:---|:---|
| **KanbanBoard.tsx ~500 LOC** | Hard to test individual features; high merge conflict risk | v0.2 |
| **Zero test coverage** | No automated regression protection | v0.3 |
| **`useRef` coupling in App.tsx** | `openModal` passed via ref; breaks if KanbanBoard unmounts | v0.2 |
| **Git integration is UI simulation** | `Git Sync ⚡` button plays animation only — not a real git operation | v1.0 |
| **localStorage only** | Data is local to the browser; no cross-device sync | v0.4 (after backend) |

---

## Good First Issues

These are well-scoped tasks suitable for a first contribution:

1. **Extract `BoardHeader` component** — pull ~40 lines from the top of KanbanBoard.tsx
2. **Extract `TaskCard` component** — currently inlined inside the column render
3. **Fix mock data timestamps** — replace `new Date()` with fixed ISO strings
4. **Migrate `CommandType` to `as const`** — replace the TypeScript enum to fix tree-shaking
5. **Add store unit tests** — cover `addTask`, `deleteTask`, `updateTaskStatus`

Look for issues labeled `good first issue` on GitHub, or open a new Issue to discuss your idea before starting.

---

## Need Help?

- Open a [GitHub Issue](https://github.com/IcannAI/taskflow-board/issues) describing the problem or idea.
- PR descriptions should cover: what changed, why it changed, and how to verify it.