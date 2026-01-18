import { motion } from 'framer-motion';
import { ExternalLink, GitBranch, RefreshCw, MoreHorizontal, Loader2, Trash2 } from 'lucide-react';
import { DeploymentStatus, Project } from '@/types/project';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getFrameworkIcon, getStatusConfig } from './utils';
import { useDeployments } from '@/hooks/use-deployments';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { useState } from 'react';
import { useProjects } from '@/hooks/use-projects';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface ProjectHeaderProps {
  project: Project;
}

export const ProjectHeader = ({ project }: ProjectHeaderProps) => {
  const router = useRouter();
  const latestDeployment = project.deployments?.[0];
  const status = getStatusConfig(latestDeployment?.status);
  const { deleteProject } = useProjects();
  const { redeploy, isDeploying } = useDeployments();

  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleRedeploy = () => {
    redeploy(project.id);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // 2. Call the delete function from your hook
      await deleteProject(project.id);
      
      toast.success("Project deleted successfully");
      router.push("/dashboard/projects"); 

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to delete project");
      setIsDeleting(false); // Reset loading only on error
      setShowDeleteAlert(false); // Close dialog
    }
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
                {(latestDeployment?.status === DeploymentStatus.BUILDING || latestDeployment?.status === DeploymentStatus.DEPLOYING) && (
                  <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", status.color)}></span>
                )}
                <span className={cn("relative inline-flex rounded-full h-2 w-2", status.color, status.glow)}></span>
              </span>
              <span className={cn("text-xs font-medium capitalize", status.text)}>
                {status.label}
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
          disabled={isDeploying}
          onClick={handleRedeploy}
        >
          {isDeploying ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
          )}
          Redeploy
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-white">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-[#0A0A0A] border-white/10 text-white">
            <DropdownMenuLabel>Project Actions</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            
            {/* DELETE OPTION */}
            <DropdownMenuItem 
              onClick={() => setShowDeleteAlert(true)}
              className="text-red-400 focus:text-red-400 focus:bg-red-400/10 cursor-pointer"
            >
              <Trash2 className="w-4 h-4 mr-2 text-red-400" />
              Delete Project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent className="bg-[#0F1117] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This action cannot be undone. This will permanently delete 
              <span className="text-white font-semibold"> {project.name} </span>
              and remove all associated deployments, domains, and environment variables.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10 hover:bg-white/5 text-white hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault(); // Prevent auto-closing to show loading state if needed
                handleDelete();
              }}
              className="bg-red-500 hover:bg-red-600 text-white border-0"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...
                </>
              ) : (
                "Delete Project"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};
