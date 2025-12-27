import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton = ({ className, style }: SkeletonProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('skeleton-shimmer rounded-lg bg-muted', className)}
      style={style}
    />
  );
};

export const CardSkeleton = () => {
  return (
    <div className="glass rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
};

export const ChartSkeleton = () => {
  return (
    <div className="glass rounded-xl p-6 space-y-4 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-36" />
          </div>
        </div>
        <div className="space-y-1 text-right">
          <Skeleton className="h-6 w-20 ml-auto" />
          <Skeleton className="h-3 w-24 ml-auto" />
        </div>
      </div>
      <div className="h-[200px] flex items-end gap-1 pt-8">
        {Array.from({ length: 24 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1"
            // eslint-disable-next-line react-hooks/purity
            style={{ height: `${Math.random() * 100 + 20}px` }}
          />
        ))}
      </div>
    </div>
  );
};

export const ListSkeleton = () => {
  return (
    <div className="glass rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
            <div className="flex items-center gap-3">
              <Skeleton className="w-2.5 h-2.5 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
};
