import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Kanban, LayoutDashboard, User, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTaskStore } from '../store/useTaskStore';

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface LayoutProps {
  children: React.ReactNode;
  currentView: 'KANBAN' | 'DASHBOARD';
  onViewChange: (view: 'KANBAN' | 'DASHBOARD') => void;
  onNewTask?: () => void;
  onOpenPalette?: () => void;
  onGitSync?: () => void;
}

type ToastType = 'default' | 'success' | 'git' | 'info';

interface ToastItem {
  id: number;
  msg: string;
  type: ToastType;
  leaving: boolean;
}

/* ─────────────────────────────────────────────
   Toast Context (global singleton)
───────────────────────────────────────────── */
let _toastId = 0;
let _addToast: ((msg: string, type?: ToastType) => void) | null = null;

export function showToast(msg: string, type: ToastType = 'default') {
  _addToast?.(msg, type);
}

/* ─────────────────────────────────────────────
   Git Event type
───────────────────────────────────────────── */
interface GitEvent {
  icon: string;
  type: 'branch' | 'commit' | 'pr' | 'done';
  title: string;
  metaParts: Array<{ text: string; className?: string }>;
}

const GIT_EVENTS: GitEvent[] = [
  {
    icon: '⎇', type: 'branch', title: 'Branch auto-created',
    metaParts: [
      { text: 'feat/fix-auth-bug', className: 'tf-git-event-sha' },
      { text: ' created from main' },
    ],
  },
  {
    icon: '●', type: 'commit', title: 'Commit detected',
    metaParts: [
      { text: 'SHA: ' },
      { text: 'a3f9c2d', className: 'tf-git-event-sha' },
      { text: ' · "fix: auth edge case ' },
      { text: '⟶ TF-001', className: 'tf-git-event-task' },
      { text: '"' },
    ],
  },
  {
    icon: '↑', type: 'commit', title: 'Task auto-updated',
    metaParts: [
      { text: 'TF-001', className: 'tf-git-event-task' },
      { text: ' status → IN PROGRESS · 1 commit' },
    ],
  },
  {
    icon: '✓', type: 'done', title: 'TF-001 moved to In Progress',
    metaParts: [{ text: 'Time tracked: 0h 12m since branch creation' }],
  },
];

