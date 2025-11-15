import type { D1Database } from '@cloudflare/workers-types';
import type { Env } from './types';
import type { User, Project, Track, Favorite } from '@suno-music-app/shared/index';

/**
 * Génère un ID unique simple
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Récupère un utilisateur par email
 */
export async function getUserByEmail(db: D1Database, email: string): Promise<User | null> {
  const result = await db
    .prepare('SELECT * FROM users WHERE email = ?')
    .bind(email)
    .first();
  
  return result as User | null;
}

/**
 * Crée un nouvel utilisateur
 */
export async function createUser(db: D1Database, email: string): Promise<User> {
  const now = Date.now();
  const user: User = {
    id: generateId(),
    email,
    created_at: now,
    updated_at: now,
  };

  await db
    .prepare('INSERT INTO users (id, email, created_at, updated_at) VALUES (?, ?, ?, ?)')
    .bind(user.id, user.email, user.created_at, user.updated_at)
    .run();

  return user;
}

/**
 * Récupère un utilisateur par ID
 */
export async function getUserById(db: D1Database, userId: string): Promise<User | null> {
  const result = await db
    .prepare('SELECT * FROM users WHERE id = ?')
    .bind(userId)
    .first();
  
  return result as User | null;
}

/**
 * Récupère tous les projets d'un utilisateur
 */
export async function getProjectsByUserId(db: D1Database, userId: string): Promise<Project[]> {
  const result = await db
    .prepare('SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC')
    .bind(userId)
    .all();
  
  return result.results as Project[];
}

/**
 * Crée un nouveau projet
 */
export async function createProject(
  db: D1Database,
  userId: string,
  name: string,
  description?: string
): Promise<Project> {
  const now = Date.now();
  const project: Project = {
    id: generateId(),
    user_id: userId,
    name,
    description: description || null,
    created_at: now,
    updated_at: now,
  };

  await db
    .prepare('INSERT INTO projects (id, user_id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(project.id, project.user_id, project.name, project.description, project.created_at, project.updated_at)
    .run();

  return project;
}

/**
 * Récupère un projet par ID
 */
export async function getProjectById(db: D1Database, projectId: string): Promise<Project | null> {
  const result = await db
    .prepare('SELECT * FROM projects WHERE id = ?')
    .bind(projectId)
    .first();
  
  return result as Project | null;
}

/**
 * Récupère tous les tracks d'un projet
 */
export async function getTracksByProjectId(db: D1Database, projectId: string): Promise<Track[]> {
  const result = await db
    .prepare('SELECT * FROM tracks WHERE project_id = ? ORDER BY created_at DESC')
    .bind(projectId)
    .all();
  
  return result.results as Track[];
}

/**
 * Crée un nouveau track
 */
export async function createTrack(
  db: D1Database,
  userId: string,
  projectId: string,
  title: string,
  prompt: string,
  style?: string,
  lyrics?: string
): Promise<Track> {
  const now = Date.now();
  const track: Track = {
    id: generateId(),
    project_id: projectId,
    user_id: userId,
    suno_id: null,
    title,
    prompt,
    style: style || null,
    lyrics: lyrics || null,
    audio_url: null,
    image_url: null,
    duration: null,
    status: 'pending',
    error_message: null,
    created_at: now,
    updated_at: now,
  };

  await db
    .prepare(`
      INSERT INTO tracks (
        id, project_id, user_id, suno_id, title, prompt, style, lyrics,
        audio_url, image_url, duration, status, error_message, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      track.id, track.project_id, track.user_id, track.suno_id, track.title,
      track.prompt, track.style, track.lyrics, track.audio_url, track.image_url,
      track.duration, track.status, track.error_message, track.created_at, track.updated_at
    )
    .run();

  return track;
}

/**
 * Met à jour un track
 */
export async function updateTrack(
  db: D1Database,
  trackId: string,
  updates: Partial<Track>
): Promise<void> {
  const now = Date.now();
  const fields: string[] = [];
  const values: any[] = [];

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && key !== 'created_at') {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  });

  fields.push('updated_at = ?');
  values.push(now);
  values.push(trackId);

  const query = `UPDATE tracks SET ${fields.join(', ')} WHERE id = ?`;
  await db.prepare(query).bind(...values).run();
}

/**
 * Récupère un track par ID
 */
export async function getTrackById(db: D1Database, trackId: string): Promise<Track | null> {
  const result = await db
    .prepare('SELECT * FROM tracks WHERE id = ?')
    .bind(trackId)
    .first();
  
  return result as Track | null;
}

/**
 * Ajoute un track aux favoris
 */
export async function addFavorite(db: D1Database, userId: string, trackId: string): Promise<Favorite> {
  const now = Date.now();
  const favorite: Favorite = {
    id: generateId(),
    user_id: userId,
    track_id: trackId,
    created_at: now,
  };

  await db
    .prepare('INSERT INTO favorites (id, user_id, track_id, created_at) VALUES (?, ?, ?, ?)')
    .bind(favorite.id, favorite.user_id, favorite.track_id, favorite.created_at)
    .run();

  return favorite;
}

/**
 * Supprime un track des favoris
 */
export async function removeFavorite(db: D1Database, userId: string, trackId: string): Promise<void> {
  await db
    .prepare('DELETE FROM favorites WHERE user_id = ? AND track_id = ?')
    .bind(userId, trackId)
    .run();
}

/**
 * Récupère tous les favoris d'un utilisateur
 */
export async function getFavoritesByUserId(db: D1Database, userId: string): Promise<Track[]> {
  const result = await db
    .prepare(`
      SELECT t.* FROM tracks t
      INNER JOIN favorites f ON t.id = f.track_id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `)
    .bind(userId)
    .all();
  
  return result.results as Track[];
}
