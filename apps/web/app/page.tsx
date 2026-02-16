/* eslint-disable react-hooks/purity */
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Cloud,
  GitBranch,
  Rocket,
  Server,
  Shield,
  Terminal,
  Layers,
  Globe,
  Zap,
  ArrowRight,
  Code2,
  Container,
  Database,
  MonitorDot,
  LayoutDashboard,
  ScrollText,
  ChevronRight,
  ExternalLink,
  Box,
  Network,
  Lock,
  RefreshCcw,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Play,
  Cpu,
  HardDrive,
  MemoryStick,
} from "lucide-react";
import {
  SiTypescript,
  SiNextdotjs,
  SiReact,
  SiNestjs,
  SiPrisma,
  SiPostgresql,
  SiRedis,
  SiDocker,
  SiKubernetes,
  SiTerraform,
  SiAnsible,
  SiGo,
  SiTailwindcss,
  SiGraphql,
  SiGithub,
  SiLetsencrypt,
} from "react-icons/si";

// ─── Floating particles ──────────────────────────────────────
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-emerald-500/30"
          initial={{
            x: `${Math.random() * 100}%`,
            y: `${Math.random() * 100}%`,
            scale: Math.random() * 0.5 + 0.5,
          }}
          animate={{
            y: [null, `${Math.random() * -30 + 85}%`, `${Math.random() * 100}%`],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: Math.random() * 8 + 12,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ─── Animated counter ────────────────────────────────────────
function AnimatedNumber({ value, suffix = "" }: { value: string; suffix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const numVal = parseInt(value) || 0;
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView || numVal === 0) return;
    let start = 0;
    const duration = 1800;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * numVal));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isInView, numVal]);

  return (
    <span ref={ref}>
      {numVal === 0 ? value : count}
      {suffix}
    </span>
  );
}

// ─── Mouse-tracking glow card ────────────────────────────────
function GlowCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className={`relative overflow-hidden rounded-2xl bg-zinc-900/60 border border-white/[0.06] backdrop-blur-sm ${className}`}
      style={{
        background: isHovered
          ? `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(16,185,129,0.06), transparent 60%)`
          : undefined,
      }}
    >
      {isHovered && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: `radial-gradient(300px circle at ${mousePos.x}px ${mousePos.y}px, rgba(16,185,129,0.15), transparent 60%)`,
            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            maskComposite: "exclude",
            WebkitMaskComposite: "xor",
            padding: "1px",
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

// ─── Typing animation ───────────────────────────────────────
function TypingText({ texts }: { texts: string[] }) {
  const [index, setIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = texts[index];
    let timeout: NodeJS.Timeout;

    if (!deleting && displayed.length < current.length) {
      timeout = setTimeout(() => setDisplayed(current.slice(0, displayed.length + 1)), 70);
    } else if (!deleting && displayed.length === current.length) {
      timeout = setTimeout(() => setDeleting(true), 2200);
    } else if (deleting && displayed.length > 0) {
      timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 35);
    } else if (deleting && displayed.length === 0) {
      timeout = setTimeout(() => {
        setDeleting(false);
        setIndex((i) => (i + 1) % texts.length);
      }, 0);
    }
    return () => clearTimeout(timeout);
  }, [displayed, deleting, index, texts]);

  return (
    <span className="text-emerald-400">
      {displayed}
      <span className="animate-pulse text-emerald-300/60">_</span>
    </span>
  );
}

// ─── Live deployment terminal ────────────────────────────────
const deploymentSteps = [
  { text: "$ git push origin main", color: "text-white", delay: 0 },
  { text: "", color: "", delay: 400 },
  { text: "  ● Webhook received — queuing deployment...", color: "text-emerald-400", delay: 800 },
  { text: "  ● Status → BUILDING", color: "text-amber-400", delay: 1600 },
  { text: "", color: "", delay: 2000 },
  { text: "  ┌ Cloning repository", color: "text-zinc-400", delay: 2200 },
  { text: "  │ git clone --depth 1 --single-branch", color: "text-zinc-600", delay: 2600 },
  { text: "  └ ✓ Cloned in 1.2s", color: "text-emerald-400", delay: 3400 },
  { text: "", color: "", delay: 3600 },
  { text: "  ┌ Building container image", color: "text-zinc-400", delay: 3800 },
  { text: "  │ railpack prepare → build plan generated", color: "text-zinc-600", delay: 4400 },
  { text: "  │ buildctl build → pushing to registry", color: "text-zinc-600", delay: 5200 },
  { text: "  └ ✓ Image: registry/myapp:d8f3a1c (47s)", color: "text-emerald-400", delay: 6400 },
  { text: "", color: "", delay: 6600 },
  { text: "  ● Status → DEPLOYING", color: "text-cyan-400", delay: 6800 },
  { text: "", color: "", delay: 7000 },
  { text: "  ┌ Kubernetes rollout", color: "text-zinc-400", delay: 7200 },
  { text: "  │ Deployment + Service + Ingress created", color: "text-zinc-600", delay: 7800 },
  { text: "  │ TLS certificate provisioned (Let's Encrypt)", color: "text-zinc-600", delay: 8600 },
  { text: "  │ Waiting for readiness probe...", color: "text-zinc-600", delay: 9200 },
  { text: "  └ ✓ 1/1 pods running", color: "text-emerald-400", delay: 10400 },
  { text: "", color: "", delay: 10600 },
  { text: "  ● Status → READY", color: "text-emerald-300 font-semibold", delay: 10800 },
  { text: "  ● https://myapp.deploy.code2cloud.dev", color: "text-emerald-400 underline decoration-emerald-400/30", delay: 11400 },
  { text: "  ● Streaming runtime logs...", color: "text-zinc-500", delay: 12000 },
];

