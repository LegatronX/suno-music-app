export interface Env {
  // D1 Database
  DB: D1Database;
  
  // KV Namespaces
  AUTH_KV: KVNamespace;
  SESSION_KV: KVNamespace;
  JOBS_KV: KVNamespace;
  
  // Environment variables
  SUNO_API_KEY: string;
  SESSION_SECRET?: string;
  FRONTEND_URL?: string;
}

export interface MusicGenerationJob {
  trackId: string;
  userId: string;
  projectId: string;
  prompt: string;
  title: string;
  style?: string;
  lyrics?: string;
  customMode: boolean;
}
