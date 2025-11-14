/**
 * Client API Suno avec gestion automatique du rate limiting et retry
 */

export interface SunoGenerateRequest {
  prompt: string;
  make_instrumental?: boolean;
  wait_audio?: boolean;
  custom_mode?: boolean;
  tags?: string;
  title?: string;
  lyrics?: string;
}

export interface SunoTrack {
  id: string;
  title: string;
  audio_url: string;
  image_url: string;
  lyric: string;
  created_at: string;
  model_name: string;
  status: string;
  gpt_description_prompt: string;
  prompt: string;
  type: string;
  tags: string;
  duration: number;
}

export interface SunoGenerateResponse {
  clips: SunoTrack[];
}

export interface SunoGetResponse {
  clips: SunoTrack[];
}

export class SunoApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'SunoApiError';
  }
}

export class SunoClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.suno.ai/v1';
  private maxRetries: number = 5;
  private initialBackoff: number = 1000; // 1 seconde

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Suno API key is required');
    }
    this.apiKey = apiKey;
  }

  /**
   * Calcule le délai de backoff exponentiel
   */
  private getBackoffDelay(attempt: number): number {
    return this.initialBackoff * Math.pow(2, attempt);
  }

  /**
   * Effectue une requête HTTP avec retry et gestion du rate limiting
   */
  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    attempt: number = 0
  ): Promise<Response> {
    try {
      const response = await fetch(url, options);

      // Gestion du rate limiting (429)
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter
          ? parseInt(retryAfter) * 1000
          : this.getBackoffDelay(attempt);

        if (attempt < this.maxRetries) {
          console.log(`Rate limited. Retrying after ${waitTime}ms...`);
          await this.sleep(waitTime);
          return this.fetchWithRetry(url, options, attempt + 1);
        }

        throw new SunoApiError(
          'Rate limit exceeded. Please try again later.',
          429,
          retryAfter ? parseInt(retryAfter) : undefined
        );
      }

      // Gestion des erreurs serveur (5xx)
      if (response.status >= 500) {
        if (attempt < this.maxRetries) {
          const waitTime = this.getBackoffDelay(attempt);
          console.log(`Server error. Retrying after ${waitTime}ms...`);
          await this.sleep(waitTime);
          return this.fetchWithRetry(url, options, attempt + 1);
        }

        throw new SunoApiError(
          `Server error: ${response.statusText}`,
          response.status
        );
      }

      // Gestion des erreurs client (4xx sauf 429)
      if (response.status >= 400) {
        const errorData = await response.json().catch(() => ({}));
        throw new SunoApiError(
          errorData.message || `Client error: ${response.statusText}`,
          response.status
        );
      }

      return response;
    } catch (error) {
      // Gestion des erreurs réseau
      if (error instanceof SunoApiError) {
        throw error;
      }

      if (attempt < this.maxRetries) {
        const waitTime = this.getBackoffDelay(attempt);
        console.log(`Network error. Retrying after ${waitTime}ms...`);
        await this.sleep(waitTime);
        return this.fetchWithRetry(url, options, attempt + 1);
      }

      throw new SunoApiError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        0
      );
    }
  }

  /**
   * Utilitaire pour attendre
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Génère un morceau de musique
   */
  async generate(request: SunoGenerateRequest): Promise<SunoGenerateResponse> {
    const url = `${this.baseUrl}/generate`;
    
    const response = await this.fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();
    return data as SunoGenerateResponse;
  }

  /**
   * Récupère les informations d'un ou plusieurs morceaux
   */
  async get(ids: string[]): Promise<SunoGetResponse> {
    const idsParam = ids.join(',');
    const url = `${this.baseUrl}/clips?ids=${idsParam}`;

    const response = await this.fetchWithRetry(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    const data = await response.json();
    return data as SunoGetResponse;
  }

  /**
   * Attend qu'un morceau soit complété
   */
  async waitForCompletion(
    id: string,
    maxWaitTime: number = 300000, // 5 minutes
    pollInterval: number = 5000 // 5 secondes
  ): Promise<SunoTrack> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const response = await this.get([id]);
      const track = response.clips.find((clip) => clip.id === id);

      if (!track) {
        throw new SunoApiError(`Track ${id} not found`, 404);
      }

      if (track.status === 'complete' || track.status === 'completed') {
        return track;
      }

      if (track.status === 'error' || track.status === 'failed') {
        throw new SunoApiError(`Track generation failed`, 500);
      }

      await this.sleep(pollInterval);
    }

    throw new SunoApiError('Track generation timeout', 408);
  }
}
