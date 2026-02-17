import React from 'react';
import { LayoutDashboard, Kanban, Settings, Command, Search, User, Layers, Boxes } from 'lucide-react';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  currentView: 'KANBAN' | 'DASHBOARD';
  onViewChange: (view: 'KANBAN' | 'DASHBOARD') => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onViewChange }) => {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-16 lg:w-64 bg-surface border-r border-border flex flex-col justify-between shrink-0">
        <div>
          <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-border">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Boxes className="w-5 h-5 text-white" />
            </div>
            <span className="ml-3 font-bold text-lg hidden lg:block tracking-tight">TaskFlow</span>
          </div>

          <nav className="p-4 space-y-2">
            <button
              onClick={() => onViewChange('KANBAN')}
              className={cn(
                "w-full flex items-center p-3 rounded-lg transition-colors group",
                currentView === 'KANBAN' ? "bg-primary/10 text-primary" : "text-muted hover:text-text hover:bg-zinc-800"
              )}
            >
              <Kanban className="w-5 h-5" />
              <span className="ml-3 font-medium text-sm hidden lg:block">Kanban</span>
            </button>
            <button
              onClick={() => onViewChange('DASHBOARD')}
              className={cn(
                "w-full flex items-center p-3 rounded-lg transition-colors group",
                currentView === 'DASHBOARD' ? "bg-primary/10 text-primary" : "text-muted hover:text-text hover:bg-zinc-800"
              )}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="ml-3 font-medium text-sm hidden lg:block">Analytics</span>
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-border space-y-4">
             {/* Cmd+K Hint */}
            <div className="hidden lg:flex items-center justify-between bg-zinc-900 p-2 rounded border border-zinc-800 text-xs text-muted cursor-default">
                <div className="flex items-center gap-2">
                    <Search className="w-3 h-3" />
                    <span>Search</span>
                </div>
                <kbd className="bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700 font-mono">⌘K</kbd>
            </div>

            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800 cursor-pointer transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden lg:block overflow-hidden">
                    <p className="text-sm font-medium truncate">Dev User</p>
                    <p className="text-xs text-muted truncate">@github/dev</p>
                </div>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background">
        <header className="h-16 border-b border-border flex items-center justify-between px-6 shrink-0 lg:hidden">
            <span className="font-bold">TaskFlow</span>
            <button className="p-2">
                <Settings className="w-5 h-5" />
            </button>
        </header>
        <div className="flex-1 overflow-auto p-4 lg:p-8">
            <div className="max-w-7xl mx-auto h-full">
                {children}
            </div>
        </div>
      </main>
    </div>
  );
};