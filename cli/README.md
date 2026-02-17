# Skynet CLI

Terminal-first interface for Skynet artifact registry.

## Install

```bash
cd cli
npm install
npm run build
npm link
```

Or from distribution:
```bash
skynet --version
```

## Commands

```
skynet status              System status + auth state
skynet artifacts           List all artifacts
skynet artifact <slug>     Show artifact detail
  --content                Show full content if unlocked
skynet entitlements        Show user unlocks
skynet auth:login          Authenticate with magic link
skynet auth:logout         Clear auth token
```

## Development

```bash
npm run dev -- status
npm run dev -- artifacts
npm run dev -- artifact memory-optimization-v1 --content
```

## Build Standalone Binary

```bash
npm run pack
# Outputs: skynet (Linux/macOS) or skynet.exe (Windows)
```

## Environment

```bash
SKYNET_API_URL=http://localhost:3000/api  # Optional, defaults to https://skynet.io/api
```

## Philosophy

- Minimal dependencies (Commander.js only)
- No decorations, no ASCII art
- Structured output optimized for terminals
- All business logic on server (API calls only)
- Clean, system-like interface
