import { motion } from 'framer-motion';
import { GitCommit, Hammer, TestTube, Globe, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PipelineStep {
  icon: typeof GitCommit;
  label: string;
  status: 'completed' | 'active' | 'pending';
}

const steps: PipelineStep[] = [
  { icon: GitCommit, label: 'Source', status: 'completed' },
  { icon: Hammer, label: 'Build', status: 'completed' },
  { icon: TestTube, label: 'Tests', status: 'completed' },
  { icon: Globe, label: 'Assign Domains', status: 'active' },
  { icon: Check, label: 'Ready', status: 'pending' },
];

export const PipelineVisualizer = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card p-6"
    >
      <h3 className="text-lg font-semibold text-foreground mb-6">Deployment Pipeline</h3>
      
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.label} className="flex items-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="flex flex-col items-center"
            >
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all",
                step.status === 'completed' && "bg-emerald-500/20 text-emerald-400",
                step.status === 'active' && "bg-primary/20 text-primary animate-pulse",
                step.status === 'pending' && "bg-muted text-muted-foreground"
              )}>
                {step.status === 'active' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : step.status === 'completed' ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <step.icon className="w-5 h-5" />
                )}
              </div>
              <span className={cn(
                "text-sm font-medium",
                step.status === 'completed' && "text-emerald-400",
                step.status === 'active' && "text-primary",
                step.status === 'pending' && "text-muted-foreground"
              )}>
                {step.label}
              </span>
            </motion.div>

            {index < steps.length - 1 && (
              <div className={cn(
                "w-16 h-0.5 mx-2 rounded-full",
                steps[index + 1].status === 'pending' 
                  ? "bg-muted" 
                  : "bg-gradient-to-r from-emerald-500 to-primary"
              )} />
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
};
