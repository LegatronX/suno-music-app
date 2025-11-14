/**
 * Enregistre le service worker pour la PWA
 */
export function registerServiceWorker() {
  if (typeof window === 'undefined') {
    return;
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        console.log('[PWA] Service Worker enregistré avec succès:', registration.scope);

        // Vérifier les mises à jour
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] Nouvelle version disponible');
                
                // Proposer à l'utilisateur de recharger
                if (confirm('Une nouvelle version est disponible. Recharger maintenant ?')) {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                }
              }
            });
          }
        });

        // Recharger la page lorsque le nouveau SW prend le contrôle
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!refreshing) {
            refreshing = true;
            window.location.reload();
          }
        });
      } catch (error) {
        console.error('[PWA] Erreur lors de l\'enregistrement du Service Worker:', error);
      }
    });
  } else {
    console.log('[PWA] Service Worker non supporté par ce navigateur');
  }
}

/**
 * Vérifie si l'application est installée en mode standalone
 */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

/**
 * Affiche la bannière d'installation PWA
 */
export function setupInstallPrompt(
  onInstallPrompt?: (event: Event) => void
) {
  if (typeof window === 'undefined') {
    return;
  }

  let deferredPrompt: any = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    if (onInstallPrompt) {
      onInstallPrompt(e);
    }
  });

  return {
    showInstallPrompt: async () => {
      if (!deferredPrompt) {
        return false;
      }

      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log('[PWA] Installation:', outcome);
      deferredPrompt = null;
      
      return outcome === 'accepted';
    },
  };
}
