import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div className={cn("glass rounded-xl p-4 space-y-4", className)}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg skeleton-shimmer" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded skeleton-shimmer" />
          <div className="h-3 w-1/2 rounded skeleton-shimmer" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded skeleton-shimmer" />
        <div className="h-3 w-4/5 rounded skeleton-shimmer" />
      </div>
    </div>
  );
}

export function SkeletonChart({ className }: SkeletonCardProps) {
  return (
    <div className={cn("glass rounded-xl p-6", className)}>
      <div className="h-5 w-1/4 rounded skeleton-shimmer mb-6" />
      <div className="h-48 w-full rounded skeleton-shimmer" />
    </div>
  );
}

export function SkeletonTable({ className, rows = 5 }: SkeletonCardProps & { rows?: number }) {
  return (
    <div className={cn("glass rounded-xl overflow-hidden", className)}>
      <div className="p-4 border-b border-white/5">
        <div className="h-5 w-1/3 rounded skeleton-shimmer" />
      </div>
      <div className="divide-y divide-white/5">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-4">
            <div className="w-8 h-8 rounded-full skeleton-shimmer" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 rounded skeleton-shimmer" />
              <div className="h-3 w-1/4 rounded skeleton-shimmer" />
            </div>
            <div className="h-6 w-16 rounded skeleton-shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}