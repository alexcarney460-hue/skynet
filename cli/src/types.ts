export interface Artifact {
  id: string;
  slug: string;
  category: string;
  title: string;
  description: string;
  preview_excerpt: string;
  price_cents: number;
  version: string;
  created_at: string;
  content_text?: string;
}

export interface Entitlements {
  user_id: string;
  full_unlock: boolean;
  unlocked_artifacts: string[];
}

export interface SystemStatus {
  registry_state: string;
  artifacts_online: number;
  auth_state: string;
  user?: string;
  api_version: string;
  cli_version: string;
}

export interface ApiResponse<T> {
  status: string;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthToken {
  access_token: string;
  user_id: string;
  expires_at: number;
}