function LiveTerminal() {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [replay, setReplay] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-100px" });
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isInView) return;
    const reset = setTimeout(() => setVisibleLines(0), 0);
    const timers: NodeJS.Timeout[] = [reset];
    deploymentSteps.forEach((step, i) => {
      timers.push(setTimeout(() => setVisibleLines(i + 1), step.delay + 10));
    });
    return () => timers.forEach(clearTimeout);
  }, [isInView, replay]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [visibleLines]);

  const isComplete = visibleLines >= deploymentSteps.length;

  return (
    <div ref={ref} className="w-full max-w-3xl mx-auto">
      <div className="rounded-2xl overflow-hidden border border-emerald-500/10 shadow-2xl shadow-emerald-500/5 bg-zinc-950">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900/90 border-b border-white/5">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-zinc-700 hover:bg-red-500/80 transition-colors" />
            <div className="w-3 h-3 rounded-full bg-zinc-700 hover:bg-amber-500/80 transition-colors" />
            <div className="w-3 h-3 rounded-full bg-zinc-700 hover:bg-emerald-500/80 transition-colors" />
          </div>
          <span className="text-xs text-zinc-600 font-mono ml-3">deployment-pipeline</span>
          <div className="ml-auto flex items-center gap-2">
            {!isComplete && visibleLines > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                running
              </span>
            )}
            {isComplete && (
              <button
                onClick={() => { setVisibleLines(0); setReplay(r => r + 1); }}
                className="flex items-center gap-1 text-xs text-zinc-500 hover:text-emerald-400 transition-colors"
              >
                <RefreshCcw className="w-3 h-3" />
                replay
              </button>
            )}
          </div>
        </div>
        {/* Terminal body */}
        <div ref={terminalRef} className="p-5 font-mono text-[13px] h-[400px] overflow-y-auto leading-relaxed">
          <AnimatePresence>
            {deploymentSteps.slice(0, visibleLines).map((step, i) =>
              step.text === "" ? (
                <div key={i} className="h-3" />
              ) : (
                <motion.div
                  key={`${replay}-${i}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`${step.color} py-[1px]`}
                >
                  {step.text}
                </motion.div>
              ),
            )}
          </AnimatePresence>
          {visibleLines > 0 && !isComplete && (
            <span className="inline-block w-[7px] h-[15px] bg-emerald-400/70 animate-pulse mt-1" />
          )}
          {isComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 pt-3 border-t border-white/5 text-emerald-500/60 text-xs"
            >
              Pipeline complete — 12.0s total
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Pipeline Step ───────────────────────────────────────────
function PipelineStep({
  icon: Icon,
  title,
  description,
  step,
  isLast = false,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  step: number;
  isLast?: boolean;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: step * 0.08 }}
      className="flex gap-4 relative"
    >
      {!isLast && (
        <div className="absolute left-5 top-12 w-px h-[calc(100%-12px)] bg-gradient-to-b from-emerald-500/30 to-transparent" />
      )}
      <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
        <Icon className="w-5 h-5 text-emerald-400" />
      </div>
      <div className="pb-8">
        <span className="text-[10px] font-mono text-emerald-500/50 uppercase tracking-widest">Step {step}</span>
        <h4 className="text-white font-semibold text-[15px]">{title}</h4>
        <p className="text-zinc-500 text-sm mt-1 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

// ─── Feature Card ────────────────────────────────────────────
function FeatureCard({
  icon: Icon,
  title,
  description,
  delay = 0,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <GlowCard className="p-6 h-full">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center mb-4">
          <Icon className="w-5 h-5 text-emerald-400" />
        </div>
        <h3 className="text-white font-semibold text-[15px] mb-2">{title}</h3>
        <p className="text-zinc-500 text-sm leading-relaxed">{description}</p>
      </GlowCard>
    </motion.div>
  );
}

// ─── Tech Badge ──────────────────────────────────────────────
function TechBadge({
  icon: Icon,
  name,
  category,
  delay = 0,
}: {
  icon: React.ElementType;
  name: string;
  category: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.04 }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-emerald-500/20 hover:bg-emerald-500/[0.03] transition-all cursor-default group"
    >
      <Icon className="w-5 h-5 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
      <div>
        <p className="text-white text-sm font-medium">{name}</p>
        <p className="text-zinc-600 text-[11px]">{category}</p>
      </div>
    </motion.div>
  );
}

// ─── Architecture Diagram helpers ────────────────────────────

function FlowConnector({ label, height = 48 }: { label?: string; height?: number }) {
  return (
    <div className="flex items-center justify-center relative" style={{ height }}>
      <div className="w-px h-full bg-gradient-to-b from-emerald-500/30 via-emerald-500/10 to-emerald-500/30 relative overflow-hidden">
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
          animate={{ y: [-6, height + 6] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.5 }}
        />
      </div>
      {label && (
        <span className="absolute left-1/2 ml-5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-600 font-mono whitespace-nowrap">
          {label}
        </span>
      )}
    </div>
  );
}

function DiagramLayer({
  label,
  color = "emerald",
  children,
  delay = 0,
}: {
  label: string;
  color?: "emerald" | "cyan" | "amber" | "red" | "zinc";
  children: React.ReactNode;
  delay?: number;
}) {
  const borderColors: Record<string, string> = {
    emerald: "border-emerald-500/10",
    cyan: "border-cyan-500/10",
    amber: "border-amber-500/10",
    red: "border-red-500/10",
    zinc: "border-white/[0.04]",
  };
  const labelColors: Record<string, string> = {
    emerald: "text-emerald-500/70 bg-emerald-500/8 border-emerald-500/10",
    cyan: "text-cyan-500/70 bg-cyan-500/8 border-cyan-500/10",
    amber: "text-amber-500/70 bg-amber-500/8 border-amber-500/10",
    red: "text-red-500/70 bg-red-500/8 border-red-500/10",
    zinc: "text-zinc-600 bg-zinc-800/50 border-zinc-700/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className={`relative rounded-2xl border ${borderColors[color]} bg-zinc-900/20 backdrop-blur-sm p-5 md:p-6`}
    >
      <span
        className={`absolute -top-2.5 left-5 px-2.5 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-widest border ${labelColors[color]}`}
      >
        {label}
      </span>
      {children}
    </motion.div>
  );
}

function DiagNode({
  icon: Icon,
  name,
  detail,
  accent = "emerald",
}: {
  icon: React.ElementType;
  name: string;
  detail?: string;
  accent?: "emerald" | "cyan" | "amber" | "red";
}) {
  const colors = {
    emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/15", text: "text-emerald-400" },
    cyan: { bg: "bg-cyan-500/10", border: "border-cyan-500/15", text: "text-cyan-400" },
    amber: { bg: "bg-amber-500/10", border: "border-amber-500/15", text: "text-amber-400" },
    red: { bg: "bg-red-500/10", border: "border-red-500/15", text: "text-red-400" },
  };
  const c = colors[accent];

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -2 }}
      className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.06] hover:border-emerald-500/10 transition-all cursor-default"
    >
      <div className={`w-8 h-8 rounded-lg ${c.bg} ${c.border} border flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-4 h-4 ${c.text}`} />
      </div>
      <div className="min-w-0">
        <p className="text-white text-xs font-medium">{name}</p>
        {detail && <p className="text-zinc-600 text-[10px] mt-0.5 truncate">{detail}</p>}
      </div>
    </motion.div>
  );
}

function FlowArrow({ label, direction = "right" }: { label?: string; direction?: "right" | "left" | "both" }) {
  return (
    <div className="flex items-center gap-0.5 mx-1 flex-shrink-0">
      {direction === "left" && <ChevronRight className="w-3 h-3 text-emerald-500/30 rotate-180" />}
      {direction === "both" && <ChevronRight className="w-3 h-3 text-emerald-500/30 rotate-180" />}
      <div className="flex flex-col items-center min-w-[20px]">
        {label && <span className="text-[8px] text-zinc-600 font-mono leading-none mb-0.5">{label}</span>}
        <div className="h-px w-full min-w-[20px] bg-gradient-to-r from-emerald-500/20 to-emerald-500/30" />
      </div>
      {(direction === "right" || direction === "both") && <ChevronRight className="w-3 h-3 text-emerald-500/30" />}
    </div>
  );
}

// ─── Section helpers ─────────────────────────────────────────
function Section({ children, id, className = "" }: { children: React.ReactNode; id?: string; className?: string }) {
  return (
    <section id={id} className={`relative py-24 md:py-32 ${className}`}>
      <div className="max-w-6xl mx-auto px-6">{children}</div>
    </section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/8 border border-emerald-500/15 text-emerald-400 text-xs font-medium mb-4"
    >
      {children}
    </motion.div>
  );
}

function SectionTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.h2
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1 }}
      className={`text-3xl md:text-4xl font-bold text-white mb-4 ${className}`}
    >
      {children}
    </motion.h2>
  );
}

function SectionDescription({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.15 }}
      className={`text-zinc-400 text-lg max-w-2xl leading-relaxed ${className}`}
    >
      {children}
    </motion.p>
  );
}

// ═════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════
export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#030712]">
      {/* ── Background ─────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Cpath d='M0 0h48M0 0v48' stroke='white' stroke-opacity='0.4' stroke-dasharray='3 5' fill='none'/%3E%3C/svg%3E")`,
            backgroundSize: "48px 48px",
            maskImage: "linear-gradient(to bottom, black 30%, transparent 80%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 30%, transparent 80%)",
          }}
        />
        <motion.div
          className="absolute -top-[300px] -right-[200px] w-[800px] h-[800px] rounded-full opacity-[0.08]"
          style={{ background: "radial-gradient(circle, hsl(160 84% 39%) 0%, transparent 65%)" }}
          animate={{ x: [0, 40, -20, 0], y: [0, 20, -10, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-[200px] -left-[200px] w-[600px] h-[600px] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, hsl(172 66% 50%) 0%, transparent 65%)" }}
          animate={{ x: [0, -30, 20, 0], y: [0, -20, 15, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
        <FloatingParticles />
      </div>

      {/* ── Navbar ─────────────────────────────────────────── */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 bg-[#030712]/70 backdrop-blur-2xl border-b border-white/[0.04]"
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
              <Cloud className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="font-bold text-lg text-white tracking-tight">
              Code<span className="text-emerald-400">2</span>Cloud
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {[["Features", "#features"], ["Pipeline", "#pipeline"], ["Architecture", "#architecture"], ["Tech Stack", "#tech"]].map(([label, href]) => (
              <a key={label} href={href} className="text-sm text-zinc-500 hover:text-emerald-400 transition-colors duration-200">
                {label}
              </a>
            ))}
          </div>
          <Link href="/dashboard" className="group px-4 py-2 text-sm font-medium rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all">
            Get Started <ArrowRight className="w-3.5 h-3.5 inline ml-1 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </motion.nav>

      {/* ══════════════════════════════════════════════════════
           HERO
           ══════════════════════════════════════════════════════ */}
      <section className="relative pt-36 pb-16 md:pt-48 md:pb-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-500/8 border border-emerald-500/15 text-emerald-400 text-xs font-medium mb-8"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Polyglot Monorepo — TypeScript + Go + Terraform
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold text-white leading-[1.08] tracking-tight mb-8"
            >
              From{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-emerald-400">git push</span>
                <span className="absolute -bottom-1 left-0 right-0 h-3 bg-emerald-500/10 rounded-sm -z-0" />
              </span>{" "}
              to
              <br />
              <span className="relative inline-block">
                <span className="relative z-10 text-emerald-400">production</span>
                <span className="absolute -bottom-1 left-0 right-0 h-3 bg-emerald-500/10 rounded-sm -z-0" />
              </span>{" "}
              in{" "}
              <span className="text-zinc-500 text-3xl md:text-5xl font-semibold">
                <TypingText texts={["seconds.", "one click.", "zero config."]} />
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-zinc-400 max-w-2xl leading-relaxed mb-10"
            >
              An end-to-end cloud deployment platform. A <span className="text-emerald-400 font-medium">Go worker</span> picks
              up your build from Redis, clones your repo, builds a container with BuildKit, deploys to{" "}
              <span className="text-white font-medium">Kubernetes</span>, provisions TLS, and streams logs — all automatically.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <Link
                href="/dashboard"
                className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-medium text-sm text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20 hover:shadow-emerald-500/30"
              >
                <Rocket className="w-4 h-4" />
                Start Deploying
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#pipeline"
                className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-medium text-sm text-zinc-300 bg-white/[0.03] border border-white/[0.06] hover:border-emerald-500/20 hover:bg-emerald-500/[0.04] transition-all"
              >
                <Terminal className="w-4 h-4 text-emerald-500" />
                Watch the Pipeline
              </a>
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-px rounded-2xl overflow-hidden border border-white/[0.04] bg-white/[0.02]"
          >
            {[
              { value: "10", suffix: "+", label: "Pipeline steps automated", icon: Zap },
              { value: "5", suffix: "+", label: "Frameworks supported", icon: Code2 },
              { value: "3", suffix: "", label: "Background goroutines", icon: RefreshCcw },
              { value: "0", suffix: "", label: "Downtime deploys", icon: Shield },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="flex flex-col items-center justify-center py-8 px-4 text-center bg-[#030712]/80 group hover:bg-emerald-500/[0.03] transition-colors"
              >
                {/* Icon + Number Group */}
                <div className="flex items-center gap-2 mb-2"> {/* Added small mb-2 here to space away from label */}
                  <stat.icon className="w-5 h-5 md:w-6 md:h-6 text-emerald-500/40 group-hover:text-emerald-400 transition-colors" />
                  <div className="text-2xl md:text-3xl font-bold text-white leading-none">
                    <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                  </div>
                </div>
                
                {/* Label */}
                <p className="text-zinc-600 text-xs uppercase tracking-wider">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
           LIVE PIPELINE
           ══════════════════════════════════════════════════════ */}
      <Section id="pipeline">
        <div className="text-center mb-14">
          <SectionLabel><Terminal className="w-3.5 h-3.5" /> Live Pipeline</SectionLabel>
          <SectionTitle className="text-center">Watch a Deployment Unfold</SectionTitle>
          <SectionDescription className="mx-auto text-center">
            Every <code className="text-emerald-400 font-mono text-sm bg-emerald-500/10 px-1.5 py-0.5 rounded">git push</code> triggers
            this exact sequence — orchestrated end-to-end by the Go worker.
          </SectionDescription>
        </div>
        <LiveTerminal />
      </Section>

      {/* ══════════════════════════════════════════════════════
           FEATURES
           ══════════════════════════════════════════════════════ */}
      <Section id="features">
        <SectionLabel><Zap className="w-3.5 h-3.5" /> Platform</SectionLabel>
        <SectionTitle>Everything to Ship, Monitor &amp; Scale</SectionTitle>
        <SectionDescription>One platform replaces your entire CI/CD pipeline, domain config, secret management, and deployment monitoring.</SectionDescription>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-14">
          <FeatureCard icon={Rocket} title="One-Click Deployments" description="Push code or hit deploy. Go worker clones, builds, containerizes, and rolls out to Kubernetes — fully automated, every time." delay={0} />
          <FeatureCard icon={GitBranch} title="GitHub App Integration" description="OAuth + GitHub Installation tokens. Webhooks for auto-deploy on push. Branch selection, shallow cloning, and commit tracking." delay={0.06} />
          <FeatureCard icon={Globe} title="Custom Domains & TLS" description="Add domains with auto DNS verification (CNAME/A via Google DNS). Let's Encrypt TLS via cert-manager. Zero manual config." delay={0.12} />
          <FeatureCard icon={ScrollText} title="Real-Time Log Streaming" description="Build logs stream live during clone, build and deploy. Runtime pod logs with auto-reconnect. Batched at 20 lines, flushed every 2s." delay={0.18} />
          <FeatureCard icon={RefreshCcw} title="Cancel & Rollback" description="Cancel mid-flight builds via Redis signals checked at every pipeline stage. Roll back to any previous deployment with history tracking." delay={0.24} />
          <FeatureCard icon={Clock} title="TTL Auto-Cleanup" description="Set per-deployment TTL. Background goroutine tears down expired K8s resources every 60s — Ingress, Service, Deployment gone." delay={0.3} />
          <FeatureCard icon={Lock} title="Env Vars & Secrets" description="Per-environment secrets (prod/preview/dev). Sensitive keys auto-masked in logs. Framework-aware PORT/HOST injection." delay={0.36} />
          <FeatureCard icon={MonitorDot} title="Health Probes" description="TCP liveness + readiness probes on every container. Rolling updates: maxUnavailable=0, maxSurge=1. True zero-downtime deploys." delay={0.42} />
          <FeatureCard icon={LayoutDashboard} title="Project Dashboard" description="Multi-project management with per-project build config, deployment history, domain settings, and system health charts." delay={0.48} />
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════
           GO WORKER ENGINE
           ══════════════════════════════════════════════════════ */}
      <Section id="go-worker">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <SectionLabel><SiGo className="w-4 h-4" /> Go Worker</SectionLabel>
            <SectionTitle>
              The Heart of the Platform.
              <br />
              <span className="text-emerald-400/60">Written in Go.</span>
            </SectionTitle>
            <SectionDescription>
              A standalone Go service that blocks on Redis BRPop, executes a multi-stage
              deployment pipeline, and runs 3 concurrent background goroutines — all with
              minimal memory overhead and graceful shutdown handling.
            </SectionDescription>

            <div className="mt-10 space-y-3">
              {[
                { icon: Cpu, label: "Redis BRPop Queue", desc: "Blocking pop — zero polling, instant pickup" },
                { icon: Container, label: "BuildKit + Railpack", desc: "Framework auto-detection, OCI image builds" },
                { icon: Server, label: "Kubernetes client-go", desc: "In-cluster RBAC, Deployment/Service/Ingress CRUD" },
                { icon: Shield, label: "Graceful Shutdown", desc: "SIGINT/SIGTERM with in-flight job completion" },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.03] hover:border-emerald-500/10 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{item.label}</p>
                    <p className="text-zinc-600 text-xs mt-0.5">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="space-y-0 pt-2">
            <PipelineStep icon={Play} step={1} title="Job Dequeued from Redis" description="BRPop blocks until a build job arrives. Receives deployment ID, git URL, env vars, build commands, and domain list." />
            <PipelineStep icon={GitBranch} step={2} title="Shallow Clone" description="git clone --depth 1 with GitHub Installation Token. Live progress via StreamLogger (batched writes, 2s flush)." />
            <PipelineStep icon={Code2} step={3} title="Railpack Prepare" description="Auto-detects framework (Next.js, Go, Python, etc). Generates optimized build plan — no Dockerfile needed." />
            <PipelineStep icon={Container} step={4} title="BuildKit Build & Push" description="Builds OCI image via BuildKit gateway protocol. Pushes to internal registry with inline caching." />
            <PipelineStep icon={Server} step={5} title="K8s Deploy" description="Creates/updates Deployment + ClusterIP Service + Traefik Ingress. Rolling update: maxUnavailable=0." />
            <PipelineStep icon={Globe} step={6} title="TLS & Domains" description="cert-manager provisions Let's Encrypt certs. Custom domains verified via DNS lookups against 8.8.8.8." />
            <PipelineStep icon={CheckCircle2} step={7} title="Ready" description="Waits up to 5 min for TCP readiness probe. Sets deployment URL, sends notification, starts log streaming." isLast />
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════
           BACKGROUND WORKERS
           ══════════════════════════════════════════════════════ */}
      <Section>
        <div className="text-center mb-14">
          <SectionLabel><RefreshCcw className="w-3.5 h-3.5" /> Background</SectionLabel>
          <SectionTitle className="text-center">Three Goroutines. Always Running.</SectionTitle>
          <SectionDescription className="mx-auto text-center">
            Autonomous background workers handle domain verification, resource cleanup, and log rotation.
          </SectionDescription>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: Globe, title: "Domain Worker", interval: "30s", description: "Polls pending domains → verifies DNS (CNAME/A via Google DNS) → adds to Traefik Ingress → marks ACTIVE.", color: "emerald" as const },
            { icon: Clock, title: "Cleanup Worker", interval: "60s", description: "Checks TTL-expired deployments → stops log streams → deletes K8s resources (Ingress → Service → Deployment) → marks EXPIRED.", color: "amber" as const },
            { icon: ScrollText, title: "Log Cleanup", interval: "1h", description: "Purges old log entries based on configurable retention days. Keeps storage lean and database queries fast.", color: "cyan" as const },
          ].map((worker, i) => {
            const colorMap = {
              emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/15", text: "text-emerald-400", dot: "bg-emerald-500" },
              amber: { bg: "bg-amber-500/10", border: "border-amber-500/15", text: "text-amber-400", dot: "bg-amber-500" },
              cyan: { bg: "bg-cyan-500/10", border: "border-cyan-500/15", text: "text-cyan-400", dot: "bg-cyan-500" },
            };
            const c = colorMap[worker.color];
            return (
              <motion.div
                key={worker.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <GlowCard className="p-6 h-full">
                  <div className="flex items-center justify-between mb-5">
                    <div className={`w-10 h-10 rounded-xl ${c.bg} ${c.border} border flex items-center justify-center`}>
                      <worker.icon className={`w-5 h-5 ${c.text}`} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} animate-pulse`} />
                      <span className="text-xs font-mono text-zinc-600">every {worker.interval}</span>
                    </div>
                  </div>
                  <h3 className="text-white font-semibold mb-2">{worker.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{worker.description}</p>
                </GlowCard>
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════
           ARCHITECTURE
           ══════════════════════════════════════════════════════ */}
      <Section id="architecture">
        <div className="text-center mb-16">
          <SectionLabel><Layers className="w-3.5 h-3.5" /> Architecture</SectionLabel>
          <SectionTitle className="text-center">System Architecture — End to End</SectionTitle>
          <SectionDescription className="mx-auto text-center">
            Trace every request from <code className="text-emerald-400 font-mono text-sm bg-emerald-500/10 px-1.5 py-0.5 rounded">git push</code> to
            a live HTTPS URL. Six layers, three languages, one platform.
          </SectionDescription>
        </div>

        {/* ── DETAILED FLOW DIAGRAM ── */}
        <div className="relative max-w-5xl mx-auto space-y-0">

          {/* ── LAYER 1: External / Git ──────────────────────── */}
          <DiagramLayer label="External" color="zinc" delay={0}>
            <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4 pt-2">
              <DiagNode icon={Code2} name="Developer" detail="git push origin main" accent="emerald" />
              <FlowArrow label="push" />
              <DiagNode icon={SiGithub} name="GitHub" detail="OAuth · Webhooks · Tokens" />
              <FlowArrow label="webhook POST" />
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 text-[11px] font-mono">auto-deploy triggered</span>
              </div>
            </div>
          </DiagramLayer>

          <FlowConnector height={44} label="HTTP webhook" />

          {/* ── LAYER 2: Application ─────────────────────────── */}
          <DiagramLayer label="Application" color="emerald" delay={0.08}>
            <div className="grid md:grid-cols-[1fr_auto_1fr] gap-4 items-start pt-2">
              {/* Next.js */}
              <div className="space-y-2">
                <DiagNode icon={SiNextdotjs} name="Web Frontend" detail="Next.js 16 · React 19 · Tailwind" accent="emerald" />
                <div className="ml-12 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-600">
                    <span className="w-1 h-1 rounded-full bg-emerald-500/40" />Dashboard · Deploy UI · Log Viewer
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-600">
                    <span className="w-1 h-1 rounded-full bg-emerald-500/40" />Domain Config · Env Editor
                  </div>
                </div>
              </div>

              {/* Connection */}
              <div className="hidden md:flex flex-col items-center justify-center gap-1 py-4">
                <div className="flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 text-emerald-500/30 rotate-180" />
                  <div className="w-16 h-px bg-gradient-to-r from-emerald-500/30 to-emerald-500/30" />
                  <ChevronRight className="w-3 h-3 text-emerald-500/30" />
                </div>
                <span className="text-[9px] text-zinc-600 font-mono">REST + GraphQL</span>
              </div>

              {/* NestJS API */}
              <div className="space-y-2">
                <DiagNode icon={SiNestjs} name="API Server" detail="NestJS 11 · Prisma · BullMQ" accent="amber" />
                <div className="ml-12 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-600">
                    <span className="w-1 h-1 rounded-full bg-amber-500/40" />Auth · Projects · Deployments · Domains
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-600">
                    <span className="w-1 h-1 rounded-full bg-amber-500/40" />Webhook Handler · Build Queue
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-600">
                    <span className="w-1 h-1 rounded-full bg-amber-500/40" />Email (Nodemailer) · Health Checks
                  </div>
                </div>
              </div>
            </div>
          </DiagramLayer>

          {/* Split connectors: enqueue + CRUD */}
          <div className="flex justify-center gap-32 md:gap-48">
            <FlowConnector height={40} label="enqueue job" />
            <FlowConnector height={40} label="CRUD" />
          </div>

          {/* ── LAYER 3: Data ────────────────────────────────── */}
          <DiagramLayer label="Data Layer" color="red" delay={0.16}>
            <div className="grid md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2.5">
                <DiagNode icon={SiRedis} name="Redis 7" detail="BRPop Queue · Cancel Signals · Pub/Sub" accent="red" />
                <div className="ml-12 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-600">
                    <span className="w-1 h-1 rounded-full bg-red-500/40" />
                    <code className="text-red-400/50 text-[9px]">BRPop</code> blocking dequeue — zero polling
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-600">
                    <span className="w-1 h-1 rounded-full bg-red-500/40" />
                    <code className="text-red-400/50 text-[9px]">SET</code> cancel signal checked at every pipeline step
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-600">
                    <span className="w-1 h-1 rounded-full bg-red-500/40" />
                    Job status: pending → processing → complete/failed
                  </div>
                </div>
              </div>
              <div className="space-y-2.5">
                <DiagNode icon={SiPostgresql} name="PostgreSQL" detail="Primary Database · Prisma ORM" accent="cyan" />
                <div className="ml-12 space-y-1">
                  {[
                    "User · GitAccount · Project",
                    "Deployment · Domain · EnvVariable",
                    "LogEntry · SystemConfig",
                  ].map((m) => (
                    <div key={m} className="flex items-center gap-1.5 text-[10px] text-zinc-600">
                      <span className="w-1 h-1 rounded-full bg-cyan-500/40" />{m}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DiagramLayer>

          <FlowConnector height={44} label="BRPop (blocking)" />

          {/* ── LAYER 4: Go Worker Engine ────────────────────── */}
          <DiagramLayer label="Worker Engine" color="cyan" delay={0.24}>
            <div className="pt-2 space-y-5">
              {/* Worker title */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/15 flex items-center justify-center">
                  <SiGo className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Go Worker</p>
                  <p className="text-zinc-600 text-[11px]">Standalone binary · Goroutines · Graceful shutdown (SIGINT/SIGTERM)</p>
                </div>
              </div>

              {/* ── Build Pipeline (horizontal flow) ── */}
              <div className="rounded-xl bg-zinc-950/60 border border-white/[0.04] p-4">
                <p className="text-[10px] font-mono text-cyan-500/50 uppercase tracking-widest mb-3">Deployment Pipeline</p>
                <div className="flex flex-wrap items-center gap-1.5 md:gap-0">
                  {[
                    { icon: GitBranch, label: "Clone", detail: "git --depth 1", color: "cyan" as const },
                    { icon: Code2, label: "Railpack", detail: "detect framework", color: "cyan" as const },
                    { icon: Container, label: "BuildKit", detail: "build OCI image", color: "cyan" as const },
                    { icon: Box, label: "Push", detail: "→ internal registry", color: "emerald" as const },
                    { icon: Server, label: "Deploy", detail: "K8s rollout", color: "emerald" as const },
                    { icon: Globe, label: "TLS", detail: "cert-manager", color: "emerald" as const },
                    { icon: ScrollText, label: "Stream", detail: "pod logs", color: "emerald" as const },
                  ].map((step, i, arr) => (
                    <div key={step.label} className="flex items-center gap-0">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + i * 0.06 }}
                        whileHover={{ scale: 1.06, y: -2 }}
                        className="flex flex-col items-center gap-1 px-2 md:px-3 py-2 rounded-lg hover:bg-white/[0.02] transition-colors cursor-default"
                      >
                        <div className={`w-8 h-8 rounded-lg ${step.color === "cyan" ? "bg-cyan-500/10 border-cyan-500/15" : "bg-emerald-500/10 border-emerald-500/15"} border flex items-center justify-center`}>
                          <step.icon className={`w-3.5 h-3.5 ${step.color === "cyan" ? "text-cyan-400" : "text-emerald-400"}`} />
                        </div>
                        <span className="text-white text-[10px] font-medium">{step.label}</span>
                        <span className="text-zinc-700 text-[8px] leading-none">{step.detail}</span>
                      </motion.div>
                      {i < arr.length - 1 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.35 + i * 0.06 }}
                          className="hidden md:block"
                        >
                          <ChevronRight className="w-3 h-3 text-emerald-500/20" />
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>
                {/* Cancel check indicator */}
                <div className="mt-3 flex items-center gap-2 text-[10px] text-zinc-700">
                  <XCircle className="w-3 h-3 text-red-500/30" />
                  <span>Cancel signal checked via Redis at every stage transition</span>
                </div>
              </div>

              {/* ── Background Goroutines ── */}
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { icon: Globe, label: "Domain Verify", interval: "30s", desc: "DNS check (CNAME/A via 8.8.8.8) → Traefik Ingress update", color: "text-emerald-400", bg: "bg-emerald-500/8", border: "border-emerald-500/10" },
                  { icon: Clock, label: "TTL Cleanup", interval: "60s", desc: "Expired deploys → stop logs → delete K8s resources", color: "text-amber-400", bg: "bg-amber-500/8", border: "border-amber-500/10" },
                  { icon: Database, label: "Log Cleanup", interval: "1h", desc: "Purge old LogEntry rows by retention config", color: "text-cyan-400", bg: "bg-cyan-500/8", border: "border-cyan-500/10" },
                ].map((g) => (
                  <motion.div
                    key={g.label}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className={`rounded-lg ${g.bg} border ${g.border} px-3 py-2.5`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <g.icon className={`w-3 h-3 ${g.color}`} />
                        <span className="text-white text-[10px] font-medium">{g.label}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-mono text-zinc-600">{g.interval}</span>
                      </div>
                    </div>
                    <p className="text-zinc-600 text-[9px] leading-relaxed">{g.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </DiagramLayer>

          <FlowConnector height={44} label="K8s client-go" />

          {/* ── LAYER 5: Kubernetes Runtime ───────────────────── */}
          <DiagramLayer label="Kubernetes (K3s)" color="cyan" delay={0.32}>
            <div className="pt-2 space-y-4">
              {/* Main K8s flow */}
              <div className="flex flex-wrap items-center justify-center gap-2 md:gap-0">
                {[
                  { icon: Container, name: "Deployment", detail: "Rolling update", accent: "cyan" as const },
                  { icon: Server, name: "Service", detail: "ClusterIP", accent: "cyan" as const },
                  { icon: Network, name: "Ingress", detail: "Traefik rules", accent: "emerald" as const },
                  { icon: Globe, name: "Traefik", detail: "Reverse proxy + routing", accent: "emerald" as const },
                ].map((item, i, arr) => (
                  <div key={item.name} className="flex items-center">
                    <DiagNode icon={item.icon} name={item.name} detail={item.detail} accent={item.accent} />
                    {i < arr.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-cyan-500/20 mx-1 hidden md:block" />}
                  </div>
                ))}
              </div>

              {/* Supporting services */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { icon: SiLetsencrypt, name: "cert-manager", detail: "Let's Encrypt TLS", accent: "emerald" as const },
                  { icon: Box, name: "Registry", detail: "OCI image store", accent: "emerald" as const },
                  { icon: MonitorDot, name: "Health Probes", detail: "TCP liveness + readiness", accent: "cyan" as const },
                  { icon: Shield, name: "Rolling Update", detail: "maxUnavailable=0, surge=1", accent: "cyan" as const },
                ].map((item) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/[0.015] border border-white/[0.03] hover:border-cyan-500/10 transition-colors"
                  >
                    <item.icon className={`w-3.5 h-3.5 flex-shrink-0 ${item.accent === "emerald" ? "text-emerald-500/60" : "text-cyan-500/60"}`} />
                    <div>
                      <p className="text-white text-[10px] font-medium">{item.name}</p>
                      <p className="text-zinc-700 text-[9px]">{item.detail}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Resource specs */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                {[
                  "Port: auto-detected",
                  "CPU: 100m–500m",
                  "Memory: 128Mi–512Mi",
                  "Replicas: 1",
                  "Namespace: isolated",
                ].map((spec) => (
                  <span key={spec} className="text-[9px] font-mono text-zinc-700 px-2 py-0.5 rounded bg-white/[0.02] border border-white/[0.03]">{spec}</span>
                ))}
              </div>
            </div>
          </DiagramLayer>

          <FlowConnector height={44} label="HTTPS" />

          {/* ── LAYER 6: Result ──────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex justify-center"
          >
            <div className="inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 shadow-lg shadow-emerald-500/5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-emerald-400 font-semibold text-sm">Live Application</p>
                <p className="text-emerald-500/50 font-mono text-xs">https://myapp.deploy.code2cloud.dev</p>
              </div>
              <span className="flex items-center gap-1.5 ml-3 text-[10px] text-emerald-500/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                running
              </span>
            </div>
          </motion.div>

          <div className="h-8" />

          {/* ── LAYER 7: Infrastructure ───────────────────────── */}
          <DiagramLayer label="Infrastructure" color="amber" delay={0.4}>
            <div className="pt-2">
              <div className="grid md:grid-cols-3 gap-4 items-start">
                <div className="space-y-2">
                  <DiagNode icon={SiTerraform} name="Terraform" detail="Infrastructure as Code" accent="amber" />
                  <div className="ml-12 space-y-0.5 text-[10px] text-zinc-600">
                    <div className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-amber-500/40" />compute.tf — ARM64 instance</div>
                    <div className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-amber-500/40" />network.tf — VCN + subnets</div>
                    <div className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-amber-500/40" />security.tf — firewall rules</div>
                    <div className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-amber-500/40" />budget.tf — cost alerts</div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-3 py-3">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10">
                      <HardDrive className="w-4 h-4 text-amber-400" />
                      <div className="text-left">
                        <p className="text-white text-xs font-medium">OCI ARM64</p>
                        <p className="text-zinc-600 text-[10px]">Single node — everything runs here</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 text-center">
                    {[
                      { value: "4", label: "OCPUs" },
                      { value: "24", label: "GB RAM" },
                      { value: "190", label: "GB Disk" },
                    ].map((s) => (
                      <div key={s.label}>
                        <p className="text-white text-lg font-bold">{s.value}</p>
                        <p className="text-zinc-700 text-[10px]">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <DiagNode icon={SiAnsible} name="Ansible" detail="Configuration Management" accent="amber" />
                  <div className="ml-12 space-y-0.5 text-[10px] text-zinc-600">
                    <div className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-amber-500/40" />K3s cluster bootstrap</div>
                    <div className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-amber-500/40" />BuildKit + Registry setup</div>
                    <div className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-amber-500/40" />Traefik + cert-manager</div>
                    <div className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-amber-500/40" />Redis + secrets injection</div>
                  </div>
                </div>
              </div>
            </div>
          </DiagramLayer>
        </div>

        {/* ── Data flow legend ── */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-5 mt-10 text-[10px] text-zinc-600"
        >
          {[
            { color: "bg-emerald-500", label: "TypeScript (Web + API)" },
            { color: "bg-cyan-500", label: "Go (Worker + K8s)" },
            { color: "bg-amber-500", label: "IaC (Terraform + Ansible)" },
            { color: "bg-red-500", label: "Data (Redis + PostgreSQL)" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${item.color}/40`} />
              {item.label}
            </div>
          ))}
        </motion.div>

        {/* ── Monorepo tree ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-20 max-w-3xl mx-auto">
          <h3 className="text-lg font-semibold text-white text-center mb-6">
            Repository Structure <span className="text-zinc-600">— Turborepo</span>
          </h3>
          <GlowCard className="p-6">
            <div className="font-mono text-[13px] space-y-0.5">
              <div className="text-zinc-600">Code2Cloud/</div>
              {[
                { indent: 1, text: "apps/", color: "text-zinc-400", icon: "├─" },
                { indent: 2, text: "web/", desc: "Next.js 16 · React 19 · Tailwind", color: "text-emerald-400", icon: "├─" },
                { indent: 2, text: "api/", desc: "NestJS · Prisma · GraphQL · BullMQ", color: "text-amber-400", icon: "├─" },
                { indent: 2, text: "worker/", desc: "Go · K8s client-go · BuildKit · Redis", color: "text-cyan-400", icon: "├─" },
                { indent: 2, text: "proxy/", desc: "Go · Reverse Proxy", color: "text-teal-400", icon: "├─" },
                { indent: 2, text: "infra/", desc: "Terraform · Ansible · K8s YAML", color: "text-orange-400", icon: "└─" },
                { indent: 1, text: "packages/", color: "text-zinc-400", icon: "├─" },
                { indent: 2, text: "ui/", desc: "Shared Components", color: "text-emerald-400/60", icon: "├─" },
                { indent: 2, text: "typescript-config/", desc: "Shared TSConfig", color: "text-zinc-600", icon: "├─" },
                { indent: 2, text: "eslint-config/", desc: "Shared Lint Rules", color: "text-zinc-600", icon: "└─" },
              ].map((item, i) => (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-1.5"
                  style={{ paddingLeft: `${item.indent * 20}px` }}
                >
                  <span className="text-zinc-700">{item.icon}</span>
                  <span className={item.color}>{item.text}</span>
                  {item.desc && <span className="text-zinc-700 text-xs ml-1">{item.desc}</span>}
                </motion.div>
              ))}
            </div>
          </GlowCard>
        </motion.div>
      </Section>

      {/* ══════════════════════════════════════════════════════
           TECH STACK
           ══════════════════════════════════════════════════════ */}
      <Section id="tech">
        <div className="text-center mb-16">
          <SectionLabel><Code2 className="w-3.5 h-3.5" /> Stack</SectionLabel>
          <SectionTitle className="text-center">Built With the Best</SectionTitle>
          <SectionDescription className="mx-auto text-center">Every tool chosen deliberately. TypeScript for safety, Go for speed, Terraform for reproducibility.</SectionDescription>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <TechBadge icon={SiNextdotjs} name="Next.js 16" category="Frontend" delay={0} />
          <TechBadge icon={SiReact} name="React 19" category="UI" delay={0.03} />
          <TechBadge icon={SiTailwindcss} name="Tailwind CSS" category="Styling" delay={0.06} />
          <TechBadge icon={SiTypescript} name="TypeScript 5.9" category="Language" delay={0.09} />
          <TechBadge icon={SiNestjs} name="NestJS 11" category="Backend" delay={0.12} />
          <TechBadge icon={SiGraphql} name="GraphQL" category="API Layer" delay={0.15} />
          <TechBadge icon={SiPrisma} name="Prisma 6" category="ORM" delay={0.18} />
          <TechBadge icon={SiPostgresql} name="PostgreSQL" category="Database" delay={0.21} />
          <TechBadge icon={SiGo} name="Go 1.23" category="Worker" delay={0.24} />
          <TechBadge icon={SiRedis} name="Redis 7" category="Queue" delay={0.27} />
          <TechBadge icon={SiKubernetes} name="Kubernetes" category="Orchestration" delay={0.3} />
          <TechBadge icon={SiDocker} name="BuildKit" category="Builder" delay={0.33} />
          <TechBadge icon={SiTerraform} name="Terraform" category="IaC" delay={0.36} />
          <TechBadge icon={SiAnsible} name="Ansible" category="Config" delay={0.39} />
          <TechBadge icon={SiGithub} name="GitHub App" category="Git" delay={0.42} />
          <TechBadge icon={SiLetsencrypt} name="Let's Encrypt" category="TLS" delay={0.45} />
        </div>

        {/* Why polyglot */}
        <div className="mt-16 grid md:grid-cols-3 gap-4">
          {[
            { icon: SiTypescript, lang: "TypeScript", color: "emerald" as const, desc: "Type-safe APIs with NestJS decorators & DI. Prisma for type-safe DB. Shared monorepo configs via Turborepo.", tags: ["Next.js", "NestJS", "Prisma", "React", "GraphQL"] },
            { icon: SiGo, lang: "Go", color: "cyan" as const, desc: "Goroutines for concurrent pipelines. Native K8s client-go for in-cluster orchestration. Minimal memory footprint.", tags: ["Goroutines", "client-go", "Redis", "BuildKit", "Zap"] },
            { icon: SiTerraform, lang: "Infrastructure as Code", color: "amber" as const, desc: "Terraform provisions OCI ARM64 compute + networking. Ansible bootstraps K3s + BuildKit. K8s YAML defines the stack.", tags: ["Terraform", "Ansible", "K8s YAML", "OCI ARM64", "Traefik"] },
          ].map((item, i) => {
            const tagColors = { emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/10", cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/10", amber: "bg-amber-500/10 text-amber-400 border-amber-500/10" };
            const iconColors = { emerald: "text-emerald-400", cyan: "text-cyan-400", amber: "text-amber-400" };
            return (
              <motion.div key={item.lang} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <GlowCard className="p-6 h-full">
                  <div className="flex items-center gap-2 mb-3">
                    <item.icon className={`w-5 h-5 ${iconColors[item.color]}`} />
                    <h4 className="text-white font-semibold">{item.lang}</h4>
                  </div>
                  <p className="text-zinc-500 text-sm leading-relaxed mb-4">{item.desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((t) => (
                      <span key={t} className={`text-[10px] px-2 py-0.5 rounded-md border ${tagColors[item.color]}`}>{t}</span>
                    ))}
                  </div>
                </GlowCard>
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════
           INFRA + DATA MODEL
           ══════════════════════════════════════════════════════ */}
      <Section>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <SectionLabel><Server className="w-3.5 h-3.5" /> Infrastructure</SectionLabel>
            <h3 className="text-2xl font-bold text-white mb-3">Single ARM64 Node</h3>
            <p className="text-zinc-500 text-sm mb-6 leading-relaxed">Everything runs on one OCI instance — API, frontend, worker, K3s, BuildKit, registry, Redis.</p>
            <GlowCard className="p-6">
              <div className="grid grid-cols-3 gap-4 mb-5">
                {[
                  { icon: Cpu, val: "4", label: "OCPUs" },
                  { icon: MemoryStick, val: "24", label: "GB RAM" },
                  { icon: HardDrive, val: "190", label: "GB Disk" },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <s.icon className="w-4 h-4 text-emerald-400 mx-auto mb-1.5" />
                    <div className="text-xl font-bold text-white">{s.val}</div>
                    <p className="text-zinc-600 text-[10px] mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {["K3s", "Traefik", "BuildKit", "Registry", "Redis 7", "cert-manager"].map((s) => (
                  <span key={s} className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.03] text-zinc-500 border border-white/[0.04]">{s}</span>
                ))}
              </div>
            </GlowCard>
          </div>

          <div>
            <SectionLabel><Database className="w-3.5 h-3.5" /> Data</SectionLabel>
            <h3 className="text-2xl font-bold text-white mb-3">Prisma Schema</h3>
            <p className="text-zinc-500 text-sm mb-6 leading-relaxed">Type-safe PostgreSQL access. 8 models covering users, projects, deployments, domains, and logs.</p>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { name: "User", icon: "👤", desc: "Auth · Git Accounts" },
                { name: "Project", icon: "📁", desc: "Git · Build Config" },
                { name: "Deployment", icon: "🚀", desc: "Status · Logs · Specs" },
                { name: "Domain", icon: "🌐", desc: "DNS · TLS · Verify" },
                { name: "GitAccount", icon: "🔗", desc: "Tokens · Install ID" },
                { name: "EnvVariable", icon: "🔑", desc: "Per-Environment" },
                { name: "LogEntry", icon: "📋", desc: "Build · Runtime" },
                { name: "SystemConfig", icon: "⚙️", desc: "TTL · Retention" },
              ].map((m, i) => (
                <motion.div key={m.name} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }} className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-900/50 border border-white/[0.04] hover:border-emerald-500/10 transition-colors">
                  <span className="text-base">{m.icon}</span>
                  <div>
                    <p className="text-white text-xs font-medium">{m.name}</p>
                    <p className="text-zinc-600 text-[10px]">{m.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════
           DEPLOYMENT LIFECYCLE
           ══════════════════════════════════════════════════════ */}
      <Section>
        <div className="text-center mb-10">
          <SectionLabel><Rocket className="w-3.5 h-3.5" /> Lifecycle</SectionLabel>
          <SectionTitle className="text-center">Every State, Tracked</SectionTitle>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-2.5 max-w-3xl mx-auto">
          {[
            { status: "QUEUED", color: "text-zinc-400", bg: "bg-zinc-800/50", border: "border-zinc-700/30", icon: Loader2 },
            { status: "BUILDING", color: "text-amber-400", bg: "bg-amber-500/8", border: "border-amber-500/15", icon: Container },
            { status: "DEPLOYING", color: "text-cyan-400", bg: "bg-cyan-500/8", border: "border-cyan-500/15", icon: Server },
            { status: "READY", color: "text-emerald-400", bg: "bg-emerald-500/8", border: "border-emerald-500/15", icon: CheckCircle2 },
            { status: "FAILED", color: "text-red-400", bg: "bg-red-500/8", border: "border-red-500/15", icon: XCircle },
            { status: "CANCELED", color: "text-orange-400", bg: "bg-orange-500/8", border: "border-orange-500/15", icon: XCircle },
            { status: "EXPIRED", color: "text-zinc-600", bg: "bg-zinc-800/50", border: "border-zinc-700/30", icon: Clock },
          ].map((s, i) => (
            <motion.div key={s.status} initial={{ opacity: 0, scale: 0.85 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg ${s.bg} ${s.border} border`}>
                <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                <span className={`text-xs font-mono font-medium ${s.color}`}>{s.status}</span>
              </div>
              {i < 3 && <ChevronRight className="w-3.5 h-3.5 text-zinc-700 hidden md:block" />}
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════
        CTA
        ══════════════════════════════════════════════════════ */}
      <Section>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center max-w-2xl mx-auto">
          <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-8">
            <Rocket className="w-8 h-8 text-emerald-400" />
          </motion.div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Ready to deploy?</h2>
          <p className="text-zinc-400 text-lg mb-10 leading-relaxed">Connect GitHub. Push code. The Go worker handles the rest.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/dashboard" className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl font-medium text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20 hover:shadow-emerald-500/30 text-base">
              Get Started Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-medium text-zinc-400 bg-white/[0.03] border border-white/[0.06] hover:border-emerald-500/20 hover:bg-emerald-500/[0.04] transition-all text-base">
              <SiGithub className="w-5 h-5" />
              View Source
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </motion.div>
      </Section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.04] py-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                <Cloud className="w-3 h-3 text-emerald-400" />
              </div>
              <span className="font-semibold text-sm text-white">
                Code<span className="text-emerald-400">2</span>Cloud
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-zinc-600">
              <span>TypeScript + Go + Terraform</span>
              <span>&middot;</span>
              <span>Polyglot Monorepo</span>
              <span>&middot;</span>
              <span>Built with ❤️</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
