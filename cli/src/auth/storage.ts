import { homedir } from 'os';
import { join } from 'path';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { AuthToken } from '../types.js';

const SKYNET_DIR = join(homedir(), '.skynet');
const AUTH_FILE = join(SKYNET_DIR, 'auth.json');

function ensureDir() {
  if (!existsSync(SKYNET_DIR)) {
    mkdirSync(SKYNET_DIR, { recursive: true });
  }
}

export function saveToken(token: AuthToken): void {
  ensureDir();
  writeFileSync(AUTH_FILE, JSON.stringify(token, null, 2), 'utf-8');
}

export function getToken(): AuthToken | null {
  if (!existsSync(AUTH_FILE)) {
    return null;
  }

  try {
    const data = readFileSync(AUTH_FILE, 'utf-8');
    const token: AuthToken = JSON.parse(data);

    if (token.expires_at < Date.now()) {
      clearToken();
      return null;
    }

    return token;
  } catch {
    return null;
  }
}

export function clearToken(): void {
  if (existsSync(AUTH_FILE)) {
    try {
      require('fs').unlinkSync(AUTH_FILE);
    } catch {
      // ignore
    }
  }
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}
