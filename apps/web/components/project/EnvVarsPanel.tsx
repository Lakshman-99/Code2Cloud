"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Eye, EyeOff, Plus, Trash2, Shield, Upload, FileText, 
  Globe, Check, AlertCircle, Save, X, RefreshCw, Copy, RotateCcw,
  Loader2
} from "lucide-react";
import { useMockStore } from "@/stores/useMockStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// --- TYPES ---
type Environment = "production" | "preview" | "development";

interface EnvVar {
  id: string;
  key: string;
  value: string;
  environments: Environment[];
  isNew?: boolean; 
  isDeleted?: boolean;
}

interface Domain {
  id: string;
  name: string;
  status: "active" | "pending" | "error" | "verifying";
  type: "production" | "preview";
  dnsRecords?: { type: string; name: string; value: string }[];
}

export const EnvVarsPanel = () => {
  const { envVars: initialEnvVars } = useMockStore();
  
  // --- STATE ---
  const [envVars, setEnvVars] = useState<EnvVar[]>(initialEnvVars);
  const [isEnvDirty, setIsEnvDirty] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  
  const [domains, setDomains] = useState<Domain[]>([
    { id: "1", name: "app.code2cloud.dev", status: "active", type: "production" }
  ]);
  const [newDomain, setNewDomain] = useState("");
  const [isAddingDomain, setIsAddingDomain] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- ACTIONS: ENV VARS ---

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEnvChange = (id: string, field: keyof EnvVar, value: any) => {
    setEnvVars(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
    setIsEnvDirty(true);
  };

  const toggleEnv = (id: string, env: Environment) => {
    setEnvVars(prev => prev.map(v => {
      if (v.id !== id) return v;
      const nextEnvs = v.environments.includes(env)
        ? v.environments.filter(e => e !== env)
        : [...v.environments, env];
      return { ...v, environments: nextEnvs };
    }));
    setIsEnvDirty(true);
  };

  const addEmptyVar = () => {
    const newVar: EnvVar = {
      id: Math.random().toString(36).substr(2, 9),
      key: "",
      value: "",
      environments: ["production", "preview", "development"],
      isNew: true
    };
    // Add to TOP of list
    setEnvVars([newVar, ...envVars]);
    setIsEnvDirty(true);
  };

  const removeVar = (id: string) => {
    const varToDelete = envVars.find(v => v.id === id);
    if (!varToDelete) return;

    // Optimistic delete
    setEnvVars(prev => prev.filter(v => v.id !== id));
    setIsEnvDirty(true);

    // Toast with Undo capability
    toast("Variable deleted", {
      action: {
        label: "Undo",
        onClick: () => {
          setEnvVars(prev => [varToDelete, ...prev]);
        }
      }
    });
  };

  // --- FILE UPLOAD (BULK IMPORT) ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n");
      const newVars: EnvVar[] = [];

      lines.forEach(line => {
        // Regex to match KEY=VALUE, handling quotes and comments
        const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || "";
          // Remove surrounding quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          
          newVars.push({
            id: Math.random().toString(36).substr(2, 9),
            key: key,
            value: value,
            environments: ["production", "preview", "development"],
            isNew: true
          });
        }
      });

      if (newVars.length > 0) {
        setEnvVars(prev => [...newVars, ...prev]);
        setIsEnvDirty(true);
        toast.success(`Imported ${newVars.length} variables`);
      } else {
        toast.error("No valid variables found in file");
      }
      
      // Reset input so same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const saveEnvChanges = () => {
    const invalid = envVars.find(v => !v.key.trim());
    if (invalid) {
      toast.error("Invalid Configuration", { description: "All variables must have a key." });
      return;
    }

    setIsEnvDirty(false);
    setEnvVars(prev => prev.map(v => ({ ...v, isNew: undefined })));
    
    toast.success("Environment Variables Saved", {
      description: "Changes will apply to the next deployment.",
      icon: <Check className="w-4 h-4 text-emerald-500" />
    });
  };

  const discardChanges = () => {
    setEnvVars(initialEnvVars);
    setIsEnvDirty(false);
    toast.info("Changes discarded");
  };

  // --- ACTIONS: DOMAINS ---

  const handleAddDomain = () => {
    if (!newDomain.includes(".")) {
      toast.error("Invalid Domain", { description: "Please enter a valid domain name (e.g. example.com)" });
      return;
    }

    const domain: Domain = {
      id: Math.random().toString(),
      name: newDomain,
      status: "pending",
      type: "production",
      dnsRecords: [
        { type: "A", name: "@", value: "76.76.21.21" },
        { type: "CNAME", name: "www", value: "cname.code2cloud.dev" }
      ]
    };

    setDomains([...domains, domain]);
    setNewDomain("");
    setIsAddingDomain(false);
    toast.success("Domain Added", { description: "Please configure your DNS records." });
  };

  const verifyDomain = (id: string) => {
    setDomains(prev => prev.map(d => d.id === id ? { ...d, status: "verifying" } : d));
    
    setTimeout(() => {
      setDomains(prev => prev.map(d => d.id === id ? { ...d, status: "active" } : d));
      toast.success("Domain Verified", { description: "Traffic is now routing to this project." });
    }, 2000);
  };

  const deleteDomain = (id: string) => {
    setDomains(prev => prev.filter(d => d.id !== id));
    toast.success("Domain Removed");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-12 pb-20">
      
      {/* --- SECTION 1: ENVIRONMENT VARIABLES --- */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" />
              Environment Variables
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Encrypted secrets and configuration for your application.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
             {/* Hidden File Input */}
             <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".env,text/plain" 
                onChange={handleFileUpload} 
             />

             {isEnvDirty ? (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={discardChanges} className="text-muted-foreground hover:text-red-400">
                    <RotateCcw className="w-4 h-4 mr-2" /> Discard
                  </Button>
                  <Button onClick={saveEnvChanges} className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2 shadow-lg shadow-emerald-500/20">
                    <Save className="w-4 h-4" /> Save Changes
                  </Button>
                </div>
            ) : (
                <>
                  <Button variant="outline" size="sm" className="gap-2 border-white/10 bg-white/5 hover:bg-white/10" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4" /> Import .env
                  </Button>
                  <Button size="sm" className="gap-2 bg-primary text-primary-foreground hover:opacity-90" onClick={addEmptyVar}>
                    <Plus className="w-4 h-4" /> Add Variable
                  </Button>
                </>
            )}
          </div>
        </div>

        {/* Variables Table Card */}
        <div className="glass-card rounded-xl overflow-hidden border border-white/10 ">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[35%]">Key</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[35%]">Value</th>
                  <th className="text-center px-2 py-3 text-xs font-semibold text-muted-foreground uppercase w-[20%]">Environments</th>
                  <th className="w-[10%]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <AnimatePresence initial={false}>
                  {envVars.map((envVar) => (
                    <motion.tr
                      key={envVar.id}
                      initial={{ opacity: 0, height: 0, backgroundColor: "rgba(59, 130, 246, 0.1)" }}
                      animate={{ opacity: 1, height: "auto", backgroundColor: "rgba(0,0,0,0)" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="group hover:bg-white/5 transition-colors"
                    >
                      <td className="px-4 py-3 align-top">
                        <Input 
                          value={envVar.key} 
                          onChange={(e) => handleEnvChange(envVar.id, 'key', e.target.value)}
                          placeholder="EXAMPLE_KEY"
                          className={cn(
                            "font-mono text-sm bg-transparent border-transparent hover:border-white/10 focus:border-primary/50 focus:bg-black/20 h-9 transition-all",
                            !envVar.key && "border-red-500/30 bg-red-500/5 placeholder:text-red-500/50"
                          )}
                        />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="relative">
                          <Input 
                            type={visibleKeys.has(envVar.id) ? "text" : "password"}
                            value={envVar.value} 
                            onChange={(e) => handleEnvChange(envVar.id, 'value', e.target.value)}
                            placeholder="Value..."
                            className="font-mono text-sm bg-transparent border-transparent hover:border-white/10 focus:border-primary/50 focus:bg-black/20 h-9 pr-8 transition-all"
                          />
                          <button 
                            onClick={() => {
                              setVisibleKeys(prev => {
                                const next = new Set(prev);
                                if (next.has(envVar.id)) {
                                  next.delete(envVar.id);
                                } else {
                                  next.add(envVar.id);
                                }
                                return next;
                              });
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 p-1"
                          >
                            {visibleKeys.has(envVar.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-3 pt-2">
                          <EnvCheckbox 
                            label="Prod" 
                            checked={envVar.environments.includes('production')} 
                            onChange={() => toggleEnv(envVar.id, 'production')}
                            activeColor="bg-emerald-500"
                          />
                          <EnvCheckbox 
                            label="Prev" 
                            checked={envVar.environments.includes('preview')} 
                            onChange={() => toggleEnv(envVar.id, 'preview')}
                            activeColor="bg-blue-500"
                          />
                          <EnvCheckbox 
                            label="Dev" 
                            checked={envVar.environments.includes('development')} 
                            onChange={() => toggleEnv(envVar.id, 'development')}
                            activeColor="bg-yellow-500"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => removeVar(envVar.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            
            {envVars.length === 0 && (
              <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
                <FileText className="w-10 h-10 mb-3 opacity-20" />
                <p>No variables configured</p>
                <Button variant="link" onClick={addEmptyVar} className="text-primary mt-1">Add your first variable</Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- SECTION 2: DOMAINS --- */}
      <div className="space-y-6 pt-8 border-t border-white/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-400" />
              Custom Domains
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Manage domains assigned to your project.
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2 border-white/10 bg-white/5 hover:bg-white/10" onClick={() => setIsAddingDomain(true)}>
            <Plus className="w-4 h-4" /> Add Domain
          </Button>
        </div>

        <div className="space-y-3">
          {/* Add Domain Input - Shows only when active */}
          <AnimatePresence>
            {isAddingDomain && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginBottom: 0 }} 
                animate={{ opacity: 1, height: 'auto', marginBottom: 16 }} 
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="glass-card p-4 rounded-xl border border-blue-500/30 bg-blue-500/5"
              >
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input 
                    placeholder="e.g. my-app.com" 
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    className="bg-black/40 border-white/10 focus:border-blue-500/50 flex-1"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleAddDomain} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[80px]">Add</Button>
                    <Button variant="ghost" onClick={() => setIsAddingDomain(false)}><X className="w-4 h-4"/></Button>
                  </div>
                </div>
                <p className="text-xs text-blue-400/70 mt-2">
                  Enter the domain you want to assign to this project. We will provide DNS records in the next step.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Domains List */}
          <AnimatePresence>
            {domains.map(domain => (
              <motion.div 
                key={domain.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-card p-5 rounded-xl border border-white/10 flex flex-col gap-4"
              >
                {/* Domain Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Status Dot */}
                    <div className="relative">
                      {domain.status === 'active' && <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />}
                      {domain.status === 'pending' && <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse" />}
                      {domain.status === 'verifying' && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                      {domain.status === 'error' && <div className="w-3 h-3 rounded-full bg-red-500" />}
                    </div>
                    
                    <div>
                      <h4 className="text-base font-semibold text-foreground flex items-center gap-2">
                        <a href={`https://${domain.name}`} target="_blank" className="hover:underline hover:text-blue-400 transition-colors">
                          {domain.name}
                        </a>
                        {domain.status === 'active' && <Check className="w-3 h-3 text-emerald-500" />}
                        <Badge variant="outline" className="text-[10px] h-5 border-white/10 bg-white/5 uppercase tracking-wider ml-2">{domain.type}</Badge>
                      </h4>
                      {domain.status === 'pending' && (
                        <p className="text-xs text-yellow-500 mt-0.5 flex items-center gap-1.5">
                          <AlertCircle className="w-3 h-3" /> Invalid Configuration
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {domain.status !== 'active' && (
                      <Button variant="outline" size="sm" onClick={() => verifyDomain(domain.id)} className="border-white/10 h-8 text-xs hover:bg-white/5">
                        <RefreshCw className={cn("w-3 h-3 mr-2", domain.status === 'verifying' && "animate-spin")} /> 
                        Refresh
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => deleteDomain(domain.id)} className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-500/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* DNS Configuration Panel (Only if not active) */}
                {domain.status !== 'active' && domain.dnsRecords && (
                  <div className="bg-black/30 rounded-lg border border-white/5 p-4 mt-2">
                    <p className="text-xs text-muted-foreground mb-3 flex items-center gap-2">
                      <Globe className="w-3 h-3" />
                      Set the following record on your DNS provider to continue:
                    </p>
                    <div className="grid gap-2">
                      {domain.dnsRecords.map((record, i) => (
                        <div key={i} className="flex items-center justify-between bg-black/40 p-2.5 rounded border border-white/5 hover:border-white/10 transition-colors">
                          <div className="flex items-center gap-6">
                            <Badge variant="secondary" className="font-mono text-xs w-16 justify-center bg-white/10">{record.type}</Badge>
                            <span className="font-mono text-xs text-foreground/80">Name: <span className="text-foreground">{record.name}</span></span>
                            <span className="font-mono text-xs text-foreground/80">Value: <span className="text-foreground">{record.value}</span></span>
                          </div>
                          <button onClick={() => copyToClipboard(record.value)} className="text-muted-foreground hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

    </motion.div>
  );
};

// --- HELPER COMPONENT ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const EnvCheckbox = ({ label, checked, onChange, activeColor }: any) => (
  <div className="flex flex-col items-center gap-1.5 cursor-pointer group select-none" onClick={onChange}>
    <span className={cn("text-[10px] font-medium uppercase tracking-wider transition-colors", checked ? "text-foreground" : "text-muted-foreground group-hover:text-foreground/70")}>{label}</span>
    <div className={cn(
      "w-4 h-4 rounded border flex items-center justify-center transition-all duration-200",
      checked ? `border-transparent ${activeColor}` : "border-white/20 bg-transparent group-hover:border-white/40"
    )}>
      {checked && <Check className="w-3 h-3 text-white stroke-[3]" />}
    </div>
  </div>
);