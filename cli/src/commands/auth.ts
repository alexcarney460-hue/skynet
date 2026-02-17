import { clearToken, saveToken } from '../auth/storage.js';
import { section, success, error, DIVIDER } from '../output/format.js';
import { AuthToken } from '../types.js';

export async function authLoginCommand(): Promise<string> {
  // In a real implementation, this would:
  // 1. POST to /auth/login with email
  // 2. Wait for magic link confirmation
  // 3. Store token
  
  let output = '';
  output += section('AUTHENTICATION') + '\n\n';
  output += 'Magic link authentication not yet implemented.\n';
  output += 'Coming in Skynet CLI v1.1\n';
  output += DIVIDER;

  return output;
}

export async function authLogoutCommand(): Promise<string> {
  clearToken();

  let output = '';
  output += section('AUTHENTICATION') + '\n';
  output += success('Logged out successfully') + '\n';
  output += DIVIDER;

  return output;
}
