"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Search, Filter, LayoutGrid, List, X, 
} from "lucide-react";
import ProjectCard from "@/components/dashboard/ProjectCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NewProjectDialog } from "@/components/project/NewProjectDialog";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeploymentStatus } from "@/types/project";
import { STATUS_OPTIONS } from "@/components/project/utils";
import { useProjects } from "@/hooks/use-projects";

const Projects = () => {
  const { projects } = useProjects();
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // --- FILTER STATE ---
  // Store selected filters in state sets for O(1) lookup
  const [selectedStatus, setSelectedStatus] = useState<DeploymentStatus[]>([]);

  // Filtering Logic
  const filteredProjects = useMemo(() => {
    if (!projects) return [];

    return projects.filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.framework.toLowerCase().includes(searchQuery.toLowerCase());

      const latestStatus = project.deployments?.[0]?.status;

      const matchesStatus =
        selectedStatus.length === 0 ||
        (latestStatus && selectedStatus.includes(latestStatus));

      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, selectedStatus]);


  const toggleStatus = (status: DeploymentStatus) => {
    setSelectedStatus(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const clearFilters = () => {
    setSelectedStatus([]);
  };

  const hasActiveFilters = selectedStatus.length > 0;

  // --- ANIMATION VARIANTS ---
  // This orchestrates the children animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1, // Delay between each card appearing
        when: "beforeChildren"
      }
    }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
            Projects
          </h1>
          <p className="text-muted-foreground">
            Manage your applications and deployments.
          </p>
        </div>
        <Button
          onClick={() => setNewProjectOpen(true)}
          className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/20 transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          New Project
        </Button>
      </motion.div>

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col xl:flex-row gap-4 mb-8 justify-between items-start xl:items-center"
      >
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-80 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 h-10 transition-all"
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

          {/* FUNCTIONAL FILTER BUTTON */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className={cn(
                  "gap-2 border-white/10 h-10 bg-white/5 hover:bg-white/10 transition-all",
                  hasActiveFilters && "border-primary/50 text-primary bg-primary/5"
                )}
              >
                <Filter className="w-4 h-4" />
                Filter
                {hasActiveFilters && (
                  <span className="ml-1 rounded-full bg-primary w-5 h-5 text-[10px] text-primary-foreground flex items-center justify-center">
                    {selectedStatus.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-[#0a0a0a] border-white/10 text-foreground backdrop-blur-xl">
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              {STATUS_OPTIONS.map(({ label, value }) => (
                <DropdownMenuCheckboxItem
                  key={value}
                  checked={selectedStatus.includes(value)}
                  onCheckedChange={() => toggleStatus(value)}
                >
                  {label}
                </DropdownMenuCheckboxItem>
              ))}

              {hasActiveFilters && (
                <>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <div className="p-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearFilters}
                      className="w-full h-8 text-xs text-muted-foreground hover:text-foreground hover:bg-white/10"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* View Toggle & Count */}
        <div className="flex items-center justify-between w-full xl:w-auto gap-4">
          <p className="text-sm text-muted-foreground">
            Showing <span className="text-foreground font-medium">{filteredProjects.length}</span> projects
          </p>

          <div className="flex border border-white/10 rounded-lg p-1 bg-white/5">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1.5 rounded-md transition-all duration-200",
                viewMode === "grid" 
                  ? "bg-primary/20 text-primary shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-1.5 rounded-md transition-all duration-200",
                viewMode === "list" 
                  ? "bg-primary/20 text-primary shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Projects Grid */}
      <motion.div
        variants={containerVariants} // Apply stagger logic here
        initial="hidden"
        animate="visible"
        key={searchQuery + viewMode + selectedStatus.join('') + filteredProjects.length} // Forces re-animation on filter change
        className={cn(
          "grid gap-4",
          viewMode === "grid"
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            : "grid-cols-1"
        )}
      >
        <AnimatePresence mode="popLayout">
          {filteredProjects.map((project) => (
            <ProjectCard 
              key={project.id} 
              project={project} 
              layout={true} // Enable smooth reordering
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty State */}
      {projects && projects.length > 0 && filteredProjects.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 ring-1 ring-white/10">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No projects found
          </h3>
          <p className="text-muted-foreground mb-8 max-w-sm">
            Try adjusting your search or filters to find what you&apos;re looking for.
          </p>
          <Button
            onClick={() => {
              setSearchQuery("");
              clearFilters();
            }}
            variant="outline"
            className="border-white/10 hover:bg-white/5"
          >
            Clear Search & Filters
          </Button>
        </motion.div>
      )}

      {projects?.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-28 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 ring-1 ring-primary/30">
            <Plus className="w-9 h-9 text-primary" />
          </div>

          <h3 className="text-2xl font-semibold text-foreground mb-2">
            Create your first project
          </h3>

          <p className="text-muted-foreground mb-8 max-w-sm">
            Connect a Git repository and deploy your app in seconds.
          </p>

          <Button
            onClick={() => setNewProjectOpen(true)}
            className="gap-2 bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </motion.div>
      )}

      <NewProjectDialog
        open={newProjectOpen}
        onOpenChange={setNewProjectOpen}
      />
    </div>
  );
};

export default Projects;