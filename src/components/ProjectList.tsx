import type { Project } from '@suno-music-app/shared/index';

interface ProjectListProps {
    projects: Project[];
}

export function ProjectList({ projects }: ProjectListProps) {
    if (projects.length === 0) {
        return (
            <div className="text-center py-16">
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
                    Aucun projet pour le moment
                </p>
                <p className="text-gray-500 dark:text-gray-500">
                    Créez votre premier projet pour commencer à générer de la musique !
                </p>
            </div>
        );
    }

    return (
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
    );
}
