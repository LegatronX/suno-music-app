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
  getProjectsByUserId,
  createProject,
  getProjectById,
  getTracksByProjectId,
  createTrack,
  getTrackById,
  updateTrack,
  addFavorite,
  removeFavorite,
  getFavoritesByUserId,
  getUserById,
} from '@/lib/server/db';
import {
  handleLogin,
  handleVerifyMagicLink,
  getUserFromSession,
  deleteSession,
} from '@/lib/server/auth';

export const runtime = 'edge';

type Variables = {
  userId: string;
};

const app = new Hono<{ Bindings: Env; Variables: Variables }>().basePath('/api');

// CORS middleware
app.use('/*', cors({
  origin: (origin) => origin,
  credentials: true,
}));

// Middleware d'authentification
async function authMiddleware(c: any, next: any) {
  const sessionId = getCookie(c, 'session_id');
  
  if (!sessionId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const userId = await getUserFromSession(c.env, sessionId);
  
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  c.set('userId', userId);
  await next();
}

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

app.get('/auth/verify', async (c) => {
  try {
    const token = c.req.query('token');
    
    if (!token) {
      return c.json({ error: 'Token is required' }, 400);
    }

    const result = await handleVerifyMagicLink(c.env, token);
    
    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    // Définir le cookie de session
    setCookie(c, 'session_id', result.sessionId!, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      maxAge: 30 * 24 * 60 * 60, // 30 jours
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Verify error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.post('/auth/logout', async (c) => {
  try {
    const sessionId = getCookie(c, 'session_id');
    
    if (sessionId) {
      await deleteSession(c.env, sessionId);
    }

    setCookie(c, 'session_id', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      maxAge: 0,
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.get('/auth/me', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const user = await getUserById(c.env.DB, userId);
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Routes des projets
app.get('/projects', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const projects = await getProjectsByUserId(c.env.DB, userId);
    return c.json({ projects });
  } catch (error) {
    console.error('Get projects error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.post('/projects', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    
    const validated = CreateProjectSchema.parse(body);
    const project = await createProject(
      c.env.DB,
      userId,
      validated.name,
      validated.description
    );

    return c.json({ project }, 201);
  } catch (error) {
    console.error('Create project error:', error);
    return c.json({ error: 'Invalid request' }, 400);
  }
});

app.get('/projects/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const projectId = c.req.param('id');
    
    const project = await getProjectById(c.env.DB, projectId);
    
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    if (project.user_id !== userId) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    return c.json({ project });
  } catch (error) {
    console.error('Get project error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Routes des tracks
app.get('/projects/:id/tracks', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const projectId = c.req.param('id');
    
    const project = await getProjectById(c.env.DB, projectId);
    
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    if (project.user_id !== userId) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const tracks = await getTracksByProjectId(c.env.DB, projectId);
    return c.json({ tracks });
  } catch (error) {
    console.error('Get tracks error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.post('/tracks', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    
    const validated = CreateTrackSchema.parse(body);
    
    // Vérifier que le projet appartient à l'utilisateur
    const project = await getProjectById(c.env.DB, validated.project_id);
    
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    if (project.user_id !== userId) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    // Créer le track
    const track = await createTrack(
      c.env.DB,
      userId,
      validated.project_id,
      validated.title,
      validated.prompt,
      validated.style,
      validated.lyrics
    );

    // Ajouter le job au KV store pour traitement par le cron
    const job: MusicGenerationJob = {
      trackId: track.id,
      userId,
      projectId: validated.project_id,
      prompt: validated.prompt,
      title: validated.title,
      style: validated.style,
      lyrics: validated.lyrics,
      customMode: validated.custom_mode,
    };

    await c.env.JOBS_KV.put(`job:${track.id}`, JSON.stringify(job));

    return c.json({ track }, 201);
  } catch (error) {
    console.error('Create track error:', error);
    return c.json({ error: 'Invalid request' }, 400);
  }
});

app.get('/tracks/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const trackId = c.req.param('id');
    
    const track = await getTrackById(c.env.DB, trackId);
    
    if (!track) {
      return c.json({ error: 'Track not found' }, 404);
    }

    if (track.user_id !== userId) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    return c.json({ track });
  } catch (error) {
    console.error('Get track error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Routes des favoris
app.get('/favorites', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const tracks = await getFavoritesByUserId(c.env.DB, userId);
    return c.json({ tracks });
  } catch (error) {
    console.error('Get favorites error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.post('/favorites', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const { track_id } = await c.req.json();
    
    if (!track_id) {
      return c.json({ error: 'Track ID is required' }, 400);
    }

    // Vérifier que le track appartient à l'utilisateur
    const track = await getTrackById(c.env.DB, track_id);
    
    if (!track) {
      return c.json({ error: 'Track not found' }, 404);
    }

    if (track.user_id !== userId) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const favorite = await addFavorite(c.env.DB, userId, track_id);
    return c.json({ favorite }, 201);
  } catch (error) {
    console.error('Add favorite error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

app.delete('/favorites/:trackId', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const trackId = c.req.param('trackId');
    
    await removeFavorite(c.env.DB, userId, trackId);
    return c.json({ success: true });
  } catch (error) {
    console.error('Remove favorite error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
