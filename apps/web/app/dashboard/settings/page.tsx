"use client";

import { motion } from "framer-motion";
import { User, Bell, Shield, Globe, Palette, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const settingsSections = [
  {
    icon: User,
    title: "Profile",
    description: "Manage your account details",
    gradient: "from-blue-500/20 to-indigo-500/20",
    iconColor: "text-blue-400",
  },
  {
    icon: Bell,
    title: "Notifications",
    description: "Configure notification preferences",
    gradient: "from-amber-500/20 to-orange-500/20",
    iconColor: "text-amber-400",
  },
  {
    icon: Shield,
    title: "Security",
    description: "Security and authentication settings",
    gradient: "from-emerald-500/20 to-teal-500/20",
    iconColor: "text-emerald-400",
  },
  {
    icon: Globe,
    title: "Domains",
    description: "Manage custom domains",
    gradient: "from-purple-500/20 to-pink-500/20",
    iconColor: "text-purple-400",
  },
];

const Settings = () => {
  return (
    <div className="p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and preferences
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className="space-y-2">
          {settingsSections.map((section, index) => (
            <motion.button
              key={section.title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "w-full flex items-center gap-3 p-4 rounded-xl transition-all text-left",
                index === 0 ? "glass-card glow-border" : "hover:bg-white/5",
              )}
            >
              <div
                className={`w-10 h-10 rounded-lg bg-gradient-to-br ${section.gradient} flex items-center justify-center`}
              >
                <section.icon className={`w-5 h-5 ${section.iconColor}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {section.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {section.description}
                </p>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Profile Section */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6">
              Profile Information
            </h3>

            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl font-bold text-primary-foreground">
                JD
              </div>
              <div>
                <p className="text-foreground font-medium">John Doe</p>
                <p className="text-sm text-muted-foreground">john@acme.dev</p>
                <Button variant="outline" size="sm" className="mt-2">
                  Change Avatar
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Full Name
                </label>
                <Input
                  defaultValue="John Doe"
                  className="bg-card/50 border-white/5"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Email
                </label>
                <Input
                  defaultValue="john@acme.dev"
                  className="bg-card/50 border-white/5"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Username
                </label>
                <Input
                  defaultValue="johndoe"
                  className="bg-card/50 border-white/5"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Company
                </label>
                <Input
                  defaultValue="Acme Corp"
                  className="bg-card/50 border-white/5"
                />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6">
              Preferences
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Email Notifications
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Receive deployment updates via email
                    </p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                <div className="flex items-center gap-3">
                  <Code className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Auto Deploy
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Deploy automatically on git push
                    </p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                <div className="flex items-center gap-3">
                  <Palette className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Compact Mode
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Reduce spacing in the interface
                    </p>
                  </div>
                </div>
                <Switch />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
              Save Changes
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;
