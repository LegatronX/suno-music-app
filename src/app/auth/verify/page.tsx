'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Token manquant');
      return;
    }

    verifyToken(token);
  }, [searchParams]);

  async function verifyToken(token: string) {
    try {
      await apiClient.verifyMagicLink(token);
      setStatus('success');
      setMessage('Connexion réussie ! Redirection...');
      
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      setStatus('error');
      setMessage('Lien invalide ou expiré');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 text-center">
        <h1 className="text-3xl font-bold mb-8">
          🎵 Suno Music Generator
        </h1>
        
        {status === 'loading' && (
          <div>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-lg">Vérification en cours...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-green-100 dark:bg-green-900 border border-green-400 text-green-700 dark:text-green-300 px-4 py-3 rounded">
            <p className="text-lg font-semibold">✓ {message}</p>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
              <p className="text-lg font-semibold">✗ {message}</p>
            </div>
            <a
              href="/"
              className="inline-block bg-primary-500 hover:bg-primary-600 text-white font-semibold px-6 py-3 rounded-lg transition"
            >
              Retour à l'accueil
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-lg">Chargement...</p>
        </div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
