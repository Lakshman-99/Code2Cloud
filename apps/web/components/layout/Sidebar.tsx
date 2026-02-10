"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Rocket,
  Settings,
  ChevronRight,
  Search,
  LogOut,
  LayoutDashboard,
  User as UserIcon,
  Command
} from 'lucide-react';
import { useMockStore } from '@/stores/useMockStore';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/use-user';
import { tokenManager } from '@/lib/token-manager';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarFooterSkeleton } from '../ui/skeleton';

const menuItems = [
  { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
  { icon: Box, label: 'Projects', path: '/dashboard/projects' },
  { icon: Rocket, label: 'Deployments', path: '/dashboard/deployments' },
  { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
];

export const Sidebar = () => {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar, toggleCommandPalette } = useMockStore();

  const handleLogout = async () => {
    const toastId = toast.loading("Disconnecting session...");

    try {
      await api.post('/auth/logout'); 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      console.warn("Backend logout failed, clearing local state anyway.");
    } finally {
      tokenManager.clearTokens();
      toast.success("Logged out successfully", { id: toastId });
      router.push('/auth');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        toggleCommandPalette();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCommandPalette]);

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
      className={cn(
        "fixed left-0 top-0 h-screen flex flex-col z-50",
        "bg-[#0a0a0a]/80 backdrop-blur-xl border-r border-white/10 shadow-2xl shadow-black/50"
      )}
    >
      {/* --- HEADER --- */}
      <div className={cn(
        "h-20 flex items-center px-4 relative overflow-hidden z-20 transition-all duration-300",
        sidebarCollapsed ? "justify-center" : "justify-start",
        "backdrop-blur-xl bg-[#0a0a0a]/80",
        "border-b border-white/5",
      )}>
        {/* Background Energy */}
        <motion.div 
          className="absolute top-1/2 left-1/2 w-[200px] h-[100px] bg-cyan-500/30 blur-[80px] rounded-full pointer-events-none"
          animate={{
            rotate: [0, 360],
            scale: [0.8, 1.2, 0.8],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          style={{ x: "-50%", y: "-50%" }}
        />

        {/* Scanline */}
        <motion.div
          className="absolute top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-white/20 to-transparent z-0"
          initial={{ left: "-10%" }}
          animate={{ left: "120%" }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", repeatDelay: 2 }}
        />

        {/* LOGO CONTAINER */}
        <div className="flex items-center gap-3 relative z-10 group cursor-pointer">
            {/* 1. THE ICON (Now glowing) */}
            <div className="relative shrink-0">
              <Image
                src="/logo_c2c.png"
                alt="Code2Cloud Icon"
                width={38} // Slightly smaller to fit the glow better
                height={38}
                priority
                className={cn(
                  "object-contain transition-all duration-300",
                  "filter invert-[1] brightness-[1.5]", 
                  // Emerald Glow
                  "drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]", 
                  "group-hover:drop-shadow-[0_0_15px_rgba(52,211,153,1)] group-hover:scale-110"
                )}
              />
            </div>

            {/* 2. THE TEXT */}
            <motion.div
              initial={false}
              animate={{ 
                opacity: sidebarCollapsed ? 0 : 1,
                width: sidebarCollapsed ? 0 : 'auto',
              }}
              transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
              className="flex flex-col overflow-hidden whitespace-nowrap"
            >
              {/* Main Title: Bio-Luminescent Gradient */}
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                Code2Cloud
              </span>
              
              {/* Tagline: Whitish with a hint of Emerald */}
              <span className="text-[9.5px] text-emerald-100/70 uppercase tracking-widest font-medium pl-0.5 leading-none mt-0.5">
                Deployment Platform
              </span>
            </motion.div>
        </div>

        {/* Bottom Shelf Line */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-50" />
      </div>

      {/* --- SEARCH --- */}
      <div className="px-3 py-6">
        <button
          onClick={toggleCommandPalette}
          className={cn(
            "w-full flex items-center py-2.5 rounded-xl transition-all duration-200 group border px-3",
            "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10 text-muted-foreground hover:text-foreground",
            sidebarCollapsed ? "justify-center" : "gap-3"
          )}
        >
          <Search className="w-4 h-4 flex-shrink-0" />
          
          <motion.div
            initial={false}
            animate={{ 
              opacity: sidebarCollapsed ? 0 : 1,
              width: sidebarCollapsed ? 0 : 'auto',
            }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-between flex-1 min-w-0 overflow-hidden"
          >
            <span className="text-sm font-medium whitespace-nowrap">Search</span>
            
            {/* Awesome Command Key Visual */}
            <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border border-white/10 bg-black/20 px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 flex shadow-sm">
              <Command className="w-3 h-3" />
              <span>K</span>
            </kbd>
          </motion.div>
        </button>
      </div>

      {/* --- NAVIGATION --- */}
      <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto scrollbar-hide">
        {menuItems.map((item) => {
          const isActive = pathname === item.path || (pathname.startsWith(item.path + '/') && item.path !== '/dashboard');
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group overflow-hidden",
                isActive ? "text-white" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent border-l-2 border-primary rounded-r-xl opacity-100"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <item.icon className={cn("w-5 h-5 flex-shrink-0 relative z-10 transition-colors", isActive ? "text-primary" : "group-hover:text-primary/80")} />
              <motion.span
                initial={false}
                animate={{ opacity: sidebarCollapsed ? 0 : 1, width: sidebarCollapsed ? 0 : 'auto' }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden relative z-10"
              >
                {item.label}
              </motion.span>
            </Link>
          );
        })}
      </nav>

      {/* --- ID CARD FOOTER --- */}
      <div className="border-t border-white/5 p-3 bg-black/40 cursor-default">
        <AnimatePresence mode="wait">
          {!sidebarCollapsed ? (
            /* EXPANDED: "Pilot ID Card" Style */
            <motion.div 
              key="expanded"
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 group hover:border-white/10 transition-colors"
            >
              {!isUserLoading && user ? (
                /* 1. LOGGED IN STATE */
                <div className="flex items-center gap-3 overflow-hidden">
                  <Avatar className="h-8 w-8 rounded-lg border border-white/10 shadow-sm shrink-0">
                    <AvatarImage src={user.avatar} alt={user.name} referrerPolicy="no-referrer" />
                    <AvatarFallback className="rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold">
                      {user.name?.[0] || <UserIcon className="w-4 h-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{user.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
              ) : (
                /* 2. LOADING SKELETON STATE */
                <SidebarFooterSkeleton />
              )}
              
              {/* Power Button */}
              <button 
                onClick={handleLogout} 
                className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all ml-1"
                title="Disconnect"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </motion.div>
          ) : (
            /* COLLAPSED: Just the Power Button (Quick Exit) */
            <motion.div 
              key="collapsed"
              initial={{ opacity: 0, scale: 0.8 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex justify-center"
            >
              <button 
                onClick={handleLogout} 
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all border border-red-500/20 hover:border-red-500/40 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                title="Disconnect"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute z-50 -right-3 top-[4.5rem] w-6 h-6 rounded-full bg-[#0a0a0a] border border-white/20 flex items-center justify-center text-muted-foreground hover:text-white hover:border-primary transition-all shadow-xl hover:scale-110"
      >
        <motion.div
          initial={false}
          animate={{ rotate: sidebarCollapsed ? 0 : 180 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="w-3 h-3" />
        </motion.div>
      </button>
    </motion.aside>
  );
};