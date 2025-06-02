# promptcode-preset-mcp

A CLI tool for managing file presets for code prompting. Quickly assemble collections of files from your codebase into prompts for AI/LLM interactions.

## Installation

### Global installation (recommended)

```bash
# Install from npm
pnpm install -g @cogflows/promptcode-preset-mcp

# Or install from GitHub
pnpm install -g github:cogflows/promptcode-preset-mcp
```

### Local development

```bash
# Clone the repository
git clone https://github.com/cogflows/promptcode-preset-mcp.git
cd promptcode-preset-mcp

# Install dependencies
pnpm install

# Build and link globally
pnpm build
pnpm link --global
```

## Usage

### List presets

```bash
promptcode ls
```

### Get preset content

```bash
# Export to temp file and print path
promptcode get <preset-name>

# Export and open in default editor
promptcode get <preset-name> --open
```

### Set workspace directory

```bash
# Use environment variable
WORKSPACE=/path/to/project promptcode ls
WORKSPACE=/path/to/project promptcode get core
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
   promptcode ls
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
   promptcode get api
   ```
   Output: `/var/folders/.../T/preset-api-2025-06-02T19-12-41-238Z.txt`

5. Use the exported file with your AI tool:
   ```bash
   # Copy to clipboard (macOS)
   cat $(promptcode get api) | pbcopy
   
   # Or open directly
   promptcode get api --open
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