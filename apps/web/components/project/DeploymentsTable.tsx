"use client";

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { GitBranch, Clock, ArrowRight, Rocket } from 'lucide-react';
import { Deployment, Project } from '@/types/project';
import { getStatusConfig } from './utils';
import { formatDistanceToNow } from 'date-fns';

interface DeploymentsTableProps {
  deployments: Deployment[];
  project: Project;
}

export const DeploymentsTable = ({ deployments }: DeploymentsTableProps) => {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card overflow-hidden rounded-xl border border-white/10"
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5 bg-white/5">
              <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Status</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Commit</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Branch</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Duration</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Created</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {deployments.map((deployment, index) => {
              const deploymentStatus = getStatusConfig(deployment.status);

              return (
              <motion.tr
                key={deployment.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => router.push(`/dashboard/deployments/${deployment.id}`)} // Navigate to details
                className="hover:bg-white/5 transition-colors group cursor-pointer"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {deploymentStatus.icon}
                    <span className={`${deploymentStatus.text} text-sm font-medium capitalize`}>
                      {deploymentStatus.label}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-white/10 px-1.5 py-0.5 rounded text-foreground font-mono">
                        {deployment.commitHash.substring(0, 7)}
                      </code>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate max-w-[250px]" title={deployment.commitMessage}>
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
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    {deployment.duration ? (
                      <span className="text-foreground">{deployment.duration}s</span>
                    ) : deployment.status === "BUILDING" || deployment.status === "DEPLOYING" ? (
                      <span className="italic text-blue-400 animate-pulse">Calculating…</span>
                    ) : (
                      <span className="italic opacity-60">—</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(deployment.startedAt)} ago
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </td>
              </motion.tr>
            )})}
          </tbody>
        </table>

        {deployments.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 border border-white/10 text-center"
          >
            <div className="w-16 h-16 bg-white/[0.03] rounded-full flex items-center justify-center mb-4 border border-white/10 shadow-lg">
              <Rocket className="w-8 h-8 text-white/40" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No deployments yet</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-6">
              Push to your repository to trigger your first deployment.
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};