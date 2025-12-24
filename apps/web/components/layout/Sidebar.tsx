"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from "next/navigation";
import { motion } from 'framer-motion';
import {
  LayoutGrid,
  FolderKanban,
  Rocket,
  Database,
  Settings,
  Command,
  ChevronRight,
  User as UserIcon,
  Search,
  LogOut,
  MoreVertical,
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
  { icon: LayoutGrid, label: 'Overview', path: '/dashboard' },
  { icon: FolderKanban, label: 'Projects', path: '/dashboard/projects' },
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
    // 1. Optimistic UI: Immediately show feedback
    const toastId = toast.loading("Logging out...");

    try {
      // 2. Tell Backend to revoke refresh token (Secure!)
      // We pass skipAuth: false to ensure we send the token so the backend knows WHO to logout
      await api.post('/auth/logout'); 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      console.warn("Backend logout failed (token might be expired), clearing local state anyway.");
    } finally {
      // 3. Always clear local state and redirect
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
      <div className="h-16 flex items-center px-4 border-b border-white/5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-primary-foreground">C2</span>
          </div>
          <motion.span
            initial={false}
            animate={{ 
              opacity: sidebarCollapsed ? 0 : 1,
              width: sidebarCollapsed ? 0 : 'auto',
            }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="font-semibold text-foreground whitespace-nowrap overflow-hidden"
          >
            Code2Cloud
          </motion.span>
        </div>
      </div>

      {/* Command Palette Trigger */}
      <div className="px-3 py-4">
        <button
          onClick={toggleCommandPalette}
          className="w-full glass-card flex items-center gap-3 px-3 py-2.5 text-muted-foreground hover:text-foreground transition-colors group"
        >
          <Search className="w-4 h-4 flex-shrink-0" />
          <motion.div
            initial={false}
            animate={{ 
              opacity: sidebarCollapsed ? 0 : 1,
              width: sidebarCollapsed ? 0 : 'auto',
            }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden"
          >
            <span className="text-sm flex-1 text-left whitespace-nowrap">Search...</span>
            <kbd className="text-xs bg-muted px-1.5 py-0.5 rounded flex-shrink-0">
              <div className="flex items-center gap-1">
                <Command className="w-3 h-3" />
                <span className="font-medium">K</span>
              </div>
            </kbd>
          </motion.div>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                isActive 
                  ? "sidebar-active bg-white/5 text-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5",
              )}
            >
              <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary")} />
              <motion.span
                initial={false}
                animate={{ 
                  opacity: sidebarCollapsed ? 0 : 1,
                  width: sidebarCollapsed ? 0 : 'auto',
                }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden"
              >
                {item.label}
              </motion.span>
            </Link>
          );
        })}
      </nav>

      {/* Footer - NOW WITH DROPDOWN */}
      <div className="border-t border-white/5 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              "flex items-center gap-3 px-2 py-2 w-full rounded-lg hover:bg-white/5 transition-colors text-left group outline-none",
              sidebarCollapsed && "justify-center px-0"
            )}>
              <Avatar className="h-8 w-8 rounded-lg border border-white/10">
                {/* Use name initials or fallback icon */}
                <AvatarImage src={`https://avatar.vercel.sh/${user?.email}`} alt={user?.name} />
                <AvatarFallback className="rounded-lg bg-muted text-muted-foreground">
                  <UserIcon className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>

              <motion.div
                initial={false}
                animate={{ 
                  opacity: sidebarCollapsed ? 0 : 1,
                  width: sidebarCollapsed ? 0 : 'auto',
                }}
                transition={{ duration: 0.2 }}
                className="flex-1 min-w-0 overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="truncate">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user?.name || "Guest"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email || "guest@example.com"}
                    </p>
                  </div>
                  <MoreVertical className="w-4 h-4 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
              </motion.div>
            </button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent 
            align="end" 
            side="right" 
            className="w-56 bg-card/95 backdrop-blur-xl border-white/10"
            sideOffset={10}
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem className="cursor-pointer select-none outline-none focus:bg-transparent focus:text-foreground focus:ring-0 data-[highlighted]:bg-white/5 data-[highlighted]:text-foreground">
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer select-none outline-none focus:bg-transparent focus:text-foreground focus:ring-0 data-[highlighted]:bg-white/5 data-[highlighted]:text-foreground">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="cursor-pointer select-none outline-none focus:bg-transparent focus:text-destructive focus:ring-0 data-[highlighted]:bg-white/5 data-[highlighted]:text-foreground text-destructive"
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
        className="absolute z-10 -right-3 top-24 w-6 h-6 rounded-full bg-card border border-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shadow-lg"
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