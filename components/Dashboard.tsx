import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';
import { Activity, Clock, GitCommit, Zap, GitBranch } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';

// Custom Tooltip for Recharts
const CustomTooltip = ({ active, payload, label }: TooltipProps<any, any>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface border border-border p-2 rounded shadow-lg text-xs">
        <p className="font-semibold text-text">{label}</p>
        <p className="text-primary">Commits: {payload[0].value}</p>
      </div>
    );
  }
  return null;
};

export const Dashboard: React.FC = () => {
  const tasks = useTaskStore((state) => state.tasks);

  // Calculate stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const totalCommits = tasks.reduce((acc, t) => acc + (t.git?.commits || 0), 0);
  
  // Data for chart
  const data = tasks.map(t => ({
      name: t.title.substring(0, 10) + '...',
      commits: t.git?.commits || 0
  })).filter(d => d.commits > 0);

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
      <div className="bg-surface border border-border p-6 rounded-xl flex items-center gap-4">
          <div className={`p-3 rounded-lg bg-zinc-900 ${color}`}>
              <Icon className="w-6 h-6" />
          </div>
          <div>
              <p className="text-sm text-muted">{label}</p>
              <h4 className="text-2xl font-bold">{value}</h4>
          </div>
      </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold tracking-tight">Developer Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Activity} label="Active Tasks" value={totalTasks - completedTasks} color="text-blue-400" />
        <StatCard icon={Zap} label="Completion Rate" value={`${totalTasks ? Math.round((completedTasks/totalTasks)*100) : 0}%`} color="text-yellow-400" />
        <StatCard icon={GitCommit} label="Total Commits" value={totalCommits} color="text-emerald-400" />
        <StatCard icon={Clock} label="Est. Hours" value={Math.floor(totalCommits * 1.5)} color="text-purple-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-6 min-h-[300px]">
            <h3 className="text-lg font-semibold mb-6">Commit Activity per Task</h3>
            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <XAxis 
                            dataKey="name" 
                            stroke="#52525b" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false}
                        />
                        <YAxis 
                            stroke="#52525b" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{fill: '#27272a'}} />
                        <Bar dataKey="commits" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-surface border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Git Events</h3>
            <div className="space-y-4">
                {tasks.filter(t => t.git && t.git.commits > 0).slice(0, 4).map(t => (
                    <div key={t.id} className="flex gap-3 items-start">
                        <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                        <div>
                            <p className="text-sm font-medium">{t.git?.lastCommitMessage}</p>
                            <p className="text-xs text-muted flex items-center gap-1 mt-1">
                                <GitBranch className="w-3 h-3" />
                                {t.git?.branchName}
                            </p>
                        </div>
                    </div>
                ))}
                {tasks.filter(t => t.git?.commits).length === 0 && (
                    <p className="text-sm text-muted">No recent git activity detected.</p>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};