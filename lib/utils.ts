import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'todo': return 'bg-zinc-700 text-zinc-300';
    case 'in-progress': return 'bg-blue-600/20 text-blue-400 border-blue-600/30';
    case 'review': return 'bg-purple-600/20 text-purple-400 border-purple-600/30';
    case 'done': return 'bg-emerald-600/20 text-emerald-400 border-emerald-600/30';
    default: return 'bg-zinc-700';
  }
}