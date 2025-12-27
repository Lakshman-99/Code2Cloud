"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from "next/navigation";
import { motion } from 'framer-motion';
import {
  Box,
  Rocket,
  Database,
  Settings,
  ChevronRight,
  User as UserIcon,
  Search,
  LogOut,
  MoreVertical,
  LayoutDashboard,
} from 'lucide-react';
import { useMockStore } from '@/stores/useMockStore';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/use-user';
import { tokenManager } from '@/lib/token-manager';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const menuItems = [
  { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
  { icon: Box, label: 'Projects', path: '/dashboard/projects' },
  { icon: Rocket, label: 'Deployments', path: '/dashboard/deployments' },
  { icon: Database, label: 'Storage', path: '/dashboard/storage' },
  { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
];

export const Sidebar = () => {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar, toggleCommandPalette } = useMockStore();

  const handleLogout = async () => {
    const toastId = toast.loading("Logging out...");

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
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
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
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="fixed left-0 top-0 h-screen bg-sidebar border-r border-white/5 flex flex-col z-50"
    >
      {/* Header */}
      <div className="h-20 flex items-center px-6 border-b border-white/5">
        <div className="flex items-center gap-3 min-w-0">
          {/* Logo with Glow */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-blue-600 shadow-lg shadow-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-white">C2</span>
          </div>
          <motion.div
            initial={false}
            animate={{ 
              opacity: sidebarCollapsed ? 0 : 1,
              width: sidebarCollapsed ? 0 : 'auto',
            }}
            className="flex flex-col overflow-hidden"
          >
            <span className="font-bold text-base text-foreground tracking-tight whitespace-nowrap">
              Code2Cloud
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
              Enterprise
            </span>
          </motion.div>
        </div>
      </div>

      {/* Command Palette Trigger */}
      <div className="px-4 py-6">
        <button
          onClick={toggleCommandPalette}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group border",
            // Darker search bar
            "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10 text-muted-foreground hover:text-foreground"
          )}
        >
          <Search className="w-4 h-4 flex-shrink-0" />
          <motion.div
            initial={false}
            animate={{ 
              opacity: sidebarCollapsed ? 0 : 1,
              width: sidebarCollapsed ? 0 : 'auto',
            }}
            className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden"
          >
            <span className="text-sm font-medium flex-1 text-left whitespace-nowrap">Search</span>
            <kbd className="text-[10px] bg-black/40 border border-white/10 px-1.5 py-0.5 rounded flex-shrink-0 text-muted-foreground">
              ⌘K
            </kbd>
          </motion.div>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto scrollbar-hide">
        {menuItems.map((item) => {
          const isActive = pathname === item.path || (pathname.startsWith(item.path + '/') && item.path !== '/dashboard');
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group overflow-hidden",
                isActive 
                  ? "text-white" 
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              {/* Active State Background & Neon Accent */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent border-l-2 border-primary rounded-r-xl opacity-100"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}

              <item.icon className={cn(
                "w-5 h-5 flex-shrink-0 relative z-10 transition-colors", 
                isActive ? "text-primary" : "group-hover:text-primary/80"
              )} />
              
              <motion.span
                initial={false}
                animate={{ 
                  opacity: sidebarCollapsed ? 0 : 1,
                  width: sidebarCollapsed ? 0 : 'auto',
                }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden relative z-10"
              >
                {item.label}
              </motion.span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/5 p-4 bg-black/20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              "flex items-center gap-3 px-2 py-2 w-full rounded-xl hover:bg-white/5 transition-all duration-200 text-left group outline-none",
              sidebarCollapsed && "p-0 hover:bg-transparent"
            )}>
              <Avatar className="h-9 w-9 rounded-lg border border-white/10 shadow-sm">
                <AvatarImage src={user?.avatar || `https://avatar.vercel.sh/${user?.email}`} alt={user?.name} />
                <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-medium">
                  <UserIcon className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>

              <motion.div
                initial={false}
                animate={{ 
                  opacity: sidebarCollapsed ? 0 : 1,
                  width: sidebarCollapsed ? 0 : 'auto',
                }}
                className="flex-1 min-w-0 overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="truncate pr-2">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {user?.name || "Guest"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email || "Not signed in"}
                    </p>
                  </div>
                  <MoreVertical className="w-4 h-4 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
              </motion.div>
            </button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent 
            align="start" 
            side="right" 
            className="w-60 bg-[#0a0a0a]/95 backdrop-blur-xl border-white/10 p-1 shadow-2xl shadow-black/50"
            sideOffset={16}
          >
            <DropdownMenuLabel className="font-normal px-2 py-2">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none text-foreground">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground opacity-70">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10 my-1" />
            <div className="space-y-0.5">
              <DropdownMenuItem className="cursor-pointer rounded-lg px-2 py-2 focus:bg-white/5 focus:text-white">
                <UserIcon className="mr-2 h-4 w-4 opacity-70" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer rounded-lg px-2 py-2 focus:bg-white/5 focus:text-white">
                <Settings className="mr-2 h-4 w-4 opacity-70" />
                <span>Settings</span>
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator className="bg-white/10 my-1" />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="cursor-pointer rounded-lg px-2 py-2 text-red-400 focus:text-red-400 focus:bg-red-500/10"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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