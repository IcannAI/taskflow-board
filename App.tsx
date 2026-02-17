import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { KanbanBoard } from './components/kanban/KanbanBoard';
import { Dashboard } from './components/Dashboard';
import { CommandPalette } from './components/ui/CommandPalette';

enum View {
  KANBAN = 'KANBAN',
  DASHBOARD = 'DASHBOARD'
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.KANBAN);

  return (
    <div className="min-h-screen bg-background text-text font-sans antialiased selection:bg-primary/30">
      <CommandPalette setView={(view) => setCurrentView(view === 'dashboard' ? View.DASHBOARD : View.KANBAN)} />
      
      <Layout currentView={currentView} onViewChange={setCurrentView}>
        {currentView === View.KANBAN ? (
          <KanbanBoard />
        ) : (
          <Dashboard />
        )}
      </Layout>
    </div>
  );
};

export default App;