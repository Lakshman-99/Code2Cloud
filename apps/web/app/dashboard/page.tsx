"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { SystemHealthChart } from "@/components/dashboard/SystemHealthChart";
import { ActiveDeployments } from "@/components/dashboard/ActiveDeployments";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { QuickStats } from "@/components/dashboard/QuickStats";
import { CardSkeleton, ChartSkeleton } from "@/components/ui/skeleton-shimmer";
import { useMockStore } from "@/stores/useMockStore";
import { useUser } from "@/hooks/use-user";

const Index = () => {
  const { user } = useUser();
  const { projects, loading, setLoading } = useMockStore();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, [setLoading]);

  return (
    <div className="p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Welcome back, <span className="gradient-text">{user?.name || "Guest"}</span>
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening with your projects today.
        </p>
      </motion.div>

      {/* Bento Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="col-span-2 row-span-2">
            <ChartSkeleton />
          </div>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Large Chart Widget */}
          <SystemHealthChart />

          {/* Active Deployments */}
          <ActiveDeployments />

          {/* Quick Stats */}
          <QuickStats />

          {/* Project Cards Grid */}
          {projects.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Index;
