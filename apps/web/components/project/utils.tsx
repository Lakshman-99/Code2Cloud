import { FRAMEWORK_ICONS } from "@/types/git";
import { DeploymentStatus } from "@/types/project";
import { Ban, BrushCleaning, CheckCircle2, Hammer, Hourglass, Recycle, Rocket, XCircle } from "lucide-react";
import Image from "next/image";
import { cloneElement, isValidElement, JSX, ReactElement } from "react";

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

type StatusConfig = {
  label: string;
  color: string;
  text: string;
  glow: string;
  icon: JSX.Element;
};

const STATUS_CONFIG: Record<DeploymentStatus, StatusConfig> = {
  QUEUED: {
    label: "Queued",
    color: "bg-yellow-500",
    text: "text-yellow-500",
    glow: "shadow-[0_0_10px_rgba(234,179,8,0.4)]",
    icon: <Hourglass className="text-yellow-400 animate-hourglass" />,
  },
  READY: {
    label: "Ready",
    color: "bg-emerald-500",
    text: "text-emerald-500",
    glow: "shadow-[0_0_10px_rgba(16,185,129,0.4)]",
    icon: <CheckCircle2 className="text-emerald-400" />,
  },
  BUILDING: {
    label: "Building",
    color: "bg-blue-500",
    text: "text-blue-500",
    glow: "shadow-[0_0_10px_rgba(59,130,246,0.4)]",
    icon: <Hammer className="text-blue-400 animate-hammer" />,
  },
  DEPLOYING: {
    label: "Deploying",
    color: "bg-purple-500",
    text: "text-purple-500",
    glow: "shadow-[0_0_10px_rgba(168,85,247,0.4)]",
    icon: <Rocket className="text-purple-400 animate-fly" />,
  },
  FAILED: {
    label: "Failed",
    color: "bg-red-500",
    text: "text-red-500",
    glow: "shadow-[0_0_10px_rgba(239,68,68,0.4)]",
    icon: <XCircle className="text-red-500 animate-shake" />,
  },
  CANCELED: {
    label: "Canceled",
    color: "bg-gray-500",
    text: "text-gray-500",
    glow: "shadow-[0_0_10px_rgba(161,161,170,0.35)]",
    icon: <Ban className="text-zinc-400" />,
  },
  EXPIRED: {
    label: "Expired",
    color: "bg-gray-500",
    text: "text-gray-500",
    glow: "shadow-[0_0_10px_rgba(161,161,170,0.35)]",
    icon: <BrushCleaning className="text-zinc-400" />,
  },
  SUPERSEDED: {
    label: "Superseded",
    color: "bg-gray-500",
    text: "text-gray-500",
    glow: "shadow-[0_0_10px_rgba(161,161,170,0.35)]",
    icon: <Recycle className="text-zinc-400" />,
  }
};

export const getStatusConfig = (
  status?: DeploymentStatus,
  iconSize: number = 16
) => {
  const config = status ? STATUS_CONFIG[status] : {
    color: 'bg-gray-500',
    text: 'text-gray-500',
    glow: '',
    label: 'Unknown',
    icon: <Ban className="text-zinc-400" />,
  };

  let sizedIcon = config.icon;

  if (isValidElement(config.icon)) {
    // TypeScript cast: tell it this is a LucideIcon
    sizedIcon = cloneElement(config.icon as ReactElement<React.SVGProps<SVGSVGElement> & { size?: number }>, { size: iconSize });
  }

  return { ...config, icon: sizedIcon };
};

export const STATUS_OPTIONS = Object.entries(STATUS_CONFIG).map( 
  ([value, { label }]) => ({ 
    value: value as DeploymentStatus, 
    label, 
  }) 
);

export const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}