"use client";

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ExternalLink, GitBranch, Clock, ArrowRight } from 'lucide-react';
import { SiNextdotjs, SiPython } from 'react-icons/si';
import { cn } from '@/lib/utils';
import { Project } from '@/stores/useMockStore';

interface ProjectCardProps {
  project: Project;
  layout?: boolean;
}

const statusConfig = {
  ready: { color: 'bg-emerald-500', glow: 'shadow-emerald-500/50', text: 'text-emerald-500' },
  building: { color: 'bg-blue-500', glow: 'shadow-blue-500/50', text: 'text-blue-500' },
  error: { color: 'bg-red-500', glow: 'shadow-red-500/50', text: 'text-red-500' },
  queued: { color: 'bg-yellow-500', glow: 'shadow-yellow-500/50', text: 'text-yellow-500' },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3 }
  }
};

const ProjectCard = ({ project, layout = false }: ProjectCardProps) => {
  const router = useRouter();
  const status = statusConfig[project.status as keyof typeof statusConfig] || statusConfig.ready;

  return (
    <motion.div
      layout={layout}
      variants={itemVariants}
      onClick={() => router.push(`/dashboard/projects/${project.id}`)}
      className="group relative"
    >
      <div className={cn(
        "absolute -inset-0.5 bg-gradient-to-r rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500",
        project.type === 'nextjs' ? 'from-white/20 to-gray-500/20' : 'from-yellow-500/20 to-blue-500/20'
      )} />

      <div 
        className="relative h-full bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 rounded-xl p-5 cursor-pointer hover:bg-white/5 transition-all duration-300 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4 gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className={cn(
              "w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-lg",
              project.type === 'nextjs' 
                ? "bg-black border border-white/10 text-white" 
                : "bg-yellow-500/10 border border-yellow-500/20 text-yellow-500"
            )}>
              {project.type === 'nextjs' ? <SiNextdotjs size={24} /> : <SiPython size={24} />}
            </div>
            
            {/* Added min-w-0 to allow truncation */}
            <div className="min-w-0">
              <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors truncate pr-2">
                {project.name}
              </h3>
              <a 
                href={`https://${project.domain}`}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()} 
                className="text-xs text-muted-foreground hover:text-primary hover:underline flex items-center gap-1 truncate"
              >
                <span className="truncate">{project.domain}</span>
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
            </div>
          </div>
          
          {/* Status Indicator (Added flex-shrink-0) */}
          <div className="flex flex-shrink-0 items-center gap-2 px-2.5 py-1 rounded-full bg-white/5 border border-white/5">
            <span className={cn("relative flex h-2 w-2")}>
              {project.status === 'building' && (
                <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", status.color)}></span>
              )}
              <span className={cn("relative inline-flex rounded-full h-2 w-2", status.color, status.glow)}></span>
            </span>
            <span className={cn("text-xs font-medium capitalize", status.text)}>
              {project.status}
            </span>
          </div>
        </div>

        {/* Footer Info */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-2">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5" />
              <span>{project.branch}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{project.lastDeployed}</span>
            </div>
          </div>
          
          <div className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
              <ArrowRight className="w-4 h-4 text-primary" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;