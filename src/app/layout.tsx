import type { Metadata } from 'next';
import './globals.css';
import PWAInitializer from '@/components/PWAInitializer';

export const metadata: Metadata = {
  title: 'Suno Music Generator',
  description: 'Générez de la musique avec l\'IA Suno',
  manifest: '/manifest.json',
  themeColor: '#0ea5e9',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Suno Music',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <PWAInitializer />
        {children}
      </body>
    </html>
  );
}
