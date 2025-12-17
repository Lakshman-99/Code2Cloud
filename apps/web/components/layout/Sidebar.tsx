"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from "next/navigation";
import { motion } from 'framer-motion';
import {
  LayoutGrid,
  FolderKanban,
  Rocket,
  Database,
  Settings,
  Command,
  ChevronRight,
  User,
  ChevronDown,
  Search,
} from 'lucide-react';
import { useMockStore } from '@/stores/useMockStore';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: LayoutGrid, label: 'Overview', path: '/dashboard' },
  { icon: FolderKanban, label: 'Projects', path: '/dashboard/projects' },
  { icon: Rocket, label: 'Deployments', path: '/dashboard/deployments' },
  { icon: Database, label: 'Storage', path: '/dashboard/storage' },
  { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar, toggleCommandPalette } = useMockStore();

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
      {/* Header - Single unified logo section */}
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

      {/* Footer */}
      <div className="border-t border-white/5 p-3">
        {/* Team Switcher */}
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors mb-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            A
          </div>
          <motion.div
            initial={false}
            animate={{ 
              opacity: sidebarCollapsed ? 0 : 1,
              width: sidebarCollapsed ? 0 : 'auto',
            }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden"
          >
            <span className="text-sm flex-1 text-left whitespace-nowrap">Acme Corp</span>
            <ChevronDown className="w-4 h-4 flex-shrink-0" />
          </motion.div>
        </button>

        {/* User */}
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-muted-foreground" />
          </div>
          <motion.div
            initial={false}
            animate={{ 
              opacity: sidebarCollapsed ? 0 : 1,
              width: sidebarCollapsed ? 0 : 'auto',
            }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="flex-1 min-w-0 overflow-hidden"
          >
            <p className="text-sm font-medium text-foreground truncate whitespace-nowrap">John Doe</p>
            <p className="text-xs text-muted-foreground truncate whitespace-nowrap">john@acme.dev</p>
          </motion.div>
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute z-10 -right-3 top-30 w-6 h-6 rounded-full bg-card border border-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
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