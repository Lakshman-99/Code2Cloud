import { motion } from 'framer-motion';
import { Terminal, Copy, Download, Maximize2 } from 'lucide-react';
import { Log } from '@/stores/useMockStore';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TerminalLogsProps {
  logs: Log[];
  projectName: string;
}

export const TerminalLogs = ({ logs, projectName }: TerminalLogsProps) => {
  const handleCopy = () => {
    const logText = logs.map(l => `[${l.timestamp}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(logText);
    toast.success('Logs copied to clipboard');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card overflow-hidden"
    >
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-950 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Terminal className="w-4 h-4" />
            <span className="text-sm font-mono">{projectName} — Build Logs</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={handleCopy}>
            <Copy className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="w-7 h-7">
            <Download className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="w-7 h-7">
            <Maximize2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="bg-zinc-950 p-4 font-mono text-sm max-h-96 overflow-y-auto">
        {logs.map((log, index) => (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            className="terminal-line py-1 flex gap-3"
          >
            <span className="text-muted-foreground shrink-0">[{log.timestamp}]</span>
            <span className={cn(
              log.type === 'success' && "terminal-success",
              log.type === 'error' && "terminal-error",
              log.type === 'warning' && "terminal-warning",
              log.type === 'info' && "text-foreground"
            )}>
              {log.type === 'success' && '✓ '}
              {log.type === 'error' && '✗ '}
              {log.type === 'warning' && '⚠ '}
              {log.message}
            </span>
          </motion.div>
        ))}
        <div className="terminal-line py-1 text-muted-foreground animate-pulse">
          █
        </div>
      </div>
    </motion.div>
  );
};
