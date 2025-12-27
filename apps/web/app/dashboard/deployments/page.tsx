"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Filter, Search, GitBranch, Clock, ExternalLink, 
  CheckCircle2, XCircle, Loader2, PlayCircle, X 
} from "lucide-react";
import { useMockStore } from "@/stores/useMockStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

const statusIcons = {
  ready: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
  building: <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />,
  error: <XCircle className="w-4 h-4 text-red-500" />,
  queued: <PlayCircle className="w-4 h-4 text-yellow-500" />,
};

const Deployments = () => {
  const router = useRouter();

  const { deployments, projects } = useMockStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  // Join deployments with project data
  const enrichedDeployments = deployments.map((d) => ({
    ...d,
    project: projects.find((p) => p.id === d.projectId),
  }));

  // Filtering Logic
  const filteredDeployments = enrichedDeployments.filter((d) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      d.project?.name.toLowerCase().includes(query) ||
      d.commit.toLowerCase().includes(query) ||
      d.branch.toLowerCase().includes(query) ||
      d.commitMessage.toLowerCase().includes(query);

    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(d.status);

    return matchesSearch && matchesStatus;
  });

  const toggleStatus = (status: string) => {
    setStatusFilter(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
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
          View and manage all your deployment history across all projects.
        </p>
      </motion.div>

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4 mb-8 items-center"
      >
        {/* Search */}
        <div className="relative flex-1 w-full sm:max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search by project, commit, or branch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all h-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className={cn(
              "gap-2 border-white/10 bg-white/5 hover:bg-white/10",
              statusFilter.length > 0 && "border-primary/50 text-primary bg-primary/10"
            )}>
              <Filter className="w-4 h-4" />
              Filter
              {statusFilter.length > 0 && (
                <span className="ml-1 rounded-full bg-primary w-5 h-5 text-[10px] text-primary-foreground flex items-center justify-center">
                  {statusFilter.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="bg-[#0a0a0a] border-white/10 backdrop-blur-xl">
            <DropdownMenuLabel>Filter Status</DropdownMenuLabel>
            <DropdownMenuCheckboxItem 
              checked={statusFilter.includes('ready')}
              onCheckedChange={() => toggleStatus('ready')}
            >
              Ready
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem 
              checked={statusFilter.includes('building')}
              onCheckedChange={() => toggleStatus('building')}
            >
              Building
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem 
              checked={statusFilter.includes('error')}
              onCheckedChange={() => toggleStatus('error')}
            >
              Error
            </DropdownMenuCheckboxItem>
            {statusFilter.length > 0 && (
              <>
                <DropdownMenuSeparator className="bg-white/10" />
                <div className="p-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setStatusFilter([])}
                    className="w-full h-8 text-xs text-muted-foreground hover:text-foreground hover:bg-white/10"
                  >
                    Clear Filters
                  </Button>
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>

      {/* Deployments Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border border-white/10 bg-black/20 backdrop-blur-md overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Project
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Commit
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Branch
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Runtime
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Duration
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Triggered
                </th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence>
                {filteredDeployments.map((deployment, index) => (
                  <motion.tr
                    key={deployment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => router.push(`/dashboard/deployments/${deployment.id}`)} // Navigate to details
                    className="hover:bg-white/5 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ring-1 ring-white/10",
                            deployment.project?.type === "nextjs"
                              ? "bg-black text-white"
                              : "bg-yellow-500/10 text-yellow-500",
                          )}
                        >
                          {deployment.project?.type === "nextjs" ? "N" : "Py"}
                        </div>
                        <div>
                          <span className="text-sm font-medium text-foreground block">
                            {deployment.project?.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            production
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {statusIcons[deployment.status as keyof typeof statusIcons]}
                        <span
                          className={cn(
                            "text-sm font-medium capitalize",
                            deployment.status === "ready" && "text-emerald-500",
                            deployment.status === "building" && "text-blue-500",
                            deployment.status === "error" && "text-red-500",
                          )}
                        >
                          {deployment.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-white/10 px-1.5 py-0.5 rounded text-foreground font-mono">
                            {deployment.commit.substring(0, 7)}
                          </code>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate max-w-[180px]">
                          {deployment.commitMessage}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-white/5 px-2 py-1 rounded-md w-fit">
                        <GitBranch className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">{deployment.branch}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted-foreground">
                        Node.js 18
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{deployment.duration}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted-foreground">
                        {deployment.timestamp}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all opacity-0 group-hover:opacity-100">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          
          {filteredDeployments.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              No deployments found matching your filters.
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Deployments;