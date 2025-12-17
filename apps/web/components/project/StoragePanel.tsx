"use client";

import { motion } from 'framer-motion';
import { Database, Copy, HardDrive, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const usageData = [
  { time: '1w', storage: 120 },
  { time: '2w', storage: 145 },
  { time: '3w', storage: 160 },
  { time: '4w', storage: 178 },
  { time: '5w', storage: 195 },
  { time: '6w', storage: 220 },
  { time: '7w', storage: 248 },
];

export const StoragePanel = () => {
  const copyConnectionString = () => {
    navigator.clipboard.writeText('postgresql://user:****@db.code2cloud.dev:5432/main');
    toast.success('Connection string copied');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Database Card */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
              <Database className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">PostgreSQL Database</h3>
              <p className="text-sm text-muted-foreground">Managed database instance</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="status-dot status-dot-ready" />
            <span className="text-sm text-emerald-400">Connected</span>
          </div>
        </div>

        {/* Connection String */}
        <div className="bg-zinc-950 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Connection String</span>
            <Button variant="ghost" size="sm" onClick={copyConnectionString} className="gap-2">
              <Copy className="w-3 h-3" />
              Copy
            </Button>
          </div>
          <code className="text-sm text-foreground font-mono break-all">
            postgresql://user:****@db.code2cloud.dev:5432/main
          </code>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white/5">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <HardDrive className="w-4 h-4" />
              <span className="text-sm">Storage Used</span>
            </div>
            <p className="text-2xl font-bold text-foreground">248 MB</p>
            <p className="text-xs text-muted-foreground mt-1">of 1 GB limit</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Database className="w-4 h-4" />
              <span className="text-sm">Tables</span>
            </div>
            <p className="text-2xl font-bold text-foreground">12</p>
            <p className="text-xs text-muted-foreground mt-1">Active tables</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Activity className="w-4 h-4" />
              <span className="text-sm">Queries/min</span>
            </div>
            <p className="text-2xl font-bold text-foreground">1.2k</p>
            <p className="text-xs text-muted-foreground mt-1">Avg last hour</p>
          </div>
        </div>
      </div>

      {/* Usage Chart */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">Storage Growth</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={usageData}>
              <defs>
                <linearGradient id="colorStorage" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(240, 5%, 55%)', fontSize: 12 }}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(240, 10%, 8%)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(0, 0%, 98%)' }}
                formatter={(value: number) => [`${value} MB`, 'Storage']}
              />
              <Area
                type="monotone"
                dataKey="storage"
                stroke="hsl(142, 71%, 45%)"
                strokeWidth={2}
                fill="url(#colorStorage)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
};
