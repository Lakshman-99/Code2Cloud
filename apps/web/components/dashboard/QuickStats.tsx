import { motion } from 'framer-motion';
import { Zap, Globe, Server, Shield } from 'lucide-react';

const stats = [
  { 
    icon: Zap, 
    label: 'Avg Response', 
    value: '42ms', 
    change: '-8%',
    positive: true,
    gradient: 'from-amber-500/20 to-orange-500/20',
    iconColor: 'text-amber-400'
  },
  { 
    icon: Globe, 
    label: 'Edge Regions', 
    value: '12', 
    change: '+2',
    positive: true,
    gradient: 'from-blue-500/20 to-indigo-500/20',
    iconColor: 'text-blue-400'
  },
  { 
    icon: Server, 
    label: 'Uptime', 
    value: '99.99%', 
    change: 'SLA',
    positive: true,
    gradient: 'from-emerald-500/20 to-teal-500/20',
    iconColor: 'text-emerald-400'
  },
  { 
    icon: Shield, 
    label: 'SSL Status', 
    value: 'Active', 
    change: 'Valid',
    positive: true,
    gradient: 'from-purple-500/20 to-pink-500/20',
    iconColor: 'text-purple-400'
  },
];

export const QuickStats = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass-card p-6"
    >
      <h3 className="text-lg font-semibold text-foreground mb-6">Platform Status</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <span className="text-xs text-emerald-400">{stat.change}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
