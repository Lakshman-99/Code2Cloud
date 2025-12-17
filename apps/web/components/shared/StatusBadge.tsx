import { cn } from '@/lib/utils';
import { DeploymentStatus } from '@/stores/useMockStore';

interface StatusBadgeProps {
  status: DeploymentStatus;
  showLabel?: boolean;
  className?: string;
}

const statusConfig = {
  ready: {
    label: 'Ready',
    dotClass: 'status-ready',
    textClass: 'text-success',
  },
  building: {
    label: 'Building',
    dotClass: 'status-building',
    textClass: 'text-info',
  },
  error: {
    label: 'Error',
    dotClass: 'status-error',
    textClass: 'text-destructive',
  },
  queued: {
    label: 'Queued',
    dotClass: 'bg-warning shadow-[0_0_8px_hsl(var(--warning)/0.6)]',
    textClass: 'text-warning',
  },
};

export function StatusBadge({ status, showLabel = true, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("status-dot", config.dotClass)} />
      {showLabel && (
        <span className={cn("text-xs font-medium", config.textClass)}>
          {config.label}
        </span>
      )}
    </div>
  );
}