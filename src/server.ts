import express, { Request, Response, NextFunction } from "express";
import { loadPresets, countTokensInFile } from "./lib/presets.js";
import path from "node:path";
import fs from "node:fs/promises";
import { z } from "zod";

const app = express();
app.use(express.json());              // parses JSON bodies
const PORT = process.env.PORT ?? 8787;
const WORKSPACE = process.env.WORKSPACE ?? process.cwd();

/**
 * GET /presets  – list names, optional description, token & file counts
 */
app.get("/presets", async (_, res, next) => {
  try {
    const presets = await loadPresets(WORKSPACE);
    const enriched = await Promise.all(
      presets.map(async p => {
        const counts = await Promise.all(
          p.files.map(f =>countTokensInFile(path.join(WORKSPACE, f))),
        );
        return {
          name: p.name,
          description: p.description ?? "",
          fileCount: p.files.length,
          totalTokens: counts.reduce((a, b) => a + b, 0),
        };
      }),
    );
    res.json(enriched);
  } catch (err) { next(err); }
});

/**
 * GET /presets/:name  – detailed per-file token breakdown
 */
(app as any).get(`/presets/:name`, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const name = req.params.name;
    const preset = (await loadPresets(WORKSPACE)).find(p => p.name === name);
    if (!preset) return res.status(404).json({ error: "Not found" });

    const files = await Promise.all(
      preset.files.map(async f => ({
        path: f,
        tokens: await countTokensInFile(path.join(WORKSPACE, f)),
      })),
    );
    res.json({ ...preset, files, totalTokens: files.reduce((s, f) => s + f.tokens, 0) });
  } catch (err) { next(err); }
});

/**
 * POST /presets/:name/context  – returns concatenated prompt text
 *    body: { model?: "gpt-4o" | "claude-3-sonnet-20240229" }
 */
(app as any).post(`/presets/:name/context`, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = z.object({ model: z.string().optional() }).parse(req.body);
    const name = req.params.name;
    const preset = (await loadPresets(WORKSPACE)).find(p => p.name === name);
    if (!preset) return res.status(404).json({ error: "Not found" });

    // stream each file with minimal overhead
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    for (const rel of preset.files) {
      const abs = path.join(WORKSPACE, rel);
      const data = await fs.readFile(abs);
      res.write(data);
      res.write("\n\n"); // guardrail between files
    }
    res.end();
  } catch (err) { next(err); }
});

app.listen(PORT, () => console.log(`🚀 Preset server on http://localhost:${PORT}`));
