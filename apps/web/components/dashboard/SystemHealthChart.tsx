import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMockStore } from '@/stores/useMockStore';
import { Activity } from 'lucide-react';

const SystemHealthChart = () => {
  const { analytics } = useMockStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="col-span-2"
    >
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Activity className="w-4 h-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">System Health</CardTitle>
                <p className="text-xs text-muted-foreground">Real-time request monitoring</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">
                {analytics[analytics.length - 1]?.requests.toLocaleString()}
              </p>
              <p className="text-xs text-success">+12.5% from last hour</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(238, 83%, 67%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(238, 83%, 67%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 10%, 12%)" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fill: 'hsl(240, 5%, 55%)' }}
                  axisLine={{ stroke: 'hsl(240, 10%, 12%)' }}
                  tickLine={false}
                  interval={1}
                  minTickGap={0}
                  tickMargin={8}
                  allowDuplicatedCategory={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'hsl(240, 5%, 55%)' }}
                  axisLine={{ stroke: 'hsl(240, 10%, 12%)' }}
                  tickLine={false}
                  tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(240, 10%, 6%)',
                    border: '1px solid hsl(240, 10%, 12%)',
                    borderRadius: '8px',
                    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)',
                  }}
                  labelStyle={{ color: 'hsl(0, 0%, 98%)' }}
                  itemStyle={{ color: 'hsl(238, 83%, 67%)' }}
                />
                <Area
                  type="monotone"
                  dataKey="requests"
                  stroke="hsl(238, 83%, 67%)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRequests)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SystemHealthChart;
