import type { User, Project } from '@suno-music-app/shared/index';
import { ProjectList } from './ProjectList';

interface DashboardProps {
    user: User | null;
    projects: Project[];
    onCreateProject: () => void;
    onLogout: () => void;
}

export function Dashboard({ user, projects, onCreateProject, onLogout }: DashboardProps) {
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
                            onClick={onLogout}
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
                        onClick={onCreateProject}
                        className="bg-primary-500 hover:bg-primary-600 text-white font-semibold px-6 py-3 rounded-lg transition"
                    >
                        + Nouveau Projet
                    </button>
                </div>

                <ProjectList projects={projects} />
            </main>
        </div>
    );
}
