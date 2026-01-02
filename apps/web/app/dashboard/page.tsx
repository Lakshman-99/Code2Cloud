"use client";

import { AnimatePresence, motion } from 'framer-motion';
import SystemHealthChart from '@/components/dashboard/SystemHealthChart';
import ActiveDeployments from '@/components/dashboard/ActiveDeployments';
import ProjectCard from '@/components/dashboard/ProjectCard';
import { ChartSkeleton, ListSkeleton, CardSkeleton, NameSkeleton } from '@/components/ui/skeleton';
import { useUser } from '@/hooks/use-user';
import { useRouter } from 'next/navigation';
import { useProjects } from '@/hooks/use-projects';
import { ArrowRight } from 'lucide-react';

const Dashboard = () => {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { projects, isLoading: isProjectsLoading } = useProjects();

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
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          Welcome back, 
          {!isUserLoading && user ? (
            <span className="gradient-text bg-clip-text text-transparent">
              {user?.name}
            </span>
          ) : (
            <NameSkeleton />
          )}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening with your deployments and infrastructure today.
        </p>
      </motion.div>

      {/* Bento Grid */}
      <div className="grid grid-cols-4 gap-4">
        {/* System Health - Large Card */}
        {isProjectsLoading ? (
          <div className="col-span-2 row-span-2">
            <ChartSkeleton />
          </div>
        ) : (
          <SystemHealthChart />
        )}

        {/* Active Deployments */}
        {isProjectsLoading ? (
          <div className="col-span-2">
            <ListSkeleton />
          </div>
        ) : (
          <ActiveDeployments />
        )}

        {/* Quick Stats */}
        {isProjectsLoading ? (
          <>
            <div className="col-span-1">
              <CardSkeleton />
            </div>
            <div className="col-span-1">
              <CardSkeleton />
            </div>
          </>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="col-span-1"
            >
              <div className="glass rounded-xl p-5 h-full">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Total Deployments</p>
                <p className="text-3xl font-bold text-foreground">1,247</p>
                <p className="text-xs text-success mt-2">+23 this week</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="col-span-1"
            >
              <div className="glass rounded-xl p-5 h-full">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Avg Build Time</p>
                <p className="text-3xl font-bold text-foreground">47s</p>
                <p className="text-xs text-success mt-2">-12% faster</p>
              </div>
            </motion.div>
          </>
        )}

        {/* Projects Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="col-span-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Active Projects</h2>
            <button className="text-sm text-primary hover:text-primary/80 transition-colors" onClick={() => router.push('/dashboard/projects')}>
              View all
              <ArrowRight className="w-4 h-4 inline-block ml-1" />
            </button>
          </div>

          {/* Empty State */}
          {projects && projects.length === 0 && !isProjectsLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No projects found
              </h3>
              <p className="text-muted-foreground mb-8 max-w-sm">
                Get started by creating a new project from your Git repository.
              </p>
            </motion.div>
          )}

          {/* Grid */}
          {(isProjectsLoading || (projects && projects.length > 0)) && (
            <motion.div
              key={isProjectsLoading ? "loading" : "loaded"}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              <AnimatePresence mode="popLayout">
                {isProjectsLoading &&
                  Array.from({ length: 4 }).map((_, i) => (
                    <CardSkeleton key={i} />
                  ))}

                {projects?.map((project) => (
                  <ProjectCard key={project.id} project={project} layout={false} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
