"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Folder, FileCode, ChevronRight, ChevronLeft } from "lucide-react";
import { SiGithub } from "react-icons/si"; // Consistent icon usage
import { GitRepository } from "@/types/git";
import { cn } from "@/lib/utils";
import { useGitTree } from "@/hooks/use-git"; // <--- Import the hook
import { RootDirectorySkeleton } from "../ui/skeleton";

interface RootDirectorySelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repo: GitRepository;
  activeInstallationId: string;
  currentRoot: string;
  onSelect: (path: string) => void;
}

export const RootDirectorySelector = ({ 
  open, 
  onOpenChange, 
  repo, 
  activeInstallationId,
  currentRoot,
  onSelect 
}: RootDirectorySelectorProps) => {
  const [currentPath, setCurrentPath] = useState(currentRoot === "./" ? "" : currentRoot);
  const [selectedPath, setSelectedPath] = useState(currentRoot === "./" ? "" : currentRoot);

  // USE THE HOOK
  const { files, isLoading } = useGitTree(
    open ? activeInstallationId : undefined, // Only fetch if open
    repo.fullName, 
    currentPath
  );

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
  };

  const handleUp = () => {
    if (!currentPath) return;
    const parent = currentPath.split("/").slice(0, -1).join("/");
    setCurrentPath(parent);
  };

  const handleConfirm = () => {
    onSelect(selectedPath || "./");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-[#0A0A0A] border border-white/10 text-white p-0 gap-0 shadow-2xl">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-lg font-semibold flex items-center justify-center gap-2">
            Root Directory
          </DialogTitle>
          <p className="text-center text-sm text-muted-foreground mt-2">
            Select the directory where your source code is located.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4 text-xs font-mono text-emerald-400 bg-emerald-400/10 py-1 px-3 rounded-full w-fit mx-auto border border-emerald-400/20">
            <SiGithub className="w-3 h-3" /> {repo.fullName}
          </div>
        </DialogHeader>

        {/* BREADCRUMBS */}
        <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2 text-sm bg-white/[0.02]">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 hover:bg-white/10" 
            onClick={handleUp} 
            disabled={!currentPath}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="font-mono text-muted-foreground">/</span>
          <span className="font-mono text-white truncate max-w-[300px]">{currentPath || ""}</span>
        </div>

        {/* FILE LIST */}
        <ScrollArea className="h-[300px] p-2 bg-[#0A0A0A]">
          {isLoading ? (
            <RootDirectorySkeleton />
          ) : (
            <div className="space-y-1">
              {/* CURRENT DIR OPTION */}
              <div 
                onClick={() => setSelectedPath(currentPath)}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors group",
                  selectedPath === currentPath ? "bg-white/10" : "hover:bg-white/5"
                )}
              >
                <div className={cn(
                  "w-4 h-4 rounded-full border flex items-center justify-center",
                  selectedPath === currentPath ? "border-emerald-500 bg-emerald-500" : "border-white/30 group-hover:border-white/50"
                )}>
                  {selectedPath === currentPath && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
                </div>
                <Folder className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-mono flex-1 text-white/70">.</span>
                <span className="text-[10px] text-muted-foreground bg-white/5 px-1.5 rounded border border-white/5">Current</span>
              </div>

              {files?.map((file) => (
                <div 
                  key={file.path}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-white/5 group transition-colors"
                >
                  <div 
                    className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
                    onClick={() => {
                      if (file.type === 'dir') setSelectedPath(file.path);
                    }}
                  >
                    {/* Radio Button */}
                    {file.type === 'dir' ? (
                      <div className={cn(
                        "w-4 h-4 rounded-full border flex items-center justify-center transition-colors shrink-0",
                        selectedPath === file.path ? "border-emerald-500 bg-emerald-500" : "border-white/30 group-hover:border-white/50"
                      )}>
                        {selectedPath === file.path && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
                      </div>
                    ) : (
                      <div className="w-4 h-4 shrink-0" /> 
                    )}

                    {/* Icon */}
                    {file.type === 'dir' ? <Folder className="w-4 h-4 text-blue-400 shrink-0" /> : <FileCode className="w-4 h-4 text-white/30 shrink-0" />}
                    
                    <span className={cn("text-sm truncate", file.type === 'dir' ? "text-white" : "text-white/50")}>
                      {file.name}
                    </span>
                  </div>

                  {/* Drill Down Arrow */}
                  {file.type === 'dir' && (
                    <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-white/10" onClick={() => handleNavigate(file.path)}>
                      <ChevronRight className="w-4 h-4 text-white/30" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t border-white/10 flex justify-end gap-2 bg-[#0A0A0A]">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="h-8 text-xs hover:bg-white/10 text-white/70">Cancel</Button>
          <Button onClick={handleConfirm} className="h-8 text-xs bg-white text-black hover:bg-white/90 font-medium">Continue</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};