"use client";

import { motion } from "framer-motion";
import {
  GitCommit,
  Hammer,
  Globe,
  Check,
  Loader2,
  X,
  Clock,
  Rocket,
} from "lucide-react";
import { TiFlowChildren } from "react-icons/ti";
import { cn } from "@/lib/utils";
import { DeploymentStatus } from "@/types/project";

interface PipelineStep {
  icon: typeof GitCommit;
  label: string;
  sublabel?: string;
  status: "completed" | "active" | "pending" | "failed";
}

function getStepsFromStatus(deploymentStatus?: DeploymentStatus): PipelineStep[] {
  const s = deploymentStatus ?? DeploymentStatus.QUEUED;

  const map: Record<DeploymentStatus, PipelineStep[]> = {
    [DeploymentStatus.QUEUED]: [
      { icon: Clock, label: "Queued", sublabel: "Waiting…", status: "active" },
      { icon: GitCommit, label: "Source", sublabel: "Cloned", status: "pending" },
      { icon: Hammer, label: "Build", status: "pending" },
      { icon: Rocket, label: "Deploy", status: "pending" },
      { icon: Globe, label: "Ready", status: "pending" },
    ],
    [DeploymentStatus.BUILDING]: [
      { icon: Clock, label: "Queued", sublabel: "Done", status: "completed" },
      { icon: GitCommit, label: "Source", sublabel: "Cloned", status: "completed" },
      { icon: Hammer, label: "Build", sublabel: "Compiling…", status: "active" },
      { icon: Rocket, label: "Deploy", status: "pending" },
      { icon: Globe, label: "Ready", status: "pending" },
    ],
    [DeploymentStatus.DEPLOYING]: [
      { icon: Clock, label: "Queued", sublabel: "Done", status: "completed" },
      { icon: GitCommit, label: "Source", sublabel: "Cloned", status: "completed" },
      { icon: Hammer, label: "Build", sublabel: "Success", status: "completed" },
      { icon: Rocket, label: "Deploy", sublabel: "Pushing…", status: "active" },
      { icon: Globe, label: "Ready", status: "pending" },
    ],
    [DeploymentStatus.READY]: [
      { icon: Clock, label: "Queued", sublabel: "Done", status: "completed" },
      { icon: GitCommit, label: "Source", sublabel: "Cloned", status: "completed" },
      { icon: Hammer, label: "Build", sublabel: "Success", status: "completed" },
      { icon: Rocket, label: "Deploy", sublabel: "Live", status: "completed" },
      { icon: Globe, label: "Ready", sublabel: "Online", status: "completed" },
    ],
    [DeploymentStatus.FAILED]: [
      { icon: Clock, label: "Queued", sublabel: "Done", status: "completed" },
      { icon: GitCommit, label: "Source", sublabel: "Cloned", status: "completed" },
      { icon: Hammer, label: "Build", sublabel: "Failed", status: "failed" },
      { icon: Rocket, label: "Deploy", status: "pending" },
      { icon: Globe, label: "Ready", status: "pending" },
    ],
    [DeploymentStatus.CANCELED]: [
      { icon: Clock, label: "Queued", sublabel: "Canceled", status: "completed" },
      { icon: GitCommit, label: "Source", sublabel: "Cloned", status: "completed" },
      { icon: Hammer, label: "Build", status: "pending" },
      { icon: Rocket, label: "Deploy", status: "pending" },
      { icon: Globe, label: "Ready", status: "pending" },
    ],
    [DeploymentStatus.EXPIRED]: [
      { icon: Clock, label: "Queued", sublabel: "Done", status: "completed" },
      { icon: GitCommit, label: "Source", sublabel: "Cloned", status: "completed" },
      { icon: Hammer, label: "Build", sublabel: "Done", status: "completed" },
      { icon: Rocket, label: "Deploy", sublabel: "Expired", status: "completed" },
      { icon: Globe, label: "Ready", status: "pending" },
    ],
    [DeploymentStatus.SUPERSEDED]: [
      { icon: Clock, label: "Queued", sublabel: "Done", status: "completed" },
      { icon: GitCommit, label: "Source", sublabel: "Cloned", status: "completed" },
      { icon: Hammer, label: "Build", sublabel: "Done", status: "completed" },
      { icon: Rocket, label: "Deploy", sublabel: "Superseded", status: "completed" },
      { icon: Globe, label: "Ready", status: "completed" },
    ],
  };

  return map[s];
}

function getProgressPercent(steps: PipelineStep[]): number {
  const last = steps.length - 1;
  // Find the furthest completed or active step
  let furthest = -1;
  for (let i = last; i >= 0; i--) {
    if (steps[i].status === "completed" || steps[i].status === "active" || steps[i].status === "failed") {
      furthest = i;
      break;
    }
  }
  if (furthest <= 0) return 0;
  return (furthest / last) * 100;
}

interface PipelineVisualizerProps {
  deploymentStatus?: DeploymentStatus;
}

