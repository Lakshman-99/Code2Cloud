"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Eye, EyeOff, Plus, Trash2, Shield, Upload, FileText, 
  Globe, Check, AlertCircle, Save, X, RefreshCw, Copy, 
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Domain, DomainDnsStatus, EnvironmentType, EnvVar, Project } from "@/types/project";
import { useProjects } from "@/hooks/use-projects";

interface ProjectOverviewProps {
  project: Project;
}

export const EnvVarsPanel = ({ project }: ProjectOverviewProps) => {  
  const { saveEnvVars } = useProjects();

  const [envVars, setEnvVars] = useState<EnvVar[]>(project.envVars ?? []);
  const [domains, setDomains] = useState<Domain[]>(project.domains ?? []);
  const [ui, setUi] = useState({
    dirty: false,
    showValues: new Set<string>(),
    showAll: false,
    newDomain: "",
    addingDomain: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateId = () => crypto.randomUUID();

  const parseEnvLine = (line: string) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (!match) return null;

    let value = match[2] ?? "";
    value = value.replace(/^['"]|['"]$/g, "").trim();

    return { key: match[1].trim(), value };
  };


  const importEnvFile = async (file: File) => {
    const text = await file.text();

    const parsed = text
      .split("\n")
      .map(parseEnvLine)
      .filter(Boolean) as { key: string; value: string }[];

    if (!parsed.length) {
      toast.error("No valid environment variables found.");
      return;
    }

    setEnvVars(prev => {
      const existingKeys = new Set(prev.map(v => v.key));

      const fresh: EnvVar[] = parsed
        .filter(v => !existingKeys.has(v.key))
        .map(v => ({
          id: generateId(),
          key: v.key,
          value: v.value,
          targets: [EnvironmentType.PRODUCTION],
        }));

      return [...fresh, ...prev];
    });

    setUi(prev => ({ ...prev, dirty: true }));
    toast.success(`Imported ${parsed.length} variables`);
  };

  const saveEnvChanges = async () => {
    if (envVars.some(v => !v.key.trim())) {
      toast.error("All variables must have a key.");
      return;
    }

    try {
      await saveEnvVars(project.id, envVars);
      setUi(prev => ({ ...prev, dirty: false }));
      toast.success("Environment variables saved");
    } catch {
      toast.error("Failed to save variables");
    }
  };

  const discardChanges = () => {
    setEnvVars(project.envVars ?? []);
    setUi(prev => ({ ...prev, dirty: false }));
    toast.info("Changes discarded");
  };

  const isVisible = (id: string) => ui.showAll || ui.showValues.has(id);

  const toggleVisibility = (id: string) =>
    setUi(prev => {
      const next = new Set(prev.showValues);
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      next.has(id) ? next.delete(id) : next.add(id);
      return { ...prev, showValues: next };
    });

  const toggleAllVisibility = () =>
    setUi(prev => ({
      ...prev,
      showAll: !prev.showAll,
    }));

  const handleEnvChange = (id: string, field: keyof EnvVar, value: string) => {
    setEnvVars(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
    setUi(prev => ({ ...prev, dirty: true }));;
  };

  const toggleEnv = (id: string, env: EnvironmentType) => {
    setEnvVars(prev => prev.map(v => {
      if (v.id !== id) return v;
      const nextEnvs = v.targets.includes(env)
        ? v.targets.filter(e => e !== env)
        : [...v.targets, env];
      return { ...v, targets: nextEnvs };
    }));
    setUi(prev => ({ ...prev, dirty: true }));;
  };

  const addEmptyVar = () => {
    const newVar: EnvVar = {
      id: generateId(),
      key: "",
      value: "",
      targets: [],
    };
    // Add to TOP of list
    setEnvVars([newVar, ...envVars]);
    setUi(prev => ({ ...prev, dirty: true }));;
    toggleVisibility(newVar.id);
  };

  const removeVar = (id: string) => {
    const varToDelete = envVars.find(v => v.id === id);
    if (!varToDelete) return;

    // Optimistic delete
    setEnvVars(prev => prev.filter(v => v.id !== id));
    setUi(prev => ({ ...prev, dirty: true }));;

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

  // --- ACTIONS: DOMAINS ---

  const handleAddDomain = () => {
    if (!ui.newDomain.includes(".")) {
      toast.error("Invalid Domain", { description: "Please enter a valid domain name (e.g. example.com)" });
      return;
    }

    const domain: Domain = {
      id: generateId(),
      name: ui.newDomain,
      status: DomainDnsStatus.PENDING,
      type: EnvironmentType.PRODUCTION,
      dnsRecords: [
        { type: "A", name: "@", value: "76.76.21.21" },
        { type: "CNAME", name: "www", value: "cname.code2cloud.dev" }
      ]
    };

    setDomains([...domains, domain]);
    setUi(p => ({ ...p, newDomain: "", addingDomain: false }))
    toast.success("Domain Added", { description: "Please configure your DNS records." });
  };

  const verifyDomain = (id: string) => {
    setDomains(prev => prev.map(d => d.id === id ? { ...d, status: DomainDnsStatus.VERIFYING } : d));
    
    setTimeout(() => {
      setDomains(prev => prev.map(d => d.id === id ? { ...d, status: DomainDnsStatus.ACTIVE } : d));
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
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) importEnvFile(file);
                e.target.value = "";
              }} 
            />

            {ui.dirty ? (
                <div className="flex items-center gap-2">
                  <Button size="sm" className="gap-2 bg-red-500 text-primary-foreground hover:bg-red-500 hover:opacity-90" onClick={discardChanges}>
                    <Trash2 className="w-4 h-4 mr-2" /> Discard
                  </Button>
                  <Button size="sm" className="gap-2 bg-primary text-primary-foreground hover:opacity-90" onClick={addEmptyVar}>
                    <Plus className="w-4 h-4" /> Add Variable
                  </Button>
                  <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2 shadow-lg shadow-emerald-500/20" onClick={saveEnvChanges}>
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
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[35%]">
                    <div className="flex items-center justify-between">
                      <span>Value</span>
                      <button onClick={toggleAllVisibility}>
                        {ui.showAll ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </th>
                  <th className="text-center px-2 py-3 text-xs font-semibold text-muted-foreground uppercase w-[20%]">targets</th>
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
                            type={isVisible(envVar.id) ? "text" : "password"}
                            value={isVisible(envVar.id) ? envVar.value : "••••••••••••••••"} 
                            onChange={(e) => handleEnvChange(envVar.id, 'value', e.target.value)}
                            placeholder="Value..."
                            className="font-mono text-sm bg-transparent border-transparent hover:border-white/10 focus:border-primary/50 focus:bg-black/20 h-9 pr-8 transition-all"
                          />
                          <button 
                            onClick={() => toggleVisibility(envVar.id)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 p-1"
                          >
                            {ui.showValues.has(envVar.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-3 pt-2">
                          <EnvCheckbox 
                            label="Prod" 
                            checked={envVar.targets.includes(EnvironmentType.PRODUCTION)} 
                            onChange={() => toggleEnv(envVar.id, EnvironmentType.PRODUCTION)}
                            activeColor="bg-emerald-500"
                          />
                          <EnvCheckbox 
                            label="Prev" 
                            checked={envVar.targets.includes(EnvironmentType.PREVIEW)} 
                            onChange={() => toggleEnv(envVar.id, EnvironmentType.PREVIEW)}
                            activeColor="bg-blue-500"
                          />
                          <EnvCheckbox 
                            label="Dev" 
                            checked={envVar.targets.includes(EnvironmentType.DEVELOPMENT)} 
                            onChange={() => toggleEnv(envVar.id, EnvironmentType.DEVELOPMENT)}
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
          <Button variant="outline" size="sm" className="gap-2 border-white/10 bg-white/5 hover:bg-white/10" onClick={() => setUi(p => ({ ...p, addingDomain: true }))}>
            <Plus className="w-4 h-4" /> Add Domain
          </Button>
        </div>

        <div className="space-y-3">
          {/* Add Domain Input - Shows only when active */}
          <AnimatePresence>
            {ui.addingDomain && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginBottom: 0 }} 
                animate={{ opacity: 1, height: 'auto', marginBottom: 16 }} 
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="glass-card p-4 rounded-xl border border-blue-500/30 bg-blue-500/5"
              >
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input 
                    placeholder="e.g. my-app.com" 
                    value={ui.newDomain}
                    onChange={(e) => setUi(p => ({ ...p, newDomain: e.target.value }))}
                    className="bg-black/40 border-white/10 focus:border-blue-500/50 flex-1"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleAddDomain} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[80px]">Add</Button>
                    <Button variant="ghost" onClick={() => setUi(p => ({ ...p, addingDomain: false }))}><X className="w-4 h-4"/></Button>
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
                      {domain.status === DomainDnsStatus.ACTIVE && <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />}
                      {domain.status === DomainDnsStatus.PENDING && <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse" />}
                      {domain.status === DomainDnsStatus.VERIFYING && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                      {domain.status === DomainDnsStatus.ERROR && <div className="w-3 h-3 rounded-full bg-red-500" />}
                    </div>
                    
                    <div>
                      <h4 className="text-base font-semibold text-foreground flex items-center gap-2">
                        <a href={`https://${domain.name}`} target="_blank" className="hover:underline hover:text-blue-400 transition-colors">
                          {domain.name}
                        </a>
                        {domain.status === DomainDnsStatus.ACTIVE && <Check className="w-3 h-3 text-emerald-500" />}
                        <Badge variant="outline" className="text-[10px] h-5 border-white/10 bg-white/5 uppercase tracking-wider ml-2">{domain.type}</Badge>
                      </h4>
                      {domain.status === DomainDnsStatus.PENDING && (
                        <p className="text-xs text-yellow-500 mt-0.5 flex items-center gap-1.5">
                          <AlertCircle className="w-3 h-3" /> Invalid Configuration
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {domain.status !== DomainDnsStatus.ACTIVE && (
                      <Button variant="outline" size="sm" onClick={() => verifyDomain(domain.id)} className="border-white/10 h-8 text-xs hover:bg-white/5">
                        <RefreshCw className={cn("w-3 h-3 mr-2", domain.status === DomainDnsStatus.VERIFYING && "animate-spin")} /> 
                        Refresh
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => deleteDomain(domain.id)} className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-500/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* DNS Configuration Panel (Only if not active) */}
                {domain.status !== DomainDnsStatus.ACTIVE && domain.dnsRecords && (
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