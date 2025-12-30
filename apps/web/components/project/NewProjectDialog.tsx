import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dialog, 
  DialogContent,
  DialogHeader, 
  DialogTitle, 
} from '@/components/ui/dialog';
import { ArrowLeft, ArrowRight, Box, Check, ChevronDown, ChevronUp, GitBranch, Key, Loader2, Lock, Plus, RefreshCw, Rocket, Search, Settings2, Terminal, Trash2 } from 'lucide-react';
import { 
  SiReact, SiNextdotjs, SiPython, SiNodedotjs, SiTypescript, 
  SiJavascript, SiGo, SiRust, SiDocker, SiVuedotjs, SiHtml5, 
  SiGithub
} from "react-icons/si";
import { useGit } from '@/hooks/use-git';
import { useMemo, useState } from 'react';
import { Button } from '../ui/button';
import { RepoListSkeleton } from '../ui/skeleton';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';
import { formatDistanceToNow } from 'date-fns';
import { useMockStore } from '@/stores/useMockStore';
import { toast } from 'sonner';
import { Label } from '../ui/label';
import { GitRepository } from '@/types/git';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { cn } from '@/lib/utils';

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getLanguageIcon = (lang: string | null) => {
  const l = lang?.toLowerCase() || "";
  const className = "w-5 h-5";
  if (l.includes("react")) return <SiReact className={`${className} text-[#61DAFB]`} />;
  if (l.includes("next")) return <SiNextdotjs className={`${className} text-white`} />;
  if (l.includes("python")) return <SiPython className={`${className} text-[#3776AB]`} />;
  if (l.includes("node")) return <SiNodedotjs className={`${className} text-[#339933]`} />;
  if (l.includes("type")) return <SiTypescript className={`${className} text-[#3178C6]`} />;
  if (l.includes("java")) return <SiJavascript className={`${className} text-[#F7DF1E]`} />;
  if (l.includes("go")) return <SiGo className={`${className} text-[#00ADD8]`} />;
  if (l.includes("rust")) return <SiRust className={`${className} text-[#DEA584]`} />;
  if (l.includes("vue")) return <SiVuedotjs className={`${className} text-[#4FC08D]`} />;
  if (l.includes("docker")) return <SiDocker className={`${className} text-[#2496ED]`} />;
  return <SiHtml5 className={`${className} text-[#E34F26]`} />;
};

