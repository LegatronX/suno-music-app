'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/register-sw';
import InstallPrompt from './InstallPrompt';

export default function PWAInitializer() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return <InstallPrompt />;
}
