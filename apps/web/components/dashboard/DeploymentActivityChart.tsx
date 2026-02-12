"use client";

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';
import { DeploymentTimePoint } from '@/types/analytics';

interface DeploymentActivityChartProps {
  data: DeploymentTimePoint[];
  deploymentsThisWeek: number;
}

const DeploymentActivityChart = ({ data, deploymentsThisWeek }: DeploymentActivityChartProps) => {
  // Show last 14 days for the chart
  const chartData = data.slice(-14).map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    total: d.total,
    success: d.success,
    failed: d.failed,
  }));

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
                <CardTitle className="text-base">Deployment Activity</CardTitle>
                <p className="text-xs text-muted-foreground">Deployments over the last 14 days</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">
                {deploymentsThisWeek}
              </p>
              <p className="text-xs text-muted-foreground">this week</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 10%, 12%)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: 'hsl(240, 5%, 55%)' }}
                  axisLine={{ stroke: 'hsl(240, 10%, 12%)' }}
                  tickLine={false}
                  interval="preserveStartEnd"
                  tickMargin={8}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'hsl(240, 5%, 55%)' }}
                  axisLine={{ stroke: 'hsl(240, 10%, 12%)' }}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(240, 10%, 6%)',
                    border: '1px solid hsl(240, 10%, 12%)',
                    borderRadius: '8px',
                    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)',
                  }}
                  labelStyle={{ color: 'hsl(0, 0%, 98%)' }}
                />
                <Area
                  type="monotone"
                  dataKey="success"
                  name="Successful"
                  stroke="hsl(142, 71%, 45%)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSuccess)"
                  stackId="1"
                />
                <Area
                  type="monotone"
                  dataKey="failed"
                  name="Failed"
                  stroke="hsl(0, 84%, 60%)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorFailed)"
                  stackId="1"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DeploymentActivityChart;
