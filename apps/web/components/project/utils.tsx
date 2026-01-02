import { FRAMEWORK_ICONS } from "@/types/git";
import { DeploymentStatus } from "@/types/project";
import Image from "next/image";

export const getFrameworkIcon = (framework: string, language: string | null, size: number = 20) => {
  const fw = framework?.toLowerCase();
  const lang = language?.toLowerCase() || "";

  // Framework-specific
  if (fw && FRAMEWORK_ICONS[fw]) {
    return <Image src={FRAMEWORK_ICONS[fw]} alt={fw} width={size} height={size} />;
  }

  // Fallback to language
  if (fw && (fw.includes("unknown") || fw.includes("other"))) return <div className="w-5 h-5 border-2 border-gray-400 border-dotted rounded-full" />;
  if (lang.includes("python")) return <Image src={FRAMEWORK_ICONS["python"]} alt="python" width={size} height={size} />;
  if (lang.includes("node") || lang.includes("javascript")) return <Image src={FRAMEWORK_ICONS["node"]} alt="nodejs" width={size} height={size} />;
  if (lang.includes("typescript")) return <Image src={FRAMEWORK_ICONS["typescript"]} alt="typescript" width={size} height={size} />;
  if (lang.includes("go")) return <Image src={FRAMEWORK_ICONS["golang"]} alt="golang" width={size} height={size} />;

  // Default fallback
  return <div className="w-5 h-5 bg-white/50 rounded-sm" />;
};

export const getStatusConfig = (status?: DeploymentStatus) => {
  switch (status) {
    case 'READY': return { color: 'bg-emerald-500', text: 'text-emerald-500', glow: 'shadow-[0_0_10px_rgba(16,185,129,0.4)]', label: 'Ready' };
    case 'FAILED': return { color: 'bg-red-500', text: 'text-red-500', glow: 'shadow-[0_0_10px_rgba(239,68,68,0.4)]', label: 'Failed' };
    case 'BUILDING': return { color: 'bg-blue-500', text: 'text-blue-500', glow: 'shadow-[0_0_10px_rgba(59,130,246,0.4)]', label: 'Building' };
    case 'DEPLOYING': return { color: 'bg-purple-500', text: 'text-purple-500', glow: 'shadow-[0_0_10px_rgba(168,85,247,0.4)]', label: 'Deploying' };
    case 'QUEUED': return { color: 'bg-yellow-500', text: 'text-yellow-500', glow: 'shadow-[0_0_10px_rgba(234,179,8,0.4)]', label: 'Queued' };
    default: return { color: 'bg-gray-500', text: 'text-gray-500', glow: '', label: 'Unknown' };
  }
};

export const STATUS_OPTIONS: { label: string; value: DeploymentStatus }[] = [
  { label: "Ready", value: DeploymentStatus.READY },
  { label: "Building", value: DeploymentStatus.BUILDING },
  { label: "Deploying", value: DeploymentStatus.DEPLOYING },
  { label: "Failed", value: DeploymentStatus.FAILED },
  { label: "Canceled", value: DeploymentStatus.CANCELED },
];