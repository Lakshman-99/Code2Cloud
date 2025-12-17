import { motion } from 'framer-motion';
import { ExternalLink, GitBranch, RefreshCw, MoreHorizontal } from 'lucide-react';
import { Project } from '@/stores/useMockStore';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ProjectHeaderProps {
  project: Project;
}

export const ProjectHeader = ({ project }: ProjectHeaderProps) => {
  const handleRedeploy = () => {
    toast.success('Deployment queued', {
      description: `${project.name} is being redeployed from ${project.branch}`,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold",
          project.type === 'nextjs'
            ? "bg-white/10 text-foreground"
            : "bg-emerald-500/20 text-emerald-400"
        )}>
          {project.type === 'nextjs' ? (
            <svg viewBox="0 0 180 180" fill="none" className="w-8 h-8">
              <mask id="mask1" maskUnits="userSpaceOnUse" x="0" y="0" width="180" height="180">
                <circle cx="90" cy="90" r="90" fill="white"/>
              </mask>
              <g mask="url(#mask1)">
                <circle cx="90" cy="90" r="90" fill="currentColor"/>
                <path d="M149.508 157.52L69.142 54H54v72.272h12.114V69.3l73.885 95.673c3.497-2.286 6.815-4.818 9.927-7.571l-.418.118z" fill="black"/>
                <path d="M115 54h12v72h-12V54z" fill="black"/>
              </g>
            </svg>
          ) : (
            <span>Py</span>
          )}
        </div>

        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
            <div className={cn(
              "status-dot",
              project.status === 'ready' && "status-dot-ready",
              project.status === 'building' && "status-dot-building"
            )} />
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            <a
              href={`https://${project.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              {project.domain}
              <ExternalLink className="w-3 h-3" />
            </a>
            <span>•</span>
            <div className="flex items-center gap-1">
              <GitBranch className="w-3 h-3" />
              {project.branch}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleRedeploy}
        >
          <RefreshCw className="w-4 h-4" />
          Redeploy
        </Button>
        <Button
          size="sm"
          className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
          asChild
        >
          <a href={`https://${project.domain}`} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4" />
            Visit
          </a>
        </Button>
        <Button variant="ghost" size="icon" className="w-8 h-8">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};
