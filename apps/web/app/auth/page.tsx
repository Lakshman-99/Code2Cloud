/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import Image from "next/image"; // Import Next Image
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { AuthResponse } from "@/types/auth";
import { FaGoogle, FaGithub } from "react-icons/fa";
import { Mail, Lock, User, Loader2, Eye, EyeOff } from "lucide-react";
import { signInSchema, signUpSchema } from "@/lib/validation/auth";
import { tokenManager } from "@/lib/token-manager";
import { CosmicBackground } from "@/components/layout/CosmicBackground";
import { urlConfig } from "@/lib/url-config";
import { cn } from "@/lib/utils"; // Import cn

const AuthPage = () => {
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(isLogin ? signInSchema : signUpSchema),
    defaultValues: { email: "siva.l@northeastern.edu", password: "Code@2024", name: "" },
  });

  const onSubmit = async (data: any) => {
    const toastId = toast.loading(isLogin ? "Authenticating credentials..." : "Initializing new account...");
    setLoading(true);

    try {
      if (isLogin) {
        // Login Flow
        const res = await api.post<AuthResponse>("/auth/signin", data, { skipAuth: true });
        tokenManager.setTokens(res);
        toast.success("Welcome back!", { id: toastId });
      } else {
        // Signup Flow
        const res = await api.post<AuthResponse>("/auth/signup", data, { skipAuth: true });
        tokenManager.setTokens(res);
        toast.success("Welcome aboard!", { id: toastId });
      }

      router.push("/dashboard"); 
      router.refresh();
    } catch (error: any) {
      console.error("Auth error:", error);
      toast.error(error.message || "Authentication Failed", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <CosmicBackground />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* --- BRANDING HEADER --- */}
        <div className="text-center mb-8 flex flex-col items-center">
          {/* Glowing Logo */}
          <motion.div
            className="mb-4 relative"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            {/* Glow Effect behind logo */}
            <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full" />
            
            <Image
              src="/logo_c2c.png"
              alt="Code2Cloud"
              width={80} // Bigger size for Auth Page
              height={80}
              priority
              className={cn(
                "relative z-10 object-contain",
                // The Signature Reactor Glow
                "filter invert-[1] brightness-[1.5]", 
                "drop-shadow-[0_0_15px_rgba(52,211,153,0.6)]"
              )}
            />
          </motion.div>

          {/* Gradient Text */}
          <h1 className="text-4xl font-bold mb-2 tracking-tight bg-gradient-to-r from-white via-teal-300 to-emerald-400 bg-clip-text text-transparent">
            Code2Cloud
          </h1>
          
          <p className="text-muted-foreground text-sm uppercase tracking-widest font-medium">
            {isLogin ? "Welcome back, deployer" : "Join the future of DevOps"}
          </p>
        </div>

        {/* Auth card */}
        <div className="glass backdrop-blur-xl border border-border/50 rounded-2xl p-8 shadow-2xl">
          {/* OAuth buttons */}
          <div className="space-y-3 mb-6">
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 bg-background/50 border-border/50 hover:bg-accent/10 hover:border-accent/50 transition-all duration-300 gap-2"
              disabled={loading}
              onClick={() => window.location.href = `${urlConfig.apiUrl}/auth/google`}
            >
              <FaGoogle />
              Continue with Google
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12 bg-background/50 border-border/50 hover:bg-accent/10 hover:border-accent/50 transition-all duration-300 gap-2"
              disabled={loading}
              onClick={() => window.location.href = `${urlConfig.apiUrl}/auth/github`}
            >
              <FaGithub />
              Continue with GitHub
            </Button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-black/40 backdrop-blur-xl text-muted-foreground rounded-full border border-white/5">
                or use secure credentials
              </span>
            </div>
          </div>

          {/* Email/Password form */}
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <Label htmlFor="name" className="text-sm text-muted-foreground">Full Name</Label>
                  <div className="relative mt-1.5">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      {...register("name")}
                      className="pl-10 h-12 bg-background/50 border-border/50 focus:border-emerald-500/50 transition-all"
                    />
                  </div>
                  {errors.name?.message && (
                    <p className="text-xs text-destructive mt-1">{String(errors.name.message)}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <Label htmlFor="email" className="text-sm text-muted-foreground">Email</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...register("email")}
                  className="pl-10 h-12 bg-background/50 border-border/50 focus:border-primary/50"
                />
              </div>
              {errors.email?.message && (
                <p className="text-xs text-destructive mt-1">{String(errors.email.message)}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password" className="text-sm text-muted-foreground">Password</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  className="pl-10 pr-10 h-12 bg-background/50 border-border/50 focus:border-emerald-500/50 transition-all"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password?.message && (
                <p className="text-xs text-destructive mt-1">{String(errors.password.message)}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-medium shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all duration-300"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isLogin ? (
                "Access Console"
              ) : (
                "Initialize Account"
              )}
            </Button>
          </form>

          {/* Toggle login/signup */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            {isLogin ? "First time deploying?" : "Already initialized?"}{" "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              {isLogin ? "Create credentials" : "Log in"}
            </button>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6 opacity-50">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </div>
  );
};

export default AuthPage;