"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion"; // Import Variants
import { Box, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProjectNotFoundStateProps {
  projectId?: string;
}

// --- ANIMATIONS (Fixed with : Variants) ---
const containerVariant: Variants = {
    animate: {
        y: [-5, 5, -5],
        transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
    }
}

const glitchCube: Variants = {
  initial: { opacity: 0.5, scale: 0.9 },
  animate: {
    opacity: [0.5, 1, 0.5, 0.8, 0.5],
    scale: [0.9, 1, 0.95, 1, 0.9],
    skewX: [0, 2, -2, 0],
    filter: ["hue-rotate(0deg)", "hue-rotate(90deg)", "hue-rotate(0deg)"],
    transition: { duration: 2, repeat: Infinity, ease: "linear" }
  }
};

const particleExplosion: Variants = {
    animate: (i: number) => ({
        x: (Math.random() - 0.5) * 100,
        y: (Math.random() - 0.5) * 100,
        opacity: [1, 0],
        scale: [1, 0],
        transition: { duration: 1, repeat: Infinity, delay: i * 0.1 }
    })
}

// --- GRAPHIC ---
const MissingProjectGraphic = () => {
    const particles = Array.from({ length: 12 });
    return (
        <svg viewBox="0 0 200 200" className="w-48 h-48 drop-shadow-[0_0_30px_rgba(59,130,246,0.4)]">
            <defs>
                <linearGradient id="holo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
                </linearGradient>
            </defs>
            
            <motion.g variants={containerVariant} animate="animate">
                {/* Base platform */}
                <ellipse cx="100" cy="160" rx="50" ry="10" fill="#3b82f6" opacity="0.2" />
                
                {/* The Glitching Cube representing the project */}
                <motion.g variants={glitchCube} initial="initial" animate="animate">
                     {/* Wireframe Cube */}
                    <path d="M 100 40 L 150 65 L 150 125 L 100 150 L 50 125 L 50 65 Z" stroke="url(#holo-grad)" strokeWidth="2" fill="none" />
                    <path d="M 50 65 L 100 90 L 150 65" stroke="url(#holo-grad)" strokeWidth="1" fill="none" opacity="0.5"/>
                    <path d="M 100 90 L 100 150" stroke="url(#holo-grad)" strokeWidth="1" fill="none" opacity="0.5"/>

                    {/* Big Question Mark */}
                    <text x="100" y="115" textAnchor="middle" fontSize="60" fill="white" opacity="0.8" fontFamily="monospace" fontWeight="bold">?</text>
                    
                    {/* Error Xs */}
                    <path d="M 40 40 L 60 60 M 60 40 L 40 60" stroke="#ef4444" strokeWidth="3" opacity="0.7" />
                </motion.g>

                {/* Dissolving Particles */}
                <g transform="translate(100, 100)">
                {particles.map((_, i) => (
                  <motion.rect key={i} width="4" height="4" fill={i%2===0 ? "#22d3ee" : "#ef4444"} variants={particleExplosion} animate="animate" custom={i} />
                ))}
                </g>
            </motion.g>
        </svg>
    )
}

export const ProjectNotFoundState = ({ projectId }: ProjectNotFoundStateProps) => {
  return (
    <div className="flex min-h-[calc(100vh-5rem)] w-full items-center justify-center px-6">
      <div className="flex flex-col items-center justify-center text-center p-8 border-white/5 rounded-2xl m-8 relative overflow-hidden">
        {/* Subtle red warning gradient background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.15)_0%,transparent_70%)] pointer-events-none" />

        <MissingProjectGraphic />
        
        <h2 className="text-2xl font-bold text-white mt-6">
          Project Not Found
        </h2>
        
        <p className="text-muted-foreground mt-2 max-w-md font-light">
          We couldn&apos;t locate the project identifier <span className="font-mono text-blue-400 bg-blue-400/10 px-1 rounded">{projectId || "UNKNOWN"}</span> in the registry. It may have been deleted or access is restricted.
        </p>

        <div className="mt-8 flex gap-4">
          <Button asChild className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]">
            <Link href="/dashboard/projects">
              <Box className="w-4 h-4 mr-2" />
              Return to Projects Fleet
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10">
              <Link href="#" onClick={(e) => { e.preventDefault(); history.back(); }}>
                  <ArrowLeft className="w-4 h-4 mr-2"/> Go Back
              </Link>
          </Button>
        </div>

        <div className="mt-8 text-xs text-red-400/70 font-mono border border-red-400/20 bg-red-400/5 px-3 py-1 rounded-full uppercase tracking-widest animate-pulse z-10">
          Error: REGISTRY_ENTRY_NULL
        </div>
      </div>
    </div>
  );
};