"use client";

import { useRouter, useParams, useSearchParams, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { ProjectHeader } from "@/components/project/ProjectHeader";
import { DeploymentsTable } from "@/components/project/DeploymentsTable";
import { TerminalLogs } from "@/components/project/TerminalLogs";
import { EnvVarsPanel } from "@/components/project/EnvVarsPanel";
import { StoragePanel } from "@/components/project/StoragePanel";
import { useMockStore } from "@/stores/useMockStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProjectOverview } from "@/components/project/ProjectOverview";

const tabs = ["Overview", "Deployments", "Logs", "Storage", "Settings"];

const ProjectDetail = () => {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const projectId = params.id as string;

  const { getProjectById, getDeploymentsByProject, getLogsByProject } = useMockStore();

  const tabParam = searchParams.get("tab");
  const activeTab = tabs.find((t) => t.toLowerCase() === tabParam?.toLowerCase()) || "Overview";

  const project = getProjectById(projectId);
  const deployments = getDeploymentsByProject(projectId);
  const logs = getLogsByProject(projectId);

  const handleTabChange = (tab: string) => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("tab", tab.toLowerCase());
    router.push(`${pathname}?${newParams.toString()}`);
  };

  if (!project) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Project not found</p>
        <Button onClick={() => router.push("/dashboard/projects")} className="mt-4">
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => router.push("/dashboard/projects")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Projects
      </motion.button>

      {/* Header */}
      <ProjectHeader project={project} />

      {/* Tabs */}
      <div className="border-b border-white/5 mb-8">
        <div className="flex gap-1">
          {tabs.map((tab) => (
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
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-accent"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "Overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <ProjectOverview project={project} />
          </motion.div>
        )}

        {activeTab === "Deployments" && (
          <motion.div
            key="deployments"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <DeploymentsTable deployments={deployments} project={project} />
          </motion.div>
        )}

        {activeTab === "Logs" && (
          <motion.div
            key="logs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <TerminalLogs logs={logs} projectName={project.name} />
          </motion.div>
        )}

        {activeTab === "Storage" && (
          <motion.div
            key="storage"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <StoragePanel />
          </motion.div>
        )}

        {activeTab === "Settings" && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <EnvVarsPanel />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectDetail;
