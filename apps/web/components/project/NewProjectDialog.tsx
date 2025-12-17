import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowRight, 
  ArrowLeft,
  Rocket, 
  Github,
  Upload,
  CheckCircle2,
  Loader2,
  Terminal,
  Globe,
  Zap
} from 'lucide-react';
import { useMockStore, FrameworkType } from '@/stores/useMockStore';
import { toast } from 'sonner';

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'framework' | 'source' | 'configure' | 'deploying' | 'success';

const frameworkOptions = [
  {
    id: 'nextjs' as FrameworkType,
    name: 'Next.js',
    description: 'Full-stack React framework with SSR, API routes & more',
    icon: (
      <svg viewBox="0 0 180 180" fill="none" className="w-10 h-10">
        <mask id="mask0_408_139" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="180" height="180">
          <circle cx="90" cy="90" r="90" fill="black" />
        </mask>
        <g mask="url(#mask0_408_139)">
          <circle cx="90" cy="90" r="90" fill="black" />
          <path d="M149.508 157.52L69.142 54H54V125.97H66.1136V69.3836L139.999 164.845C143.333 162.614 146.509 160.165 149.508 157.52Z" fill="url(#paint0_linear_408_139)" />
          <rect x="115" y="54" width="12" height="72" fill="url(#paint1_linear_408_139)" />
        </g>
        <defs>
          <linearGradient id="paint0_linear_408_139" x1="109" y1="116.5" x2="144.5" y2="160.5" gradientUnits="userSpaceOnUse">
            <stop stopColor="white" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="paint1_linear_408_139" x1="121" y1="54" x2="120.799" y2="106.875" gradientUnits="userSpaceOnUse">
            <stop stopColor="white" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    ),
    runtime: 'Node 18.x',
    features: ['Server Components', 'API Routes', 'Edge Runtime', 'Static Export'],
  },
  {
    id: 'python' as FrameworkType,
    name: 'Python',
    description: 'FastAPI / Django for high-performance APIs & web apps',
    icon: (
      <svg viewBox="0 0 256 255" className="w-10 h-10">
        <defs>
          <linearGradient x1="12.959%" y1="12.039%" x2="79.639%" y2="78.201%" id="pythonA">
            <stop stopColor="#387EB8" offset="0%" />
            <stop stopColor="#366994" offset="100%" />
          </linearGradient>
          <linearGradient x1="19.128%" y1="20.579%" x2="90.742%" y2="88.429%" id="pythonB">
            <stop stopColor="#FFE052" offset="0%" />
            <stop stopColor="#FFC331" offset="100%" />
          </linearGradient>
        </defs>
        <path d="M126.916.072c-64.832 0-60.784 28.115-60.784 28.115l.072 29.128h61.868v8.745H41.631S.145 61.355.145 126.77c0 65.417 36.21 63.097 36.21 63.097h21.61v-30.356s-1.165-36.21 35.632-36.21h61.362s34.475.557 34.475-33.319V33.97S194.67.072 126.916.072zM92.802 19.66a11.12 11.12 0 0 1 11.13 11.13 11.12 11.12 0 0 1-11.13 11.13 11.12 11.12 0 0 1-11.13-11.13 11.12 11.12 0 0 1 11.13-11.13z" fill="url(#pythonA)" />
        <path d="M128.757 254.126c64.832 0 60.784-28.115 60.784-28.115l-.072-29.127H127.6v-8.745h86.441s41.486 4.705 41.486-60.712c0-65.416-36.21-63.096-36.21-63.096h-21.61v30.355s1.165 36.21-35.632 36.21h-61.362s-34.475-.557-34.475 33.32v56.013s-5.235 33.897 62.518 33.897zm34.114-19.586a11.12 11.12 0 0 1-11.13-11.13 11.12 11.12 0 0 1 11.13-11.131 11.12 11.12 0 0 1 11.13 11.13 11.12 11.12 0 0 1-11.13 11.13z" fill="url(#pythonB)" />
      </svg>
    ),
    runtime: 'Python 3.11',
    features: ['FastAPI', 'Django', 'Auto Docs', 'Type Hints'],
  },
];

