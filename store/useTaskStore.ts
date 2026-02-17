import { create } from 'zustand';
import { Task, TaskStatus } from '../types';

interface TaskState {
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  deleteTask: (id: string) => void;
  updateTaskGitInfo: (id: string, commits: number, lastMsg: string) => void;
}

// Mock Data for demonstration
const mockTasks: Task[] = [
  {
    id: 'TASK-101',
    title: 'Implement Authentication Middleware',
    status: 'in-progress',
    priority: 'high',
    createdAt: new Date().toISOString(),
    tags: ['backend', 'security'],
    git: {
      branchName: 'feat/auth-middleware',
      commits: 12,
      lastCommitMessage: 'feat: add jwt verification',
      lastCommitHash: 'a1b2c3d',
      repo: 'taskflow-api'
    }
  },
  {
    id: 'TASK-102',
    title: 'Design Command Palette UI',
    status: 'review',
    priority: 'medium',
    createdAt: new Date().toISOString(),
    tags: ['frontend', 'ui/ux'],
    git: {
      branchName: 'feat/cmd-palette',
      commits: 8,
      lastCommitMessage: 'fix: z-index issues on modal',
      lastCommitHash: 'e5f6g7h',
      repo: 'taskflow-web'
    }
  },
  {
    id: 'TASK-103',
    title: 'Setup SQLite Database',
    status: 'done',
    priority: 'high',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    tags: ['database', 'infra'],
    git: {
      branchName: 'chore/db-setup',
      commits: 4,
      lastCommitMessage: 'chore: initial migration',
      lastCommitHash: '9i8j7k6',
      repo: 'taskflow-core'
    }
  },
  {
    id: 'TASK-104',
    title: 'Optimize Git Sync Polling',
    status: 'todo',
    priority: 'low',
    createdAt: new Date().toISOString(),
    tags: ['performance', 'worker'],
    git: {
      branchName: 'refactor/sync-engine',
      commits: 0,
      repo: 'taskflow-worker'
    }
  }
];

export const useTaskStore = create<TaskState>((set) => ({
  tasks: mockTasks,
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  updateTaskStatus: (id, status) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
    })),
  deleteTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    })),
  updateTaskGitInfo: (id, commits, lastMsg) => 
    set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? {
            ...t,
            git: t.git ? { ...t.git, commits, lastCommitMessage: lastMsg } : undefined
        } : t)
    }))
}));