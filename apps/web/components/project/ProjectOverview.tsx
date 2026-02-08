"use client";

import { motion } from "framer-motion";
import { 
  Globe, 
  Zap, 
  GitBranch, 
  Clock, 
  ArrowUpRight, 
  Terminal, 
  Box,
  Github,
  Copy,
  GitCommitVertical,
  MessageCircleCode
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PipelineVisualizer } from "./PipelineVisualizer"; // Adjust path if needed
import { Project } from "@/types/project";
import { FRAMEWORKS } from "@/types/git";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { getFrameworkIcon } from "./utils";

interface ProjectOverviewProps {
  project: Project;
}

export const ProjectOverview = ({ project }: ProjectOverviewProps) => {
  const latestDeployment = project.deployments?.[0];
  const shortHash = latestDeployment.commitHash?.slice(0, 7);
  const commitUrl = `https://github.com/${project.gitRepoOwner}/${project.gitRepoName}/commit/${latestDeployment.commitHash}`;
  const branchUrl = `${project.gitRepoUrl}/tree/${project.gitBranch}`
  
  return (
    <>
      {/* 1. Pipeline Visualizer */}
      <PipelineVisualizer deploymentStatus={latestDeployment.status} />

      {/* 2. Quick Actions & Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        
        {/* --- Project Info Card --- */}
        <div className="glass-card rounded-xl p-6 relative overflow-hidden">
          {/* Subtle background gradient splash */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10 transition-all duration-500 group-hover:bg-primary/10" />

          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Box className="w-5 h-5 text-primary" />
              Project Details
            </h3>
            
            {/* Animated Status Tag */}
            {project.onlineStatus === "ACTIVE" ? (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-medium text-emerald-500">System Online</span>
              </div>
            ) : project.onlineStatus === "PENDING" ? (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                </span>
                <span className="text-xs font-medium text-yellow-500">Starting Up</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-xs font-medium text-red-500">System Offline</span>
              </div>
            )}

          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
            {/* Framework */}
            <div className="col-span-2 sm:col-span-1">
              <dt className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" /> Framework
              </dt>
              <dd className="flex items-center gap-2 group">
                <span
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium border bg-secondary/40 backdrop-blur-md hover:bg-secondary/60 transition"
                >
                  {getFrameworkIcon(project.framework, project.language, 18)}
                  <span className="truncate max-w-[120px]">
                    {FRAMEWORKS[project.framework] ?? project.framework}
                  </span>
                </span>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(project.framework);
                    toast.success("Framework copied");
                  }}
                  className="opacity-0 group-hover:opacity-100 transition"
                >
                  <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                </button>
              </dd>
            </div>

            {/* Branch */}
            <div className="col-span-2 sm:col-span-1">
              <dt className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5" /> Branch
              </dt>
              <dd className="flex items-center gap-2 group">
                <a
                  href={branchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-foreground bg-secondary/50 px-2 py-0.5 rounded flex items-center gap-1 hover:bg-secondary transition"
                >
                  {project.gitBranch}
                  <ArrowUpRight className="w-3 h-3 opacity-60" />
                </a>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(project.gitBranch)
                    toast.success("Branch name copied")
                  }}
                  className="opacity-0 group-hover:opacity-100 transition"
                >
                  <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                </button>
              </dd>
            </div>

            {/* URL */}
            <div className="col-span-2">
              <dt className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> Production URL
              </dt>
              <dd className="flex items-center gap-2 group">
                <a 
                  href={`${latestDeployment.deploymentUrl}`} 
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-primary hover:text-primary/80 hover:underline flex items-center gap-1 transition-colors"
                >
                  {latestDeployment.deploymentUrl}
                  <ArrowUpRight className="w-3 h-3" />
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(latestDeployment.deploymentUrl)
                    toast.success("Production URL copied to clipboard!");
                  }}
                  className="opacity-0 group-hover:opacity-100 transition"
                >
                  <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                </button>
              </dd>
            </div>

            {/* Stats Row */}
            <div className="col-span-2 grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
              <div>
                <dt className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                  <GitCommitVertical className="w-3.5 h-3.5" /> Commit Hash
                </dt>
                <dd className="flex items-center gap-2 group">
                  <a
                    href={commitUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    {shortHash}
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(latestDeployment.commitHash)
                      toast.success("Commit hash copied to clipboard!");
                    }}
                    className="opacity-0 group-hover:opacity-100 transition"
                  >
                    <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                  <MessageCircleCode className="w-3.5 h-3.5 text-muted-foreground" />
                  Commit Message
                </dt>
                <dd className="text-sm text-muted-foreground inline-flex items-center px-2 py-0.5 rounded-sm bg-secondary/30 italic">
                  <span className="text-muted-foreground/60">❝</span>
                  <span className="mx-1 text-foreground max-w-[270px] truncate">
                    {latestDeployment.commitMessage || "No commit message"}
                  </span>
                  <span className="text-muted-foreground/60">❞</span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                  <Github className="w-3.5 h-3.5" /> Author
                </dt>
                <dd className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-2 bg-secondary/40 px-2 py-0.5 rounded text-sm font-medium">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    {latestDeployment.commitAuthor || "Unknown"}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Last Deployed
                </dt>
                <dd className="text-sm font-medium text-foreground capitalize">{formatDistanceToNow(new Date(latestDeployment.startedAt))} ago</dd>
              </div>
            </div>
          </dl>
        </div>

        {/* --- Quick Actions Card --- */}
        <div className="glass-card rounded-xl p-6 flex flex-col h-full">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-accent" />
            Quick Actions
          </h3>
          
          <div className="flex-1 space-y-3">
            {[
              { 
                label: "Visit Production", 
                icon: Globe, 
                color: "text-blue-400", 
                bg: "group-hover:bg-blue-500/10",
                href: `${latestDeployment.deploymentUrl}`
              },
              { 
                label: "View Source Code", 
                icon: Github, 
                color: "text-white", 
                bg: "group-hover:bg-white/10",
                href: branchUrl || "#" 
              },
              { 
                label: "View Analytics", 
                icon: Zap, 
                color: "text-amber-400", 
                bg: "group-hover:bg-amber-500/10",
                href: "#"
              }
            ].map((action) => (
              <motion.a
                key={action.label}
                href={action.href}
                target={action.href !== "#" ? "_blank" : undefined}
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "flex items-center justify-between p-3.5 rounded-xl bg-secondary/30 border border-transparent hover:border-white/5 transition-all cursor-pointer group",
                  action.bg
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg bg-background/50", action.color)}>
                    <action.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{action.label}</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </motion.a>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow"
          >
            Redeploy Project
          </motion.button>
        </div>
      </div>
    </>
  );
};