const sourceOptions = [
  {
    id: 'github',
    name: 'Import from GitHub',
    description: 'Connect your repository',
    icon: Github,
  },
  {
    id: 'template',
    name: 'Start from Template',
    description: 'Use a starter template',
    icon: Zap,
  },
  {
    id: 'upload',
    name: 'Upload Project',
    description: 'Upload your codebase',
    icon: Upload,
  },
];

export const NewProjectDialog = ({ open, onOpenChange }: NewProjectDialogProps) => {
  const [step, setStep] = useState<Step>('framework');
  const [selectedFramework, setSelectedFramework] = useState<FrameworkType | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const { addProject } = useMockStore();

  const resetDialog = () => {
    setStep('framework');
    setSelectedFramework(null);
    setSelectedSource(null);
    setProjectName('');
    setRepoUrl('');
  };

  const handleClose = (open: boolean) => {
    if (!open) resetDialog();
    onOpenChange(open);
  };

  const handleDeploy = async () => {
    setStep('deploying');
    
    // Simulate deployment
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Add the project
    addProject({
      name: projectName || 'new-project',
      type: selectedFramework!,
      domain: `${projectName || 'new-project'}.code2cloud.dev`,
      branch: 'main',
    });
    
    setStep('success');
    toast.success('Project deployed successfully!');
  };

  const canProceed = () => {
    switch (step) {
      case 'framework':
        return selectedFramework !== null;
      case 'source':
        return selectedSource !== null;
      case 'configure':
        return projectName.trim().length > 0;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (step === 'framework') setStep('source');
    else if (step === 'source') setStep('configure');
    else if (step === 'configure') handleDeploy();
  };

  const prevStep = () => {
    if (step === 'source') setStep('framework');
    else if (step === 'configure') setStep('source');
  };

  const selectedFrameworkData = frameworkOptions.find(f => f.id === selectedFramework);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] glass border-white/10 bg-card/95 backdrop-blur-xl p-0 overflow-hidden">
        {/* Progress indicator */}
        {step !== 'deploying' && step !== 'success' && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-muted/20">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-accent"
              initial={{ width: '0%' }}
              animate={{
                width: step === 'framework' ? '33%' : step === 'source' ? '66%' : '100%',
              }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Step 1: Framework Selection */}
          {step === 'framework' && (
            <motion.div
              key="framework"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="p-6"
            >
              <DialogHeader className="mb-6">
                <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <Rocket className="w-5 h-5 text-primary" />
                  </div>
                  Create New Project
                </DialogTitle>
                <DialogDescription className="text-muted-foreground mt-2">
                  Choose your framework to get started
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 gap-4">
                {frameworkOptions.map((framework) => (
                  <motion.button
                    key={framework.id}
                    onClick={() => setSelectedFramework(framework.id)}
                    className={`relative p-5 rounded-xl border text-left transition-all duration-200 group ${
                      selectedFramework === framework.id
                        ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                        : 'border-white/10 bg-card/50 hover:border-white/20 hover:bg-card/80'
                    }`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    {selectedFramework === framework.id && (
                      <motion.div
                        layoutId="selected-framework"
                        className="absolute inset-0 rounded-xl border-2 border-primary"
                        initial={false}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                    <div className="flex items-start gap-4 relative z-10">
                      <div className={`p-2 rounded-lg transition-colors ${
                        selectedFramework === framework.id ? 'bg-primary/20' : 'bg-muted/30 group-hover:bg-muted/50'
                      }`}>
                        {framework.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-foreground text-lg">{framework.name}</h3>
                          <span className="text-xs px-2 py-1 rounded-full bg-muted/50 text-muted-foreground">
                            {framework.runtime}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{framework.description}</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {framework.features.map((feature) => (
                            <span
                              key={feature}
                              className="text-xs px-2 py-0.5 rounded bg-muted/30 text-muted-foreground"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                      {selectedFramework === framework.id && (
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className="flex justify-end mt-6">
                <Button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Source Selection */}
          {step === 'source' && (
            <motion.div
              key="source"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="p-6"
            >
              <DialogHeader className="mb-6">
                <DialogTitle className="text-2xl font-bold text-foreground">
                  Import your project
                </DialogTitle>
                <DialogDescription className="text-muted-foreground mt-2 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                    {selectedFrameworkData?.icon && <span className="w-4 h-4">{selectedFrameworkData.icon}</span>}
                    {selectedFrameworkData?.name}
                  </span>
                  How would you like to add your code?
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 gap-3">
                {sourceOptions.map((source) => (
                  <motion.button
                    key={source.id}
                    onClick={() => setSelectedSource(source.id)}
                    className={`p-4 rounded-xl border text-left transition-all duration-200 flex items-center gap-4 ${
                      selectedSource === source.id
                        ? 'border-primary bg-primary/10'
                        : 'border-white/10 bg-card/50 hover:border-white/20 hover:bg-card/80'
                    }`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                      selectedSource === source.id ? 'bg-primary/20' : 'bg-muted/30'
                    }`}>
                      <source.icon className={`w-6 h-6 ${
                        selectedSource === source.id ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{source.name}</h3>
                      <p className="text-sm text-muted-foreground">{source.description}</p>
                    </div>
                    {selectedSource === source.id && (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    )}
                  </motion.button>
                ))}
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="ghost" onClick={prevStep} className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
                <Button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Configuration */}
          {step === 'configure' && (
            <motion.div
              key="configure"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="p-6"
            >
              <DialogHeader className="mb-6">
                <DialogTitle className="text-2xl font-bold text-foreground">
                  Configure your project
                </DialogTitle>
                <DialogDescription className="text-muted-foreground mt-2">
                  Set up your project details before deploying
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="projectName" className="text-foreground">Project Name</Label>
                  <Input
                    id="projectName"
                    placeholder="my-awesome-project"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    className="bg-card/50 border-white/10 focus:border-primary/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your project will be deployed at <span className="text-primary">{projectName || 'project-name'}.code2cloud.dev</span>
                  </p>
                </div>

                {selectedSource === 'github' && (
                  <div className="space-y-2">
                    <Label htmlFor="repoUrl" className="text-foreground">Repository URL</Label>
                    <Input
                      id="repoUrl"
                      placeholder="https://github.com/username/repo"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      className="bg-card/50 border-white/10 focus:border-primary/50"
                    />
                  </div>
                )}

                <div className="p-4 rounded-xl bg-muted/20 border border-white/5">
                  <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-primary" />
                    Build Settings
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Framework</span>
                      <span className="text-foreground">{selectedFrameworkData?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Runtime</span>
                      <span className="text-foreground">{selectedFrameworkData?.runtime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Build Command</span>
                      <span className="text-foreground font-mono text-xs">
                        {selectedFramework === 'nextjs' ? 'npm run build' : 'pip install -r requirements.txt'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="ghost" onClick={prevStep} className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
                <Button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                >
                  <Rocket className="w-4 h-4" />
                  Deploy
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Deploying */}
          {step === 'deploying' && (
            <motion.div
              key="deploying"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="p-8 flex flex-col items-center justify-center min-h-[300px]"
            >
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
                <div className="absolute inset-0 rounded-full animate-ping bg-primary/20" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Deploying your project...</h3>
              <p className="text-muted-foreground text-center">
                Setting up your {selectedFrameworkData?.name} application
              </p>
              <div className="mt-6 space-y-2 text-sm text-muted-foreground">
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Cloning repository
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Installing dependencies
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 }}
                  className="flex items-center gap-2"
                >
                  <Loader2 className="w-4 h-4 text-primary animate-spin" /> Building application
                </motion.p>
              </div>
            </motion.div>
          )}

          {/* Step 5: Success */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="p-8 flex flex-col items-center justify-center min-h-[300px]"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-400/20 flex items-center justify-center mb-6"
              >
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </motion.div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Deployment Successful!</h3>
              <p className="text-muted-foreground text-center mb-6">
                Your project is now live
              </p>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/30 text-foreground mb-6">
                <Globe className="w-4 h-4 text-primary" />
                <span className="font-mono text-sm">{projectName || 'new-project'}.code2cloud.dev</span>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleClose(false)}
                  className="border-white/10"
                >
                  Close
                </Button>
                <Button
                  className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  onClick={() => {
                    handleClose(false);
                    // Could navigate to project detail here
                  }}
                >
                  <Globe className="w-4 h-4" />
                  Visit Project
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