export const NewProjectDialog = ({ open, onOpenChange }: NewProjectDialogProps) => {
  const { isConnected, accounts, repos, isLoading, selectedAccount, setSelectedAccount, refreshStatus } = useGit();
  const { addProject } = useMockStore();
  
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isAccountOpen, setIsAccountOpen] = useState<boolean>(false);
  const [selectedRepo, setSelectedRepo] = useState<GitRepository | null>(null);

  // Animation states
  const [importingRepoId, setImportingRepoId] = useState<number | null>(null); // For button loader
  const [deploying, setDeploying] = useState(false);

  // Configuration State
  const [projectName, setProjectName] = useState("");
  const [rootDirectory, setRootDirectory] = useState("./");
  const [showBuildSettings, setShowBuildSettings] = useState(false);
  const [showEnvVars, setShowEnvVars] = useState(false);
  const [envVars, setEnvVars] = useState([{ key: "", value: "" }]);

  // Derived View Logic
  const view = useMemo(() => {
    if (deploying) return 'deploying';
    if (selectedRepo) return 'configure';
    if (!isLoading && !isConnected) return 'connect';
    return 'list';
  }, [deploying, selectedRepo, isLoading, isConnected]);


  // Progress Bar Logic
  const progress = useMemo(() => {
    switch (view) {
      case 'connect': return '10%';
      case 'list': return '30%';
      case 'configure': return '70%';
      case 'deploying': return '90%';
      default: return '0%';
    }
  }, [view]);

  // Handlers
  const handleClose = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setTimeout(() => {
        setSearchQuery("");
        setIsAccountOpen(false);
        setSelectedRepo(null);
        setImportingRepoId(null);
        setDeploying(false);
      }, 300);
    }
  };

  const handleConnect = () => {
    setIsAccountOpen(false);
    const width = 600, height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const toastId = toast.loading("Opening GitHub Authentication...");

    const popup = window.open(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/github/connect`,
      "GitHubConnect",
      `width=${width},height=${height},top=${top},left=${left}`
    );

    const timer = setInterval(() => {
      if (popup?.closed) {
        clearInterval(timer);
        refreshStatus();
        toast.success("GitHub Connected Successfully!", { id: toastId });
      }
    }, 1000);
  };

  const handleImport = async (repo: GitRepository) => {
    setImportingRepoId(repo.id);
    setProjectName(repo.name);
    setSelectedRepo(repo);
    setImportingRepoId(null);
  };

  const handleDeploy = async () => {
    setDeploying(true);
    await new Promise(r => setTimeout(r, 2000));
    
    addProject({
      name: projectName,
      type: 'nextjs', // In real app, detect from repo
      domain: `${projectName}.code2cloud.dev`,
      branch: selectedRepo?.defaultBranch || 'main',
    });
    
    toast.success("Deployment Initiated");
    handleClose(false);
  };

  const updateEnv = (i: number, field: "key" | "value", val: string) => {
    const next = [...envVars];
    next[i][field] = val;
    setEnvVars(next);
  };

  const removeEnv = (i: number) => {
    setEnvVars(envVars.filter((_, idx) => idx !== i));
  };

  const importEnvFile = async (file: File) => {
    const text = await file.text();

    const parsed = text
      .split("\n")
      .map((line) => line.trim())
      .filter((l) => l && !l.startsWith("#") && l.includes("="))
      .map((l) => {
        const [key, ...rest] = l.split("=");
        return { key, value: rest.join("=") };
      });

    setEnvVars(parsed.length ? parsed : envVars);
    toast.success("Environment Variables Imported");
  };

  const filteredRepos = useMemo(() => 
    repos?.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase())), 
  [repos, searchQuery]);


  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-[900px] h-[650px] border-white/10 bg-card/95 backdrop-blur-xl p-0 flex flex-col gap-0 overflow-hidden shadow-2xl" 
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Progress indicator */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/5 z-50">
          <motion.div
            className="h-full bg-gradient-to-r from-teal-400 to-emerald-500"
            initial={{ width: '0%' }}
            animate={{ width: progress }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>

        <DialogHeader className="px-8 py-6 border-b border-white/10 backdrop-blur-xl shrink-0">
          <DialogTitle className="flex items-center gap-2 text-2xl font-semibold">
            <Box className="h-6 w-6"/>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              {view === 'configure' ? 'Configure Project' : 'New Project'}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {/* STATE 1: LOADING */}
            {isLoading && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center">
                <RepoListSkeleton />
              </motion.div>
            )}

            {/* STATE 2: CONNECT */}
            {view === 'connect' && (
              <motion.div key="connect" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <div className="w-20 h-20 bg-white/[0.03] rounded-3xl flex items-center justify-center mb-8 border border-white/10 shadow-2xl">
                  <SiGithub className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Connect to GitHub</h2>
                <p className="text-white/50 max-w-sm mb-8 text-sm">Link your GitHub account to access your repositories and deploy in seconds.</p>
                <Button onClick={handleConnect} size="lg" className="bg-white text-black hover:bg-white/90 font-bold h-12 px-8 rounded-xl">Connect GitHub</Button>
              </motion.div>
            )}

            {/* STATE 3: REPO LIST (CONNECTED) */}
            {!isLoading && view === 'list' && (
              <motion.div 
                key="list"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col h-full"
              >
                {/* TOOLBAR: Account + Search */}
                <div className="px-8 py-4 border-b border-white/10 flex items-center gap-4 shrink-0 z-10">
                  
                  {/* Account Switcher */}
                  <div className="relative">
                    <button 
                      onClick={() => setIsAccountOpen(!isAccountOpen)}
                      className="flex items-center gap-3 px-4 h-11 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] transition-all min-w-[220px]"
                    >
                      <div className="w-6 h-6 rounded-full flex items-center justify-center">
                        <SiGithub />
                      </div>
                      <span className="text-sm font-medium text-white truncate flex-1 text-left">
                        {selectedAccount?.username || "GitHub"}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${isAccountOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isAccountOpen && (
                        <>
                          <div className="fixed inset-0 z-0" onClick={() => setIsAccountOpen(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                            className="absolute top-full left-0 mt-2 w-[240px] p-1.5 bg-[#0F1115] border border-white/10 rounded-xl shadow-2xl z-50"
                          >
                            <div className="px-2 py-2 text-[10px] uppercase tracking-wider text-white/40 font-bold">Connected</div>
                            {/* LIST ALL ACCOUNTS */}
                            <div className="space-y-1">
                              {accounts?.map((account) => (
                                <div 
                                  key={account.id} 
                                  onClick={() => { setSelectedAccount(account.id); setIsAccountOpen(false); }}
                                  className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-lg border transition-all cursor-pointer",
                                    // Conditional Styling:
                                    selectedAccount?.id === account.id 
                                      ? "bg-white/10 border-white/10 shadow-sm" // Active State (Brighter)
                                      : "bg-transparent border-transparent hover:bg-white/[0.05] text-muted-foreground hover:text-white" // Inactive
                                  )}
                                >
                                  {/* Account Avatar */}
                                  <Avatar className="h-8 w-8 rounded-full border border-white/10 shadow-sm shrink-0">
                                    <AvatarImage src={account.avatarUrl} alt={account.username} referrerPolicy="no-referrer" />
                                    <AvatarFallback className="rounded-full text-white font-bold">
                                      <SiGithub className="w-5 h-5" />
                                    </AvatarFallback>
                                  </Avatar>
                                  
                                  <span className="text-sm text-white font-medium truncate flex-1">{account.username}</span> 
                                  
                                  {/* Active Checkmark (Logic: if repo list matches this account - for now just show check on all connected) */}
                                  <Check className="w-4 h-4 text-emerald-500" />
                                </div>
                              ))}
                            </div>
                            <div className="h-px bg-white/10 my-1.5 mx-1" />
                            <button 
                              onClick={handleConnect}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg text-left transition-colors"
                            >
                              <Plus className="w-4 h-4" /> Add Account
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Search Bar */}
                  <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-emerald-400 transition-colors" />
                    <Input 
                      placeholder="Search repositories..." 
                      className="pl-11 bg-[#0A0A0A] border-white/10 text-sm h-11 rounded-xl focus-visible:ring-1 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50 transition-all placeholder:text-white/20"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* SCROLLABLE LIST */}
                <ScrollArea className="flex-1 overflow-y-auto">
                  <div className="p-4 space-y-2">
                    {/* If we are re-validating but have data, we show data. Only generic isLoading shows skeleton */}
                    {filteredRepos?.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-64 text-white/30">
                        <p>No repositories found.</p>
                        <button onClick={() => refreshStatus()} className="flex items-center gap-2 text-emerald-400 hover:underline mt-4 text-sm">
                          <RefreshCw className="w-3 h-3" /> Refresh List
                        </button>
                      </div>
                    ) : (
                      filteredRepos?.map((repo) => (
                        <motion.div 
                          key={repo.id}
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          className="group flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-[#0F1117] border border-white/10 flex items-center justify-center shrink-0 group-hover:border-white/20 transition-colors">
                              {getLanguageIcon(repo.language)}
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm font-semibold text-white truncate flex items-center gap-2 group-hover:text-emerald-400 transition-colors">
                                {repo.name} 
                                {repo.private && <Lock className="w-3 h-3 text-white/30" />}
                              </h3>
                              <p className="text-xs text-white/40 mt-1 font-mono">
                                {formatDistanceToNow(new Date(repo.updatedAt))} ago
                              </p>
                            </div>
                          </div>
                          
                          <Button 
                            onClick={() => handleImport(repo)}
                            size="sm" 
                            className="bg-gradient-to-r from-emerald-400 to-cyan-400 text-black font-bold h-9 px-6 rounded-lg transition-all translate-x-2 group-hover:translate-x-0"
                          >
                            {importingRepoId === repo.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Import"}
                            <ArrowRight className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                          </Button>
                        </motion.div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </motion.div>
            )}

            {/* STATE 4: CONFIGURE (Based on Screenshot) */}
            {view === 'configure' && selectedRepo && (
              <motion.div key="configure" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-full">
                <ScrollArea className="flex-1 overflow-y-auto">
                  <div className="p-8 space-y-6">
                    
                    {/* Repo Card */}
                    <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex items-center gap-3">
                      <div>
                        <p className="text-xs text-white/40 mt-1">Importing from GitHub</p>
                        <h3 className="font-medium text-white text-sm flex items-center gap-2">
                          <SiGithub className="w-4 h-4 text-white" />
                            {selectedRepo.fullName} 
                            <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-white/50 border border-white/5 font-mono">
                              <GitBranch className="w-3 h-3 inline-block mr-1" />
                              {selectedRepo.defaultBranch}
                            </span>
                        </h3>
                      </div>
                    </div>

                    {/* Project Name */}
                    <div className="space-y-4">
                      <Label className="text-xs font-bold text-white/40 uppercase tracking-widest">Project Name</Label>
                      <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} className="bg-[#0A0A0A] border-white/10 h-11 focus-visible:ring-emerald-500/50" />
                    </div>

                    {/* Framework & Root */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-white/40 uppercase tracking-widest">Framework Preset</Label>
                          <div className="flex items-center gap-2 h-11 px-3 rounded-md border border-white/10 bg-white/5 text-sm text-white/70">
                            {getLanguageIcon(selectedRepo.language)} 
                            {selectedRepo.language?.toLowerCase().includes('python') ? 'Python' : 'Next.js'}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-white/40 uppercase tracking-widest">Root Directory</Label>
                          <div className="flex gap-2">
                            <Input value={rootDirectory} onChange={(e) => setRootDirectory(e.target.value)} className="bg-[#0A0A0A] border-white/10 h-11 font-mono text-sm" />
                            <Button variant="outline" className="border-white/10 h-11 hover:bg-white/5">Edit</Button>
                          </div>
                        </div>
                    </div>

                    {/* Build Settings Accordion */}
                    <div className="rounded-xl border border-white/10 bg-[#0A0A0A] overflow-hidden">
                      <button onClick={() => setShowBuildSettings(!showBuildSettings)} className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-2 text-sm font-medium text-white"><Settings2 className="w-4 h-4 text-white/50"/> Build and Output Settings</div>
                        {showBuildSettings ? <ChevronUp className="w-4 h-4 text-white/50"/> : <ChevronDown className="w-4 h-4 text-white/50"/>}
                      </button>
                      {showBuildSettings && (
                        <div className="p-4 border-t border-white/10 space-y-4 bg-black/20">
                            <div className="grid gap-2">
                              <Label className="text-xs text-white/50">Build Command</Label>
                              <Input placeholder="npm run build" className="bg-black border-white/10 h-9 font-mono text-xs" />
                            </div>
                            <div className="grid gap-2">
                              <Label className="text-xs text-white/50">Output Directory</Label>
                              <Input placeholder=".next" className="bg-black border-white/10 h-9 font-mono text-xs" />
                            </div>
                            <div className="grid gap-2">
                              <Label className="text-xs text-white/50">Install Command</Label>
                              <Input placeholder="npm install" className="bg-black border-white/10 h-9 font-mono text-xs" />
                            </div>
                        </div>
                      )}
                    </div>

                    {/* Env Vars Accordion */}
                    <div className="rounded-xl border border-white/10 bg-[#0A0A0A] overflow-hidden">
                      <button onClick={() => setShowEnvVars(!showEnvVars)} className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-2 text-sm font-medium text-white"><Key className="w-4 h-4 text-white/50"/> Environment Variables</div>
                        {showEnvVars ? <ChevronUp className="w-4 h-4 text-white/50"/> : <ChevronDown className="w-4 h-4 text-white/50"/>}
                      </button>
                      {showEnvVars && (
                        <div className="p-4 border-t border-white/10 space-y-3 bg-black/20">
                            {/* HEADER */}
                            <div className="grid grid-cols-[1fr_1fr_36px] gap-2 text-[11px] uppercase text-muted-foreground px-1">
                              <span>Key</span>
                              <span>Value</span>
                              <span></span>
                            </div>

                            {/* ROWS */}
                            {envVars.map((env, i) => (
                              <div
                                key={i}
                                className="grid grid-cols-[1fr_1fr_36px] gap-2 items-center"
                              >
                                <Input
                                  value={env.key}
                                  onChange={(e) => updateEnv(i, "key", e.target.value.toUpperCase())}
                                  placeholder="ENV_VAR"
                                  className="bg-black border-white/10 h-9 font-mono text-xs uppercase"
                                />

                                <Input
                                  value={env.value}
                                  onChange={(e) => updateEnv(i, "value", e.target.value)}
                                  placeholder="I8JAS92JASD4#ML"
                                  className="bg-black border-white/10 h-9 font-mono text-xs"
                                />

                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => removeEnv(i)}
                                  className="h-9 w-9 text-red-400 hover:bg-red-400/10"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}

                            {/* IMPORT BAR */}
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <label className="cursor-pointer text-blue-400 hover:underline">
                                Import from .env
                                <input
                                  type="file"
                                  accept=".env,.env.*"
                                  hidden
                                  onChange={(e) =>
                                    e.target.files && importEnvFile(e.target.files[0])
                                  }
                                />
                              </label>
                            </div>

                            {/* ADD */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEnvVars([...envVars, { key: "", value: "" }])}
                              className="w-full border-dashed border-white/20 h-8 text-xs hover:border-white/40 hover:bg-white/5 transition-colors"
                            >
                              <Plus className="w-3 h-3 mr-2" />
                              Add Variable
                            </Button>
                        </div>
                      )}
                    </div>

                  </div>
                </ScrollArea>
                
                {/* Footer */}
                <div className="p-3 border-t border-white/10 flex justify-end gap-3 shrink-0">
                  <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => setSelectedRepo(null)}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group mr-2"
                  >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back
                  </motion.button>
                  <Button onClick={handleDeploy} className="bg-gradient-to-r from-emerald-400 to-cyan-400 text-black font-bold px-5 h-10 rounded-lg hover:scale-[1.05] transition-transform">
                    <Rocket className="w-4 h-4" />
                    Deploy
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STATE 5: DEPLOYING */}
            {view === 'deploying' && (
              <motion.div key="deploying" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="relative mb-8">
                    <div className="w-20 h-20 rounded-full border-2 border-white/10" />
                    <div className="w-20 h-20 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin absolute inset-0 shadow-[0_0_30px_rgba(16,185,129,0.3)]" />
                    <Terminal className="w-8 h-8 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Initializing...</h3>
                <p className="text-white/50 font-mono text-sm">Cloning repository and setting up build pipeline</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};
