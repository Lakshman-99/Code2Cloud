import { cn } from "@/lib/utils";
import { CSSProperties } from "react";

interface SkeletonShimmerProps {
  className?: string;
  style?: CSSProperties;
}

export const SkeletonShimmer = ({ className, style }: SkeletonShimmerProps) => {
  return (
    <div
      className={cn(
        // 1. Base Styles (Shape & Base Color)
        "relative overflow-hidden rounded-md bg-white/5",
        className
      )}
      style={style}
    >
      {/* 2. The Shimmer Overlay (The Moving Light) */}
      <div 
        className="absolute inset-0 -translate-x-full animate-shimmer-slide bg-gradient-to-r from-transparent via-white/10 to-transparent"
        style={{ content: '""' }}
      />
    </div>
  );
};
export const CardSkeleton = () => (
  <div className="glass-card p-6 space-y-4">
    <SkeletonShimmer className="h-4 w-1/3" />
    <SkeletonShimmer className="h-8 w-2/3" />
    <div className="flex gap-2">
      <SkeletonShimmer className="h-6 w-16" />
      <SkeletonShimmer className="h-6 w-20" />
    </div>
  </div>
);

export const ChartSkeleton = () => (
  <div className="glass-card p-6 space-y-4">
    <div className="flex justify-between items-center">
      <SkeletonShimmer className="h-5 w-32" />
      <SkeletonShimmer className="h-8 w-24" />
    </div>
    <div className="h-64 flex items-end gap-2 pt-8">
      {Array.from({ length: 12 }).map((_, i) => (
        <SkeletonShimmer
          key={i}
          className="flex-1"
          // eslint-disable-next-line react-hooks/purity
          style={{ height: `${Math.random() * 60 + 20}%` }}
        />
      ))}
    </div>
  </div>
);

export const TableSkeleton = () => (
  <div className="glass-card overflow-hidden">
    <div className="p-4 border-b border-white/5">
      <SkeletonShimmer className="h-5 w-40" />
    </div>
    <div className="divide-y divide-white/5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="p-4 flex items-center gap-4">
          <SkeletonShimmer className="w-2 h-2 rounded-full" />
          <SkeletonShimmer className="h-4 w-24" />
          <SkeletonShimmer className="h-4 w-32 flex-1" />
          <SkeletonShimmer className="h-4 w-16" />
          <SkeletonShimmer className="h-4 w-20" />
        </div>
      ))}
    </div>
  </div>
);
