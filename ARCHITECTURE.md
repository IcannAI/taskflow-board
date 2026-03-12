# TaskFlow Board — Architecture

## Tech Stack
- React 19 + Vite 6 + TypeScript 5.8
- Zustand 5（含 persist middleware）
- Tailwind CSS + tailwind-merge + clsx
- Recharts（Dashboard 圖表）
- Fuse.js（Command Palette 搜尋）

## 元件依賴圖
```
index.tsx
  └── App.tsx（全域狀態協調）
        ├── Layout
        ├── KanbanBoard ← geminiService（透過 proxy）
        ├── Dashboard   ← useTaskStore
        └── CommandPalette ← useTaskStore
```

## 資料流
```
User Action
  → Zustand Store（useTaskStore）
  → Component re-render
  → localStorage（persist middleware 自動同步）

AI Request
  → geminiService.ts（無 API Key）
  → /api/gemini（Vercel Edge Function）
  → Gemini API（key 只存在 Vercel 環境變數）
```

## 檔案結構
```
/
├── api/
│   └── gemini.ts        # Vercel Edge Function proxy
├── components/
│   ├── kanban/
│   │   └── KanbanBoard.tsx  # ⚠️ 技術債：~500 LOC 待拆分
│   ├── Dashboard.tsx
│   ├── Layout.tsx
│   └── ui/
│       └── CommandPalette.tsx
├── fixtures/
│   └── mockData.ts      # 開發環境 mock，production 自動清空
├── services/
│   └── geminiService.ts # 呼叫 /api/gemini，不持有 key
├── store/
│   └── useTaskStore.ts  # Zustand + persist
├── lib/
│   └── utils.ts         # cn() helper
└── types.ts             # 集中型別定義
```

## 已知技術債
| 項目 | 風險 | 對應 Phase |
|:---|:---|:---|
| KanbanBoard.tsx ~500 LOC | 難測試、高 merge conflict | Phase 4-A |
| App.tsx useRef 傳遞 openModal | 元件耦合脆弱 | Phase 4-B |
| CommandType 用 enum | tree-shaking 問題 | Phase 4 |
| User interface 未使用 | 多餘定義 | Phase 4 |

## 環境變數
| 變數 | 位置 | 說明 |
|:---|:---|:---|
| GEMINI_API_KEY | Vercel Dashboard + .env | Gemini API，只在 server 端使用 |
