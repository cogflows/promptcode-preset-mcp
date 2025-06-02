#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPresets, loadPreset } from "./presetManager.js";
import { countTokensInFile } from "./tokenCounter.js";
import { buildTree, treeToString } from "./fileTree.js";

// Get package version
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(await fs.readFile(path.join(__dirname, '..', 'package.json'), 'utf-8'));
const VERSION = packageJson.version;

const WORKSPACE = process.env.WORKSPACE ?? process.cwd();

async function listPresets() {
  try {
    const presets = await loadPresets(WORKSPACE);
    
    // Enrich with token counts
    const enriched = await Promise.all(
      presets.map(async (preset) => {
        const totalTokens = await preset.files.reduce(async (sumPromise, file) => {
          const sum = await sumPromise;
          const tokens = await countTokensInFile(path.join(WORKSPACE, file));
          return sum + tokens;
        }, Promise.resolve(0));
        
        return {
          name: preset.name,
          fileCount: preset.files.length,
          totalTokens
        };
      })
    );
    
    console.log(JSON.stringify(enriched, null, 2));
  } catch (error) {
    console.error("Error listing presets:", error);
    process.exit(1);
  }
}

async function getPreset(name: string) {
  try {
    const preset = await loadPreset(WORKSPACE, name);
    if (!preset) {
      console.error(`Preset "${name}" not found`);
      process.exit(1);
    }
    
    // First, gather file info with tokens for the tree
    const fileInfo = await Promise.all(
      preset.files.map(async f => ({
        path: f,
        tokens: await countTokensInFile(path.join(WORKSPACE, f)),
      })),
    );

    // Build and render the file tree
    const tree = buildTree(WORKSPACE, fileInfo);
    const treeStr = treeToString(tree);

    // Concatenate all files with tree at the beginning
    let output = "# File Tree\n\n";
    output += treeStr;
    output += "\n\n# File Contents\n\n";
    
    for (const file of preset.files) {
      const filepath = path.join(WORKSPACE, file);
      const content = await fs.readFile(filepath, "utf-8");
      output += `// --- ${file} ---\n${content}\n\n`;
    }
    
    // Create temp file
    const os = await import("node:os");
    const tmpDir = os.tmpdir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const tmpFile = path.join(tmpDir, `preset-${name}-${timestamp}.txt`);
    
    // Write to temp file
    await fs.writeFile(tmpFile, output);
    console.log(tmpFile);
    
    // Try to open the file if --open flag is passed
    if (process.argv.includes("--open")) {
      try {
        const { default: open } = await import("open");
        await open(tmpFile);
      } catch {
        // If open fails, just continue
      }
    }
  } catch (error) {
    console.error("Error getting preset:", error);
    process.exit(1);
  }
}

async function getPresetTree(name: string) {
  try {
    const preset = await loadPreset(WORKSPACE, name);
    if (!preset) {
      console.error(`Preset "${name}" not found`);
      process.exit(1);
    }
    
    // Gather file info with tokens for the tree
    const fileInfo = await Promise.all(
      preset.files.map(async f => ({
        path: f,
        tokens: await countTokensInFile(path.join(WORKSPACE, f)),
      })),
    );

    // Build and render the file tree
    const tree = buildTree(WORKSPACE, fileInfo);
    const treeStr = treeToString(tree);
    
    console.log(treeStr);
  } catch (error) {
    console.error("Error getting preset tree:", error);
    process.exit(1);
  }
}

// Parse command line arguments
const command = process.argv[2];
const arg = process.argv[3];

// Handle version flag
if (command === '--version' || command === '-v') {
  console.log(VERSION);
  process.exit(0);
}

switch (command) {
  case "ls":
  case "list":
    await listPresets();
    break;
    
  case "get":
    if (!arg) {
      console.error("Usage: pnpm cli get <preset-name>");
      process.exit(1);
    }
    await getPreset(arg);
    break;
    
  case "tree":
    if (!arg) {
      console.error("Usage: pnpm cli tree <preset-name>");
      process.exit(1);
    }
    await getPresetTree(arg);
    break;
    
  default:
    console.log(`promptcode v${VERSION}\n`);
    console.log("Usage:");
    console.log("  promptcode ls                 - List all presets");
    console.log("  promptcode get <name>         - Export preset to temp file and print path");
    console.log("  promptcode get <name> --open  - Export preset and open in default editor");
    console.log("  promptcode tree <name>        - Display file tree for preset");
    console.log("  promptcode --version          - Show version information");
    console.log("");
    console.log("Environment:");
    console.log("  WORKSPACE=<path>              - Set workspace directory (default: current directory)");
    process.exit(1);
}