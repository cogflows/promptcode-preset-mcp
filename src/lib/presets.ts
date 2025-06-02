// src/lib/presets.ts
import path from "node:path";
import fs from "node:fs/promises";
import { encoding_for_model, TiktokenModel } from "tiktoken";

// --- 2.1 Load preset JSONs ------------------------------------
export interface FilePreset {
  name: string;
  description?: string;
  files: string[];
}

export async function loadPresets(workspace: string): Promise<FilePreset[]> {
  const presetDir = path.join(workspace, ".promptcode", "presets");
  const items = await fs.readdir(presetDir);
  const jsonFiles = items.filter(f => f.endsWith(".json"));

  return Promise.all(
    jsonFiles.map(async f => {
      const raw = await fs.readFile(path.join(presetDir, f), "utf8");
      return JSON.parse(raw) as FilePreset;
    }),
  );
}

// --- 2.2 Token counter (cached) -------------------------------
const encCache = new Map<string, ReturnType<typeof encoding_for_model>>();
export async function countTokensInFile(
  absFile: string,
  model: TiktokenModel = "gpt-4o",
): Promise<number> {
  let enc = encCache.get(model);
  if (!enc) {
    enc = encoding_for_model(model);
    encCache.set(model, enc);
  }
  const text = await fs.readFile(absFile, "utf8");
  return enc.encode(text).length; // ⚡ 50k-ops/sec on Node 20
}
