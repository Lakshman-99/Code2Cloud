import { motion } from 'framer-motion';
import { GitCommit, Hammer, TestTube, Globe, Check, Loader2 } from 'lucide-react';
import { TiFlowChildren } from "react-icons/ti";
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
  const activeIndex = steps.findIndex(s => s.status === 'active');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-8">
        <TiFlowChildren className="w-6 h-6 text-violet-500" />
        Deployment Pipeline
      </h3>

      <div className="relative">
        {/* Base rail */}
        <div className="absolute top-[22px] left-0 right-0 h-1 rounded-full bg-muted" />
        {/* Progress rail */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute top-[22px] left-0 h-1 rounded-full bg-gradient-to-r from-emerald-500 to-primary"        
        />

        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <motion.div
                key={step.label}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.15 }}
                className="flex flex-col items-center"
              >
                <div className="rounded-full bg-card">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center z-10 transition-all shadow-lg',
                      step.status === 'completed' && 'bg-emerald-500/20 text-emerald-400 shadow-emerald-500/30',
                      step.status === 'active' && 'bg-primary/20 text-primary animate-pulse shadow-primary/30',
                      step.status === 'pending' && 'bg-muted text-muted-foreground'
                    )}
                  >
                    {step.status === 'active' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : step.status === 'completed' ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                </div>

                <span
                  className={cn(
                    'mt-2 text-sm font-medium',
                    step.status === 'completed' && 'text-emerald-400',
                    step.status === 'active' && 'text-primary',
                    step.status === 'pending' && 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
