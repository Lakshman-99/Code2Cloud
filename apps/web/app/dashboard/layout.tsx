"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { CosmicBackground } from "@/components/layout/CosmicBackground";
import { useMockStore } from "@/stores/useMockStore";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed, setLoading } = useMockStore();

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, [setLoading]);

  return (
    <div className="min-h-screen bg-[#030712] text-foreground relative selection:bg-primary/30">
      <CosmicBackground />

      <div className="relative z-10">
        <Sidebar />
        <CommandPalette />

        <motion.main
          initial={false}
          animate={{ marginLeft: sidebarCollapsed ? 72 : 240 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="min-h-screen"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
