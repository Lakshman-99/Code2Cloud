"use client";

import { motion } from "framer-motion";
import { StoragePanel } from "@/components/project/StoragePanel";

const Storage = () => {
  return (
    <div className="p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">Storage</h1>
        <p className="text-muted-foreground">
          Manage your database and file storage
        </p>
      </motion.div>

      <StoragePanel />
    </div>
  );
};

export default Storage;
