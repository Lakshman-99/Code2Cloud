"use client";

import { motion } from 'framer-motion';
import { Database, Copy, HardDrive, Server } from 'lucide-react';
import { toast } from 'sonner';
import { XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Line, LineChart } from 'recharts';


export const StoragePanel = () => {
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const storageData = Array.from({ length: 7 }, (_, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    // eslint-disable-next-line react-hooks/purity
    usage: Math.floor(Math.random() * 500) + 200,
  }));

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

        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-secondary/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Connection String</span>
              <button
                onClick={() =>
                  handleCopy('postgres://user:****@db.code2cloud.dev:5432/production')
                }
                className="p-1.5 rounded hover:bg-secondary transition-colors"
              >
                <Copy className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <code className="text-sm text-foreground font-mono block truncate">
              postgres://user:****@db.code2cloud.dev:5432/production
            </code>
          </div>

          <div className="p-4 rounded-lg bg-secondary/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pooled Connection</span>
              <button
                onClick={() =>
                  handleCopy('postgres://user:****@pooler.code2cloud.dev:6543/production')
                }
                className="p-1.5 rounded hover:bg-secondary transition-colors"
              >
                <Copy className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <code className="text-sm text-foreground font-mono block truncate">
              postgres://user:****@pooler.code2cloud.dev:6543/production
            </code>
          </div>
        </div>
      </div>

      {/* Storage Usage */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <HardDrive className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">Database Size</span>
          </div>
          <p className="text-2xl font-bold text-foreground">2.4 GB</p>
          <p className="text-xs text-muted-foreground mt-1">of 10 GB limit</p>
          <div className="mt-3 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full w-[24%] gradient-primary rounded-full" />
          </div>
        </div>

        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <Server className="w-5 h-5 text-accent" />
            <span className="text-sm text-muted-foreground">Blob Storage</span>
          </div>
          <p className="text-2xl font-bold text-foreground">847 MB</p>
          <p className="text-xs text-muted-foreground mt-1">1,234 files</p>
          <div className="mt-3 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full w-[8%] bg-accent rounded-full" />
          </div>
        </div>

        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <Database className="w-5 h-5 text-success" />
            <span className="text-sm text-muted-foreground">KV Storage</span>
          </div>
          <p className="text-2xl font-bold text-foreground">156 KB</p>
          <p className="text-xs text-muted-foreground mt-1">89 keys</p>
          <div className="mt-3 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full w-[2%] bg-success rounded-full" />
          </div>
        </div>
      </div>

      {/* Usage Chart */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">Storage Usage (Last 7 Days)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={storageData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 4%, 16%)" />
            <XAxis
              dataKey="day"
              stroke="hsl(240, 5%, 55%)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(240, 5%, 55%)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}MB`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(240, 6%, 8%)',
                border: '1px solid hsl(240, 4%, 16%)',
                borderRadius: '8px',
              }}
              labelStyle={{ color: 'hsl(240, 5%, 96%)' }}
            />
            <Line
              type="monotone"
              dataKey="usage"
              stroke="hsl(270, 70%, 60%)"
              strokeWidth={2}
              dot={{ fill: 'hsl(270, 70%, 60%)', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};
