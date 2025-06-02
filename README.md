# promptcode-preset-mcp

A CLI tool for managing file presets for code prompting. Quickly assemble collections of files from your codebase into prompts for AI/LLM interactions.

## Installation

```bash
# Install dependencies
pnpm install
```

## Usage

### List presets

```bash
pnpm cli ls
```

### Get preset content

```bash
# Export to temp file and print path
pnpm cli get <preset-name>

# Export and open in default editor
pnpm cli get <preset-name> --open
```

### Set workspace directory

```bash
# Use environment variable
WORKSPACE=/path/to/project pnpm cli ls
WORKSPACE=/path/to/project pnpm cli get core
```

## Creating Presets

Presets are JSON files stored in `.promptcode/presets/` within your workspace directory.

Example preset file `.promptcode/presets/core.json`:

```json
{
  "name": "core",
  "files": [
    "src/main.ts",
    "src/utils.ts",
    "README.md"
  ]
}
```

## Example Workflow

1. Create a presets directory in your project:
   ```bash
   mkdir -p .promptcode/presets
   ```

2. Create preset files:
   ```bash
   echo '{
     "name": "api",
     "files": ["src/api/index.ts", "src/api/routes.ts", "src/types.ts"]
   }' > .promptcode/presets/api.json
   ```

3. List available presets:
   ```bash
   pnpm cli ls
   ```
   Output:
   ```json
   [
     {
       "name": "api",
       "fileCount": 3,
       "totalTokens": 1250
     }
   ]
   ```

4. Export preset content:
   ```bash
   pnpm cli get api
   ```
   Output: `/var/folders/.../T/preset-api-2025-06-02T19-12-41-238Z.txt`

5. Use the exported file with your AI tool:
   ```bash
   # Copy to clipboard (macOS)
   cat $(pnpm cli get api) | pbcopy
   
   # Or open directly
   pnpm cli get api --open
   ```

## Features

- **Token counting**: Uses OpenAI's tiktoken to count tokens in files
- **Caching**: Token counts are cached for performance
- **Workspace support**: Work with presets from any project directory
- **Clean output**: Returns just the file path for easy scripting

## Development

The project is written in TypeScript and uses:
- Node.js ES modules
- tiktoken for token counting
- TypeScript for type safety

### Project Structure

```
src/
├── cli.ts           # CLI interface
├── presetManager.ts # Preset loading/saving logic
├── tokenCounter.ts  # Token counting with caching
└── types/
    └── filePreset.ts # TypeScript interfaces
```