import type { Env, MusicGenerationJob } from './types';
import { SunoClient } from '@suno-music-app/shared/index';
import { updateTrack } from './db';

/**
 * Traite un seul job de génération de musique.
 * @param job - Le job à traiter.
 * @param env - L'environnement Cloudflare.
 */
async function processMusicGenerationJob(
  job: MusicGenerationJob,
  env: Env
): Promise<void> {
  console.log(`Processing music generation job for track ${job.trackId}`);

  // Vérifier que la clé API Suno est configurée
  if (!env.SUNO_API_KEY) {
    throw new Error('SUNO_API_KEY is not configured');
  }

  // Mettre à jour le statut à "processing"
  await updateTrack(env.DB, job.trackId, {
    status: 'processing',
  });

  // Initialiser le client Suno
  const sunoClient = new SunoClient(env.SUNO_API_KEY);

  // Préparer la requête de génération
  const generateRequest = {
    prompt: job.prompt,
    make_instrumental: !job.lyrics,
    wait_audio: false,
    custom_mode: job.customMode,
    ...(job.customMode && {
      tags: job.style || '',
      title: job.title,
      lyrics: job.lyrics || '',
    }),
  };

  // Générer le morceau
  const generateResponse = await sunoClient.generate(generateRequest);

  if (!generateResponse.clips || generateResponse.clips.length === 0) {
    throw new Error('No clips returned from Suno API');
  }

  const clip = generateResponse.clips[0];

  // Attendre que le morceau soit complété
  console.log(`Waiting for track ${clip.id} to complete...`);
  const completedClip = await sunoClient.waitForCompletion(clip.id);

  // Mettre à jour le track avec les informations du morceau généré
  await updateTrack(env.DB, job.trackId, {
    suno_id: completedClip.id,
    audio_url: completedClip.audio_url,
    image_url: completedClip.image_url,
    duration: completedClip.duration,
    status: 'completed',
    lyrics: completedClip.lyric || job.lyrics || null,
  });

  console.log(`Track ${job.trackId} completed successfully`);
}

/**
 * Le gestionnaire pour le Cron Trigger, qui s'exécute périodiquement.
 * @param env - L'environnement Cloudflare.
 */
export async function handleCronTrigger(env: Env): Promise<void> {
  console.log('Cron trigger fired. Checking for pending jobs...');

  // Lister toutes les clés de jobs en attente
  const jobKeys = await env.JOBS_KV.list({ prefix: 'job:' });

  if (jobKeys.keys.length === 0) {
    console.log('No pending jobs found.');
    return;
  }

  console.log(`Found ${jobKeys.keys.length} pending jobs.`);

  // Traiter chaque job
  for (const key of jobKeys.keys) {
    const jobData = await env.JOBS_KV.get(key.name);
    if (!jobData) continue;

    try {
      const job = JSON.parse(jobData) as MusicGenerationJob;
      await processMusicGenerationJob(job, env);

      // Supprimer le job du KV après traitement réussi
      await env.JOBS_KV.delete(key.name);
      console.log(`Job ${key.name} processed and deleted.`);

    } catch (error) {
      console.error(`Error processing job ${key.name}:`, error);
      const jobData = await env.JOBS_KV.get(key.name);
      if (jobData) {
        const job = JSON.parse(jobData) as MusicGenerationJob;
        // Mettre à jour le statut à "failed"
        await updateTrack(env.DB, job.trackId, {
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        });
        // Supprimer le job pour ne pas le réessayer indéfiniment
        await env.JOBS_KV.delete(key.name);
      }
    }
  }
}
