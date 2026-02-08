/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  GitBranch,
  ExternalLink,
  Server,
  Box,
  RotateCw,
  Globe,
  Check,
  Copy,
  LayoutTemplate,
  GitCommit,
  User,
  Clock,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  GitCommitVertical,
  ShieldCheck,
  CheckCircle2,
  Circle,
  Settings2,
  Activity,
  Terminal as TerminalIcon,
  ImageOff,
  X,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TerminalLogs } from "@/components/project/TerminalLogs";
import { DeploymentNotFoundState } from "@/components/feedback/DeploymentNotFoundState";
import { useDeployment, useDeployments } from "@/hooks/use-deployments";
import { useDeploymentLogs } from "@/hooks/use-deployment-logs";
import { useProjects } from "@/hooks/use-projects";
import { getStatusConfig } from "@/components/project/utils";
import { formatDistanceToNow } from "date-fns";
import { DeploymentStatus, LogSource } from "@/types/project";
import { DeploymentDetailsSkeleton } from "@/components/ui/skeleton";

const FRONTEND_FRAMEWORKS = [
  "next", "nextjs", "next.js", "react", "vue", "nuxt", "nuxtjs", "nuxt.js",
  "svelte", "sveltekit", "angular", "gatsby", "astro", "remix", "vite",
  "solid", "solidstart", "qwik",
];

