"use client";

import { motion } from "framer-motion";

export function CosmicBackground() {
  const starPattern =
    'radial-gradient(1.5px 1.5px at 20px 30px, rgba(255,255,255,.9), rgba(0,0,0,0)), radial-gradient(1.5px 1.5px at 40px 70px, rgba(200,220,255,.9), rgba(0,0,0,0)), radial-gradient(2px 2px at 50px 160px, rgba(255,255,255,.8), rgba(0,0,0,0)), radial-gradient(2px 2px at 90px 40px, rgba(220,200,255,.8), rgba(0,0,0,0)), radial-gradient(1.5px 1.5px at 130px 80px, rgba(255,255,255,.8), rgba(0,0,0,0))';

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">

      {/* Tech Grid */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          maskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
        }}
      />
      
      {/* 💙 Floating Nebula Left */}
      <motion.div
        className="absolute -top-[200px] -left-[200px] w-[600px] h-[600px] bg-blue-600/30 rounded-full blur-[140px] mix-blend-screen"
        animate={{ x: [0, 80, -40], y: [0, 60, -30] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* 💜 Floating Nebula Right */}
      <motion.div
        className="absolute -bottom-[200px] -right-[200px] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[140px] mix-blend-screen"
        animate={{ x: [0, -60, 40], y: [0, -40, 60] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* 
      <motion.div
        className="absolute top-[-200px] left-[-200px] w-[700px] h-[700px] bg-blue-500/35 rounded-full blur-[160px] mix-blend-screen"
        animate={{ x: [0, 120, -80], y: [0, 80, -60] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute bottom-[-250px] right-[-250px] w-[700px] h-[700px] bg-purple-500/30 rounded-full blur-[160px] mix-blend-screen"
        animate={{ x: [0, -120, 60], y: [0, -60, 80] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      /> 
      */}

      {/* ✨ Starfield Drift 1 */}
      <motion.div
        className="absolute inset-0 mix-blend-screen"
        animate={{ backgroundPosition: ["0px 0px", "800px 600px"] }}
        transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
        style={{ backgroundImage: starPattern, backgroundSize: "180px 180px", opacity: 0.45 }}
      />

      {/* ✨ Starfield Drift 2 */}
      <motion.div
        className="absolute inset-0 mix-blend-screen"
        animate={{ backgroundPosition: ["200px 100px", "1200px 900px"] }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        style={{ backgroundImage: starPattern, backgroundSize: "300px 300px", opacity: 0.6 }}
      />
    </div>
  );
}
