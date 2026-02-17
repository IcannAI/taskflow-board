import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Kanban, LayoutDashboard, Plus, Zap, Filter, Calendar, BarChart2, GitBranch, Users, X } from 'lucide-react';
import Fuse from 'fuse.js';
import { useTaskStore } from '../../store/useTaskStore';
import { cn } from '../../lib/utils';
import { Task } from '../../types';
import { showToast } from '../Layout';

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface CommandPaletteProps {
  setView: (view: 'KANBAN' | 'DASHBOARD') => void;
  onNewTask?: () => void;
  onGitSync?: () => void;
  /** Controlled open state (optional) */
  isOpen?: boolean;
  onClose?: () => void;
}

interface PaletteCommand {
  id: string;
  icon: string | React.ReactNode;
  name: string;
  hint: string;
  kbd?: string;
  action: () => void;
  section?: string;
}

/* ─────────────────────────────────────────────
   CommandPalette
───────────────────────────────────────────── */
export const CommandPalette: React.FC<CommandPaletteProps> = ({
  setView,
  onNewTask,
  onGitSync,
  isOpen: controlledOpen,
  onClose: controlledClose,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen  = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const doClose = useCallback(() => {
    controlledClose ? controlledClose() : setInternalOpen(false);
  }, [controlledClose]);
  const doOpen  = useCallback(() => setInternalOpen(true), []);

  const [query,         setQuery]         = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const tasks = useTaskStore(s => s.tasks);

  /* ── Fuse.js for task search ── */
  const fuse = new Fuse(tasks, {
    keys: ['title', 'id', 'tags', 'git.branchName'],
    threshold: 0.4,
  });

  /* ── Command definitions ── */
  const buildCommands = (): PaletteCommand[] => [
    {
      id: 'new-task',
      icon: '✦',
      name: 'New Task',
      hint: 'Create a new task on the board',
      kbd: 'N',
      section: 'Actions',
      action: () => { doClose(); onNewTask?.(); },
    },
    {
      id: 'git-sync',
      icon: '⚡',
      name: 'tf task start <id>',
      hint: 'Create git branch & trigger sync',
      section: 'Actions',
      action: () => { doClose(); onGitSync?.(); },
    },
    {
      id: 'go-board',
      icon: '⊞',
      name: 'Go to Board',
      hint: 'Switch to Kanban board view',
      section: 'Navigation',
      action: () => { doClose(); setView('KANBAN'); },
    },
    {
      id: 'go-analytics',
      icon: '◈',
      name: 'Go to Analytics',
      hint: 'Switch to Dashboard view',
      section: 'Navigation',
      action: () => { doClose(); setView('DASHBOARD'); },
    },
    {
      id: 'filter-me',
      icon: '👤',
      name: 'Filter by @me',
      hint: 'Show tasks assigned to me',
      section: 'Filters',
      action: () => { doClose(); showToast('👤 Showing my tasks', 'info'); },
    },
    {
      id: 'filter-p0',
      icon: '🔴',
      name: 'Filter P0 only',
      hint: 'Show critical priority tasks',
      section: 'Filters',
      action: () => { doClose(); showToast('🔴 Showing P0 bugs', 'info'); },
    },
    {
      id: 'view-calendar',
      icon: '◷',
      name: 'Switch to Calendar view',
      hint: 'View tasks by date — coming in v1.1',
      section: 'Views',
      action: () => { doClose(); showToast('📅 Calendar view — coming in v1.1', 'info'); },
    },
    {
      id: 'view-list',
      icon: '≡',
      name: 'Switch to List view',
      hint: 'Linear-style list — coming in v1.1',
      section: 'Views',
      action: () => { doClose(); showToast('≡ List view — coming in v1.1', 'info'); },
    },
    {
      id: 'sprint-close',
      icon: '✕',
      name: 'Close Sprint 1',
      hint: 'Mark Sprint 1 as complete',
      section: 'Sprint',
      action: () => { doClose(); showToast('🎉 Sprint 1 closed!', 'success'); },
    },
    {
      id: 'analytics',
      icon: '📊',
      name: 'Sprint Analytics',
      hint: 'View velocity & burndown chart',
      section: 'Sprint',
      action: () => { doClose(); showToast('📊 Analytics coming in v2.0', 'info'); },
    },
  ];

  const COMMANDS = buildCommands();

  /* ── Derived list ── */
  const isCommandMode = query.startsWith('>');
  const searchTerm    = isCommandMode ? query.slice(1).trim() : query.trim();

  const taskResults: Array<{ _type: 'task'; item: Task }> = !isCommandMode && searchTerm
    ? fuse.search(searchTerm).map(r => ({ _type: 'task', item: r.item }))
    : [];

  const cmdResults: Array<{ _type: 'cmd'; item: PaletteCommand }> = (() => {
    if (!searchTerm) return COMMANDS.map(c => ({ _type: 'cmd' as const, item: c }));
    const q = searchTerm.toLowerCase();
    return COMMANDS
      .filter(c => c.name.toLowerCase().includes(q) || c.hint.toLowerCase().includes(q))
      .map(c => ({ _type: 'cmd' as const, item: c }));
  })();

  const displayedItems = isCommandMode
    ? cmdResults
    : searchTerm
      ? [...taskResults, ...cmdResults]
      : cmdResults;

  /* ── Keyboard: ⌘K to toggle ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        isOpen ? doClose() : doOpen();
      }
      if (e.key === 'Escape' && isOpen) doClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, doClose, doOpen]);

  /* ── Focus & reset on open ── */
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  /* ── Reset selection when list changes ── */
  useEffect(() => { setSelectedIndex(0); }, [query]);

  /* ── Execute item ── */
  const execute = (index: number) => {
    const entry = displayedItems[index];
    if (!entry) return;
    if (entry._type === 'task') {
      showToast(`🔍 Navigated to ${entry.item.id}`, 'info');
      doClose();
    } else {
      entry.item.action();
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, displayedItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (displayedItems.length > 0) execute(selectedIndex);
    }
  };

  if (!isOpen) return null;

  /* ── Group commands by section for rendering ── */
  const sections: Record<string, typeof cmdResults> = {};
  displayedItems.forEach((entry, flatIdx) => {
    if (entry._type === 'task') {
      (sections['Tasks'] = sections['Tasks'] ?? []).push({ ...entry, _flatIdx: flatIdx } as any);
    } else {
      const sec = entry.item.section ?? 'Commands';
      (sections[sec] = sections[sec] ?? []).push({ ...entry, _flatIdx: flatIdx } as any);
    }
  });

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
  return (
    <div
      className="fixed inset-0 flex items-start justify-center"
      style={{ paddingTop: '15vh', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 1000 }}
      onClick={e => { if (e.target === e.currentTarget) doClose(); }}
    >
      <div
        style={{
          width: 560,
          background: 'var(--surface2)',
          border: '1px solid var(--border2)',
          borderRadius: 10,
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
          animation: 'tf-scale-in 0.15s ease',
        }}
      >
        {/* ── Search bar ── */}
        <div
          className="flex items-center gap-2"
          style={{ padding: '0 16px', borderBottom: '1px solid var(--border)' }}
        >
          <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>&gt;</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="task, search, filter, view…"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              padding: '14px 0',
              fontSize: 14,
              fontFamily: 'inherit',
              color: 'var(--text)',
              caretColor: 'var(--accent)',
            }}
          />
          <button
            onClick={doClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 12, padding: 4 }}
          >
            ESC
          </button>
        </div>

        {/* ── Results ── */}
        <div style={{ maxHeight: 360, overflowY: 'auto' }}>
          {displayedItems.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', fontSize: 11, color: 'var(--text3)' }}>
              No commands found
            </div>
          ) : (
            Object.entries(sections).map(([sectionName, entries]) => (
              <div key={sectionName} style={{ borderBottom: '1px solid var(--border)' }}>
                {/* Section label */}
                <div style={{ padding: '6px 16px 2px', fontSize: 9, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text3)' }}>
                  {sectionName}
                </div>

                {(entries as any[]).map((entry: any) => {
                  const flatIdx = entry._flatIdx ?? 0;
                  const isSelected = flatIdx === selectedIndex;

                  if (entry._type === 'task') {
                    const task: Task = entry.item;
                    return (
                      <div
                        key={task.id}
                        className="flex items-center gap-2"
                        style={{
                          padding: '8px 16px',
                          cursor: 'pointer',
                          background: isSelected ? 'var(--surface3)' : 'transparent',
                          transition: 'background 0.08s',
                        }}
                        onClick={() => execute(flatIdx)}
                        onMouseEnter={() => setSelectedIndex(flatIdx)}
                      >
                        {/* Icon */}
                        <div style={{
                          width: 28, height: 28,
                          background: 'var(--surface3)',
                          border: '1px solid var(--border)',
                          borderRadius: 5,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, flexShrink: 0,
                        }}>
                          🔍
                        </div>

                        {/* Task info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="flex items-center justify-between gap-2">
                            <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {task.title}
                            </span>
                            <span style={{ fontSize: 9, color: 'var(--text3)', fontFamily: 'inherit', flexShrink: 0 }}>
                              {task.id}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5" style={{ fontSize: 9, color: 'var(--text3)' }}>
                            <span style={{
                              width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                              background: task.status === 'done' ? 'var(--green)' : task.status === 'in-progress' ? 'var(--accent)' : 'var(--text3)',
                            }} />
                            <span>{task.status}</span>
                            {task.git && (
                              <span style={{ marginLeft: 'auto', color: 'var(--green)' }}>
                                ⎇ {task.git.branchName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  /* Command item */
                  const cmd: PaletteCommand = entry.item;
                  return (
                    <div
                      key={cmd.id}
                      className="flex items-center gap-2"
                      style={{
                        padding: '8px 16px',
                        cursor: 'pointer',
                        background: isSelected ? 'var(--surface3)' : 'transparent',
                        transition: 'background 0.08s',
                      }}
                      onClick={() => execute(flatIdx)}
                      onMouseEnter={() => setSelectedIndex(flatIdx)}
                    >
                      {/* Icon box */}
                      <div style={{
                        width: 28, height: 28,
                        background: 'var(--surface3)',
                        border: '1px solid var(--border)',
                        borderRadius: 5,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, flexShrink: 0,
                      }}>
                        {cmd.icon}
                      </div>

                      {/* Name + hint */}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: 'var(--text)' }}>{cmd.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>{cmd.hint}</div>
                      </div>

                      {/* Optional kbd */}
                      {cmd.kbd && (
                        <div style={{
                          fontSize: 9,
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          padding: '2px 5px',
                          borderRadius: 3,
                          color: 'var(--text3)',
                          flexShrink: 0,
                        }}>
                          {cmd.kbd}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* ── Footer hint bar ── */}
        <div
          className="flex items-center justify-between"
          style={{
            background: 'rgba(17,19,24,0.8)',
            padding: '8px 16px',
            borderTop: '1px solid var(--border)',
            fontSize: 10,
            color: 'var(--text3)',
          }}
        >
          <div className="flex gap-4">
            <span><strong style={{ color: 'var(--text2)', fontFamily: 'inherit' }}>⌘K</strong> to toggle</span>
            <span><strong style={{ color: 'var(--text2)', fontFamily: 'inherit' }}>&gt;</strong> for commands</span>
            <span><strong style={{ color: 'var(--text2)', fontFamily: 'inherit' }}>↑↓</strong> to navigate</span>
            <span><strong style={{ color: 'var(--text2)', fontFamily: 'inherit' }}>↵</strong> to run</span>
          </div>
          <span>TaskFlow CLI</span>
        </div>
      </div>
    </div>
  );
};