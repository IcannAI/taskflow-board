export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done';
export type Priority = 'low' | 'medium' | 'high';

export interface GitMetadata {
  branchName: string;
  commits: number;
  lastCommitMessage?: string;
  lastCommitHash?: string;
  repo: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  git?: GitMetadata;
  createdAt: string;
  tags: string[];
}

export interface User {
  username: string;
  avatarUrl: string;
}

export enum CommandType {
  NAVIGATE = 'NAVIGATE',
  ACTION = 'ACTION',
  TASK = 'TASK'
}

export interface Command {
  id: string;
  label: string;
  shortcut?: string;
  type: CommandType;
  action: () => void;
  keywords?: string[];
}