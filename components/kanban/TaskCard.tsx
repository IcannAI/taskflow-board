import React, { useState } from 'react';
import { GitBranch, GitCommit } from 'lucide-react';
import { Task, TaskStatus } from '../../types';
import { cn, formatDate } from '../../lib/utils';
import { useTaskStore } from '../../store/useTaskStore';
import { ASSIGNEE_COLORS } from './KanbanBoard';
import { showToast } from '../Layout';

/* ─────────────────────────────────────────────
   Props
───────────────────────────────────────────── */
interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const PRIORITY_BAR: Record<string, string> = {
  high:   'var(--red)',
  medium: 'var(--yellow)',
  low:    'var(--text3)',
};

const TAG_STYLES: Record<string, React.CSSProperties> = {
  bug:     { background: 'rgba(239,68,68,0.15)',   color: 'var(--red)',    border: '1px solid rgba(239,68,68,0.25)' },
  feature: { background: 'rgba(59,130,246,0.15)',  color: 'var(--accent)', border: '1px solid rgba(59,130,246,0.25)' },
  task:    { background: 'rgba(99,102,241,0.15)',  color: 'var(--purple)', border: '1px solid rgba(99,102,241,0.25)' },
  epic:    { background: 'rgba(245,158,11,0.15)',  color: 'var(--yellow)', border: '1px solid rgba(245,158,11,0.25)' },
  general: { background: 'rgba(74,85,104,0.2)',    color: 'var(--text3)',  border: '1px solid var(--border)' },
};

function getDueMeta(due?: string): { label: string; style: React.CSSProperties } | null {
  if (!due) return null;
  const today = new Date();
  const dueDate = new Date(due);
  const diff = Math.floor((dueDate.getTime() - today.getTime()) / 86400000);
  const label = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (diff < 0)              return { label: `⚠ ${label}`, style: { color: 'var(--red)' } };
  if (diff >= 0 && diff <= 2) return { label: `◷ ${label}`, style: { color: 'var(--yellow)' } };
  return { label: `◷ ${label}`, style: { color: 'var(--text3)' } };
}

/* ─────────────────────────────────────────────
   TaskCard Component
───────────────────────────────────────────── */
export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isDragging = false,
  onDragStart,
  onDragEnd,
}) => {
  const updateStatus = useTaskStore(s => s.updateTaskStatus);
  const [hovered, setHovered] = useState(false);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    const newStatus = e.target.value as TaskStatus;
    updateStatus(task.id, newStatus);
    const emoji = newStatus === 'done' ? '✅' : newStatus === 'in-progress' ? '🔄' : '📋';
    showToast(`${emoji} ${task.id} → ${newStatus}`);
    if (newStatus === 'done') {
      setTimeout(() => showToast(`⚡ Git Sync: ${task.id} auto-closing PR…`, 'git'), 700);
    }
  };

  const due = getDueMeta(task.createdAt ? undefined : undefined); // extend Task type with dueDate if needed
  const assigneeColor = ASSIGNEE_COLORS[task.assignee ?? ''] ?? '#6b7280';
  const priorityBar   = PRIORITY_BAR[task.priority] ?? 'var(--text3)';

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        background: hovered ? 'var(--surface3)' : 'var(--surface2)',
        border: `1px solid ${isDragging ? 'var(--accent)' : hovered ? 'var(--border2)' : 'var(--border)'}`,
        borderRadius: 6,
        padding: '10px 12px',
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.5 : 1,
        transition: 'all 0.15s',
        transform: hovered && !isDragging ? 'translateY(-1px)' : 'none',
        boxShadow: hovered && !isDragging ? '0 4px 16px rgba(0,0,0,0.3)' : 'none',
        overflow: 'hidden',
      }}
    >
      {/* Left priority bar */}
      <span style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 2,
        background: priorityBar,
        borderRadius: '6px 0 0 6px',
      }} />

      {/* Task ID row */}
      <div className="flex items-center justify-between mb-1" style={{ paddingLeft: 4 }}>
        <span style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: '0.5px' }}>
          {task.id}
          {task.git?.branchName && (
            <>
              {' · '}
              <span style={{ color: 'var(--green)' }}>⎇ {task.git.branchName}</span>
            </>
          )}
        </span>

        {/* Quick-status select (visible on hover) */}
        <select
          value={task.status}
          onChange={handleStatusChange}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 3,
            fontSize: 9,
            color: 'var(--text2)',
            fontFamily: 'inherit',
            padding: '1px 4px',
            cursor: 'pointer',
            outline: 'none',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.12s',
          }}
          onClick={e => e.stopPropagation()}
        >
          <option value="todo">Todo</option>
          <option value="in-progress">In Progress</option>
          <option value="review">Review</option>
          <option value="done">Done</option>
        </select>
      </div>

      {/* Title */}
      <h3 style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', lineHeight: 1.5, marginBottom: 8, paddingLeft: 4 }}>
        {task.title}
      </h3>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-2" style={{ paddingLeft: 4 }}>
        {task.tags.map(tag => (
          <span
            key={tag}
            style={{
              fontSize: 9,
              padding: '2px 6px',
              borderRadius: 3,
              fontWeight: 600,
              letterSpacing: '0.3px',
              textTransform: 'uppercase',
              ...( TAG_STYLES[tag] ?? TAG_STYLES.general ),
            }}
          >
            {tag}
          </span>
        ))}
        <span style={{
          fontSize: 9,
          padding: '2px 6px',
          borderRadius: 3,
          background: 'rgba(74,85,104,0.2)',
          color: 'var(--text3)',
          border: '1px solid var(--border)',
        }}>
          {task.priority === 'high' ? 'P0' : task.priority === 'medium' ? 'P1' : 'P2'}
        </span>
      </div>

      {/* Git section */}
      {task.git && (
        <div style={{
          margin: '6px 4px 8px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 5,
          padding: '6px 8px',
        }}>
          <div className="flex items-center gap-1.5 mb-1">
            <GitBranch size={11} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: 10, color: 'var(--accent)', fontFamily: 'inherit', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
              {task.git.branchName}
            </span>
          </div>
          <div className="flex items-center justify-between" style={{ fontSize: 9, color: 'var(--text3)' }}>
            <div className="flex items-center gap-1">
              <GitCommit size={10} />
              <span>{task.git.commits} commits</span>
            </div>
            {task.git.commits > 0 && (
              <span style={{
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.2)',
                color: 'var(--green)',
                padding: '1px 5px',
                borderRadius: 3,
                fontSize: 9,
              }}>
                ⎇ {task.git.commits} commits
              </span>
            )}
          </div>
        </div>
      )}

      {/* Footer: assignee + due */}
      <div className="flex items-center gap-1.5" style={{ paddingLeft: 4 }}>
        {task.assignee && (
          <span style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: assigneeColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 8,
            fontWeight: 700,
            color: 'white',
            flexShrink: 0,
          }}>
            {task.assignee}
          </span>
        )}

        {due && (
          <span style={{ fontSize: 9, ...due.style }}>{due.label}</span>
        )}
      </div>
    </div>
  );
};