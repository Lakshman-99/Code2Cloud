import { motion } from 'framer-motion';
import { Rocket, GitBranch, ExternalLink } from 'lucide-react';
import { useMockStore } from '@/stores/useMockStore';
import { cn } from '@/lib/utils';

export const ActiveDeployments = () => {
  const { deployments, projects } = useMockStore();

  const recentDeployments = deployments.slice(0, 4).map(d => ({
    ...d,
    project: projects.find(p => p.id === d.projectId),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="glass-card p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
          <Rocket className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Active Deployments</h3>
          <p className="text-sm text-muted-foreground">Recent build activity</p>
        </div>
      </div>

      <div className="space-y-3">
        {recentDeployments.map((deployment, index) => (
          <motion.div
            key={deployment.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group cursor-pointer"
          >
            <div className={cn(
              "status-dot",
              deployment.status === 'ready' && "status-dot-ready",
              deployment.status === 'building' && "status-dot-building",
              deployment.status === 'error' && "status-dot-error"
            )} />
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {deployment.project?.name}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <GitBranch className="w-3 h-3" />
                <span>{deployment.branch}</span>
                <span>•</span>
                <span>{deployment.commit}</span>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs text-muted-foreground">{deployment.timestamp}</p>
              <p className={cn(
                "text-xs font-medium",
                deployment.status === 'ready' && "text-emerald-400",
                deployment.status === 'building' && "text-blue-400",
                deployment.status === 'error' && "text-red-400"
              )}>
                {deployment.status === 'building' ? 'Building...' : deployment.status}
              </p>
            </div>

            <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
