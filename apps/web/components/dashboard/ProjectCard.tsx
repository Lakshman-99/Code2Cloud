import { motion } from 'framer-motion';
import Link from 'next/link';
import { GitBranch, ExternalLink, Clock } from 'lucide-react';
import { Project } from '@/stores/useMockStore';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
  index: number;
}

export const ProjectCard = ({ project, index }: ProjectCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
    >
      <Link
        href={`/dashboard/projects/${project.id}`}
        className="glass-card p-5 block group hover:border-white/10 transition-all duration-300"
      >
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold",
            project.type === 'nextjs'
              ? "bg-white/10 text-foreground"
              : "bg-emerald-500/20 text-emerald-400"
          )}>
            {project.type === 'nextjs' ? (
              <svg viewBox="0 0 180 180" fill="none" className="w-7 h-7">
                <mask id="mask0_408_134" maskUnits="userSpaceOnUse" x="0" y="0" width="180" height="180">
                  <circle cx="90" cy="90" r="90" fill="white"/>
                </mask>
                <g mask="url(#mask0_408_134)">
                  <circle cx="90" cy="90" r="90" fill="currentColor"/>
                  <path d="M149.508 157.52L69.142 54H54v72.272h12.114V69.3l73.885 95.673c3.497-2.286 6.815-4.818 9.927-7.571l-.418.118z" fill="black"/>
                  <path d="M115 54h12v72h-12V54z" fill="black"/>
                </g>
              </svg>
            ) : (
              <span>Py</span>
            )}
          </div>

          <div className={cn(
            "status-dot",
            project.status === 'ready' && "status-dot-ready",
            project.status === 'building' && "status-dot-building",
            project.status === 'error' && "status-dot-error"
          )} />
        </div>

        <h3 className="text-base font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
          {project.name}
        </h3>
        
        <p className="text-sm text-muted-foreground mb-4 truncate">
          {project.domain}
        </p>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <GitBranch className="w-3 h-3" />
            <span>{project.branch}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{project.lastDeployed}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{project.commit}</span>
          <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </Link>
    </motion.div>
  );
};
