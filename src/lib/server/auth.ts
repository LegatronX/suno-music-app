import type { Env } from './types';
import { getUserByEmail, createUser } from './db';

/**
 * Génère un token aléatoire sécurisé
 */
export function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Génère un secret de session s'il n'existe pas
 */
export function getOrGenerateSessionSecret(env: Env): string {
  if (env.SESSION_SECRET) {
    return env.SESSION_SECRET;
  }
  // En production, ce secret devrait être configuré manuellement
  // Pour le développement, on génère un secret temporaire
  return generateToken();
}

/**
 * Crée un magic link token
 */
export async function createMagicLinkToken(
  env: Env,
  email: string
): Promise<string> {
  const token = generateToken();
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

  await env.AUTH_KV.put(
    `magic:${token}`,
    JSON.stringify({ email, expiresAt }),
    { expirationTtl: 900 } // 15 minutes
  );

  return token;
}

/**
 * Vérifie un magic link token
 */
export async function verifyMagicLinkToken(
  env: Env,
  token: string
): Promise<string | null> {
  const data = await env.AUTH_KV.get(`magic:${token}`);
  
  if (!data) {
    return null;
  }

  const { email, expiresAt } = JSON.parse(data);

  if (Date.now() > expiresAt) {
    await env.AUTH_KV.delete(`magic:${token}`);
    return null;
  }

  // Supprimer le token après utilisation
  await env.AUTH_KV.delete(`magic:${token}`);

  return email;
}

/**
 * Crée une session utilisateur
 */
export async function createSession(
  env: Env,
  userId: string
): Promise<string> {
  const sessionId = generateToken();
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 jours

  await env.SESSION_KV.put(
    `session:${sessionId}`,
    JSON.stringify({ userId, expiresAt }),
    { expirationTtl: 30 * 24 * 60 * 60 } // 30 jours
  );

  return sessionId;
}

/**
 * Récupère l'utilisateur depuis une session
 */
export async function getUserFromSession(
  env: Env,
  sessionId: string
): Promise<string | null> {
  const data = await env.SESSION_KV.get(`session:${sessionId}`);
  
  if (!data) {
    return null;
  }

  const { userId, expiresAt } = JSON.parse(data);

  if (Date.now() > expiresAt) {
    await env.SESSION_KV.delete(`session:${sessionId}`);
    return null;
  }

  return userId;
}

/**
 * Supprime une session
 */
export async function deleteSession(
  env: Env,
  sessionId: string
): Promise<void> {
  await env.SESSION_KV.delete(`session:${sessionId}`);
}

/**
 * Envoie un email avec le magic link (simulation pour le moment)
 */
export async function sendMagicLinkEmail(
  email: string,
  token: string,
  frontendUrl: string
): Promise<void> {
  const magicLink = `${frontendUrl}/auth/verify?token=${token}`;
  
  // Dans une vraie application, on utiliserait un service d'email
  // Pour le moment, on log simplement le lien
  console.log(`Magic link for ${email}: ${magicLink}`);
  
  // TODO: Intégrer un service d'email (SendGrid, Mailgun, etc.)
  // Pour l'instant, l'utilisateur devra copier le lien depuis les logs
}

/**
 * Gère le processus de connexion complet
 */
export async function handleLogin(
  env: Env,
  email: string
): Promise<{ success: boolean; message: string }> {
  // Vérifier ou créer l'utilisateur
  let user = await getUserByEmail(env.DB, email);
  
  if (!user) {
    user = await createUser(env.DB, email);
  }

  // Créer le magic link
  const token = await createMagicLinkToken(env, email);
  
  // Envoyer l'email
  const frontendUrl = env.FRONTEND_URL || 'http://localhost:3000';
  await sendMagicLinkEmail(email, token, frontendUrl);

  return {
    success: true,
    message: 'Magic link sent to your email',
  };
}

/**
 * Gère la vérification du magic link
 */
export async function handleVerifyMagicLink(
  env: Env,
  token: string
): Promise<{ success: boolean; sessionId?: string; error?: string }> {
  const email = await verifyMagicLinkToken(env, token);
  
  if (!email) {
    return {
      success: false,
      error: 'Invalid or expired token',
    };
  }

  // Récupérer l'utilisateur
  const user = await getUserByEmail(env.DB, email);
  
  if (!user) {
    return {
      success: false,
      error: 'User not found',
    };
  }

  // Créer la session
  const sessionId = await createSession(env, user.id);

  return {
    success: true,
    sessionId,
  };
}
