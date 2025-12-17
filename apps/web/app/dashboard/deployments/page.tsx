"use client";

import { motion } from "framer-motion";
import { Filter, Search, GitBranch, Clock, ExternalLink } from "lucide-react";
import { useMockStore } from "@/stores/useMockStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const Deployments = () => {
  const { deployments, projects } = useMockStore();

  const deploymentsWithProject = deployments.map((d) => ({
    ...d,
    project: projects.find((p) => p.id === d.projectId),
  }));

  return (
    <div className="p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Deployments
        </h1>
        <p className="text-muted-foreground">
          View and manage all your deployment history
        </p>
      </motion.div>

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-3 mb-8"
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search deployments..."
            className="pl-10 bg-card/50 border-white/5 focus:border-primary/50"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          Filter
        </Button>
      </motion.div>

      {/* Deployments Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                  Project
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                  Commit
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                  Branch
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                  Runtime
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                  Duration
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">
                  Time
                </th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {deploymentsWithProject.map((deployment, index) => (
                <motion.tr
                  key={deployment.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                          deployment.project?.type === "nextjs"
                            ? "bg-white/10 text-foreground"
                            : "bg-emerald-500/20 text-emerald-400",
                        )}
                      >
                        {deployment.project?.type === "nextjs" ? "N" : "Py"}
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {deployment.project?.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "status-dot",
                          deployment.status === "ready" && "status-dot-ready",
                          deployment.status === "building" &&
                            "status-dot-building",
                          deployment.status === "error" && "status-dot-error",
                        )}
                      />
                      <span
                        className={cn(
                          "text-sm font-medium capitalize",
                          deployment.status === "ready" && "text-emerald-400",
                          deployment.status === "building" && "text-blue-400",
                          deployment.status === "error" && "text-red-400",
                        )}
                      >
                        {deployment.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <code className="text-sm text-foreground font-mono">
                        {deployment.commit}
                      </code>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[180px]">
                        {deployment.commitMessage}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <GitBranch className="w-3 h-3" />
                      {deployment.branch}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "px-2 py-1 rounded-md text-xs font-medium",
                        deployment.project?.type === "python"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-white/10 text-foreground",
                      )}
                    >
                      {deployment.runtime}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {deployment.duration > 0
                        ? `${deployment.duration}s`
                        : "—"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {deployment.timestamp}
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default Deployments;