function isFrontendFramework(fw: string): boolean {
  return FRONTEND_FRAMEWORKS.includes(fw.toLowerCase().trim());
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

// ─── Collapsible Section ─────────────────────────────────────

function Section({
  title,
  defaultOpen = false,
  right,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-white/[0.06] rounded-xl bg-white/[0.02] overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          {open ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
          <span className="text-sm font-medium text-foreground">{title}</span>
        </div>
        {right && <div className="flex items-center gap-3">{right}</div>}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/[0.06]">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Status Dot for sections ─────────────────────────────────

function StatusDot({ status }: { status: DeploymentStatus }) {
  const done = status === DeploymentStatus.READY || status === DeploymentStatus.EXPIRED;
  const failed = status === DeploymentStatus.FAILED || status === DeploymentStatus.CANCELED;
  const active = status === DeploymentStatus.BUILDING || status === DeploymentStatus.DEPLOYING;

  if (done) return <CheckCircle2 className="w-[18px] h-[18px] text-emerald-400" />;
  if (failed)
    return (
      <div className="w-[18px] h-[18px] rounded-full border-2 border-red-400 flex items-center justify-center">
        <span className="text-red-400 text-[10px] font-bold">!</span>
      </div>
    );
  if (active) return <Loader2 className="w-[18px] h-[18px] text-amber-400 animate-spin" />;
  return <Circle className="w-[18px] h-[18px] text-muted-foreground" />;
}

// ─── Main Component ──────────────────────────────────────────

export default function DeploymentDetails() {
  const router = useRouter();
  const params = useParams();
  const [copied, setCopied] = useState<string | null>(null);

  const deploymentId = params.id as string;
  const { redeploy } = useDeployments();
  const { deployment, isLoading: isDeploymentsLoading, cancelDeployment } = useDeployment(deploymentId);
  const { getProjectById, isLoading: isProjectsLoading } = useProjects();
  const { logs, isLive, isLoading: isLogsLoading } = useDeploymentLogs(deploymentId, {
    source: LogSource.BUILD,
  });

  const project = getProjectById(deployment?.projectId || "");

  if (isDeploymentsLoading || isProjectsLoading) return <DeploymentDetailsSkeleton />;
  if (!deployment || !project) return <DeploymentNotFoundState deploymentId={deploymentId} />;

  const statusConfig = getStatusConfig(deployment.status, 24);
  const isReady = deployment.status === DeploymentStatus.READY;
  const isActive =
    deployment.status === DeploymentStatus.BUILDING ||
    deployment.status === DeploymentStatus.DEPLOYING;
  
  const canCancel = isActive ||
    deployment.status === DeploymentStatus.QUEUED;
  const isFrontend = isFrontendFramework(project.framework);
  const commitUrl = `https://github.com/${project.gitRepoOwner}/${project.gitRepoName}/commit/${deployment.commitHash}`;
  const branchUrl = `${project.gitRepoUrl}/tree/${project.gitBranch}`;

  const handleRedeploy = () => {
    redeploy(project.id);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="p-8 max-w-[1920px] mx-auto space-y-8 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col xl:flex-row xl:items-center justify-between gap-6"
      >
        <div className="flex flex-col gap-4">
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Fleet
          </motion.button>

          <div className="flex items-center gap-4">
            <div
              className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center border backdrop-blur-xl border-white/10 bg-white/5 shadow-md",
                statusConfig.text,
              )}
            >
              {statusConfig.icon}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3">
                {project.name}
                <span className="text-muted-foreground font-normal text-lg">
                  / {deploymentId.substring(0, 8)}
                </span>
              </h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <div className="flex flex-shrink-0 items-center gap-2 px-2.5 py-1 rounded-full border border-white/5">
                  <span className={cn("relative flex h-2 w-2")}>
                    {isActive && (
                      <span
                        className={cn(
                          "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                          statusConfig.color,
                        )}
                      />
                    )}
                    <span
                      className={cn(
                        "relative inline-flex rounded-full h-2 w-2",
                        statusConfig.color,
                        statusConfig.glow,
                      )}
                    />
                  </span>
                  <span className={cn("text-xs font-medium capitalize", statusConfig.text)}>
                    {statusConfig.label}
                  </span>
                </div>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span className="flex items-center gap-1.5 font-mono text-xs">
                  <GitBranch className="w-3 h-3" /> {deployment.branch}
                </span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span className="flex items-center gap-1.5 font-mono text-xs">
                  <GitCommitVertical className="w-3 h-3" />
                  {deployment.commitHash.substring(0, 7)}
                </span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span className="flex items-center gap-1.5 font-mono text-xs">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(deployment.startedAt)} ago
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          {isReady && (
            <Button
              className="gap-2 bg-gradient-to-r from-emerald-400 to-cyan-400 text-black font-bold hover:opacity-90 shadow-[0_0_20px_-5px_rgba(52,211,153,0.5)] transition-all border-0"
              onClick={() =>
                window.open(`${deployment.deploymentUrl}`, "_blank")
              }
            >
              <ExternalLink className="w-4 h-4" />
              Live Preview
            </Button>
          )}
          {canCancel ? (
            <Button
              variant="outline"
              className="gap-2 border-red-400 text-red-400 hover:bg-red-400/10"
              onClick={cancelDeployment}
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
          ) : (
            <Button
              variant="outline"
              className="gap-2 border-white/10 bg-white/5 hover:bg-white/10 text-foreground group"
              onClick={handleRedeploy}
            >
              <RotateCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
              Redeploy
            </Button>
          )}
        </div>
      </motion.div>

      {/* ── TOP CARD: PREVIEW + META ──────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="border border-white/[0.06] rounded-xl bg-white/[0.02] overflow-hidden"
      >
        <div className="flex flex-col lg:flex-row">
          {/* Preview (frontend only) or Placeholder */}
          <div className="lg:w-[400px] shrink-0 border-b lg:border-b-0 lg:border-r border-white/[0.06] bg-[#050505] relative overflow-hidden flex flex-col justify-center">
            {isFrontend && isReady ? (
              <div
                className="aspect-[16/10] relative group cursor-pointer overflow-hidden"
                onClick={() =>
                  window.open(`${deployment.deploymentUrl}`, "_blank")
                }
              >
                <SitePreview url={deployment.deploymentUrl} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/60 via-transparent to-transparent opacity-60 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none" />
              </div>
            ) : (
              <div className="aspect-[16/10] flex items-center justify-center p-8">
                <div className="text-center space-y-3">
                  {isActive ? (
                    <>
                      <Loader2 className="w-6 h-6 mx-auto animate-spin text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Building…</p>
                    </>
                  ) : !isFrontend ? (
                    <>
                      <Server className="w-6 h-6 mx-auto text-muted-foreground/50" />
                      <p className="text-xs text-muted-foreground/50">
                        Preview not available for server applications
                      </p>
                    </>
                  ) : (
                    <>
                      <Box className="w-6 h-6 mx-auto text-muted-foreground/50" />
                      <p className="text-xs text-muted-foreground/50">No preview</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Meta Grid */}
          <div className="flex-1 p-5 space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <MetaField label="Created">
                <span className="text-sm text-foreground">
                  {new Date(deployment.startedAt).toLocaleDateString("en-US", {
                    month: "numeric", day: "numeric", year: "2-digit",
                  })}
                </span>
                <span className="text-xs text-muted-foreground ml-1.5">
                  {formatDistanceToNow(deployment.startedAt)} ago
                </span>
              </MetaField>
              <MetaField label="Status">
                <span className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      statusConfig.color,
                      isActive && "animate-pulse",
                    )}
                  />
                  <span className={cn("text-sm font-medium", statusConfig.text)}>
                    {statusConfig.label}
                  </span>
                </span>
              </MetaField>
              <MetaField label="Duration">
                <span className="flex items-center gap-1.5 text-sm text-foreground">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  {deployment.duration
                    ? formatDuration(deployment.duration)
                    : isActive ? "Running…" : "—"}
                </span>
              </MetaField>
              <MetaField label="Environment">
                <span className="text-sm text-foreground capitalize flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-muted-foreground" />
                  {deployment.environment.toLowerCase()}
                </span>
              </MetaField>
            </div>

            <div className="border-t border-white/[0.06]" />

            {/* Domains */}
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground font-medium">Domains</span>
              <div className="space-y-1.5">
                {project.domains && project.domains.map((domain) => (
                  <DomainRow
                    key={domain.id}
                    url={domain.name}
                    primary={domain.name === deployment.deploymentUrl}
                    isCopied={copied === domain.name}
                    onCopy={() => handleCopy(domain.name, domain.name)}
                  />
                ))}
              </div>
            </div>

            <div className="border-t border-white/[0.06]" />

            {/* Source */}
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground font-medium">Source</span>
              <div className="space-y-1.5">
                <a
                  href={branchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-foreground hover:text-blue-400 transition-colors group w-fit"
                >
                  <GitBranch className="w-3.5 h-3.5 text-muted-foreground group-hover:text-blue-400" />
                  <span className="font-mono text-xs">{deployment.branch}</span>
                </a>
                <a
                  href={commitUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-blue-400 transition-colors group w-fit"
                >
                  <GitCommit className="w-3.5 h-3.5" />
                  <span className="font-mono text-xs">
                    {deployment.commitHash.substring(0, 7)}
                  </span>
                  {deployment.commitMessage && (
                    <span className="text-xs truncate max-w-[300px]">
                      {deployment.commitMessage}
                    </span>
                  )}
                </a>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── COLLAPSIBLE SECTIONS ──────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        {/* Deployment Settings */}
        <Section
          title="Deployment Settings"
          right={
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-mono">{project.framework}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground">
                {deployment.deploymentRegion}
              </span>
            </div>
          }
        >
          <div className="p-5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              <SettingsRow label="Framework" value={project.framework} />
              <SettingsRow label="Region" value={deployment.deploymentRegion} />
              <SettingsRow label="OS" value={deployment.machineOS} />
              <SettingsRow label="Branch" value={deployment.branch} mono />
              <SettingsRow label="Build Command" value={project.buildCommand} mono />
              <SettingsRow label="Install Command" value={project.installCommand} mono />
              <SettingsRow label="Output Directory" value={project.outputDirectory} mono />
              <SettingsRow label="Root Directory" value={project.rootDirectory || "./"} mono />
            </div>
          </div>
        </Section>

        {/* Build Logs */}
        <Section
          title="Build Logs"
          defaultOpen
          right={
            <div className="flex items-center gap-2.5">
              {deployment.duration && (
                <span className="text-xs font-mono text-muted-foreground">
                  {formatDuration(deployment.duration)}
                </span>
              )}
              <StatusDot status={deployment.status} />
            </div>
          }
        >
          <div className="h-[500px] flex flex-col">
            <TerminalLogs
              logs={logs}
              projectName={project.name}
              isLive={isLive}
              logSource={LogSource.BUILD}
              isLoading={isLogsLoading}
            />
          </div>
        </Section>

        {/* Deployment Summary */}
        <Section
          title="Deployment Summary"
          right={
            <div className="flex items-center gap-2.5">
              {deployment.commitAuthor && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <User className="w-3 h-3" />
                  {deployment.commitAuthor}
                </span>
              )}
              <StatusDot status={deployment.status} />
            </div>
          }
        >
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              <SettingsRow label="Deployment ID" value={deploymentId.substring(0, 12)} mono />
              <SettingsRow label="Environment" value={deployment.environment.toLowerCase()} />
              <SettingsRow label="Region" value={deployment.deploymentRegion} />
              <SettingsRow label="Author" value={deployment.commitAuthor} />
              <SettingsRow
                label="Started"
                value={new Date(deployment.startedAt).toLocaleString("en-US", {
                  month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                })}
              />
              {deployment.finishedAt && (
                <SettingsRow
                  label="Finished"
                  value={new Date(deployment.finishedAt).toLocaleString("en-US", {
                    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                />
              )}
            </div>
          </div>
        </Section>

        {/* Assigning Domains */}
        <Section
          title="Assigning Domains"
          right={<StatusDot status={deployment.status} />}
        >
          <div className="p-5 space-y-2">
            {project.domains && project.domains.map((domain) => (
              <DomainRow
                key={domain.id}
                url={domain.name}
                primary={domain.name === deployment.deploymentUrl}
                isCopied={copied === domain.name}
                onCopy={() => handleCopy(domain.name, domain.name)}
              />
            ))}
            {isReady && (
              <p className="text-[11px] text-emerald-400/60 flex items-center gap-1.5 pt-2">
                <ShieldCheck className="w-3 h-3" />
                SSL certificates provisioned and active
              </p>
            )}
          </div>
        </Section>
      </motion.div>

      {/* ── BOTTOM QUICK LINKS ────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pb-8"
      >
        <QuickLink
          icon={TerminalIcon}
          title="Runtime Logs"
          description="View and debug runtime logs & errors"
          href={`/dashboard/projects/${deployment.projectId}?tab=logs`}
        />
        <QuickLink
          icon={Activity}
          title="Monitoring"
          description="Monitor app health & uptime"
          href={`/dashboard/projects/${deployment.projectId}?tab=monitoring`}
        />
        <QuickLink
          icon={Settings2}
          title="Project Settings"
          description="Configure build, env vars & domains"
          href={`/dashboard/projects/${deployment.projectId}?tab=settings`}
        />
      </motion.div>
    </div>
  );
}

// ─── Subcomponents ───────────────────────────────────────────

function MetaField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <div>{children}</div>
    </div>
  );
}

function SettingsRow({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between text-sm py-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span
        className={cn(
          "text-foreground text-xs",
          mono && "font-mono bg-black/30 px-1.5 py-0.5 rounded border border-white/5 text-muted-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function DomainRow({ url, primary, isCopied, onCopy }: any) {
  return (
    <div className="flex items-center group">
      <a
        href={`${url}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-sm hover:text-blue-400 transition-colors min-w-0"
      >
        {primary ? (
          <Globe className="w-3.5 h-3.5 text-foreground shrink-0" />
        ) : (
          <LayoutTemplate className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        )}
        <span className="font-mono text-xs truncate">{url}</span>
      </a>
      <button
        onClick={onCopy}
        className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100 shrink-0 ml-2"
      >
        {isCopied ? (
          <Check className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}

function QuickLink({ icon: Icon, title, description, href }: {
  icon: any; title: string; description: string; href: string;
}) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(href)}
      className="text-left p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all group"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="text-sm font-medium text-foreground flex items-center gap-2">
            <Icon className="w-4 h-4 text-muted-foreground" />
            {title}
          </span>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </button>
  );
}

function SitePreview({ url }: { url: string }) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const screenshotUrl = `https://api.microlink.io?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=1280&viewport.height=800`;

  return (
    <div className="w-full h-full relative">
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#050505] z-10">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050505] z-10 gap-2">
          <ImageOff className="w-5 h-5 text-muted-foreground/50" />
          <p className="text-[11px] text-muted-foreground/50">Failed to load preview</p>
        </div>
      )}
      <Image
        src={screenshotUrl}
        alt={`Preview of ${url}`}
        fill
        className={cn(
          "object-cover object-top transition-opacity duration-500",
          status === "ready" ? "opacity-100" : "opacity-0",
        )}
        unoptimized
        onLoad={() => setStatus("ready")}
        onError={() => setStatus("error")}
      />
    </div>
  );
}