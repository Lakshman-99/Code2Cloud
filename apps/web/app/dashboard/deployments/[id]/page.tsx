/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowLeft, CheckCircle2, XCircle, Loader2, PlayCircle, 
  GitBranch, ExternalLink, Terminal, 
  Cpu, HardDrive, Zap, Server, Box, Layers, RotateCw,
  Globe,
  Check,
  Copy,
  LayoutTemplate,
  GitCommit,
  User,
  Timer
} from "lucide-react";
import { useMockStore } from "@/stores/useMockStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TerminalLogs } from "@/components/project/TerminalLogs";
import { Badge } from "@/components/ui/badge";

// --- MOCK INFRASTRUCTURE DATA ---
const mockSystemStats = {
  instanceType: "c7g.2xlarge",
  vcpu: "8 vCPU",
  ram: "16 GB DDR5",
  storage: "SSD 512GB",
  os: "Ubuntu 22.04 LTS",
  region: "us-east-1",
  provider: "AWS Nitro"
};

const mockConfig = {
  buildCommand: "npm run build",
  outputDirectory: ".next",
  installCommand: "npm install",
  framework: "Next.js 14",
  nodeVersion: "18.x (LTS)"
};

const statusConfig = {
  ready: { 
    icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", glow: "shadow-[0_0_30px_-10px_rgba(16,185,129,0.3)]", animate: "" 
  },
  building: { 
    icon: Loader2, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", glow: "shadow-[0_0_30px_-10px_rgba(59,130,246,0.3)]", animate: "animate-spin" 
  },
  error: { 
    icon: XCircle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", glow: "shadow-[0_0_30px_-10px_rgba(239,68,68,0.3)]", animate: "" 
  },
  queued: { 
    icon: PlayCircle, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", glow: "shadow-[0_0_30px_-10px_rgba(234,179,8,0.3)]", animate: "" 
  },
};

