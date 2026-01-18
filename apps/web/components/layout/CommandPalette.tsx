import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FolderKanban, Rocket, Settings, X } from 'lucide-react';
import { useMockStore } from '@/stores/useMockStore';
import { cn } from '@/lib/utils';
import { getFrameworkIcon } from '../project/utils';
import { useProjects } from '@/hooks/use-projects';

export const CommandPalette = () => {
  const router = useRouter();
  const { commandPaletteOpen, toggleCommandPalette } = useMockStore();

  const { projects } = useProjects();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const listRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const filteredProjects = useMemo(() => {
    if (!projects) return [];

    return projects.filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(query.toLowerCase()) ||
        project.framework.toLowerCase().includes(query.toLowerCase());

      return matchesSearch;
    });
  }, [projects, query]);

  const actions = [
    { icon: FolderKanban, label: 'Go to Projects', action: () => router.push('/dashboard/projects') },
    { icon: Rocket, label: 'View Deployments', action: () => router.push('/dashboard/deployments') },
    { icon: Settings, label: 'Open Settings', action: () => router.push('/dashboard/settings') },
  ];

  const handleSelect = useCallback((index: number) => {
    if (index < filteredProjects.length) {
      router.push(`/dashboard/projects/${filteredProjects[index].id}`);
    } else {
      const actionIndex = index - filteredProjects.length;
      actions[actionIndex]?.action();
    }
    toggleCommandPalette();
    setQuery('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredProjects, router, toggleCommandPalette]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!commandPaletteOpen) return;

      if (e.key === 'Escape') {
        toggleCommandPalette();
        setQuery('');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filteredProjects.length + actions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        handleSelect(selectedIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, selectedIndex, filteredProjects.length, toggleCommandPalette, actions.length, handleSelect]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const container = listRef.current;
    const el = itemRefs.current[selectedIndex];
    if (!container || !el) return;

    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();

    const overBottom = elRect.bottom > containerRect.bottom;
    const overTop = elRect.top < containerRect.top;

    if (overBottom) {
      container.scrollBy({
        top: elRect.bottom - containerRect.bottom + 20,
        behavior: "smooth",
      });
    }

    if (overTop) {
      container.scrollBy({
        top: elRect.top - containerRect.top - 20,
        behavior: "smooth",
      });
    }
  }, [selectedIndex]);

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            onClick={toggleCommandPalette}
          />
          <div className="fixed inset-0 z-50 flex justify-center pt-[15vh] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
              className="w-full max-w-lg h-fit pointer-events-auto mx-4"
            >
              <div className="glass-card overflow-hidden shadow-2xl">
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                  <Search className="w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search projects or type a command..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
                    autoFocus
                  />
                  <button
                    onClick={toggleCommandPalette}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Results */}
                <div ref={listRef} className="max-h-80 overflow-y-auto p-2">
                  {filteredProjects.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs text-muted-foreground px-2 py-1">Projects</p>
                      {filteredProjects.map((project, index) => (
                        <button
                          ref={(el) => {itemRefs.current[index] = el}}
                          key={project.id}
                          onClick={() => handleSelect(index)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left",
                            selectedIndex === index
                              ? "bg-white/10 text-foreground"
                              : "text-muted-foreground hover:bg-white/5"
                          )}
                        >
                          <div
                            className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ring-1 ring-white/10 bg-black text-white",
                            )}
                          >
                            {getFrameworkIcon(project?.framework || "", project?.language || "")}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{project.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{project.deployments[0].deploymentUrl}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-muted-foreground px-2 py-1">Actions</p>
                    {actions.map((action, index) => {
                      const actualIndex = filteredProjects.length + index;
                      return (
                        <button
                          ref={(el) => {itemRefs.current[filteredProjects.length + index] = el}}
                          key={action.label}
                          onClick={() => handleSelect(actualIndex)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                            selectedIndex === actualIndex
                              ? "bg-white/10 text-foreground"
                              : "text-muted-foreground hover:bg-white/5"
                          )}
                        >
                          <action.icon className="w-4 h-4" />
                          <span className="text-sm">{action.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-white/5 px-4 py-2 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <kbd className="bg-muted px-1.5 py-0.5 rounded">↑↓</kbd> Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="bg-muted px-1.5 py-0.5 rounded">↵</kbd> Select
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="bg-muted px-1.5 py-0.5 rounded">Esc</kbd> Close
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};