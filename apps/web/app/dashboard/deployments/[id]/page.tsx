/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Loader2, 
  GitBranch, ExternalLink, 
  Cpu, HardDrive, Zap, Server, Box, Layers, RotateCw,
  Globe,
  Check,
  Copy,
  LayoutTemplate,
  GitCommit,
  User,
  Timer,
  Clock,
  ArrowUpRight,
  GitCommitVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TerminalLogs } from "@/components/project/TerminalLogs";
import { Badge } from "@/components/ui/badge";
import { DeploymentNotFoundState } from "@/components/feedback/DeploymentNotFoundState";
import { useDeployment } from "@/hooks/use-deployments";
import { useProjects } from "@/hooks/use-projects";
import { getStatusConfig } from "@/components/project/utils";
import { formatDistanceToNow } from "date-fns";
import { Log } from "@/stores/useMockStore";


export default function DeploymentDetails() {
  const router = useRouter();
  const params = useParams();
  const [copied, setCopied] = useState<string | null>(null);

  const deploymentId = params.id as string;
  const { deployment, isLoading: isDeploymentsLoading } = useDeployment(deploymentId);
  const { getProjectById, isLoading: isProjectsLoading } = useProjects();

  const project = getProjectById(deployment?.projectId || "");
  const logs = [] as Log[];

  if (isDeploymentsLoading || isProjectsLoading) {
    return <div>Loading...</div>;
  }

  if (!deployment || !project) {
    return <DeploymentNotFoundState deploymentId={deploymentId} />;
  }

  const statusConfig = getStatusConfig(deployment.status);
  const isReady = deployment.status === 'READY';
  const commitUrl = `https://github.com/${project.gitRepoOwner}/${project.gitRepoName}/commit/${deployment.commitHash}`;
  const branchUrl = `${project.gitRepoUrl}/tree/${project.gitBranch}`

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="p-8 max-w-[1920px] mx-auto space-y-8 min-h-screen">
      
      {/* --- 1. HEADER --- */}
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
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center border backdrop-blur-xl",
              statusConfig.text, statusConfig.glow
            )}>
              {statusConfig.icon}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
                {project.name}
                <span className="text-muted-foreground font-normal text-lg">/ {deploymentId.substring(0,8)}</span>
              </h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <Badge variant="outline" className={cn("capitalize border-white/10 px-2 py-0", statusConfig.text)}>
                  {statusConfig.label}
                </Badge>
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
              onClick={() => window.open(`https://${deployment.deploymentUrl}`, '_blank')}
            >
              <ExternalLink className="w-4 h-4" />
              Live Preview
            </Button>
          )}
          <Button variant="outline" className="gap-2 border-white/10 bg-white/5 hover:bg-white/10 text-foreground group">
            <RotateCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
            Redeploy
          </Button>
        </div>
      </motion.div>

      {/* --- 2. HERO ROW: PREVIEW & TELEMETRY --- */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Machine Telemetry (Takes 2/3) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="xl:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <StatCard icon={Cpu} label="vCPU" value={deployment.machineCpu} subValue="High-Perf" colorName="blue" />
          <StatCard icon={Zap} label="Memory" value={deployment.machineRam} subValue="DDR5 ECC" colorName="amber" />
          <StatCard icon={HardDrive} label="Storage" value={deployment.machineStorage} subValue="NVMe SSD" colorName="purple" />
          <StatCard icon={Server} label="System" value={deployment.machineOS} subValue={deployment.deploymentRegion} colorName="emerald" pulse />
        </motion.div>

        {/* Visual Preview (Takes 1/3) */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 0.1 }}
          className="group relative aspect-video xl:aspect-auto xl:h-40 w-full rounded-xl overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-2xl flex flex-col"
        >
          {/* Mock Browser Header */}
          <div className="h-8 bg-[#0f0f0f] border-b border-white/5 flex items-center px-3 gap-2">
            <div className="flex gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500/20"/><div className="w-2 h-2 rounded-full bg-yellow-500/20"/><div className="w-2 h-2 rounded-full bg-emerald-500/20"/></div>
            <div className="flex-1 bg-black/40 h-5 rounded text-[10px] flex items-center px-2 text-muted-foreground font-mono truncate">
              {deployment.deploymentUrl}
            </div>
          </div>
          {/* Content */}
          <div className="flex-1 bg-gradient-to-br from-indigo-900/10 via-[#050505] to-purple-900/10 flex items-center justify-center group-hover:bg-white/5 transition-colors cursor-pointer" onClick={() => window.open(`https://${deployment.deploymentUrl}`, '_blank')}>
            {isReady ? (
              <div
                className="relative w-full h-full rounded-xl overflow-hidden cursor-pointer group"
                onClick={() => window.open(`https://${deployment.deploymentUrl}`, "_blank")}
              >
                <iframe
                  src={`/api/preview?url=https://${deployment.deploymentUrl}`}
                  className="w-full h-full pointer-events-none scale-[0.25] origin-top-left"
                  style={{ width: "400%", height: "400%" }}
                />

                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ExternalLink className="w-6 h-6 text-white" />
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 pt-9">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-sm text-muted-foreground animate-pulse">
                  Deployment in progress...
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* --- MAIN DASHBOARD LAYOUT --- */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-full">
        
        {/* LEFT: THE TERMINAL (2/3 width) */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="xl:col-span-2 flex flex-col gap-6"
        >
          {/* Terminal Container */}
          <TerminalLogs logs={logs} projectName={project.name} />
        </motion.div>

        {/* RIGHT: SYSTEM SPECS (1/3 width) */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          {/* Domains Card */}
          <div className="glass-card p-5 rounded-xl border border-white/10 bg-white/5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Globe className="w-3.5 h-3.5" /> Active Domains
            </h3>
            <div className="space-y-2">
              <DomainRow 
                url={deployment.deploymentUrl} 
                main 
                isCopied={copied === 'main'} 
                onCopy={() => handleCopy(deployment.deploymentUrl, 'main')} 
              />
              <DomainRow 
                url={`${deployment.id.substring(0,8)}-${project.name}.code2cloud.app`} 
                isCopied={copied === 'sub'} 
                onCopy={() => handleCopy(`${deploymentId}-app`, 'sub')} 
              />
            </div>
          </div>

          {/* Source Control Card */}
          <div className="glass-card p-5 rounded-xl border border-white/10 bg-white/5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Box className="w-3.5 h-3.5" /> Source Control
            </h3>
            <div className="bg-[#0a0a0a]/50 rounded-lg p-3 border border-white/5 mb-4">
              <p className="text-sm text-foreground leading-relaxed italic line-clamp-2">
                &quot;{deployment.commitMessage}&quot;
              </p>
            </div>
            <div className="space-y-3">
              <InfoRow label="Branch" value={deployment.branch} mono icon={<GitBranch className="w-3.5 h-3.5"/>} url={branchUrl} />
              <InfoRow label="Commit" value={deployment.commitHash.substring(0, 7)} mono icon={<GitCommit className="w-3.5 h-3.5"/>} url={commitUrl} />
              <InfoRow label="Committer" value={deployment.commitAuthor} icon={<User className="w-3.5 h-3.5"/>} />
              <InfoRow 
                label="Duration" 
                value={
                  deployment.duration 
                    ? `${deployment.duration}s` 
                    : (deployment.status === "BUILDING" || deployment.status === "DEPLOYING")
                      ? "Calculating…" 
                      : "—"
                } 
                icon={<Timer className="w-3.5 h-3.5"/>} 
              />
            </div>
          </div>

          {/* Config Card */}
          <div className="glass-card p-5 rounded-xl border border-white/10 bg-white/5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5" /> Build Config
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Framework</span>
                <span className="text-foreground font-medium flex items-center gap-1.5"><Box className="w-3.5 h-3.5"/>{project.framework}</span>
              </div>

              <div className="space-y-3 pt-3 border-t border-white/5">
                <CommandRow label="Build Command" command={project.buildCommand} />
                <CommandRow label="Output Directory" command={project.outputDirectory} />
                <CommandRow label="Install Command" command={project.installCommand} />
              </div>
            </div>
          </div>

        </motion.div>
      </div>
    </div>
  );
}

// --- SUBCOMPONENTS ---

const StatCard = ({ icon: Icon, label, value, subValue, colorName, pulse }: any) => {
  // Define mapping for colors to ensure Tailwind picks them up
  // This is the safest way to handle dynamic Tailwind classes
  const colors: any = {
    blue: "text-blue-400 bg-blue-400",
    amber: "text-amber-400 bg-amber-400",
    purple: "text-purple-400 bg-purple-400",
    emerald: "text-emerald-400 bg-emerald-400",
  };

  const activeColor = colors[colorName] || colors.blue;

  return (
    <div className="glass-card p-5 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md relative overflow-hidden group hover:border-white/20 hover:bg-white/[0.07] transition-all duration-300 h-40 flex flex-col justify-between">
      
      {/* Large Decorative Icon */}
      <div className={cn(
        "absolute -top-1 -right-1 p-3 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500 rotate-12 group-hover:rotate-0",
        activeColor.split(' ')[0] // takes the 'text-...' part
      )}>
        <Icon className="w-24 h-24" />
      </div>

      {/* Header: Icon & Label */}
      <div className="relative z-10 flex items-center gap-2.5">
        <div className={cn("p-1.5 rounded-lg bg-white/5 border border-white/10 shadow-sm", activeColor.split(' ')[0])}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>

      {/* Footer: Value & SubValue */}
      <div className="relative z-10">
        <div className="text-2xl font-bold text-white tracking-tight leading-none group-hover:translate-x-1 transition-transform duration-300">
          {value}
        </div>
        
        {subValue && (
          <div className="flex items-center gap-1.5 mt-2">
            <div className={cn(
              "shrink-0 w-1 h-1 rounded-full", 
              activeColor.split(' ')[1], // takes the 'bg-...' part
              (pulse || label === "System") && "animate-pulse shadow-[0_0_8px_currentColor]"
            )} />
            <span className="text-[10px] text-muted-foreground/70 font-mono uppercase tracking-tighter whitespace-nowrap">
              {subValue}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const DomainRow = ({ url, main, isCopied, onCopy }: any) => (
  <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/5 group hover:border-white/10 transition-colors">
    <div className="flex items-center gap-3 overflow-hidden">
      {main ? <Globe className="w-3.5 h-3.5 text-primary flex-shrink-0" /> : <LayoutTemplate className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
      <a href={`https://${url}`} target="_blank" className="text-xs text-foreground hover:underline truncate font-mono block">
        {url}
      </a>
    </div>
    <button 
      onClick={onCopy}
      className="p-1.5 rounded-md hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
    >
      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  </div>
);

const InfoRow = ({ label, value, mono, icon, url }: any) => {
  const content = (
    <span className={cn(
      "font-medium text-foreground text-sm flex items-center gap-1 transition-colors",
      mono && "font-mono text-xs bg-black/30 px-1.5 py-0.5 rounded text-muted-foreground border border-white/5",
      url && "group-hover:text-blue-400"
    )}>
      {value}
      {url && (
        <ArrowUpRight className="w-3 h-3" />
      )}
    </span>
  );

  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-muted-foreground flex items-center gap-2 text-xs">
        {icon} {label}
      </span>
      {url ? (
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="group" // Used to trigger the icon hover
        >
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  );
};

const CommandRow = ({ label, command }: any) => (
  <div className="flex items-center justify-between gap-4">
    <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">{label}</span>
    <div className="font-mono text-[10px] bg-[#0a0a0a] px-2 py-1 rounded border border-white/10 text-gray-400 truncate max-w-[120px]">
      {command}
    </div>
  </div>
);