"use client";

import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import {
  Activity, CheckCircle2, Clock, Rocket,
  TrendingUp, Zap, GitCommitVertical,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useProjectAnalytics } from "@/hooks/use-analytics";
import { DeploymentStatus, Project } from "@/types/project";
import { formatDistanceToNow } from "date-fns";
import { getStatusConfig } from "./utils";

interface AnalyticsPanelProps {
  project: Project;
}

const STATUS_COLORS: Record<string, string> = {
  READY: "hsl(142, 71%, 45%)",
  FAILED: "hsl(0, 84%, 60%)",
  BUILDING: "hsl(43, 96%, 56%)",
  DEPLOYING: "hsl(217, 91%, 60%)",
  QUEUED: "hsl(240, 5%, 55%)",
  CANCELED: "hsl(25, 95%, 53%)",
  EXPIRED: "hsl(280, 67%, 50%)",
};

const formatDuration = (seconds: number): string => {
  if (seconds === 0) return "—";
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
};

export const AnalyticsPanel = ({ project }: AnalyticsPanelProps) => {
  const { analytics, isLoading } = useProjectAnalytics(project.id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card rounded-xl p-5 animate-pulse">
              <div className="h-4 w-24 bg-white/5 rounded mb-3" />
              <div className="h-8 w-16 bg-white/10 rounded" />
            </div>
          ))}
        </div>
        <div className="glass-card rounded-xl p-6 animate-pulse">
          <div className="h-[250px] bg-white/5 rounded" />
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Activity className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No Analytics Data</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Analytics will appear here once you have deployment activity for this project.
        </p>
      </div>
    );
  }

  // Prepare chart data
  const deploymentChartData = analytics.deploymentsOverTime.slice(-14).map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    success: d.success,
    failed: d.failed,
    total: d.total,
  }));

  const buildTimeChartData = analytics.buildTimeTrend
    .slice(-14)
    .filter((d) => d.avgDuration > 0)
    .map((d) => ({
      date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      duration: d.avgDuration,
    }));

  const statusPieData = Object.entries(analytics.statusDistribution)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      name: status,
      value: count,
      color: STATUS_COLORS[status] || "hsl(240, 5%, 55%)",
    }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* ── KPI Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={<Rocket className="w-4 h-4" />}
          iconColor="text-primary"
          label="Total Deployments"
          value={analytics.totalDeployments.toString()}
          subtext={`+${analytics.deploymentsThisWeek} this week`}
        />
        <KPICard
          icon={<Clock className="w-4 h-4" />}
          iconColor="text-accent"
          label="Avg Build Time"
          value={formatDuration(analytics.avgBuildTime)}
          subtext={`Fastest: ${formatDuration(analytics.fastestBuild)}`}
        />
        <KPICard
          icon={<CheckCircle2 className="w-4 h-4" />}
          iconColor="text-emerald-400"
          label="Success Rate"
          value={`${analytics.successRate}%`}
          subtext={
            <div className="mt-1 h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${analytics.successRate}%` }}
              />
            </div>
          }
        />
        <KPICard
          icon={<Zap className="w-4 h-4" />}
          iconColor="text-amber-400"
          label="Slowest Build"
          value={formatDuration(analytics.slowestBuild)}
          subtext={`vs avg ${formatDuration(analytics.avgBuildTime)}`}
        />
      </div>

      {/* ── Deployment Activity Chart ──────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Deployment Activity</CardTitle>
              <p className="text-xs text-muted-foreground">Last 14 days</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={deploymentChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="projColorSuccess" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="projColorFailed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 10%, 12%)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(240, 5%, 55%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(240, 5%, 55%)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(240, 10%, 6%)",
                    border: "1px solid hsl(240, 10%, 12%)",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "hsl(0, 0%, 98%)" }}
                />
                <Area type="monotone" dataKey="success" name="Successful" stroke="hsl(142, 71%, 45%)" strokeWidth={2} fillOpacity={1} fill="url(#projColorSuccess)" stackId="1" />
                <Area type="monotone" dataKey="failed" name="Failed" stroke="hsl(0, 84%, 60%)" strokeWidth={2} fillOpacity={1} fill="url(#projColorFailed)" stackId="1" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ── Build Time Trend + Status Distribution ─────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Build Time Trend */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                <Clock className="w-4 h-4 text-accent" />
              </div>
              <div>
                <CardTitle className="text-base">Build Time Trend</CardTitle>
                <p className="text-xs text-muted-foreground">Average duration per day</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {buildTimeChartData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                No completed builds yet
              </div>
            ) : (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={buildTimeChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 10%, 12%)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(240, 5%, 55%)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(240, 5%, 55%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}s`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(240, 10%, 6%)",
                        border: "1px solid hsl(240, 10%, 12%)",
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "hsl(0, 0%, 98%)" }}
                      formatter={(value: number) => [`${value}s`, "Avg Duration"]}
                    />
                    <Line type="monotone" dataKey="duration" stroke="hsl(270, 70%, 60%)" strokeWidth={2} dot={{ fill: "hsl(270, 70%, 60%)", r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-base">Status Distribution</CardTitle>
                <p className="text-xs text-muted-foreground">All-time breakdown</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {statusPieData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                No deployment data
              </div>
            ) : (
              <div className="h-[200px] flex items-center">
                <ResponsiveContainer width="50%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {statusPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(240, 10%, 6%)",
                        border: "1px solid hsl(240, 10%, 12%)",
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "hsl(0, 0%, 98%)" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {statusPieData.map((entry) => (
                    <div key={entry.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-muted-foreground capitalize">{entry.name.toLowerCase()}</span>
                      </div>
                      <span className="font-medium text-foreground">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Activity ────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <GitCommitVertical className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <p className="text-xs text-muted-foreground">Last 10 deployments</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {analytics.recentActivity.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No recent deployment activity
            </div>
          ) : (
            <div className="space-y-2">
              {analytics.recentActivity.map((item) => {
                const statusCfg = getStatusConfig(item.status as DeploymentStatus);
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <div className={cn("w-3 h-3 rounded-full", statusCfg.color)} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-muted-foreground">
                            {item.commitHash.slice(0, 7)}
                          </span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-sm text-foreground truncate max-w-[300px]">
                            {item.commitMessage || "No commit message"}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {item.branch} · {formatDistanceToNow(new Date(item.startedAt))} ago
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {item.duration !== undefined && item.duration !== null && (
                        <span className="text-xs text-muted-foreground">
                          {formatDuration(item.duration)}
                        </span>
                      )}
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] capitalize", statusCfg.text)}
                      >
                        {statusCfg.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// ── KPI Card Component ─────────────────────────────────────
interface KPICardProps {
  icon: React.ReactNode;
  iconColor: string;
  label: string;
  value: string;
  subtext: React.ReactNode;
}

const KPICard = ({ icon, iconColor, label, value, subtext }: KPICardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass-card rounded-xl p-5"
  >
    <div className="flex items-center gap-2 mb-2">
      <span className={iconColor}>{icon}</span>
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
    </div>
    <p className="text-3xl font-bold text-foreground">{value}</p>
    <div className="text-xs text-muted-foreground mt-2">{subtext}</div>
  </motion.div>
);

export default AnalyticsPanel;
