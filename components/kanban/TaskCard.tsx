import React from 'react';
import { GitCommit, GitBranch, Calendar, MoreHorizontal, AlertCircle } from 'lucide-react';
import { Task } from '../../types';
import { cn, formatDate, getStatusColor } from '../../lib/utils';
import { useTaskStore } from '../../store/useTaskStore';

interface TaskCardProps {
  task: Task;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const updateStatus = useTaskStore(state => state.updateTaskStatus);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateStatus(task.id, e.target.value as any);
  };

  return (
    <div className="group bg-surface hover:bg-zinc-800/80 border border-border rounded-lg p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:border-zinc-700">
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-mono text-muted">{task.id}</span>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
           {/* Quick Status Select for this demo */}
           <select 
             value={task.status} 
             onChange={handleStatusChange}
             className="bg-zinc-900 border border-border text-xs rounded px-1 py-0.5 text-muted focus:outline-none focus:border-primary"
            >
               <option value="todo">Todo</option>
               <option value="in-progress">In Progress</option>
               <option value="review">Review</option>
               <option value="done">Done</option>
           </select>
        </div>
      </div>

      <h3 className="font-medium text-text text-sm mb-3 leading-tight">
        {task.title}
      </h3>

      {/* Git Integration Section */}
      {task.git && (
        <div className="mb-3 bg-zinc-900/50 rounded-md p-2 border border-zinc-800/50">
          <div className="flex items-center gap-2 mb-1.5">
            <GitBranch className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-mono text-primary truncate max-w-[150px]">
              {task.git.branchName}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted">
            <div className="flex items-center gap-1">
              <GitCommit className="w-3.5 h-3.5" />
              <span>{task.git.commits} commits</span>
            </div>
            {task.git.commits > 0 && (
                <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">
                    +{Math.floor(task.git.commits * 1.5)}h
                </span>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800/50">
        <div className="flex gap-2">
          {task.tags.map(tag => (
            <span key={tag} className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-full border border-zinc-700">
              {tag}
            </span>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
            {task.priority === 'high' && <AlertCircle className="w-4 h-4 text-red-500" />}
            {task.priority === 'medium' && <div className="w-2 h-2 rounded-full bg-yellow-500" />}
            {task.priority === 'low' && <div className="w-2 h-2 rounded-full bg-blue-500" />}
        </div>
      </div>
    </div>
  );
};