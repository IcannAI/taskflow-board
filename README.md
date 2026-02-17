# TaskFlow — Developer Task OS
### FAANG-Level Demo · Deploy in 5 minutes

> "零摩擦的開發者任務管理 — 你的工作流，你的方式"

---

## 🚀 5 分鐘部署到 Vercel

```bash
# 1. Clone or download this repo
git init taskflow-demo && cd taskflow-demo

# 2. Copy the demo file as index.html
cp taskflow-demo.html index.html

# 3. Push to GitHub
git add . && git commit -m "feat: taskflow demo"
git remote add origin https://github.com/YOUR_USERNAME/taskflow-demo.git
git push -u origin main

# 4. Import into Vercel
# Go to vercel.com → New Project → Import your repo → Deploy
# Done! Live at https://taskflow-demo.vercel.app
```

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

## 📋 Product Spec

See `TaskFlow_Product_Spec_FAANG.docx` for full product specification including SWOT analysis, MVP roadmap, and go-to-market strategy.

---