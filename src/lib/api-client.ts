import type {
  User,
  Project,
  Track,
  CreateProject,
  CreateTrack,
} from '@suno-music-app/shared/index';

const API_BASE_URL = '/api';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async login(email: string): Promise<{ success: boolean; message: string }> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyMagicLink(token: string): Promise<{ success: boolean }> {
    return this.request(`/auth/verify?token=${token}`, {
      method: 'GET',
    });
  }

  async logout(): Promise<{ success: boolean }> {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser(): Promise<{ user: User }> {
    return this.request('/auth/me');
  }

  // Projects
  async getProjects(): Promise<{ projects: Project[] }> {
    return this.request('/projects');
  }

  async createProject(data: CreateProject): Promise<{ project: Project }> {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProject(id: string): Promise<{ project: Project }> {
    return this.request(`/projects/${id}`);
  }

  // Tracks
  async getProjectTracks(projectId: string): Promise<{ tracks: Track[] }> {
    return this.request(`/projects/${projectId}/tracks`);
  }

  async createTrack(data: CreateTrack): Promise<{ track: Track }> {
    return this.request('/tracks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTrack(id: string): Promise<{ track: Track }> {
    return this.request(`/tracks/${id}`);
  }

  // Favorites
  async getFavorites(): Promise<{ tracks: Track[] }> {
    return this.request('/favorites');
  }

  async addFavorite(trackId: string): Promise<{ favorite: any }> {
    return this.request('/favorites', {
      method: 'POST',
      body: JSON.stringify({ track_id: trackId }),
    });
  }

  async removeFavorite(trackId: string): Promise<{ success: boolean }> {
    return this.request(`/favorites/${trackId}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();
