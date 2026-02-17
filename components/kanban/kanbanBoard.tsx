import React, { useState } from 'react';
import { Plus, Sparkles, Loader2 } from 'lucide-react';
import { useTaskStore } from '../../store/useTaskStore';
import { Task, TaskStatus } from '../../types';
import { TaskCard } from './TaskCard';
import { generateTaskPlan } from '../../services/geminiService';
import { cn } from '../../lib/utils';

const columns: { id: TaskStatus; label: string }[] = [
  { id: 'todo', label: 'To Do' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'review', label: 'Code Review' },
  { id: 'done', label: 'Done' },
];

export const KanbanBoard: React.FC = () => {
  const tasks = useTaskStore((state) => state.tasks);
  const addTask = useTaskStore((state) => state.addTask);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);

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

  const handleCreateTask = () => {
    if (!newTaskTitle) return;
    
    const newTask: Task = {
        id: `TASK-${Math.floor(Math.random() * 10000)}`,
        title: newTaskTitle,
        status: 'todo',
        priority: 'medium',
        createdAt: new Date().toISOString(),
        tags: ['general'],
        git: aiSuggestion ? {
            branchName: aiSuggestion.branchNameSuggestion,
            commits: 0,
            repo: 'taskflow-web'
        } : undefined
    };

    addTask(newTask);
    setNewTaskTitle('');
    setAiSuggestion(null);
    setIsModalOpen(false);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Sprint Board</h1>
        <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-blue-600 px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors"
        >
            <Plus className="w-4 h-4" />
            New Task
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-hidden min-h-[500px]">
        {columns.map((col) => (
          <div key={col.id} className="flex flex-col h-full bg-zinc-900/30 rounded-xl border border-zinc-800/50">
            <div className="p-4 border-b border-zinc-800/50 flex items-center justify-between">
                <span className="font-semibold text-sm text-zinc-300">{col.label}</span>
                <span className="bg-zinc-800 text-zinc-500 text-xs px-2 py-0.5 rounded-full font-mono">
                    {tasks.filter(t => t.status === col.id).length}
                </span>
            </div>
            <div className="flex-1 p-3 overflow-y-auto space-y-3 custom-scrollbar">
              {tasks
                .filter((task) => task.status === col.id)
                .map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-surface border border-border w-full max-w-md p-6 rounded-xl shadow-2xl">
                <h3 className="text-lg font-bold mb-4">Create New Task</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-muted mb-1">Task Title</label>
                        <input 
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-sm focus:border-primary outline-none"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            placeholder="e.g., Refactor Login Component"
                        />
                    </div>

                    <div className="flex items-center justify-between">
                         <button 
                            type="button"
                            onClick={handleAiAssist}
                            disabled={!newTaskTitle || isAiLoading}
                            className="text-xs flex items-center gap-1.5 text-purple-400 hover:text-purple-300 disabled:opacity-50"
                        >
                            {isAiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            AI Suggest Plan
                        </button>
                    </div>

                    {aiSuggestion && (
                        <div className="bg-purple-900/20 border border-purple-500/30 rounded-md p-3 text-xs space-y-2">
                             <div className="flex gap-2">
                                <span className="text-muted">Branch:</span>
                                <code className="text-purple-300 bg-purple-900/40 px-1 rounded">{aiSuggestion.branchNameSuggestion}</code>
                             </div>
                             <div>
                                <span className="text-muted block mb-1">Suggested Subtasks:</span>
                                <ul className="list-disc list-inside text-zinc-300 pl-1">
                                    {aiSuggestion.subtasks.map((s: string, i: number) => (
                                        <li key={i}>{s}</li>
                                    ))}
                                </ul>
                             </div>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 rounded-md"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleCreateTask}
                            disabled={!newTaskTitle}
                            className="flex-1 px-4 py-2 text-sm bg-primary hover:bg-blue-600 disabled:opacity-50 rounded-md text-white font-medium"
                        >
                            Create
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};