import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMockStore } from '@/stores/useMockStore';
import { Rocket, GitCommit, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusColors = {
  ready: 'bg-success',
  building: 'bg-info',
  error: 'bg-destructive',
  queued: 'bg-warning',
};

const ActiveDeployments = () => {
  const { deployments, projects } = useMockStore();

  const recentDeployments = deployments.slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="col-span-2"
    >
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
              <Rocket className="w-4 h-4 text-accent" />
            </div>
            <div>
              <CardTitle className="text-base">Active Deployments</CardTitle>
              <p className="text-xs text-muted-foreground">Recent build activity</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentDeployments.map((deployment, index) => {
            const project = projects.find((p) => p.id === deployment.projectId);
            return (
              <motion.div
                key={deployment.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className={cn('w-2.5 h-2.5 rounded-full', statusColors[deployment.status])} />
                    {deployment.status === 'building' && (
                      <div
                        className={cn(
                          'absolute inset-0 rounded-full animate-ping',
                          statusColors[deployment.status]
                        )}
                      />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                      {project?.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <GitCommit className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground font-mono">
                        {deployment.commit}
                      </span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {deployment.commitMessage}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={project?.type === 'nextjs' ? 'nextjs' : 'python'} className="text-[10px]">
                    {deployment.runtime}
                  </Badge>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span className="text-xs">{deployment.createdAt}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ActiveDeployments;
