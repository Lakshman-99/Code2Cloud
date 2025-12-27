import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Copy, Download, Maximize2, Minimize2, Search } from 'lucide-react';
import { useMemo, useRef, useState, useEffect } from 'react';
import { Log } from '@/stores/useMockStore';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TerminalLogsProps {
  logs: Log[];
  projectName: string;
}

export const TerminalLogs = ({ logs, projectName }: TerminalLogsProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | Log['type']>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const bodyRef = useRef<HTMLDivElement>(null);

  const logText = useMemo(
    () => logs.map(l => `[${l.timestamp}] ${l.message}`).join('\n'),
    [logs]
  );

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      if (filter !== 'all' && l.type !== filter) return false;
      if (query && !l.message.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [logs, filter, query]);

  useEffect(() => {
    if (autoScroll && bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [filteredLogs, autoScroll]);

  const handleCopy = () => {
    navigator.clipboard.writeText(logText);
    toast.success('Logs copied to clipboard');
  };

  const handleDownload = () => {
    const blob = new Blob([logText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}-logs.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Logs downloaded');
  };

  const stats = useMemo(() => ({
    success: logs.filter(l => l.type === 'success').length,
    error: logs.filter(l => l.type === 'error').length,
    warning: logs.filter(l => l.type === 'warning').length,
  }), [logs]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'glass-card overflow-hidden flex flex-col',
          isFullscreen && 'fixed inset-4 z-50'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5"> 
              <div className="w-3 h-3 rounded-full bg-red-500/80" /> 
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" /> 
              <div className="w-3 h-3 rounded-full bg-green-500/80" /> 
            </div>
            <Terminal className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-mono text-muted-foreground">
              {projectName} — Build Logs
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleCopy}><Copy className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" onClick={handleDownload}><Download className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(v => !v)}>
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search logs..."
              className="pl-8 w-full bg-zinc-900 border border-white/5 rounded-md text-sm px-3 py-1.5"
            />
          </div>

          {['all', 'success', 'error', 'warning', 'info'].map(t => (
            <Button
              key={t}
              size="sm"
              variant={filter === t ? 'default' : 'ghost'}
              onClick={() => setFilter(t as 'all' | Log['type'])}
            >
              {t}
            </Button>
          ))}

          <Button
            size="sm"
            variant={autoScroll ? 'default' : 'ghost'}
            onClick={() => setAutoScroll(v => !v)}
          >
            Auto-scroll
          </Button>
        </div>

        {/* Body */}
        <div
          ref={bodyRef}
          className={cn(
            'bg-zinc-950 p-4 font-mono text-sm overflow-y-auto',
            isFullscreen
              ? 'h-[calc(100vh)]'   // fullscreen mode
              : 'h-[491px]'              // normal mode fixed size
          )}
        >
          {filteredLogs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.01 }}
              className="flex gap-3 py-1"
            >
              <span className="text-muted-foreground shrink-0">[{log.timestamp}]</span>
              <span className={cn(
                log.type === 'success' && 'terminal-success',
                log.type === 'error' && 'terminal-error',
                log.type === 'warning' && 'terminal-warning',
                log.type === 'info' && 'text-foreground'
              )}>
                {log.type === 'success' && '✓ '} 
                {log.type === 'error' && '✗ '} 
                {log.type === 'warning' && '⚠ '} 
                {log.message}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-950 border-t border-white/5 text-xs text-muted-foreground">
          <span>✓ {stats.success} • ⚠ {stats.warning} • ✗ {stats.error}</span>
          <span>{filteredLogs.length} / {logs.length} logs</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
