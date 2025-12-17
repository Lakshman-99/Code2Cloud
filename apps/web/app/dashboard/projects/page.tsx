"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Filter, LayoutGrid, List } from "lucide-react";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { useMockStore } from "@/stores/useMockStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NewProjectDialog } from "@/components/project/NewProjectDialog";

const Projects = () => {
  const { projects } = useMockStore();
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <>
      <div className="p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Projects
            </h1>
            <p className="text-muted-foreground">
              Manage and deploy your applications
            </p>
          </div>
          <Button
            onClick={() => setNewProjectOpen(true)}
            className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-3 mb-8"
        >
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card/50 border-white/5 focus:border-primary/50"
            />
          </div>
          <Button variant="outline" className="gap-2 border-white/10">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
          <div className="flex border border-white/10 rounded-lg overflow-hidden">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className="rounded-none"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
              className="rounded-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* Projects count */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-muted-foreground mb-4"
        >
          {filteredProjects.length} project
          {filteredProjects.length !== 1 ? "s" : ""}
        </motion.p>

        {/* Projects Grid */}
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              : "flex flex-col gap-3"
          }
        >
          {filteredProjects.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              No projects found
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? `No projects match "${searchQuery}"`
                : "Get started by creating your first project"}
            </p>
            <Button
              onClick={() => setNewProjectOpen(true)}
              className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              <Plus className="w-4 h-4" />
              New Project
            </Button>
          </motion.div>
        )}
      </div>

      <NewProjectDialog
        open={newProjectOpen}
        onOpenChange={setNewProjectOpen}
      />
    </>
  );
};

export default Projects;
