'use client';

import { useState, useEffect } from 'react';
import { setupInstallPrompt, isStandalone } from '@/lib/register-sw';

export default function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [installHandler, setInstallHandler] = useState<any>(null);

  useEffect(() => {
    // Ne pas afficher si déjà installé
    if (isStandalone()) {
      return;
    }

    const handler = setupInstallPrompt(() => {
      setShowPrompt(true);
    });

    setInstallHandler(handler);
  }, []);

  async function handleInstall() {
    if (installHandler) {
      const accepted = await installHandler.showInstallPrompt();
      if (accepted) {
        setShowPrompt(false);
      }
    }
  }

  function handleDismiss() {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  }

  // Ne pas afficher si l'utilisateur a déjà refusé
  if (typeof window !== 'undefined' && localStorage.getItem('pwa-prompt-dismissed')) {
    return null;
  }

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg p-4 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">📱</div>
          <div>
            <h3 className="font-semibold">Installer Suno Music</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Accédez rapidement à l'application depuis votre écran d'accueil
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleDismiss}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Plus tard
          </button>
          <button
            onClick={handleInstall}
            className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition"
          >
            Installer
          </button>
        </div>
      </div>
    </div>
  );
}