export default function DeploymentDetails() {
  const router = useRouter();
  const { id } = useParams();
  const { deployments, projects, getLogsByProject } = useMockStore();
  const [copied, setCopied] = useState<string | null>(null);

  const deployment = deployments.find((d) => d.id === id);
  const project = projects.find((p) => p.id === deployment?.projectId);
  const logs = project ? getLogsByProject(project.id) : [];

  if (!deployment || !project) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground">
        Deployment not found
      </div>
    );
  }

  const status = statusConfig[deployment.status as keyof typeof statusConfig] || statusConfig.ready;
  const StatusIcon = status.icon;
  const isReady = deployment.status === 'ready';

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
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors w-fit group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-mono tracking-wide text-xs uppercase">Back to Fleet</span>
          </button>

          <div className="flex items-center gap-4">
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center border backdrop-blur-xl",
              status.bg, status.border, status.glow
            )}>
              <StatusIcon className={cn("w-7 h-7", status.color, status.animate)} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
                {project.name}
                <span className="text-muted-foreground font-normal text-lg">/ {deployment.id.substring(0,8)}</span>
              </h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <Badge variant="outline" className={cn("capitalize border-white/10 px-2 py-0", status.color, status.bg)}>
                  {deployment.status}
                </Badge>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span className="flex items-center gap-1.5 font-mono text-xs">
                  <GitBranch className="w-3 h-3" /> {deployment.branch}
                </span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span className="flex items-center gap-1.5 font-mono text-xs">
                  {deployment.commit.substring(0, 7)}
                </span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span>{deployment.timestamp}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          {isReady && (
            <Button 
              className="gap-2 bg-gradient-to-r from-emerald-400 to-cyan-400 text-black font-bold hover:opacity-90 shadow-[0_0_20px_-5px_rgba(52,211,153,0.5)] transition-all border-0"
              onClick={() => window.open(`https://${project.domain}`, '_blank')}
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
          <StatCard icon={Cpu} label="vCPU" value={mockSystemStats.vcpu} subValue="High-Perf" color="text-blue-400" />
          <StatCard icon={Zap} label="Memory" value={mockSystemStats.ram} subValue="DDR5 ECC" color="text-amber-400" />
          <StatCard icon={HardDrive} label="Storage" value={mockSystemStats.storage} subValue="NVMe SSD" color="text-purple-400" />
          <StatCard icon={Server} label="System" value={mockSystemStats.os} subValue={mockSystemStats.region} color="text-emerald-400" />
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
              {project.domain}
            </div>
          </div>
          {/* Content */}
          <div className="flex-1 bg-gradient-to-br from-indigo-900/10 via-[#050505] to-purple-900/10 flex items-center justify-center group-hover:bg-white/5 transition-colors cursor-pointer" onClick={() => window.open(`https://${project.domain}`, '_blank')}>
            {isReady ? (
              <div
                className="relative w-full h-full rounded-xl overflow-hidden cursor-pointer group"
                onClick={() => window.open(`https://${project.domain}`, "_blank")}
              >
                <iframe
                  src={`/api/preview?url=https://${project.domain}`}
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
          <div className="glass-card rounded-xl overflow-hidden border border-white/10 bg-[#050505] flex flex-col h-[600px] shadow-2xl relative group">
            
            {/* Glossy Header */}
            <div className="px-4 py-3 border-b border-white/10 bg-white/5 flex items-center justify-between backdrop-blur-md z-10">
              <div className="flex items-center gap-3">
                <Terminal className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground tracking-wide">Build Output</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-muted-foreground border border-white/5 font-mono">
                  v2.4.0
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </span>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                </div>
              </div>
            </div>

            {/* Logs Component */}
            <div className="flex-1 relative">
              {/* Scanline Effect Overlay */}
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[5] bg-[length:100%_2px,3px_100%] opacity-20" />
              
              <TerminalLogs logs={logs} projectName={project.name} />
            </div>
          </div>
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
                url={project.domain} 
                main 
                isCopied={copied === 'main'} 
                onCopy={() => handleCopy(project.domain, 'main')} 
              />
              <DomainRow 
                url={`${deployment.id.substring(0,8)}-${project.name}.code2cloud.app`} 
                isCopied={copied === 'sub'} 
                onCopy={() => handleCopy(`${deployment.id}-app`, 'sub')} 
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
              <InfoRow label="Branch" value={deployment.branch} mono icon={<GitBranch className="w-3.5 h-3.5"/>} />
              <InfoRow label="Commit" value={deployment.commit} mono icon={<GitCommit className="w-3.5 h-3.5"/>} />
              <InfoRow label="Committer" value="shadcn-user" icon={<User className="w-3.5 h-3.5"/>} />
              <InfoRow label="Duration" value={deployment.duration} icon={<Timer className="w-3.5 h-3.5"/>} />
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
                <span className="text-foreground font-medium flex items-center gap-1.5"><Box className="w-3.5 h-3.5"/>{mockConfig.framework}</span>
              </div>

              <div className="space-y-3 pt-3 border-t border-white/5">
                <CommandRow label="Build Command" command={mockConfig.buildCommand} />
                <CommandRow label="Output Directory" command={mockConfig.outputDirectory} />
                <CommandRow label="Install Command" command={mockConfig.installCommand} />
              </div>
            </div>
          </div>

        </motion.div>
      </div>
    </div>
  );
}

// --- SUBCOMPONENTS ---

const StatCard = ({ icon: Icon, label, value, subValue, color }: any) => (
  <div className="glass-card p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm relative overflow-hidden group hover:bg-white/10 transition-colors h-full">
    <div className={cn("absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-30 transition-opacity", color)}>
      <Icon className="w-16 h-16" />
    </div>
    <div className="relative z-10 flex flex-col justify-between h-full">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={cn("w-4 h-4", color)} />
        <span className="text-xs font-medium text-muted-foreground uppercase">{label}</span>
      </div>
      <div>
        <div className="text-lg font-bold text-foreground tracking-tight leading-none">{value}</div>
        <div className="text-[10px] text-muted-foreground mt-1 font-mono">{subValue}</div>
      </div>
    </div>
  </div>
);

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

const InfoRow = ({ label, value, mono, icon }: any) => (
  <div className="flex justify-between items-center text-sm">
    <span className="text-muted-foreground flex items-center gap-2 text-xs">
      {icon} {label}
    </span>
    <span className={cn("font-medium text-foreground text-sm", mono && "font-mono text-xs bg-black/30 px-1.5 py-0.5 rounded text-muted-foreground border border-white/5")}>
      {value}
    </span>
  </div>
);

const CommandRow = ({ label, command }: any) => (
  <div className="flex items-center justify-between gap-4">
    <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">{label}</span>
    <div className="font-mono text-[10px] bg-[#0a0a0a] px-2 py-1 rounded border border-white/10 text-gray-400 truncate max-w-[120px]">
      {command}
    </div>
  </div>
);