import { cn } from '@/lib/utils';
import { SkeletonShimmer } from './skeleton-shimmer';
import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton = ({ className, style }: SkeletonProps) => {
  return <SkeletonShimmer className={cn("bg-muted/20", className)} style={style} />;
};

export const NameSkeleton = () => {
  return (
    <SkeletonShimmer className="h-8 w-48 bg-white/10 border border-white/5" />
  );
}

export const SidebarFooterSkeleton = () => {
  return (
    <div className="flex items-center gap-3 w-full">
      <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-2 w-24 opacity-60" />
      </div>
    </div>
  );
}

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

export const RepoListSkeleton = () => (
  <motion.div 
    key="list"
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="flex flex-col h-full w-full"
  >
    <div className="px-8 py-4 border-b border-white/10 flex items-center gap-4 shrink-0 z-10">
      <div className="relative">
        <Skeleton className="h-11 w-56 bg-white/10" />
      </div>
      <div className="flex-1 relative group">
        <Skeleton className="h-11 w-full bg-white/10" />
      </div>
    </div>
    <div className="p-4 space-y-2">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <>
        <motion.div 
          key={i}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="group flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-4 min-w-0">
            <Skeleton className="w-10 h-10 rounded-lg bg-white/10" />
            <div className="min-w-0">
              <Skeleton className="h-4 w-32 bg-white/10 mb-2" />
              <Skeleton className="h-3 w-48 bg-white/10" />
            </div>
          </div>
          <Skeleton className="h-8 w-20 rounded-lg bg-white/10" />

        </motion.div>
        </>
      ))}
    </div>
  </motion.div>
);

export const RootDirectorySkeleton = () => {
  return (
    <div className="space-y-1">
      {/* Simulate Current Directory Row */}
      <div className="flex items-center gap-3 p-2 rounded-md border border-white/5 bg-white/[0.02]">
        <div className="w-4 h-4 rounded-full border border-white/10 flex items-center justify-center">
          <Skeleton className="w-full h-full rounded-full bg-white/10" />
        </div>
        <Skeleton className="w-4 h-4 rounded bg-blue-400/20" /> {/* Icon */}
        <Skeleton className="h-4 w-24 bg-white/10" /> {/* Name */}
        <Skeleton className="h-4 w-12 ml-auto bg-white/5 rounded" /> {/* Badge */}
      </div>

      {/* Simulate File Rows */}
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center justify-between p-2 rounded-md border border-transparent">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-4 h-4 rounded-full border border-white/10" /> {/* Radio Placeholder */}
            
            {/* Folder Icon (blue-ish tint) vs File Icon (white tint) */}
            <Skeleton className={`w-4 h-4 rounded ${i >= 4 ? 'bg-white/10' : 'bg-blue-400/20'}`} />
            
            <Skeleton className="h-3.5 w-1/3 bg-white/10" />
          </div>
          {/* Arrow Placeholder */}
          {i >= 4 && <Skeleton className="w-4 h-4 rounded bg-white/5" />}
        </div>
      ))}
    </div>
  );
};