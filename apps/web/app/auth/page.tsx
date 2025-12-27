/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
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
import { Rocket, Mail, Lock, User, Loader2, Eye, EyeOff } from "lucide-react";
import { signInSchema, signUpSchema } from "@/lib/validation/auth";
import { tokenManager } from "@/lib/token-manager";

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
    const toastId = toast.loading(isLogin ? "Signing you in..." : "Creating account...");
    setLoading(true);

    try {
      if (isLogin) {
        // Login Flow
        const res = await api.post<AuthResponse>("/auth/signin", data, { skipAuth: true });
        
        // Let TokenManager handle storage (Memory + LocalStorage)
        tokenManager.setTokens(res);
        
        toast.success("Welcome back!", { id: toastId });
      } else {
        // Signup Flow
        const res = await api.post<AuthResponse>("/auth/signup", data, { skipAuth: true });
        
        // Auto-login on signup (since your backend returns tokens now!)
        tokenManager.setTokens(res);
        
        toast.success("Account created!", { id: toastId });
      }

      router.push("/dashboard"); 
      router.refresh();
    } catch (error: any) {
      console.error("Auth error:", error);
      toast.error(error.message || "Something went wrong", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full bg-primary/10 blur-[100px]"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{ top: "-20%", left: "-10%" }}
        />
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full bg-accent/10 blur-[100px]"
          animate={{
            x: [0, -80, 0],
            y: [0, 80, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          style={{ bottom: "-10%", right: "-5%" }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo and title */}
        <div className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent mb-4"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Rocket className="w-8 h-8 text-primary-foreground" />
          </motion.div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Code2Cloud
          </h1>
          <p className="text-muted-foreground">
            {isLogin ? "Welcome back, deployer" : "Join the future of DevOps"}
          </p>
        </div>

        {/* Auth card */}
        <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-8 shadow-2xl">
          {/* OAuth buttons */}
          <div className="space-y-3 mb-6">
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 bg-background/50 border-border/50 hover:bg-accent/10 hover:border-accent/50 transition-all duration-300"
              disabled={loading}
              onClick={() => window.location.href = "http://localhost:3001/auth/google"}
            >
              <FaGoogle />
              Continue with Google
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12 bg-background/50 border-border/50 hover:bg-accent/10 hover:border-accent/50 transition-all duration-300"
              disabled={loading}
              onClick={() => window.location.href = "http://localhost:3001/auth/github"}
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
              <span className="px-3 bg-card/50 text-muted-foreground">
                or continue with email
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
                >
                  <Label
                    htmlFor="name"
                    className="text-sm text-muted-foreground"
                  >
                    Full Name
                  </Label>
                  <div className="relative mt-1.5">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      {...register("name")}
                      className="pl-10 h-12 bg-background/50 border-border/50 focus:border-primary/50"
                    />
                  </div>
                  {errors.name?.message && (
                    <p className="text-xs text-destructive mt-1">
                      {String(errors.name.message)}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <Label htmlFor="email" className="text-sm text-muted-foreground">
                Email
              </Label>
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
              <Label
                htmlFor="password"
                className="text-sm text-muted-foreground"
              >
                Password
              </Label>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      {...register("password")}
                      className="pl-10 pr-10 h-12 bg-background/50 border-border/50 focus:border-primary/50"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
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
              className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-primary-foreground font-medium"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isLogin ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          {/* Toggle login/signup */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
              }}
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </div>
  );
};

export default AuthPage;