/* ─────────────────────────────────────────────
   Layout Component
───────────────────────────────────────────── */
export const Layout: React.FC<LayoutProps> = ({
  children,
  currentView,
  onViewChange,
  onNewTask,
  onOpenPalette,
  onGitSync,
}) => {
  /* ── Toast state ── */
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((msg: string, type: ToastType = 'default') => {
    const id = ++_toastId;
    setToasts(prev => [...prev, { id, msg, type, leaving: false }]);
    // start fade-out
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t));
    }, 2400);
    // remove from DOM
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2700);
  }, []);

  // Register global singleton
  useEffect(() => {
    _addToast = addToast;
    return () => { _addToast = null; };
  }, [addToast]);

  /* ── Git Sync Panel state ── */
  const [gitPanelOpen, setGitPanelOpen] = useState(false);
  const [gitEvents, setGitEvents] = useState<GitEvent[]>([]);
  const [gitProgress, setGitProgress] = useState<number | null>(null);
  const gitTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const tasks = useTaskStore(s => s.tasks);
  const updateTaskStatus = useTaskStore(s => s.updateTaskStatus);

  const triggerGitSync = useCallback(() => {
    // clear previous
    gitTimers.current.forEach(clearTimeout);
    gitTimers.current = [];
    setGitEvents([]);
    setGitProgress(null);
    setGitPanelOpen(true);

    GIT_EVENTS.forEach((ev, i) => {
      const t = setTimeout(() => {
        setGitEvents(prev => [...prev, ev]);

        // After last event: auto-move first todo task & show progress
        if (i === GIT_EVENTS.length - 1) {
          const todoTask = tasks.find(t => t.status === 'todo');
          if (todoTask) {
            updateTaskStatus(todoTask.id, 'in-progress');
            addToast(`⚡ Git Sync: ${todoTask.id} auto-moved to In Progress`, 'git');
          }
          const doneCount = tasks.filter(t => t.status === 'done').length + 1;
          setGitProgress(Math.round((doneCount / tasks.length) * 100));
        }
      }, 200 + i * 600);
      gitTimers.current.push(t);
    });

    onGitSync?.();
  }, [tasks, updateTaskStatus, addToast, onGitSync]);

  // Keyboard: G → Git Sync
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const inInput = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || active instanceof HTMLSelectElement;
      if (!inInput && (e.key === 'g' || e.key === 'G')) {
        triggerGitSync();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [triggerGitSync]);

  /* ── Toast colour map ── */
  const toastColors: Record<ToastType, string> = {
    default: 'var(--text)',
    success: 'var(--green)',
    git:     'var(--cyan)',
    info:    'var(--accent)',
  };
  const toastIcons: Record<ToastType, string> = {
    default: '', success: '', git: '⚡', info: 'ℹ',
  };

  /* ── Sidebar items ── */
  const todoCount     = tasks.filter(t => t.status === 'todo').length;
  const inProgCount   = tasks.filter(t => t.status === 'in-progress').length;
  const reviewCount   = tasks.filter(t => t.status === 'review').length;
  const doneCount     = tasks.filter(t => t.status === 'done').length;
  const p0Count       = tasks.filter(t => t.priority === 'high').length;

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg)', color: 'var(--text)' }}>

      {/* ── TOPBAR ── */}
      <header
        className="flex items-center gap-4 shrink-0 z-50"
        style={{
          height: 48,
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '0 16px',
        }}
      >
        {/* Logo */}
        <div
          className="tf-syne flex items-center gap-2 select-none"
          style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.5px' }}
        >
          <span className="tf-logo-dot" />
          TaskFlow
        </div>

        <div style={{ width: 1, height: 20, background: 'var(--border)', flexShrink: 0 }} />

        {/* Tab bar */}
        <nav className="flex gap-0.5">
          {[
            { label: 'Board',    view: 'KANBAN'    as const },
            { label: 'Analytics', view: 'DASHBOARD' as const },
          ].map(({ label, view }) => (
            <button
              key={view}
              onClick={() => onViewChange(view)}
              className="transition-colors"
              style={{
                padding: '4px 12px',
                fontSize: 11,
                letterSpacing: '0.5px',
                borderRadius: 4,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                background: currentView === view ? 'var(--surface3)' : 'transparent',
                color:      currentView === view ? 'var(--text)'  : 'var(--text2)',
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}

          {/* Git Sync tab */}
          <button
            onClick={triggerGitSync}
            className="transition-colors flex items-center gap-1"
            style={{
              padding: '4px 12px',
              fontSize: 11,
              letterSpacing: '0.5px',
              borderRadius: 4,
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              background: 'transparent',
              color: 'var(--text2)',
              transition: 'all 0.15s',
            }}
            title="Trigger Git Sync (G)"
          >
            <Zap size={11} />
            <span>Git Sync</span>
          </button>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 ml-auto">
          {/* ⌘K hint */}
          <button
            onClick={onOpenPalette}
            style={{
              fontSize: 10,
              color: 'var(--text3)',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              padding: '2px 8px',
              borderRadius: 4,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)';
            }}
          >
            <span>⌘K</span>
            <span>Command Palette</span>
          </button>

          {/* New Task */}
          <button
            onClick={onNewTask}
            className="tf-syne"
            style={{
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              padding: '5px 12px',
              borderRadius: 5,
              fontSize: 11,
              fontFamily: 'inherit',
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: '0.3px',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              const b = e.currentTarget as HTMLButtonElement;
              b.style.background = '#2563eb';
              b.style.transform = 'translateY(-1px)';
              b.style.boxShadow = '0 4px 12px rgba(59,130,246,0.3)';
            }}
            onMouseLeave={e => {
              const b = e.currentTarget as HTMLButtonElement;
              b.style.background = 'var(--accent)';
              b.style.transform = 'translateY(0)';
              b.style.boxShadow = 'none';
            }}
          >
            + New Task
          </button>
        </div>
      </header>

      {/* ── BODY (sidebar + main) ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* SIDEBAR */}
        <aside
          className="flex flex-col shrink-0 overflow-y-auto"
          style={{
            width: 220,
            background: 'var(--surface)',
            borderRight: '1px solid var(--border)',
          }}
        >
          {/* Project section */}
          <div style={{ padding: '16px 12px 8px' }}>
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text3)', padding: '0 4px', marginBottom: 6 }}>
              Project
            </div>
            {[
              { icon: '◈', label: 'TaskFlow MVP', count: tasks.length, active: true,  onClick: () => onViewChange('KANBAN') },
              { icon: '◇', label: 'Design System',count: 3,           active: false, onClick: () => {} },
            ].map(item => (
              <SidebarItem key={item.label} {...item} />
            ))}
          </div>

          {/* Views section */}
          <div style={{ padding: '8px 12px' }}>
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text3)', padding: '0 4px', marginBottom: 6 }}>
              Views
            </div>
            {[
              { icon: '🔴', label: 'P0 Bugs',     count: p0Count,    onClick: () => addToast('🔴 Showing P0 bugs', 'info') },
              { icon: '👤', label: 'My Tasks',     count: tasks.length, onClick: () => addToast('👤 Showing my tasks', 'info') },
              { icon: '⚡', label: 'Sprint 1',     count: tasks.length, onClick: () => onViewChange('KANBAN') },
            ].map(item => (
              <SidebarItem key={item.label} {...item} />
            ))}
          </div>

          {/* Git status widget */}
          <div style={{ margin: '8px 12px', padding: '8px 10px', background: 'var(--surface2)', border: '1px solid var(--border)', borderLeft: '2px solid var(--green)', borderRadius: 5, fontSize: 9, color: 'var(--text2)', lineHeight: 1.6 }}>
            <div style={{ color: 'var(--green)', fontWeight: 600 }}>⎇ feat/command-palette</div>
            <div style={{ color: 'var(--text3)' }}>↑ {inProgCount} tasks in progress</div>
            <div style={{ color: 'var(--green)', marginTop: 2 }}>● {doneCount} tasks auto-updated</div>
          </div>

          {/* Team */}
          <div style={{ padding: '8px 12px', marginTop: 'auto', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text3)', padding: '0 4px', marginBottom: 6 }}>
              Team
            </div>
            {[
              { initials: 'AJ', name: 'Alice J.',  color: '#3b82f6', online: true },
              { initials: 'BK', name: 'Bob K.',    color: '#8b5cf6', online: false },
            ].map(member => (
              <div
                key={member.name}
                className="flex items-center gap-2"
                style={{ padding: '5px 8px', borderRadius: 5, cursor: 'pointer', marginBottom: 1, fontSize: 11, color: 'var(--text2)' }}
              >
                <span style={{ width: 18, height: 18, borderRadius: '50%', background: member.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                  {member.initials}
                </span>
                {member.name}
                <span style={{ marginLeft: 'auto', fontSize: 9, color: member.online ? 'var(--green)' : 'var(--yellow)' }}>●</span>
              </div>
            ))}
          </div>
        </aside>

        {/* MAIN */}
        <main className="flex flex-col flex-1 overflow-hidden">
          {children}
        </main>
      </div>

      {/* ── GIT SYNC PANEL (floating) ── */}
      <div className={cn('tf-git-panel', gitPanelOpen && 'open')}>
        <div className="tf-git-panel-header">
          <Zap size={14} style={{ color: 'var(--yellow)' }} />
          <div className="tf-git-panel-title">Git Sync Intelligence</div>
          <button
            className="tf-git-panel-close"
            onClick={() => setGitPanelOpen(false)}
          >✕</button>
        </div>
        <div className="tf-git-panel-body">
          {gitEvents.map((ev, i) => (
            <div key={i} className="tf-git-event">
              <div className={cn('tf-git-event-icon', ev.type)}>
                <span style={{ fontSize: 11 }}>{ev.icon}</span>
              </div>
              <div className="tf-git-event-body">
                <div className="tf-git-event-title">{ev.title}</div>
                <div className="tf-git-event-meta">
                  {ev.metaParts.map((p, j) => (
                    <span key={j} className={p.className}>{p.text}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {gitProgress !== null && (
            <div className="tf-git-progress">
              <div className="tf-git-progress-label">
                <span>Sprint 1 Progress</span>
                <span style={{ color: 'var(--green)' }}>
                  {tasks.filter(t => t.status === 'done').length} / {tasks.length} tasks
                </span>
              </div>
              <div className="tf-git-progress-bar">
                <div className="tf-git-progress-fill" style={{ width: `${gitProgress}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── TOAST CONTAINER ── */}
      <div className="tf-toast-container">
        {toasts.map(t => (
          <div
            key={t.id}
            className={cn('tf-toast', t.leaving && 'leaving')}
            style={{ borderColor: toastColors[t.type] }}
          >
            {toastIcons[t.type] && (
              <span style={{ color: toastColors[t.type] }}>{toastIcons[t.type]}</span>
            )}
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   SidebarItem sub-component
───────────────────────────────────────────── */
interface SidebarItemProps {
  icon: string;
  label: string;
  count?: number;
  active?: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, count, active, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const highlighted = active || hovered;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '5px 8px',
        borderRadius: 5,
        cursor: 'pointer',
        fontSize: 11,
        color: highlighted ? 'var(--text)' : 'var(--text2)',
        background: active ? 'var(--surface3)' : hovered ? 'var(--surface2)' : 'transparent',
        marginBottom: 1,
        transition: 'all 0.12s',
      }}
    >
      <span style={{ fontSize: 12, width: 16, textAlign: 'center' }}>{icon}</span>
      {label}
      {count !== undefined && (
        <span style={{ marginLeft: 'auto', fontSize: 9, background: 'var(--surface3)', color: 'var(--text3)', padding: '1px 5px', borderRadius: 8 }}>
          {count}
        </span>
      )}
    </div>
  );
};