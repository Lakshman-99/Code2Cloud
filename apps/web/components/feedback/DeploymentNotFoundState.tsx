"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion"; // Import Variants
import { Rocket, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeploymentNotFoundStateProps {
  deploymentId?: string;
}

// --- ANIMATIONS (Fixed with : Variants) ---
const scannerRotation: Variants = {
    animate: {
        rotate: 360,
        transition: { duration: 4, repeat: Infinity, ease: "linear" }
    }
}

const targetBlip: Variants = {
    animate: {
        opacity: [0, 1, 1, 0, 0],
        scale: [0.5, 1, 1.2, 0.1, 0],
        fill: ["#22d3ee", "#22d3ee", "#ef4444", "#ef4444", "#ef4444"],
        transition: { duration: 4, repeat: Infinity, times: [0, 0.1, 0.3, 0.4, 1] }
    }
}

const signalText: Variants = {
    animate: {
        opacity: [0, 1, 0],
        transition: { duration: 1, repeat: Infinity, repeatDelay: 3 }
    }
}

// --- GRAPHIC ---
const MissingDeploymentGraphic = () => {
    return (
        <svg viewBox="0 0 200 200" className="w-48 h-48 drop-shadow-[0_0_30px_rgba(239,68,68,0.3)]">
            {/* Radar Background */}
            <circle cx="100" cy="100" r="80" stroke="#3b82f6" strokeWidth="1" fill="#1e3a8a" opacity="0.2" />
            <circle cx="100" cy="100" r="60" stroke="#3b82f6" strokeWidth="1" fill="none" opacity="0.3" />
            <circle cx="100" cy="100" r="40" stroke="#3b82f6" strokeWidth="1" fill="none" opacity="0.4" />
            <line x1="100" y1="20" x2="100" y2="180" stroke="#3b82f6" strokeWidth="1" opacity="0.3" />
            <line x1="20" y1="100" x2="180" y2="100" stroke="#3b82f6" strokeWidth="1" opacity="0.3" />

            {/* Scanner Sweep Line */}
            <motion.g variants={scannerRotation} animate="animate" style={{ originX: "100px", originY: "100px" }}>
                <line x1="100" y1="100" x2="100" y2="20" stroke="url(#scan-grad)" strokeWidth="2" />
                <defs>
                    <linearGradient id="scan-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#22d3ee" stopOpacity="1" />
                        <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                    </linearGradient>
                </defs>
            </motion.g>

            {/* Center point */}
            <circle cx="100" cy="100" r="4" fill="#22d3ee" />

            {/* Target Blip that fails */}
            <g transform="translate(140, 60)">
                <motion.circle r="8" variants={targetBlip} animate="animate" />
                <motion.text x="15" y="5" fill="#ef4444" fontSize="12" fontFamily="monospace" variants={signalText} animate="animate">SIGNAL LOST</motion.text>
            </g>
        </svg>
    )
}

export const DeploymentNotFoundState = ({ deploymentId }: DeploymentNotFoundStateProps) => {
  return (
    <div className="flex min-h-[calc(100vh-5rem)] w-full items-center justify-center px-6">
      <div className="flex flex-col items-center justify-center text-center p-8 border-white/5 rounded-2xl m-8 relative overflow-hidden">
        {/* Subtle red warning gradient background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.15)_0%,transparent_70%)] pointer-events-none" />

        <MissingDeploymentGraphic />
        
        <h2 className="text-2xl font-bold text-white mt-6 flex items-center gap-2">
          Deployment Not Found
        </h2>

        <p className="text-muted-foreground mt-2 max-w-md font-light">
          We couldn’t retrieve metadata for deployment{" "}
          <span className="font-mono text-red-400 bg-red-400/10 px-1 rounded">
            {deploymentId?.substring(0, 8) || "UNKNOWN"}…
          </span>
          . The pipeline may not have initialized correctly or the deployment entry was removed from the registry.
        </p>

        <div className="mt-8 flex gap-4 z-10">
          <Button asChild className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]">
            <Link href="/dashboard/deployments">
              <Rocket className="w-4 h-4 mr-2" />
              View All Deployments
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10">
            <Link href="#" onClick={(e) => { e.preventDefault(); history.back(); }}>
              <ArrowLeft className="w-4 h-4 mr-2"/> Go Back
            </Link>
          </Button>
        </div>

        <div className="mt-8 text-xs text-red-400/70 font-mono border border-red-400/20 bg-red-400/5 px-3 py-1 rounded-full uppercase tracking-widest animate-pulse z-10">
          Status: NO_CARRIER_SIGNAL
        </div>
      </div>
    </div>
  );
};