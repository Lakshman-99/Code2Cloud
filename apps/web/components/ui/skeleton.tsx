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

export const DeploymentRowSkeleton = () => {
  return (
    <tr className="border-b border-white/5 animate-pulse">
      {/* Project */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-lg bg-white/10" />
          <div className="space-y-1">
            <Skeleton className="h-3.5 w-28 bg-white/10" />
            <Skeleton className="h-3 w-16 bg-white/5" />
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4 rounded-full bg-white/10" />
          <Skeleton className="h-3.5 w-20 bg-white/10" />
        </div>
      </td>

      {/* Commit */}
      <td className="px-6 py-4">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-20 bg-white/10 rounded" />
          <Skeleton className="h-3 w-36 bg-white/5" />
        </div>
      </td>

      {/* Branch */}
      <td className="px-6 py-4">
        <Skeleton className="h-6 w-20 bg-white/10 rounded-md" />
      </td>

      {/* Runtime */}
      <td className="px-6 py-4">
        <Skeleton className="h-3.5 w-16 bg-white/10" />
      </td>

      {/* Duration */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4 rounded-full bg-white/10" />
          <Skeleton className="h-3.5 w-10 bg-white/10" />
        </div>
      </td>

      {/* Started At */}
      <td className="px-6 py-4">
        <Skeleton className="h-3.5 w-24 bg-white/10" />
      </td>

      {/* Action */}
      <td className="px-6 py-4 text-right">
        <Skeleton className="w-8 h-8 rounded-lg bg-white/5" />
      </td>
    </tr>
  );
};

export const ProjectDetailSkeleton = () => {
  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      {/* Back Button */}
      <Skeleton className="h-4 w-32 mb-8" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Skeleton className="w-14 h-14 rounded-xl" />
          <div className="space-y-3">
            <Skeleton className="h-6 w-52" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/5 mb-8">
        <div className="flex gap-3">
          {[...Array(5)].map((_, index) => (
            <Skeleton key={index} className="h-10 w-24" />
          ))}
        </div>
      </div>

      {/* Pipeline */}
      <div className="glass-card p-6 mb-6">
        <Skeleton className="h-6 w-52 mb-8" />
        <Skeleton className="h-1 w-full mb-6 rounded-full" />

        <div className="flex justify-between">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex flex-col items-center">
              <Skeleton className="w-12 h-12 rounded-full" />
              <Skeleton className="h-3 w-16 mt-3" />
            </div>
          ))}
        </div>
      </div>

      {/* Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Project Details */}
        <div className="glass-card p-6 space-y-6">
          <div className="flex justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-6 w-28 rounded-full" />
          </div>

          <div className="grid grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-32" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-36" />
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-card p-6 flex flex-col">
          <Skeleton className="h-5 w-32 mb-6" />
          <div className="flex-1 space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-12 w-full rounded-xl mt-6" />
        </div>
      </div>
    </div>
  );
};

export function SettingsSkeleton() {
  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen space-y-8">
      
      {/* --- HEADER SKELETON --- */}
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          {/* Title */}
          <Skeleton className="h-9 w-64 rounded-lg" />
          {/* Subtitle */}
          <Skeleton className="h-4 w-96 rounded-md" />
        </div>
        {/* Save Button Placeholder (Optional, usually hidden until dirty, but keeps layout stable) */}
        <div className="w-32 h-10" /> 
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* --- SIDEBAR SKELETON --- */}
        <div className="lg:col-span-1 space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>

        {/* --- MAIN CONTENT SKELETON --- */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Mimic the "General" Glass Card */}
          <div className="p-6 rounded-xl border border-white/10 bg-white/5 space-y-8">
            
            {/* Card Title */}
            <Skeleton className="h-7 w-48 rounded-md" />

            <div className="space-y-6">
              {/* Region Select */}
              <div className="space-y-3">
                <Skeleton className="h-4 w-40 rounded" /> {/* Label */}
                <Skeleton className="h-12 w-full rounded-md" /> {/* Input */}
                <Skeleton className="h-3 w-2/3 rounded" /> {/* Helper text */}
              </div>

              {/* Divider */}
              <div className="h-px bg-white/5 w-full" />

              {/* Resource Limits Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}