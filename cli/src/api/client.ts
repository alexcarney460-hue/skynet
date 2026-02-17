import { Artifact, Entitlements, ApiResponse } from '../types.js';

const API_BASE = process.env.SKYNET_API_URL || 'https://skynet.io/api';

export class SkynetClient {
  private token?: string;

  constructor(token?: string) {
    this.token = token;
  }

  setToken(token: string) {
    this.token = token;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, { ...options, headers });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized. Run: skynet auth login');
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json() as ApiResponse<T>;
      if (data.status === 'error') {
        throw new Error(data.message || 'API error');
      }

      return data.data as T;
    } catch (err) {
      throw new Error(`API request failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async listArtifacts(): Promise<Artifact[]> {
    return this.request<Artifact[]>('/v1/artifacts');
  }

  async getArtifact(slug: string): Promise<Artifact & { entitled: boolean }> {
    return this.request(`/v1/artifacts/${slug}`);
  }

  async getEntitlements(): Promise<Entitlements> {
    return this.request('/v1/me/entitlements');
  }
}
