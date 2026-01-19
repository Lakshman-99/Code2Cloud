import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Rocket, GitCommit, Clock, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Deployment, Project } from '@/types/project';
import { getStatusConfig } from '../project/utils';
import { formatDistanceToNow } from 'date-fns';
import { FRAMEWORKS } from '@/types/git';
import { useRouter } from 'next/navigation';

interface DeploymentCardProps {
  deployments: Deployment[];
  projects: Project[];
}

const ActiveDeployments = ({ deployments, projects }: DeploymentCardProps) => {
  const router = useRouter();
  const recentDeployments = deployments.slice(0, 4);

  if (deployments.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="col-span-2"
      >
        <Card className="h-full flex flex-col">
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
          <CardContent className="flex-1 flex flex-col items-center justify-center text-center py-8 min-h-[200px]">
            <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4 border border-white/5">
              <Layers className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">No deployments yet</h3>
            <p className="text-xs text-muted-foreground max-w-[250px] mt-1 leading-relaxed">
              Your deployment queue is empty. Push code to your repository or manually trigger a deploy to see activity here.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

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
            const status = getStatusConfig(deployment.status);

            return (
              <motion.div
                key={deployment.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => router.push(`/dashboard/deployments/${deployment.id}`)}
                className={cn(
                  'flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer group',
                  status.glow
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <div className={cn('w-3 h-3 rounded-full', status.color)} />
                    {(deployment.status === 'BUILDING' || deployment.status === 'DEPLOYING') && (
                      <div className={cn('absolute inset-0 rounded-full animate-ping', status.color)} />
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                      {project?.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <GitCommit className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground font-mono">
                        {deployment.commitHash.slice(0, 7)}
                      </span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground truncate " title={deployment.commitMessage}>
                        {deployment.commitMessage}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={'python'} className="text-[10px]">
                    {FRAMEWORKS[project?.framework || "Unknown"]}
                  </Badge>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span className="text-xs">{formatDistanceToNow(new Date(deployment.startedAt))} ago</span>
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
