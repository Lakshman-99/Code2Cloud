import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Plus, Trash2, Shield } from 'lucide-react';
import { useMockStore } from '@/stores/useMockStore';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

export const EnvVarsPanel = () => {
  const { envVars } = useMockStore();
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  const toggleVisibility = (id: string) => {
    setVisibleKeys(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSave = () => {
    toast.success('Environment variables saved', {
      description: 'Changes will be applied on next deployment',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Environment Variables</h3>
            <p className="text-sm text-muted-foreground">Encrypted secrets and configuration</p>
          </div>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Variable
        </Button>
      </div>

      {/* Variables Table */}
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Key</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Value</th>
              <th className="text-center px-6 py-4 text-sm font-medium text-muted-foreground">Prod</th>
              <th className="text-center px-6 py-4 text-sm font-medium text-muted-foreground">Preview</th>
              <th className="text-center px-6 py-4 text-sm font-medium text-muted-foreground">Dev</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody>
            {envVars.map((envVar, index) => (
              <motion.tr
                key={envVar.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-white/5 hover:bg-white/5 transition-colors group"
              >
                <td className="px-6 py-4">
                  <code className="text-sm text-foreground font-mono">{envVar.key}</code>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <code className="text-sm text-muted-foreground font-mono">
                      {visibleKeys.has(envVar.id) ? envVar.value : '••••••••••••'}
                    </code>
                    <button
                      onClick={() => toggleVisibility(envVar.id)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {visibleKeys.has(envVar.id) ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <Checkbox
                    checked={envVar.environments.includes('production')}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                </td>
                <td className="px-6 py-4 text-center">
                  <Checkbox
                    checked={envVar.environments.includes('preview')}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                </td>
                <td className="px-6 py-4 text-center">
                  <Checkbox
                    checked={envVar.environments.includes('development')}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                </td>
                <td className="px-6 py-4">
                  <button className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
          Save Changes
        </Button>
      </div>
    </motion.div>
  );
};
