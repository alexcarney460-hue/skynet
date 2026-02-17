import { homedir } from 'os';
import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';

export type OptimizationMode = 'MINIMAL' | 'BALANCED' | 'AGGRESSIVE';

interface ConfigFile {
  mode: OptimizationMode;
  updatedAt: string;
}

const CONFIG_DIR = join(homedir(), '.skynet');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');
const DEFAULT_MODE: OptimizationMode = 'BALANCED';

/**
 * Ensure config directory exists.
 */
function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

/**
 * Get current mode (with fallback to default).
 */
export function getMode(): OptimizationMode {
  ensureConfigDir();

  if (!existsSync(CONFIG_FILE)) {
    // Create default config
    const defaultConfig: ConfigFile = {
      mode: DEFAULT_MODE,
      updatedAt: new Date().toISOString(),
    };
    writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
    return DEFAULT_MODE;
  }

  try {
    const content = readFileSync(CONFIG_FILE, 'utf-8');
    const config: ConfigFile = JSON.parse(content);
    return config.mode || DEFAULT_MODE;
  } catch {
    return DEFAULT_MODE;
  }
}

/**
 * Set mode persistently.
 */
export function setMode(mode: OptimizationMode): void {
  ensureConfigDir();

  const config: ConfigFile = {
    mode,
    updatedAt: new Date().toISOString(),
  };

  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}
