import fs from "node:fs/promises";
import path from "node:path";
import { FilePreset } from "./types/filePreset.js";

const PRESETS_DIR = ".promptcode/presets";

export async function loadPresets(workspace: string): Promise<FilePreset[]> {
  const presetsPath = path.join(workspace, PRESETS_DIR);
  
  try {
    const files = await fs.readdir(presetsPath);
    const jsonFiles = files.filter(f => f.endsWith(".json"));
    
    const presets = await Promise.all(
      jsonFiles.map(async (file) => {
        const content = await fs.readFile(path.join(presetsPath, file), "utf-8");
        return JSON.parse(content) as FilePreset;
      })
    );
    
    return presets;
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export async function loadPreset(workspace: string, name: string): Promise<FilePreset | null> {
  const presets = await loadPresets(workspace);
  return presets.find(p => p.name === name) || null;
}

export async function savePreset(workspace: string, preset: FilePreset): Promise<void> {
  const presetsPath = path.join(workspace, PRESETS_DIR);
  
  // Ensure directory exists
  await fs.mkdir(presetsPath, { recursive: true });
  
  // Save preset
  const filename = `${preset.name.replace(/[^a-z0-9-_]/gi, "_")}.json`;
  const filepath = path.join(presetsPath, filename);
  await fs.writeFile(filepath, JSON.stringify(preset, null, 2));
}