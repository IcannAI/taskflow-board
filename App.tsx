import React, { useRef, useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { KanbanBoard } from './components/kanban/kanbanBoard';
import { Dashboard } from './components/Dashboard';
import { CommandPalette } from './components/ui/CommandPalette';

// ─── 型別與原 Layout.tsx 保持一致（大寫字串 literal） ───────────────────
type AppView = 'KANBAN' | 'DASHBOARD';

// ─────────────────────────────────────────────────────────────────────────
//  App — 全域狀態指揮中心
//
//  ┌─ 狀態 ──────────────────────────────────────────────────────────┐
//  │  view          'KANBAN' | 'DASHBOARD'   目前顯示哪個主頁面        │
//  │  paletteOpen   boolean                  CommandPalette 是否開啟  │
//  │  openModalRef  React.MutableRefObject   指向 KanbanBoard 的      │
//  │                                         openModal() 函式         │
//  └─────────────────────────────────────────────────────────────────┘
//
//  ┌─ 為什麼狀態在 App，不在子元件？ ────────────────────────────────┐
//  │  Layout  Topbar「+ New Task」→ 需要觸發 KanbanBoard 的 Modal    │
//  │  CommandPalette「New Task」  → 需要觸發 KanbanBoard 的 Modal    │
//  │  Layout  Topbar「⌘K」       → 需要開啟 CommandPalette           │
//  │  三者是兄弟元件，共同的最近祖先是 App，由此統一管理              │
//  └─────────────────────────────────────────────────────────────────┘
// ─────────────────────────────────────────────────────────────────────────
const App: React.FC = () => {
  const [view,        setView]        = useState<AppView>('KANBAN');
  const [paletteOpen, setPaletteOpen] = useState(false);

  // KanbanBoard 內部的 openModal() 函式會在 mount 後
  // 透過 openModalRef prop 把自己的參照存進來
  const openModalRef = useRef<((col?: string) => void) | null>(null);

  // 全域快捷鍵：⌘K / Ctrl+K → 切換 CommandPalette
  // （CommandPalette 本身也監聽，雙保險確保在任何焦點狀態下都有效）
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    // 注意：不加 min-h-screen 或額外 div wrapper
    // index.css 已設定 html/body/#root { height:100%; overflow:hidden }
    // Layout 內部自己管理 flex 高度，額外包層會撐破版面
    <>
      {/* ── 主框架：Topbar + Sidebar + 內容區 ── */}
      <Layout
        currentView={view}
        onViewChange={setView}
        onNewTask={() => openModalRef.current?.()}
        onOpenPalette={() => setPaletteOpen(true)}
      >
        {view === 'KANBAN' ? (
          // openModalRef 傳入後，KanbanBoard mount 時會執行：
          // openModalRef.current = openModal（KanbanBoard 自己的函式）
          <KanbanBoard openModalRef={openModalRef} />
        ) : (
          <Dashboard />
        )}
      </Layout>

      {/* ── Command Palette（全域浮層，渲染在 Layout 之外） ── */}
      {/* isOpen / onClose 由 App 控制，確保 Layout 的 ⌘K 按鈕  */}
      {/* 和 CommandPalette 自身的 ESC 鍵都能正確開關            */}
      <CommandPalette
        setView={setView}
        onNewTask={() => openModalRef.current?.()}
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
      />
    </>
  );
};

export default App;