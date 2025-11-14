'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import type { Project, Track } from '@suno-music-app/shared/index';

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    prompt: '',
    style: '',
    lyrics: '',
  });

  useEffect(() => {
    loadProject();
    const interval = setInterval(loadTracks, 5000); // Rafraîchir toutes les 5 secondes
    return () => clearInterval(interval);
  }, [projectId]);

  useEffect(() => {
    if (currentTrack && audioRef.current) {
      updateMediaSession(currentTrack);
    }
  }, [currentTrack]);

  async function loadProject() {
    try {
      const { project } = await apiClient.getProject(projectId);
      setProject(project);
      await loadTracks();
    } catch (error) {
      console.error('Failed to load project:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  }

  async function loadTracks() {
    try {
      const { tracks } = await apiClient.getProjectTracks(projectId);
      setTracks(tracks);
    } catch (error) {
      console.error('Failed to load tracks:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      await apiClient.createTrack({
        project_id: projectId,
        title: formData.title,
        prompt: formData.prompt,
        style: formData.style || undefined,
        lyrics: formData.lyrics || undefined,
        custom_mode: customMode,
      });

      setFormData({ title: '', prompt: '', style: '', lyrics: '' });
      setShowForm(false);
      await loadTracks();
    } catch (error) {
      alert('Erreur lors de la création du morceau');
    }
  }

  function playTrack(track: Track) {
    if (!track.audio_url) return;
    
    setCurrentTrack(track);
    if (audioRef.current) {
      audioRef.current.src = track.audio_url;
      audioRef.current.play();
    }
  }

  function updateMediaSession(track: Track) {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: 'Suno AI',
        album: project?.name || 'Suno Music',
        artwork: track.image_url ? [
          { src: track.image_url, sizes: '512x512', type: 'image/jpeg' }
        ] : [],
      });

      navigator.mediaSession.setActionHandler('play', () => {
        audioRef.current?.play();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        audioRef.current?.pause();
      });
    }
  }

  async function toggleFavorite(track: Track) {
    try {
      // TODO: Implémenter la logique de favoris
      await apiClient.addFavorite(track.id);
      await loadTracks();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Chargement...</div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <a href="/" className="text-2xl">←</a>
            <h1 className="text-2xl font-bold">{project.name}</h1>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary-500 hover:bg-primary-600 text-white font-semibold px-6 py-3 rounded-lg transition"
          >
            + Générer un morceau
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">Nouveau morceau</h2>
            
            <div className="mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={customMode}
                  onChange={(e) => setCustomMode(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="font-medium">Mode personnalisé</span>
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Activez pour contrôler le style et les paroles
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Titre
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description / Prompt
                </label>
                <textarea
                  value={formData.prompt}
                  onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                  rows={3}
                  required
                />
              </div>

              {customMode && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Style (tags)
                    </label>
                    <input
                      type="text"
                      value={formData.style}
                      onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                      placeholder="pop, rock, electronic..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Paroles
                    </label>
                    <textarea
                      value={formData.lyrics}
                      onChange={(e) => setFormData({ ...formData, lyrics: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                      rows={6}
                      placeholder="Laissez vide pour un morceau instrumental"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 rounded-lg transition"
                >
                  Générer
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-2xl font-bold mb-4">Morceaux générés</h2>
          
          {tracks.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Aucun morceau pour le moment
              </p>
            </div>
          ) : (
            tracks.map((track) => (
              <div
                key={track.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
              >
                <div className="flex items-start gap-4">
                  {track.image_url && (
                    <img
                      src={track.image_url}
                      alt={track.title}
                      className="w-24 h-24 rounded-lg object-cover"
                    />
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-semibold">{track.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {track.prompt}
                        </p>
                        {track.style && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Style: {track.style}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          track.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                          track.status === 'processing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                          track.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {track.status === 'completed' ? 'Terminé' :
                           track.status === 'processing' ? 'En cours...' :
                           track.status === 'failed' ? 'Échec' :
                           'En attente'}
                        </span>
                      </div>
                    </div>

                    {track.status === 'completed' && track.audio_url && (
                      <div className="mt-4 flex items-center gap-4">
                        <button
                          onClick={() => playTrack(track)}
                          className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg transition"
                        >
                          ▶ Écouter
                        </button>
                        <a
                          href={track.audio_url}
                          download
                          className="text-primary-500 hover:text-primary-600 font-medium"
                        >
                          Télécharger
                        </a>
                        <button
                          onClick={() => toggleFavorite(track)}
                          className="text-2xl hover:scale-110 transition"
                        >
                          ⭐
                        </button>
                      </div>
                    )}

                    {track.status === 'failed' && track.error_message && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                        Erreur: {track.error_message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