export const PipelineVisualizer = ({
  deploymentStatus,
}: PipelineVisualizerProps) => {
  const steps = getStepsFromStatus(deploymentStatus);
  const progress = getProgressPercent(steps);
  const isAllDone = steps.every((s) => s.status === "completed");
  const hasFailed = steps.some((s) => s.status === "failed");
  const isExpired = deploymentStatus === DeploymentStatus.EXPIRED;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 relative overflow-hidden"
    >
      {/* Ambient glow for completed state */}
      {isAllDone && (
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[400px] h-[120px] bg-emerald-500/8 rounded-full blur-3xl pointer-events-none" />
      )}

      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <TiFlowChildren className="w-6 h-6 text-violet-500" />
          Deployment Pipeline
        </h3>
        {isExpired && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-[11px] font-medium text-gray-400 px-2.5 py-1 rounded-full bg-gray-500/10 border border-gray-500/20"
          >
            Resources released
          </motion.span>
        )}
        {isAllDone && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-[11px] font-medium text-emerald-400 px-2.5 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20"
          >
            All systems go
          </motion.span>
        )}
        {hasFailed && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-[11px] font-medium text-red-400 px-2.5 py-1 rounded-full bg-red-400/10 border border-red-400/20"
          >
            Pipeline failed
          </motion.span>
        )}
      </div>

      <div className="relative px-2">
        {/* Rail background — z-0 so nodes sit on top */}
        <div className="absolute top-[22px] left-[24px] right-[24px] h-[3px] rounded-full bg-white/[0.06] z-0" />

        {/* Animated progress rail */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `calc((100% - 48px) * ${progress / 100})` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className={cn(
            "absolute top-[22px] left-[24px] h-[3px] rounded-full z-0",
            hasFailed
              ? "bg-gradient-to-r from-emerald-500 via-emerald-500 to-red-500"
              : "bg-gradient-to-r from-emerald-500 to-emerald-400",
          )}
        />

        {/* Glow on the progress tip */}
        {!isAllDone && !hasFailed && !isExpired && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `calc((100% - 48px) * ${progress / 100})` }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="absolute top-[18px] left-[24px] h-[11px] rounded-full bg-emerald-500/20 blur-sm pointer-events-none z-0"
          />
        )}

        <div className="relative z-10 flex justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = step.status === "completed";
            const isActive = step.status === "active";
            const isFailed = step.status === "failed";
            const isPending = step.status === "pending";

            return (
              <motion.div
                key={step.label}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay: index * 0.1 + 0.1,
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                }}
                className="flex flex-col items-center w-[48px]"
              >
                {/* Node */}
                <div className="relative">
                  {/* Active ring pulse */}
                  {isActive && (
                    <motion.div
                      animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-0 rounded-full bg-primary/30"
                    />
                  )}

                  {/* Failed ring pulse */}
                  {isFailed && (
                    <motion.div
                      animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-0 rounded-full bg-red-500/30"
                    />
                  )}

                  {/* Opaque backing to mask the rail behind the node */}
                  <div className="absolute inset-[-2px] rounded-full bg-[#0a0e1a]" />

                  <div
                    className={cn(
                      "w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 border relative",
                      isCompleted &&
                        "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_-3px_rgba(52,211,153,0.4)]",
                      isActive &&
                        "bg-primary/15 text-primary border-primary/30 shadow-[0_0_12px_-3px_rgba(var(--primary),0.4)]",
                      isFailed &&
                        "bg-red-500/15 text-red-400 border-red-500/30 shadow-[0_0_12px_-3px_rgba(239,68,68,0.4)]",
                      isPending &&
                        "bg-white/[0.04] text-muted-foreground/50 border-white/[0.08]",
                    )}
                  >
                    {isActive ? (
                      <Loader2 className="w-[18px] h-[18px] animate-spin" />
                    ) : isCompleted ? (
                      <motion.div
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                          delay: index * 0.1 + 0.3,
                          type: "spring",
                          stiffness: 400,
                          damping: 15,
                        }}
                      >
                        <Check className="w-[18px] h-[18px]" />
                      </motion.div>
                    ) : isFailed ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      >
                        <X className="w-[18px] h-[18px]" />
                      </motion.div>
                    ) : (
                      <Icon className="w-[18px] h-[18px]" />
                    )}
                  </div>
                </div>

                {/* Label */}
                <motion.span
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                  className={cn(
                    "mt-3 text-xs font-medium",
                    isCompleted && "text-emerald-400",
                    isActive && "text-primary",
                    isFailed && "text-red-400",
                    isPending && "text-muted-foreground/50",
                  )}
                >
                  {step.label}
                </motion.span>

                {/* Sublabel */}
                {step.sublabel && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 + 0.4 }}
                    className={cn(
                      "text-[10px] mt-0.5",
                      isCompleted && "text-emerald-400/50",
                      isActive && "text-primary/50",
                      isFailed && "text-red-400/50",
                      isPending && "text-muted-foreground/30",
                    )}
                  >
                    {step.sublabel}
                  </motion.span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};