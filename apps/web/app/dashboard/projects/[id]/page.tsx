"use client";

import { useRouter, useParams, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { ProjectHeader } from "@/components/project/ProjectHeader";
import { DeploymentsTable } from "@/components/project/DeploymentsTable";
import { TerminalLogs } from "@/components/project/TerminalLogs";
import { EnvVarsPanel } from "@/components/project/EnvVarsPanel";
import { StoragePanel } from "@/components/project/StoragePanel";
import { cn } from "@/lib/utils";
import { ProjectOverview } from "@/components/project/ProjectOverview";
import { useEffect, useState } from "react";
import { ProjectNotFoundState } from "@/components/feedback/ProjectNotFoundState";
import { useProjects } from "@/hooks/use-projects";
import { useDeployments } from "@/hooks/use-deployments";
import { useDeploymentLogs } from "@/hooks/use-deployment-logs";
import { ProjectDetailSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { LogSource } from "@/types/project";
import AnalyticsPanel from "@/components/project/AnalyticsPanel";

const tabs = ["Overview", "Deployments", "Logs", "Analytics", "Storage", "Settings"];

const ProjectDetail = () => {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const projectId = params.id as string;
  const { getProjectById, isLoading: isProjectLoading } = useProjects();
  const {
    deployments,
    redeploy,
    isLoading: isDeploymentsLoading,
  } = useDeployments(projectId);

  const project = getProjectById(projectId);

  // Get the latest deployment ID for runtime log streaming
  const latestDeploymentId =
    deployments.length > 0 ? deployments[0].id : undefined;

  // Determine active tab
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get("tab");
    return (
      tabs.find((t) => t.toLowerCase() === tabParam?.toLowerCase()) ||
      "Overview"
    );
  });

  const { logs: runtimeLogs, isLive, isLoading: isLogsLoading } = useDeploymentLogs(latestDeploymentId, {
    source: LogSource.RUNTIME,
    enabled: activeTab === "Logs",
  });

  const handleTabChange = (tab: string) => {
    // A. Update UI immediately
    setActiveTab(tab);

    // B. Update URL silently (No Router Push = No Lag)
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set("tab", tab.toLowerCase());
    window.history.replaceState({}, "", newUrl.toString());
  };

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab) {
        const found = tabs.find((t) => t.toLowerCase() === tab.toLowerCase());
        if (found) setActiveTab(found);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  if (isProjectLoading || isDeploymentsLoading) {
    return <ProjectDetailSkeleton />;
  }

  if (!project) {
    return <ProjectNotFoundState projectId={projectId} />;
  }

  // Helper to render content without repetition
  const renderTabContent = () => {
    switch (activeTab) {
      case "Overview":
        return <ProjectOverview project={project} />;
      case "Deployments":
        return <DeploymentsTable deployments={deployments} project={project} />;
      case "Logs":
        return (
          <TerminalLogs
            logs={runtimeLogs}
            projectName={project.name}
            isLive={isLive}
            logSource={LogSource.RUNTIME}
            isLoading={isLogsLoading}
          />
        );
      case "Analytics":
        return <AnalyticsPanel project={project} />;
      case "Storage":
        return <StoragePanel />;
      case "Settings":
        return <EnvVarsPanel project={project} />;
      default:
        return null;
    }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => router.push("/dashboard/projects")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Projects
      </motion.button>

      {/* Header */}
      <ProjectHeader project={project} />

      {/* 2. CONFIG CHANGED BANNER */}
      <AnimatePresence>
        {project.configChanged && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 32 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-500">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-amber-200">
                    Configuration Changed
                  </h3>
                  <p className="text-xs text-amber-200/70">
                    Environment variables or domains have been modified.
                    Redeploy to apply changes.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => redeploy(project.id)}
                disabled={isDeploymentsLoading}
                size="sm"
                className="bg-amber-500 text-black hover:bg-amber-400 font-bold border-0 shrink-0 min-w-[140px]"
              >
                {isDeploymentsLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Queuing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" /> Redeploy Now
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="border-b border-white/5 mb-8">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15, ease: "easeOut" }} // Fast & snappy
            >
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={cn(
                  "px-4 py-3 text-sm font-medium transition-colors relative",
                  activeTab === tab
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTab"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-accent"
                  />
                )}
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Content Area - Optimized Animation */}
      <div className="relative min-h-[400px]">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={activeTab} // Unique key triggers the animation
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }} // Fast & snappy
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProjectDetail;
