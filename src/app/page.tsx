'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import type { User, Project } from '@suno-music-app/shared/index';
import { LoginScreen } from '@/components/LoginScreen';
import { Dashboard } from '@/components/Dashboard';

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

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
    return <LoginScreen />;
  }

  return (
    <Dashboard
      user={user}
      projects={projects}
      onCreateProject={handleCreateProject}
      onLogout={handleLogout}
    />
  );
}
