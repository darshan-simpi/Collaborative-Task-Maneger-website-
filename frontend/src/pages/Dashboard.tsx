import { useAuth } from "@/lib/auth";
import { useGetTasks, useGetActivityLogs } from "@workspace/api-client-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import { format } from "date-fns";
import { Link } from "wouter";
import { Clock, CheckCircle2, ListTodo, Activity, ArrowRight, AlertCircle, PieChart as PieChartIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const STATUS_COLORS = {
  pending: "hsl(var(--muted-foreground))",
  in_progress: "hsl(var(--primary))",
  completed: "hsl(var(--success))",
};

export default function Dashboard() {
  const { user, isManager } = useAuth();
  
  // Get lots of tasks for accurate stats. In a real app, backend would provide a /stats endpoint.
  const { data: tasksData, isLoading: tasksLoading } = useGetTasks({
    limit: 100,
    ...(isManager ? { createdByMe: true } : { assignedToMe: true }),
  });

  const { data: logsData } = useGetActivityLogs({ limit: 5 });

  const tasks = tasksData?.tasks || [];
  
  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === "pending").length,
    inProgress: tasks.filter(t => t.status === "in_progress").length,
    completed: tasks.filter(t => t.status === "completed").length,
    highPriority: tasks.filter(t => t.priority === "high" && t.status !== "completed").length,
  };

  const chartData = [
    { name: "Pending", value: stats.pending, color: STATUS_COLORS.pending },
    { name: "In Progress", value: stats.inProgress, color: STATUS_COLORS.in_progress },
    { name: "Completed", value: stats.completed, color: STATUS_COLORS.completed },
  ].filter(d => d.value > 0);

  if (tasksLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold">Welcome back, {user?.name.split(' ')[0]}! 👋</h2>
          <p className="text-muted-foreground mt-1 text-lg">
            {isManager ? "Here's the status of tasks you've created." : "Here's what's on your plate today."}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard title="Total Tasks" value={stats.total} icon={<ListTodo size={24} />} color="bg-accent" textColor="text-foreground" />
        <StatCard title="Pending" value={stats.pending} icon={<Clock size={24} />} color="bg-muted" textColor="text-muted-foreground" />
        <StatCard title="In Progress" value={stats.inProgress} icon={<Activity size={24} />} color="bg-primary/10" textColor="text-primary" />
        <StatCard title="Completed" value={stats.completed} icon={<CheckCircle2 size={24} />} color="bg-success/10" textColor="text-success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-1 bg-card rounded-2xl p-6 border border-border/50 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold font-display mb-6">Task Distribution</h3>
          {chartData.length > 0 ? (
            <div className="flex-1 min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: 'var(--foreground)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <PieChartIcon size={48} className="mb-2 opacity-20" />
              <p>No task data to display</p>
            </div>
          )}
        </div>

        {/* Priority & Recent Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {stats.highPriority > 0 && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 sm:p-6 flex items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center text-destructive shrink-0">
                <AlertCircle size={24} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-destructive">Attention Needed</h4>
                <p className="text-sm text-destructive/80">You have {stats.highPriority} high priority tasks that aren't completed.</p>
              </div>
              <Link href="/tasks?priority=high" className="shrink-0">
                <span className="text-sm font-semibold text-destructive hover:underline cursor-pointer">View them</span>
              </Link>
            </div>
          )}

          <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold font-display">Recent Activity</h3>
              <Link href="/tasks" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                View all tasks <ArrowRight size={14} />
              </Link>
            </div>
            
            <div className="space-y-6">
              {logsData?.logs && logsData.logs.length > 0 ? (
                logsData.logs.map((log) => (
                  <div key={log.id} className="flex gap-4 relative">
                    <div className="absolute left-4 top-10 bottom-[-24px] w-[2px] bg-border last:hidden" />
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-foreground shrink-0 z-10">
                      {log.user.name[0]}
                    </div>
                    <div>
                      <p className="text-sm">
                        <span className="font-semibold text-foreground">{log.user.name}</span>{" "}
                        <span className="text-muted-foreground">{log.action}</span>{" "}
                        <Link href={`/tasks/${log.task.id}`} className="font-medium hover:text-primary hover:underline">
                          "{log.task.title}"
                        </Link>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(log.createdAt), "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No recent activity.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, textColor }: { title: string, value: number, icon: React.ReactNode, color: string, textColor: string }) {
  return (
    <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-muted-foreground">{title}</h4>
        <div className={`w-10 h-10 rounded-xl ${color} ${textColor} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <div className="text-4xl font-display font-bold">{value}</div>
    </div>
  );
}
