"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { ArrowLeft, LayoutDashboard } from "lucide-react";
import { CosmicBackground } from "@/components/layout/CosmicBackground";
import { Button } from "@/components/ui/button";

// --- ANIMATIONS ---

const blackHoleSpin: Variants = {
  animate: {
    rotate: 360,
    transition: { duration: 20, repeat: Infinity, ease: "linear" }
  }
};

const fileFloat: Variants = {
  animate: {
    x: [0, 10, 0],
    y: [0, -10, 0],
    rotate: [0, 5, -5, 0],
    transition: { duration: 6, repeat: Infinity, ease: "easeInOut" }
  }
};

const glitchText: Variants = {
  initial: { skewX: 0 },
  animate: {
    skewX: [0, 5, -5, 2, 0],
    opacity: [1, 0.8, 1],
    transition: { duration: 0.5, repeat: Infinity, repeatDelay: 3 }
  }
};

// --- VISUAL COMPONENT: "THE LOST FILE" ---
const BlackHoleGraphic = () => (
  <svg viewBox="0 0 400 300" className="w-full max-w-md h-auto drop-shadow-[0_0_60px_rgba(124,58,237,0.3)]">
    <defs>
      <linearGradient id="holeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4c1d95" />
        <stop offset="100%" stopColor="#000000" />
      </linearGradient>
      <radialGradient id="eventHorizon" cx="50%" cy="50%" r="50%">
        <stop offset="70%" stopColor="#000" stopOpacity="1" />
        <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.5" />
      </radialGradient>
    </defs>

    {/* The Accretion Disk (Spinning Rings) */}
    <motion.g cx="200" cy="150" variants={blackHoleSpin} animate="animate" style={{ transformOrigin: "200px 150px" }}>
      <ellipse cx="200" cy="150" rx="140" ry="40" stroke="#7c3aed" strokeWidth="1" fill="none" opacity="0.3" strokeDasharray="10 20" />
      <ellipse cx="200" cy="150" rx="110" ry="30" stroke="#22d3ee" strokeWidth="2" fill="none" opacity="0.5" strokeDasharray="5 10" />
      <ellipse cx="200" cy="150" rx="80" ry="20" stroke="#fff" strokeWidth="1" fill="none" opacity="0.2" />
    </motion.g>

    {/* The Event Horizon (Center) */}
    <circle cx="200" cy="150" r="40" fill="url(#eventHorizon)" />
    <circle cx="200" cy="150" r="38" fill="black" />

    {/* The Lost File (Being sucked in) */}
    <motion.g variants={fileFloat} animate="animate">
      <g transform="translate(240, 100) rotate(15)">
        {/* File Shape */}
        <rect x="0" y="0" width="60" height="80" rx="4" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
        {/* File Lines */}
        <line x1="10" y1="20" x2="50" y2="20" stroke="#3b82f6" strokeWidth="2" opacity="0.5" />
        <line x1="10" y1="35" x2="50" y2="35" stroke="#3b82f6" strokeWidth="2" opacity="0.5" />
        <line x1="10" y1="50" x2="40" y2="50" stroke="#3b82f6" strokeWidth="2" opacity="0.5" />
        
        {/* Glitch Effect on File */}
        <motion.rect x="0" y="0" width="60" height="80" rx="4" fill="white" 
          animate={{ opacity: [0, 0.2, 0] }} 
          transition={{ duration: 0.1, repeat: Infinity, repeatDelay: 2 }} 
        />
      </g>
    </motion.g>

    {/* Gravity Lines (Connecting file to hole) */}
    <motion.path 
      d="M 240 140 Q 220 150 200 150" 
      stroke="#3b82f6" 
      strokeWidth="1" 
      fill="none" 
      opacity="0.4"
      animate={{ strokeDasharray: ["0, 100", "100, 0"], opacity: [0, 0.4, 0] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
  </svg>
);

// --- MAIN PAGE ---
export default function NotFound() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#030712] text-white flex flex-col items-center justify-center p-6">
      <CosmicBackground />

      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto space-y-8">
        
        {/* 1. The Graphic */}
        <div className="relative">
          <BlackHoleGraphic />
          {/* Label indicating what happened */}
          <div className="absolute top-0 right-10 bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-2 py-1 rounded font-mono">
            ERR_FILE_MISSING
          </div>
        </div>

        {/* 2. The Text */}
        <div className="space-y-4">
          <motion.div variants={glitchText} initial="initial" animate="animate">
            <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/10">
              404
            </h1>
          </motion.div>
          
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Page Not Found
          </h2>
          
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            The page you are looking for has been consumed by the void. It might have been removed, renamed, or never existed.
          </p>
        </div>

        {/* 3. The Actions */}
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Button asChild size="lg" className="bg-white text-black hover:bg-slate-200 transition-all font-medium min-w-[160px] shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            <Link href="/dashboard">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Return to Dashboard
            </Link>
          </Button>

          <Button asChild variant="outline" size="lg" className="border-white/10 bg-white/5 hover:bg-white/10 hover:text-white min-w-[160px] backdrop-blur-sm">
            <Link href="#" onClick={(e) => { e.preventDefault(); history.back(); }}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Link>
          </Button>
        </div>

      </div>
      
      {/* Footer System Status */}
      <div className="absolute bottom-8 text-xs text-muted-foreground/40 font-mono uppercase tracking-[0.2em]">
        System Status: Critical // Path Unknown
      </div>
    </main>
  );
}