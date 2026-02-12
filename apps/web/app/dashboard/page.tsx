"use client";

import { AnimatePresence, motion } from 'framer-motion';
import DeploymentActivityChart from '@/components/dashboard/DeploymentActivityChart';
import ActiveDeployments from '@/components/dashboard/ActiveDeployments';
import ProjectCard from '@/components/dashboard/ProjectCard';
import { ChartSkeleton, ListSkeleton, CardSkeleton, NameSkeleton } from '@/components/ui/skeleton';
import { useUser } from '@/hooks/use-user';
import { useRouter } from 'next/navigation';
import { useProjects } from '@/hooks/use-projects';
import { ArrowRight, Clock, Rocket } from 'lucide-react';
import { useDeployments } from '@/hooks/use-deployments';
import { useAnalytics } from '@/hooks/use-analytics';

const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
};

const Dashboard = () => {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { projects, isLoading: isProjectsLoading } = useProjects();
  const { deployments, isLoading: isDeploymentsLoading } = useDeployments();
  const { analytics, isLoading: isAnalyticsLoading } = useAnalytics();

  const isStatsLoading = isProjectsLoading || isAnalyticsLoading;

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
        {/* Deployment Activity Chart - Real Data */}
        {isStatsLoading ? (
          <div className="col-span-2 row-span-2">
            <ChartSkeleton />
          </div>
        ) : (
          <DeploymentActivityChart
            data={analytics?.deploymentsOverTime || []}
            deploymentsThisWeek={analytics?.deploymentsThisWeek || 0}
          />
        )}

        {/* Active Deployments */}
        {isDeploymentsLoading || isProjectsLoading ? (
          <div className="col-span-2">
            <ListSkeleton />
          </div>
        ) : (
          <ActiveDeployments deployments={deployments} projects={projects || []} />
        )}

        {/* Quick Stats - Real Analytics */}
        {isStatsLoading ? (
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
                <div className="flex items-center gap-2 mb-2">
                  <Rocket className="w-4 h-4 text-primary" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Deployments</p>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {analytics?.totalDeployments.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  +{analytics?.deploymentsThisWeek || 0} this week
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="col-span-1"
            >
              <div className="glass rounded-xl p-5 h-full">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-accent" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg Build Time</p>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {analytics?.avgBuildTime ? formatDuration(analytics.avgBuildTime) : '—'}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  last 30 days
                </p>
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
