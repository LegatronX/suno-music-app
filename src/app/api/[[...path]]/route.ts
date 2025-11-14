import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { cors } from 'hono/cors';
import { getCookie, setCookie } from 'hono/cookie';
import type { Env, MusicGenerationJob } from '@/lib/server/types';
import {
  CreateProjectSchema,
  CreateTrackSchema,
} from '@suno-music-app/shared/index';
import {
import { getProjectsByUserId, createProject, getProjectById, getTracksByProjectId, createTrack, getTrackById, updateTrack, addFavorite, removeFavorite, getFavoritesByUserId, getUserById } from '@/lib/server/db';tions/api/db';
import {
import { handleLogin, handleVerifyMagicLink, getUserFromSession, deleteSession } from '@/lib/server/auth';

export const runtime = 'edge';

const app = new Hono<{ Bindings: Env }>().basePath('/api');

// ... (le reste du code de l'API Hono reste identique)

// Routes d'authentification
app.post('/auth/login', async (c) => {
  try {
    const { email } = await c.req.json();
    
    if (!email || typeof email !== 'string') {
      return c.json({ error: 'Email is required' }, 400);
    }

    const result = await handleLogin(c.env, email);
    return c.json(result);
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ... (toutes les autres routes)

app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
