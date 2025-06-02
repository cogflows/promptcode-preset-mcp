# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a preset management system for code prompting, designed to manage collections of files that can be quickly assembled into prompts for AI/LLM interactions. It provides both an HTTP API and CLI for managing and retrieving file presets.

## Architecture

The codebase is organized as follows:
- `server.ts` - Express HTTP server with REST API endpoints for preset management
- `cli.ts` - Command-line interface that interacts with the server
- `presetManager.ts` - Core preset management logic, handles loading/saving presets from `.promptcode/presets/` directory
- `tokenCounter.ts` - Token counting with caching, uses tiktoken for OpenAI model compatibility
- `types/filePreset.ts` - TypeScript interface definitions

## Important Issues to Fix

1. **Import Error in server.ts**: Line imports from `"./lib/presets.js"` which doesn't exist. Should import from `presetManager.ts` and `tokenCounter.ts`
2. **Missing fs import in server.ts**: Uses `fs` module but doesn't import it
3. **Missing dependencies in cli.ts**: Imports `execa` and `open` packages not listed in package.json

## Development Commands

Currently no build/dev scripts are defined. You'll need to add:
```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",
    "dev": "nodemon --exec ts-node src/server.ts"
  }
}
```

## API Endpoints

- `GET /presets` - Lists all presets with token counts
- `GET /presets/:name` - Detailed view of a specific preset
- `POST /presets/:name/context` - Returns concatenated file contents for a preset

## Key Implementation Details

- Presets are stored as JSON files in `.promptcode/presets/` directory
- Token counting uses gpt-tokenizer with sophisticated caching (memory + disk persistence)
- CLI requires external tools: curl, jq, and uses the `open` command
- Server defaults to port 8787