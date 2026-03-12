# TaskFlow — Developer Task OS
### FAANG-Level Demo · Deploy in 5 minutes

> "零摩擦的開發者任務管理 — 個人工作流+方式"

---

## 🎯 Demo Keyboard Shortcuts

| 操作 | 快捷鍵 |
|------|--------|
| Command Palette | `⌘K` (Mac) / `Ctrl+K` (Win) |
| New Task | `N` |
| Git Sync Demo | `G` |
| Close panels | `Esc` |

---

## ✨ Demo Features

- **看板**：拖拉任務卡片跨欄移動
- **Command Palette**：⌘K 呼叫，支援模糊搜尋、鍵盤導覽
- **Git Sync 模擬**：點擊 "Git Sync ⚡" 觀看自動同步動畫
- **New Task**：完整建立任務流程

---

## 🏗️ Tech Stack (Production Plan)

| 層 | 技術 |
|----|------|
| Frontend | React 19 + Vite + TailwindCSS + shadcn/ui |
| Backend | Hono (Node.js) |
| Database | SQLite / Turso |
| CLI | Commander.js |
| Git Integration | simple-git |
| Deploy | Vercel (Frontend) + Railway (Backend) |

---

## 📋 Go-to-Market 策略

-   Developer Communities: Reddit (r/selfhosted, r/devops), Hacker News,
    Dev.to

-   Product Hunt Launch: 準備 Demo 影片、GIF 展示 Git Sync 效果

-   GitHub Trending: 優化 README，使用 GIF 展示核心功能

-   Tech YouTubers: 聯繫 Fireship、Theo 等開發者 YouTuber

---

## 📍 Current Status (v0.1 — MVP Prototype)

| 功能 | 狀態 | 說明 |
|:---|:---|:---|
| Kanban Board + 拖曳 | ✅ 完成 | |
| Command Palette ⌘K | ✅ 完成 | Fuse.js 模糊搜尋 |
| Dashboard 圖表 | ✅ 完成 | |
| 本地持久化 | ✅ 完成 | localStorage via Zustand persist |
| AI 任務拆解 (Gemini) | ✅ 完成 | API Key 透過 Vercel proxy 保護 |
| Git 整合 | 🟡 UI 模擬 | 非真實 git 操作 |
| 後端 (Hono) | 🔴 Roadmap | |
| 資料庫 (Turso) | 🔴 Roadmap | |
| CLI (Commander.js) | 🔴 Roadmap | |

> ⚠️ 這是前端 prototype，資料存於 localStorage。
> API 呼叫透過 Vercel Edge Function proxy，key 不暴露於前端。