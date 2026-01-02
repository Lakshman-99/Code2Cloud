import { motion } from 'framer-motion';
import { ExternalLink, GitBranch, RefreshCw, MoreHorizontal } from 'lucide-react';
import { DeploymentStatus, Project } from '@/types/project';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getFrameworkIcon, getStatusConfig } from './utils';

interface ProjectHeaderProps {
  project: Project;
}

export const ProjectHeader = ({ project }: ProjectHeaderProps) => {
  const latestDeployment = project.deployments?.[0];
  const status = getStatusConfig(latestDeployment?.status);

  const handleRedeploy = () => {
    toast.success('Deployment queued', {
      description: `${project.name} is being redeployed from ${project.gitBranch} branch.`,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
    >
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold bg-white/5 border border-white/10 text-white">
          {getFrameworkIcon(project.framework, project.language, 30)}
        </div>

        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>

            <div className="flex flex-shrink-0 items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 border border-white/5">
              <span className={cn("relative flex h-2 w-2")}>
                {latestDeployment?.status === DeploymentStatus.BUILDING && (
                  <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", status.color)}></span>
                )}
                <span className={cn("relative inline-flex rounded-full h-2 w-2", status.color, status.glow)}></span>
              </span>
              <span className={cn("text-xs font-medium capitalize", status.text)}>
                {latestDeployment?.status}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            <a
              href={`https://${latestDeployment.deploymentUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              {latestDeployment.deploymentUrl}
              <ExternalLink className="w-3 h-3" />
            </a>
            <span>•</span>
            <div className="flex items-center gap-1">
              <GitBranch className="w-3 h-3" />
              {project.gitBranch}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button 
          className="gap-2 bg-gradient-to-r from-emerald-400 to-cyan-400 text-black font-bold hover:opacity-90 shadow-[0_0_20px_-5px_rgba(52,211,153,0.5)] transition-all border-0"
          onClick={() => window.open(`https://${latestDeployment.deploymentUrl}`, '_blank')}
        >
          <ExternalLink className="w-4 h-4" />
          Visit
        </Button>
        <Button
          variant="outline"
          className="gap-2 border-white/10 bg-white/5 hover:bg-white/10 text-foreground group"
          onClick={handleRedeploy}
        >
          <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
          Redeploy
        </Button>
        <Button variant="ghost" size="icon" className="w-8 h-8">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};
