import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Sparkles, Loader2, GitBranch } from 'lucide-react';
import { useTaskStore } from '../../store/useTaskStore';
import { Task, TaskStatus } from '../../types';
import { TaskCard } from './TaskCard';
import { generateTaskPlan } from '../../services/geminiService';
import { cn } from '../../lib/utils';
import { showToast } from '../Layout';

/* ─────────────────────────────────────────────
   Column config — matches Demo palette
───────────────────────────────────────────── */
const COLUMNS: { id: TaskStatus; label: string; dotColor: string; glowColor?: string }[] = [
  { id: 'todo',        label: 'TODO',        dotColor: 'var(--text3)' },
  { id: 'in-progress', label: 'IN PROGRESS', dotColor: 'var(--accent)', glowColor: 'var(--accent)' },
  { id: 'review',      label: 'CODE REVIEW', dotColor: 'var(--yellow)' },
  { id: 'done',        label: 'DONE',        dotColor: 'var(--green)',  glowColor: 'var(--green)' },
];

/* ─────────────────────────────────────────────
   Assignee colours (matches Demo)
───────────────────────────────────────────── */
export const ASSIGNEE_COLORS: Record<string, string> = {
  AJ: '#3b82f6',
  BK: '#8b5cf6',
  CL: '#10b981',
  DM: '#f59e0b',
};

