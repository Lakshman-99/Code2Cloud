/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, Cpu, AlertTriangle, 
  Slack, Globe, Save, Mail, Clock, Server, Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SystemConfig } from "@/types/auth";
import { useSettings } from "@/hooks/use-settings";
import { SettingsSkeleton } from "@/components/ui/skeleton";

// --- CONFIGURATION TABS ---
const tabs = [
  { id: "general", label: "Global Defaults", icon: Globe },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "deployments", label: "Lifecycle & Cost", icon: Cpu },
];

const ttlOptions = [
  { value: 5, label: "5 Minutes", desc: "Maximum Savings" },
  { value: 15, label: "15 Minutes", desc: "Standard Demo" },
  { value: 30, label: "30 Minutes", desc: "Long Review" },
  { value: 60, label: "1 Hour", desc: "Workshop Mode" },
];

const regions = [
  { value: "us-east-1", label: "US East (N. Virginia)", flag: "🇺🇸" },
  { value: "eu-west-1", label: "EU West (Ireland)", flag: "🇪🇺" },
  { value: "ap-south-1", label: "Asia Pacific (Mumbai)", flag: "🇮🇳" },
];

export default function Settings() {
  const { settings: serverSettings, updateSettings, isLoading } = useSettings();
  
  const [localSettings, setLocalSettings] = useState<SystemConfig | null>(null);
  const [activeTab, setActiveTab] = useState("general");
  const [isDirty, setIsDirty] = useState(false);

  // 3. Sync Server Data to Local State on Load
  if (!localSettings && serverSettings) {
    setLocalSettings(serverSettings);
  }

  // Loading State
  if (isLoading || !localSettings) {
      return <SettingsSkeleton />;
  }

  const handleToggle = (key: keyof SystemConfig) => {
    setLocalSettings(prev => prev ? ({ ...prev, [key]: !prev[key] }) : null);
    setIsDirty(true);
  };

  const handleChange = (key: keyof SystemConfig, value: any) => {
    // Convert strings to numbers for numeric fields
    if (['maxConcurrentBuilds', 'logRetentionDays', 'globalTTLMinutes'].includes(key)) {
        value = Number(value);
    }
    setLocalSettings(prev => prev ? ({ ...prev, [key]: value }) : null);
    setIsDirty(true);
  };

  const saveSettings = async () => {
    if (!localSettings) return;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { updatedAt, ...cleanPayload } = localSettings;

    try {
      await updateSettings(cleanPayload);
      setIsDirty(false);
      toast.success("Settings saved successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen space-y-8">
      
      {/* --- HEADER --- */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">System Configuration</h1>
          <p className="text-muted-foreground">Manage global resource limits, regions, and lifecycle policies.</p>
        </div>
        
        {/* Contextual Save Button */}
        <AnimatePresence>
          {isDirty && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <Button onClick={saveSettings} className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <Save className="w-4 h-4" /> Save Changes
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* --- SIDEBAR NAVIGATION --- */}
        <div className="lg:col-span-1 space-y-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium relative overflow-hidden group",
                  isActive 
                    ? "text-white bg-white/10 shadow-inner" 
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="active-setting-tab"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-primary"
                  />
                )}
                <Icon className={cn("w-4 h-4 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-white")} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* --- MAIN CONTENT AREA --- */}
        <div className="lg:col-span-3 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              
              {/* 1. GENERAL (REGION & RESOURCES) */}
              {activeTab === "general" && (
                <div className="space-y-6">
                  <section className="glass-card p-6 rounded-xl border border-white/10">
                    <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                      <Globe className="w-5 h-5 text-blue-400" /> Compute & Region
                    </h3>
                    
                    <div className="grid gap-6">
                      {/* Region Selector */}
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-white">Default Deployment Region</label>
                        <Select value={localSettings.defaultRegion} onValueChange={(val) => handleChange("defaultRegion", val)}>
                          <SelectTrigger className="w-[230px] bg-black/40 border-white/10 h-12">
                            <SelectValue placeholder="Select Region" />
                          </SelectTrigger>
                          <SelectContent position="popper" side="bottom" sideOffset={4} avoidCollisions={false} className="bg-[#0a0a0a] border-white/10">
                            {regions.map((region) => (
                              <SelectItem key={region.value} value={region.value}>
                                <span className="mr-2">{region.flag}</span> {region.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">New projects will default to this region unless specified otherwise.</p>
                      </div>

                      <div className="h-px bg-white/5" />

                      {/* Resource Limits */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <label className="text-sm font-medium text-white flex items-center gap-2">
                            <Server className="w-4 h-4 text-purple-400" /> Concurrent Builds
                          </label>
                          <Select value={localSettings.maxConcurrentBuilds.toString()} onValueChange={(val) => handleChange("maxConcurrentBuilds", val)}>
                            <SelectTrigger className="w-[230px] bg-black/40 border-white/10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent position="popper" side="bottom" sideOffset={4} avoidCollisions={false} className="bg-[#0a0a0a] border-white/10">
                              <SelectItem value="1">1 Concurrent Build</SelectItem>
                              <SelectItem value="2">2 Concurrent Builds</SelectItem>
                              <SelectItem value="5">5 Concurrent Builds (Pro)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-3">
                          <label className="text-sm font-medium text-white flex items-center gap-2">
                            <Database className="w-4 h-4 text-amber-400" /> Log Retention
                          </label>
                          <Select value={localSettings.logRetentionDays.toString()} onValueChange={(val) => handleChange("logRetentionDays", val)}>
                            <SelectTrigger className="w-[230px] bg-black/40 border-white/10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent position="popper" side="bottom" sideOffset={4} avoidCollisions={false} className="bg-[#0a0a0a] border-white/10">
                              <SelectItem value="1">1 Day (Cost Saving)</SelectItem>
                              <SelectItem value="3">3 Days</SelectItem>
                              <SelectItem value="7">7 Days</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {/* 2. NOTIFICATIONS */}
              {activeTab === "notifications" && (
                <div className="space-y-6">
                  {/* Email Section */}
                  <section className="glass-card p-6 rounded-xl border border-white/10">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Mail className="w-5 h-5 text-emerald-400" /> Email Alerts
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Deployment Failed</span>
                          <Switch checked={localSettings.emailDeployFailed} onCheckedChange={() => handleToggle("emailDeployFailed")} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Successful Deployment</span>
                          <Switch checked={localSettings.emailDeploySuccess} onCheckedChange={() => handleToggle("emailDeploySuccess")} />
                        </div>
                    </div>
                  </section>

                  {/* Slack Section */}
                  <section className="glass-card p-6 rounded-xl border border-white/10">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Slack className="w-5 h-5 text-purple-400" /> Slack Integration
                    </h3>
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-foreground">Webhook URL</label>
                        <div className="flex gap-2">
                          <Input 
                            placeholder="https://hooks.slack.com/services/..." 
                            className="bg-black/40 border-white/10 focus:border-purple-500/50"
                            value={localSettings.slackWebhook}
                            onChange={(e) => handleChange("slackWebhook", e.target.value)}
                          />
                          <Button variant="outline" className="border-white/10 bg-white/5">Test</Button>
                        </div>
                        <p className="text-xs text-muted-foreground">We&apos;ll send pipeline alerts to this channel.</p>
                    </div>
                  </section>
                </div>
              )}

              {/* 3. DEPLOYMENTS (LIFECYCLE) */}
              {activeTab === "deployments" && (
                <div className="space-y-6">
                  <section className="glass-card p-6 rounded-xl border border-white/10">
                    <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-red-400" /> Lifecycle & Cost Control
                    </h3>
                    
                    {/* GLOBAL TTL SECTION */}
                    <div className="mb-8 p-5 rounded-xl bg-red-500/5 border border-red-500/20">
                      <div className="flex items-center gap-2 mb-4">
                        <Clock className="w-5 h-5 text-red-400" />
                        <span className="text-base font-bold text-white">Global Auto-Destruct (TTL)</span>
                        <Badge variant="outline" className="text-[10px] text-red-400 border-red-400/20 bg-red-400/10">ACTIVE</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-6">
                        To manage costs, <strong>ALL</strong> deployments (Production & Preview) will be permanently destroyed after this duration.
                      </p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {ttlOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleChange("globalTTLMinutes", option.value)}
                            className={cn(
                              "flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 relative overflow-hidden",
                              localSettings.globalTTLMinutes === option.value
                                ? "bg-red-500/20 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                                : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:border-white/20"
                            )}
                          >
                            <span className="text-lg font-bold">{option.label}</span>
                            <span className="text-[10px] opacity-70 mt-1">{option.desc}</span>
                            {localSettings.globalTTLMinutes === option.value && (
                                <motion.div layoutId="activeTTL" className="absolute inset-0 border-2 border-red-500 rounded-xl" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="h-px bg-white/5 my-6" />

                    {/* Standard Settings */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5">
                        <div>
                          <p className="text-sm font-medium text-white">Auto-Deploy &apos;main&apos;</p>
                          <p className="text-xs text-muted-foreground">Trigger deployment when code is pushed.</p>
                        </div>
                        <Switch checked={localSettings.autoDeploy} onCheckedChange={() => handleToggle("autoDeploy")} />
                      </div>
                    </div>
                  </section>

                  {/* Danger Zone */}
                  <section className="glass-card p-6 rounded-xl border border-red-500/20 bg-red-500/5">
                    <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" /> Danger Zone
                    </h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">Purge All Resources</p>
                        <p className="text-xs text-red-300/70">Immediately destroy all active containers and volumes.</p>
                      </div>
                      <Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-white">Purge Now</Button>
                    </div>
                  </section>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}