"use client";

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import SystemHealthChart from '@/components/dashboard/SystemHealthChart';
import ActiveDeployments from '@/components/dashboard/ActiveDeployments';
import ProjectCard from '@/components/dashboard/ProjectCard';
import { ChartSkeleton, ListSkeleton, CardSkeleton, NameSkeleton } from '@/components/ui/skeleton';
import { useMockStore } from '@/stores/useMockStore';
import { useUser } from '@/hooks/use-user';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const Dashboard = () => {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { projects, loading, setLoading } = useMockStore();

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

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [setLoading]);

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
        {loading ? (
          <div className="col-span-2 row-span-2">
            <ChartSkeleton />
          </div>
        ) : (
          <SystemHealthChart />
        )}

        {/* Active Deployments */}
        {loading ? (
          <div className="col-span-2">
            <ListSkeleton />
          </div>
        ) : (
          <ActiveDeployments />
        )}

        {/* Quick Stats */}
        {loading ? (
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
              View all →
            </button>
          </div>
          <motion.div
            key={loading ? "loading" : "loaded"}
            variants={containerVariants} // Apply stagger logic here
            initial="hidden"
            animate="visible"
            className={cn(
              "grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
            )}
          >
            <AnimatePresence mode="popLayout">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <CardSkeleton key={i} />
                  ))
                : projects.map((project, ) => (
                    <ProjectCard key={project.id} project={project} layout={false} />
                  ))}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
