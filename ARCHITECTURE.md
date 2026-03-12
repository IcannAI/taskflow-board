## 元件依賴圖
index.tsx → App.tsx → Layout / KanbanBoard / Dashboard / CommandPalette

## 資料流
User Action → Zustand Store → Component re-render
AI Request → geminiService → KanbanBoard

## 已知技術債
- KanbanBoard.tsx ~500 LOC，待拆分
- App.tsx 用 useRef 傳遞 openModal（待移入 store）