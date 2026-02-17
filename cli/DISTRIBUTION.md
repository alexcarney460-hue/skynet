# Skynet CLI Distribution

## Building for Distribution

### Option 1: Bundled Script (Lightweight)
For users with Node.js installed:

```bash
npm run bundle
# Produces: dist/skynet-bundle.js
# Users run: node skynet-bundle.js <command>
```

### Option 2: Standalone Executable (Recommended)
For users without Node.js:

#### Windows (.exe)
```bash
npm run build
# Then wrap with Node using package.json entry point
# OR use: npx -y pkg@latest dist/bin/skynet.js --target node18-win-x64 --output skynet.exe
```

#### macOS (Universal)
```bash
npm run build
# npx -y pkg@latest dist/bin/skynet.js --target node18-macos-arm64,node18-macos-x64 --output skynet-macos
```

#### Linux
```bash
npm run build
# npx -y pkg@latest dist/bin/skynet.js --target node18-linux-x64 --output skynet-linux
```

### Option 3: NPM Package
Publish to npm for easy installation:

```bash
npm publish --access public
# Users install via: npm install -g @skynet/cli
```

## Distribution Strategy (Recommended)

**For MVP:** Use Option 3 (NPM package)
- Simplest for users
- One-line install: `npm install -g @skynet/cli`
- Auto-updates via npm
- Works on all platforms with Node.js

**For Production:** Combine Options 2 & 3
- Publish npm package (default installation method)
- Provide standalone binaries on GitHub releases (for Node-less users)
- Use GitHub Actions to auto-build binaries on release

## Publishing to NPM

1. **Update version** in `package.json`
2. **Build**: `npm run build`
3. **Test locally**: `npm link` then `skynet status`
4. **Publish**: `npm publish --access public` (requires npm account)
5. **Users install**: `npm install -g @skynet/cli`

## Standalone Binary Build (GitHub Actions)

Example workflow (`.github/workflows/release.yml`):

```yaml
name: Release Binaries
on:
  release:
    types: [published]

jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        include:
          - os: windows-latest
            target: node18-win-x64
            output: skynet.exe
          - os: macos-latest
            target: node18-macos-x64
            output: skynet-macos
          - os: ubuntu-latest
            target: node18-linux-x64
            output: skynet-linux

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci && npm run build
      - run: npx -y pkg@latest dist/bin/skynet.js --target ${{ matrix.target }} --output ${{ matrix.output }}
      - uses: softprops/action-gh-release@v1
        with:
          files: ${{ matrix.output }}
```

## Quick Start for Users

### With Node.js (Easiest)
```bash
npm install -g @skynet/cli
skynet status
```

### Without Node.js (Standalone)
Download the binary for your OS from GitHub releases:
- Windows: `skynet.exe`
- macOS: `skynet-macos`
- Linux: `skynet-linux`

Then run directly:
```bash
./skynet status
```
