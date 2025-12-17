import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { Activity, TrendingUp } from 'lucide-react';
import { useMockStore } from '@/stores/useMockStore';

export const SystemHealthChart = () => {
  const { analytics } = useMockStore();

  const totalRequests = analytics.reduce((acc, curr) => acc + curr.requests, 0);
  const avgRequests = Math.round(totalRequests / analytics.length);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card p-6 col-span-2 row-span-2"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">System Health</h3>
            <p className="text-sm text-muted-foreground">Requests per minute (24h)</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-emerald-400">
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm font-medium">+12.5%</span>
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-6">
        <span className="text-4xl font-bold gradient-text">{avgRequests.toLocaleString()}</span>
        <span className="text-muted-foreground">avg req/min</span>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={analytics}>
            <defs>
              <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(239, 84%, 67%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(270, 80%, 60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(240, 5%, 55%)', fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(240, 10%, 8%)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)',
              }}
              labelStyle={{ color: 'hsl(0, 0%, 98%)' }}
              itemStyle={{ color: 'hsl(239, 84%, 67%)' }}
            />
            <Area
              type="monotone"
              dataKey="requests"
              stroke="hsl(239, 84%, 67%)"
              strokeWidth={2}
              fill="url(#colorRequests)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};
