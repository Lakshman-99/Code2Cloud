import { Loader2 } from "lucide-react";

interface LoaderSplashProps {
  text?: string;
}

export const LoaderSplash = ({ text = "Finalizing login..." }: LoaderSplashProps) => {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#030712] z-50">
      <div className="relative flex items-center justify-center">
        {/* Outer Pulsing Ring */}
        <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-ping" />

        {/* Rotating Tech Ring */}
        <div className="absolute inset-0 rounded-full border border-cyan-500/10 border-t-cyan-500/50 animate-[spin_3s_linear_infinite]" />

        {/* Core Glow */}
        <div className="h-16 w-16 rounded-full bg-cyan-500/10 flex items-center justify-center backdrop-blur-sm z-10 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
          <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
        </div>
      </div>

      <p className="mt-8 text-xs font-mono text-cyan-500/60 tracking-[0.2em] uppercase animate-pulse">
        {text}
      </p>
    </div>
  );
};
