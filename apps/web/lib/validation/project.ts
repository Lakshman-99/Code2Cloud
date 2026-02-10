import { z } from "zod";

export const projectSchema = z.object({
  projectName: z.string().min(1, "Project name is required").regex(/^[a-zA-Z0-9-]+$/, "Letters, numbers, and dashes only"),
  rootDirectory: z.string().min(1, "Root directory is required"),
  framework: z.string(),
  buildCommand: z.string().optional(),
  outputDirectory: z.string().optional(),
  installCommand: z.string().optional(),
  runCommand: z.string().optional(),
  pythonVersion: z.string().optional(),
  envVars: z.array(z.object({
    key: z.string(),
    value: z.string()
  }))
});

export type ProjectSchema = z.infer<typeof projectSchema>;
