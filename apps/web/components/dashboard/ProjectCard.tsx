"use client";

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ExternalLink, GitBranch, Clock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Project } from '@/types/project';
import { getFrameworkIcon, getStatusConfig } from '../project/utils';
import { formatDistanceToNow } from 'date-fns';

interface ProjectCardProps {
  project: Project;
  layout?: boolean;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

const ProjectCard = ({ project, layout = false }: ProjectCardProps) => {
  const router = useRouter();
  
  // Safely access the latest deployment
  const latestDeployment = project.deployments?.[0];
  const statusConfig = getStatusConfig(latestDeployment?.status);

  return (
    <motion.div
      layout={layout}
      variants={itemVariants}
      onClick={() => router.push(`/dashboard/projects/${project.id}`)}
      className="group relative"
    >
      {/* Hover Glow Effect */}
      <div className={cn(
        "absolute -inset-0.5 bg-gradient-to-r rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500",
        latestDeployment?.status === 'FAILED' ? 'from-red-500/20 to-orange-500/20' : 'from-emerald-500/20 to-blue-500/20'
      )} />

      <div 
        className="relative h-full glass-card backdrop-blur-xl border border-white/10 rounded-xl p-5 cursor-pointer hover:bg-white/5 transition-all duration-300 overflow-hidden"
      >
        {/* Header */}
        <div>
          <div className="flex items-start justify-between mb-4 gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center bg-white/5 border border-white/10 text-white">
                {getFrameworkIcon(project.framework, project.language)}
              </div>
              
              <div className="min-w-0">
                <h3 className="font-semibold text-base text-white group-hover:text-primary transition-colors truncate">
                  {project.name}
                </h3>
                <a 
                  href={`https://${latestDeployment.deploymentUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()} 
                  className="text-xs text-muted-foreground hover:text-emerald-400 hover:underline flex items-center gap-1 truncate"
                >
                  <span className="truncate">{latestDeployment.deploymentUrl}</span>
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
              </div>
            </div>
            
            {/* Status Badge */}
            <div className="flex flex-shrink-0 items-center gap-2 px-2.5 py-1 rounded-full bg-white/5 border border-white/5">
              <span className="relative flex h-2 w-2">
                {(latestDeployment?.status === 'BUILDING' || latestDeployment?.status === 'DEPLOYING') && (
                  <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", statusConfig.color)}></span>
                )}
                <span className={cn("relative inline-flex rounded-full h-2 w-2", statusConfig.color, statusConfig.glow)}></span>
              </span>
              <span className={cn("text-xs font-medium capitalize", statusConfig.text)}>
                {statusConfig.label}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-4">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5" title="Git Branch">
              <GitBranch className="w-3.5 h-3.5" />
              <span className="font-mono text-white/60">{project.gitBranch}</span>
            </div>
            <div className="flex items-center gap-1.5" title="Last Updated">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {latestDeployment 
                  ? formatDistanceToNow(new Date(latestDeployment.startedAt)) + ' ago' 
                  : 'Never deployed'}
              </span>
            </div>
          </div>
          
          <div className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-primary">
              <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;