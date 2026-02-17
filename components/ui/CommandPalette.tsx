import React, { useEffect, useState, useRef } from 'react';
import { Command, Search, Terminal, LayoutDashboard, Kanban, Plus, Github } from 'lucide-react';
import Fuse from 'fuse.js';
import { useTaskStore } from '../../store/useTaskStore';
import { cn } from '../../lib/utils';
import { Task } from '../../types';

interface CommandPaletteProps {
  setView: (view: 'dashboard' | 'kanban') => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ setView }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const tasks = useTaskStore((state) => state.tasks);

  // Fuse configuration
  const fuse = new Fuse(tasks, {
    keys: ['title', 'id', 'tags', 'git.branchName'],
    threshold: 0.4,
  });

  const searchResults = query ? fuse.search(query).map(result => result.item) : [];

  // Static commands
  const commands = [
    { id: 'cmd-new', title: 'Create New Task', icon: Plus, action: () => alert("Shortcut triggered: Create Task") },
    { id: 'cmd-board', title: 'Go to Board', icon: Kanban, action: () => setView('kanban') },
    { id: 'cmd-dash', title: 'Go to Dashboard', icon: LayoutDashboard, action: () => setView('dashboard') },
  ];

  const displayedItems = query.startsWith('>') 
    ? commands // Command mode
    : query 
      ? searchResults // Search mode
      : commands; // Default mode

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
        setTimeout(() => inputRef.current?.focus(), 50);
        setQuery('');
        setSelectedIndex(0);
    }
  }, [isOpen]);

  const execute = (index: number) => {
      const item = displayedItems[index];
      if ('action' in item) {
          (item as any).action();
          setIsOpen(false);
      } else {
          // It's a task, maybe navigate to details (mocked)
          console.log("Navigating to task", item);
          setIsOpen(false);
      }
  };

  const handleInputKey = (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % displayedItems.length);
      }
      if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + displayedItems.length) % displayedItems.length);
      }
      if (e.key === 'Enter') {
          e.preventDefault();
          if (displayedItems.length > 0) execute(selectedIndex);
      }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm" 
        onClick={() => setIsOpen(false)}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-surface border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center px-4 py-3 border-b border-border">
          <Terminal className="w-5 h-5 text-muted mr-3" />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent border-none outline-none text-lg text-text placeholder:text-muted/50"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
            }}
            onKeyDown={handleInputKey}
          />
          <div className="flex gap-2">
            <span className="text-xs bg-border px-2 py-1 rounded text-muted">ESC</span>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto py-2">
            {displayedItems.length === 0 && (
                <div className="px-4 py-8 text-center text-muted">No results found.</div>
            )}
            
            {displayedItems.map((item, index) => {
                const isTask = 'status' in item;
                return (
                    <div
                        key={isTask ? (item as Task).id : (item as any).id}
                        className={cn(
                            "px-4 py-3 flex items-center cursor-pointer transition-colors mx-2 rounded-lg",
                            index === selectedIndex ? "bg-primary/10 text-primary" : "text-text hover:bg-zinc-800"
                        )}
                        onClick={() => execute(index)}
                        onMouseEnter={() => setSelectedIndex(index)}
                    >
                        {isTask ? (
                            // Task Result
                            <div className="flex flex-col gap-1 w-full">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-sm">{(item as Task).title}</span>
                                    <span className="text-xs font-mono opacity-50">{(item as Task).id}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs opacity-60">
                                    <span className={cn(
                                        "w-2 h-2 rounded-full",
                                        (item as Task).status === 'done' ? 'bg-emerald-500' : 
                                        (item as Task).status === 'in-progress' ? 'bg-blue-500' : 'bg-zinc-500'
                                    )} />
                                    <span>{(item as Task).status}</span>
                                    {(item as Task).git && (
                                        <div className="flex items-center gap-1 ml-auto">
                                            <Github className="w-3 h-3" />
                                            <span className="font-mono">{(item as Task).git?.branchName}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            // Command Result
                            <div className="flex items-center gap-3">
                                {React.createElement((item as any).icon, { className: "w-4 h-4" })}
                                <span>{(item as any).title}</span>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
        
        <div className="bg-zinc-900/50 px-4 py-2 border-t border-border flex items-center justify-between text-xs text-muted">
            <div className="flex gap-3">
                <span><strong className="text-text font-mono">Cmd+K</strong> to open</span>
                <span><strong className="text-text font-mono">&gt;</strong> for commands</span>
            </div>
            <span>TaskFlow CLI</span>
        </div>
      </div>
    </div>
  );
};