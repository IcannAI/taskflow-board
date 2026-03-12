import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task, TaskStatus } from '../types';
import { mockTasks } from '../fixtures/mockData';

interface TaskState {
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  deleteTask: (id: string) => void;
  updateTaskGitInfo: (id: string, commits: number, lastMsg: string) => void;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set) => ({
      tasks: mockTasks,

      addTask: (task) =>
        set((state) => ({ tasks: [...state.tasks, task] })),

      updateTaskStatus: (id, status) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, status } : t
          ),
        })),

      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        })),

      updateTaskGitInfo: (id, commits, lastMsg) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  git: t.git
                    ? { ...t.git, commits, lastCommitMessage: lastMsg }
                    : undefined,
                }
              : t
          ),
        })),
    }),
    {
      name: 'taskflow-storage',
      partialize: (state) => ({ tasks: state.tasks }),
    }
  )
);
