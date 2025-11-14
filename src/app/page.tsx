'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import type { User, Project } from '@suno-music-app/shared/index';

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [loginMessage, setLoginMessage] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const { user } = await apiClient.getCurrentUser();
      setUser(user);
      await loadProjects();
    } catch (error) {
      setShowLogin(true);
    } finally {
      setLoading(false);
    }
  }

  async function loadProjects() {
    try {
      const { projects } = await apiClient.getProjects();
      setProjects(projects);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    try {
      const result = await apiClient.login(email);
      setLoginMessage(result.message);
    } catch (error) {
      setLoginMessage('Erreur lors de l\'envoi du lien de connexion');
    }
  }

  async function handleLogout() {
    try {
      await apiClient.logout();
      setUser(null);
      setProjects([]);
      setShowLogin(true);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  async function handleCreateProject() {
    const name = prompt('Nom du projet :');
    if (!name) return;

    try {
      await apiClient.createProject({ name });
      await loadProjects();
    } catch (error) {
      alert('Erreur lors de la création du projet');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Chargement...</div>
      </div>
    );
  }

  if (showLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-center mb-8">
            🎵 Suno Music Generator
          </h1>
          
          {loginMessage ? (
            <div className="bg-green-100 dark:bg-green-900 border border-green-400 text-green-700 dark:text-green-300 px-4 py-3 rounded mb-4">
              {loginMessage}
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Adresse email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
                  placeholder="vous@exemple.com"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 rounded-lg transition"
              >
                Envoyer le lien de connexion
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">🎵 Suno Music</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Mes Projets</h2>
          <button
            onClick={handleCreateProject}
            className="bg-primary-500 hover:bg-primary-600 text-white font-semibold px-6 py-3 rounded-lg transition"
          >
            + Nouveau Projet
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
              Aucun projet pour le moment
            </p>
            <p className="text-gray-500 dark:text-gray-500">
              Créez votre premier projet pour commencer à générer de la musique !
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <a
                key={project.id}
                href={`/projects/${project.id}`}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition"
              >
                <h3 className="text-xl font-semibold mb-2">{project.name}</h3>
                {project.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {project.description}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
                  Créé le {new Date(project.created_at).toLocaleDateString()}
                </p>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
