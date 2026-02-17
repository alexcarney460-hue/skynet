import { clearToken } from '../auth/storage.js';
import { renderPanel, renderSuccess, renderInfo } from '../output/renderer.js';

export async function authLoginCommand(): Promise<string> {
  // In a real implementation, this would:
  // 1. POST to /auth/login with email
  // 2. Wait for magic link confirmation
  // 3. Store token

  const rows = [
    { key: 'Status', value: 'NOT YET IMPLEMENTED' },
    { key: 'Available In', value: 'Skynet CLI v1.1' },
  ];

  return renderPanel('AUTHENTICATION', rows);
}

export async function authLogoutCommand(): Promise<string> {
  clearToken();

  const rows = [
    { key: 'Status', value: 'LOGGED OUT' },
    { key: 'Auth Token', value: 'CLEARED' },
  ];

  const output = renderPanel('AUTHENTICATION', rows);
  return output + '\n' + renderSuccess('Session cleared');
}