/* ─────────────────────────────────────────────
   KanbanBoard
───────────────────────────────────────────── */
interface KanbanBoardProps {
  /** If parent controls the "new task" modal trigger, pass this ref */
  openModalRef?: React.MutableRefObject<(() => void) | null>;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ openModalRef }) => {
  const tasks          = useTaskStore(s => s.tasks);
  const addTask        = useTaskStore(s => s.addTask);
  const updateStatus   = useTaskStore(s => s.updateTaskStatus);

  /* ── Modal state ── */
  const [isModalOpen,   setIsModalOpen]   = useState(false);
  const [defaultCol,    setDefaultCol]    = useState<TaskStatus>('todo');
  const [newTaskTitle,  setNewTaskTitle]  = useState('');
  const [taskType,      setTaskType]      = useState<'feature' | 'bug' | 'task' | 'epic'>('feature');
  const [taskPriority,  setTaskPriority]  = useState<'high' | 'medium' | 'low'>('medium');
  const [taskAssignee,  setTaskAssignee]  = useState('AJ');
  const [taskDue,       setTaskDue]       = useState('');
  const [taskCol,       setTaskCol]       = useState<TaskStatus>('todo');

  /* ── AI state ── */
  const [isAiLoading,   setIsAiLoading]   = useState(false);
  const [aiSuggestion,  setAiSuggestion]  = useState<any>(null);

  /* ── Drag state ── */
  const [draggedId,     setDraggedId]     = useState<string | null>(null);
  const [dragOverCol,   setDragOverCol]   = useState<string | null>(null);

  /* ── View switcher ── */
  const [activeView,    setActiveView]    = useState<'board' | 'list' | 'calendar'>('board');

  /* ── Default due date (7 days ahead) ── */
  const defaultDue = () => {
    const d = new Date(Date.now() + 7 * 86400000);
    return d.toISOString().split('T')[0];
  };

  /* ── Expose openModal to Layout's "New Task" button ── */
  const openModal = useCallback((col: TaskStatus = 'todo') => {
    setDefaultCol(col);
    setTaskCol(col);
    setNewTaskTitle('');
    setAiSuggestion(null);
    setTaskDue(defaultDue());
    setIsModalOpen(true);
  }, []);

  useEffect(() => {
    if (openModalRef) openModalRef.current = openModal;
  }, [openModalRef, openModal]);

  /* Keyboard: N → open modal */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const inInput = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || active instanceof HTMLSelectElement;
      if (!inInput && (e.key === 'n' || e.key === 'N') && !isModalOpen) {
        openModal();
      }
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
      if (isModalOpen && e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        handleCreateTask();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen, openModal]);

  /* ── AI assist ── */
  const handleAiAssist = async () => {
    if (!newTaskTitle) return;
    setIsAiLoading(true);
    try {
      const result = await generateTaskPlan(newTaskTitle);
      setAiSuggestion(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  /* ── Create task ── */
  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) return;
    const id = `TF-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    const newTask: Task = {
      id,
      title: newTaskTitle.trim(),
      status: taskCol,
      priority: taskPriority,
      createdAt: new Date().toISOString(),
      tags: [taskType],
      git: aiSuggestion ? {
        branchName: aiSuggestion.branchNameSuggestion,
        commits: 0,
        repo: 'taskflow-web',
      } : undefined,
    };
    addTask(newTask);
    setIsModalOpen(false);
    setNewTaskTitle('');
    setAiSuggestion(null);
    showToast(`✦ ${id} created — "${newTask.title}"`, 'success');
    setTimeout(() => showToast(`⎇ Run: tf task start to auto-create branch`, 'git'), 900);
  };

  /* ── Drag & Drop ── */
  const onDragStart = (id: string) => setDraggedId(id);
  const onDragEnd   = () => { setDraggedId(null); setDragOverCol(null); };

  const onDrop = (col: TaskStatus) => {
    if (!draggedId) return;
    const task = tasks.find(t => t.id === draggedId);
    if (!task || task.status === col) { onDragEnd(); return; }
    updateStatus(draggedId, col);
    const colLabel = COLUMNS.find(c => c.id === col)?.label ?? col;
    const emoji = col === 'done' ? '✅' : col === 'in-progress' ? '🔄' : '📋';
    showToast(`${emoji} ${task.id} → ${colLabel}`);
    if (col === 'done') {
      setTimeout(() => showToast(`⚡ Git Sync: ${task.id} auto-closing PR…`, 'git'), 800);
    }
    onDragEnd();
  };

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Board Header ── */}
      <div
        className="flex items-center gap-3 shrink-0"
        style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}
      >
        <h1
          className="tf-syne"
          style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}
        >
          Sprint 1 — MVP Core
        </h1>

        <div className="flex items-center gap-2 ml-auto" style={{ fontSize: 10, color: 'var(--text3)' }}>
          {/* Sprint badge */}
          <span style={{
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 9,
            color: 'var(--cyan)',
            fontWeight: 600,
          }}>
            Feb 10 → Feb 28
          </span>

          {/* View switcher */}
          <div className="flex gap-0.5">
            {[
              { id: 'board',    label: '⊞ Board' },
              { id: 'list',     label: '≡ List' },
              { id: 'calendar', label: '◷ Calendar' },
            ].map(v => (
              <button
                key={v.id}
                onClick={() => {
                  if (v.id !== 'board') {
                    showToast(`📅 ${v.label.trim()} view — coming in v1.1`, 'info');
                  } else {
                    setActiveView('board');
                  }
                }}
                style={{
                  padding: '3px 8px',
                  borderRadius: 3,
                  fontSize: 9,
                  cursor: 'pointer',
                  border: 'none',
                  fontFamily: 'inherit',
                  background: activeView === v.id ? 'var(--surface3)' : 'transparent',
                  color:      activeView === v.id ? 'var(--text)' : 'var(--text3)',
                  transition: 'all 0.12s',
                }}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Columns ── */}
      <div
        className="flex gap-3 flex-1 overflow-x-auto overflow-y-hidden"
        style={{ padding: '16px 20px', alignItems: 'flex-start' }}
      >
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          const isOver   = dragOverCol === col.id;

          return (
            <div
              key={col.id}
              className="flex flex-col"
              style={{
                width: 280,
                minWidth: 280,
                maxHeight: '100%',
                background: 'var(--surface)',
                border: isOver
                  ? '1px solid var(--accent)'
                  : '1px solid var(--border)',
                borderRadius: 8,
                boxShadow: isOver ? '0 0 0 1px var(--accent)' : 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onDragOver={e => { e.preventDefault(); setDragOverCol(col.id); }}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={() => onDrop(col.id)}
            >
              {/* Column header */}
              <div
                className="flex items-center gap-2 shrink-0"
                style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}
              >
                <span style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: col.dotColor,
                  boxShadow: col.glowColor ? `0 0 6px ${col.glowColor}` : 'none',
                  flexShrink: 0,
                }} />
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.3px', color: 'var(--text)' }}>
                  {col.label}
                </span>
                <span style={{
                  marginLeft: 'auto',
                  fontSize: 9,
                  color: 'var(--text3)',
                  background: 'var(--surface2)',
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {colTasks.length}
                </span>
              </div>

              {/* Cards */}
              <div
                className="flex flex-col gap-2 overflow-y-auto flex-1"
                style={{ padding: 10 }}
              >
                {colTasks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text3)', fontSize: 10, lineHeight: 2 }}>
                    No tasks yet<br />Drop here or click +
                  </div>
                ) : (
                  colTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      isDragging={draggedId === task.id}
                      onDragStart={() => onDragStart(task.id)}
                      onDragEnd={onDragEnd}
                    />
                  ))
                )}
              </div>

              {/* Add button */}
              <button
                onClick={() => openModal(col.id)}
                style={{
                  margin: '6px 10px 10px',
                  padding: 7,
                  border: '1px dashed var(--border)',
                  borderRadius: 5,
                  fontSize: 10,
                  color: 'var(--text3)',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'transparent',
                  fontFamily: 'inherit',
                  transition: 'all 0.12s',
                  flexShrink: 0,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)';
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.05)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)';
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                }}
              >
                + Add Task
              </button>
            </div>
          );
        })}
      </div>

      {/* ── New Task Modal ── */}
      {isModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', zIndex: 900 }}
          onClick={e => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
        >
          <div
            style={{
              width: 480,
              background: 'var(--surface2)',
              border: '1px solid var(--border2)',
              borderRadius: 10,
              overflow: 'hidden',
              boxShadow: '0 30px 70px rgba(0,0,0,0.7)',
              animation: 'tf-scale-in 0.15s ease',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between" style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>✦ New Task</span>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 14 }}>✕</button>
            </div>

            {/* Body */}
            <div className="flex flex-col gap-3" style={{ padding: 16 }}>
              {/* Title */}
              <FormGroup label="Title">
                <input
                  autoFocus
                  className="w-full"
                  style={inputStyle}
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  placeholder="What needs to be done?"
                />
              </FormGroup>

              <div className="flex gap-2">
                <FormGroup label="Type">
                  <select style={inputStyle} value={taskType} onChange={e => setTaskType(e.target.value as any)}>
                    <option value="feature">Feature</option>
                    <option value="bug">Bug</option>
                    <option value="task">Task</option>
                    <option value="epic">Epic</option>
                  </select>
                </FormGroup>
                <FormGroup label="Priority">
                  <select style={inputStyle} value={taskPriority} onChange={e => setTaskPriority(e.target.value as any)}>
                    <option value="high">P0 — Critical</option>
                    <option value="medium">P1 — High</option>
                    <option value="low">P2 — Normal</option>
                  </select>
                </FormGroup>
              </div>

              <div className="flex gap-2">
                <FormGroup label="Assignee">
                  <select style={inputStyle} value={taskAssignee} onChange={e => setTaskAssignee(e.target.value)}>
                    <option value="AJ">Alice J.</option>
                    <option value="BK">Bob K.</option>
                  </select>
                </FormGroup>
                <FormGroup label="Due Date">
                  <input type="date" style={inputStyle} value={taskDue} onChange={e => setTaskDue(e.target.value)} />
                </FormGroup>
              </div>

              <FormGroup label="Column">
                <select style={inputStyle} value={taskCol} onChange={e => setTaskCol(e.target.value as TaskStatus)}>
                  {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </FormGroup>

              {/* AI assist */}
              <div className="flex items-center">
                <button
                  onClick={handleAiAssist}
                  disabled={!newTaskTitle || isAiLoading}
                  className="flex items-center gap-1.5"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--purple)', fontFamily: 'inherit', opacity: (!newTaskTitle || isAiLoading) ? 0.5 : 1 }}
                >
                  {isAiLoading
                    ? <Loader2 size={12} className="animate-spin" />
                    : <Sparkles size={12} />}
                  AI Suggest Plan
                </button>
              </div>

              {aiSuggestion && (
                <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 6, padding: '10px 12px', fontSize: 11 }}>
                  <div className="flex gap-2 mb-2">
                    <span style={{ color: 'var(--text3)' }}>Branch:</span>
                    <code style={{ color: 'var(--purple)', background: 'rgba(139,92,246,0.15)', padding: '1px 5px', borderRadius: 3 }}>
                      {aiSuggestion.branchNameSuggestion}
                    </code>
                  </div>
                  <div style={{ color: 'var(--text3)', marginBottom: 4 }}>Subtasks:</div>
                  <ul style={{ listStyle: 'disc', paddingLeft: 16, color: 'var(--text2)' }}>
                    {aiSuggestion.subtasks?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2" style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'var(--surface3)', border: '1px solid var(--border)', color: 'var(--text2)', padding: '6px 14px', borderRadius: 5, fontSize: 11, fontFamily: 'inherit', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTask}
                disabled={!newTaskTitle.trim()}
                style={{ background: 'var(--accent)', border: 'none', color: 'white', padding: '6px 14px', borderRadius: 5, fontSize: 11, fontFamily: 'inherit', fontWeight: 600, cursor: 'pointer', opacity: !newTaskTitle.trim() ? 0.5 : 1 }}
              >
                Create Task ↵
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   FormGroup helper
───────────────────────────────────────────── */
const FormGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex flex-col gap-1 flex-1">
    <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text3)' }}>{label}</div>
    {children}
  </div>
);

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 5,
  padding: '7px 10px',
  fontSize: 12,
  fontFamily: 'inherit',
  color: 'var(--text)',
  outline: 'none',
};