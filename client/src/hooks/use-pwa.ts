import { useState, useEffect } from 'react';

export function usePWA() {
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js', { scope: '/' })
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration);

          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60000); // Check every minute

          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (
                  newWorker.state === 'installed' &&
                  navigator.serviceWorker.controller
                ) {
                  // New service worker available, prompt user
                  const message =
                    'A new version of MDRRMO is available. Restart to update.';
                  console.log(message);
                  // You can dispatch an action or show a toast notification here
                  window.dispatchEvent(
                    new CustomEvent('pwa-update', { detail: { message } })
                  );
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });

      // Handle service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'CACHE_UPDATED') {
          console.log('Cache updated:', event.data.urls);
        }
      });
    }

    // Request notification permission for PWA features
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Handle app installation prompt
    let deferredPrompt: BeforeInstallPromptEvent | null = null;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
      // Store for later use or show install button
      window.dispatchEvent(
        new CustomEvent('pwa-install-prompt', { detail: { prompt: deferredPrompt } })
      );
    });

    window.addEventListener('appinstalled', () => {
      console.log('MDRRMO was installed as a PWA');
      deferredPrompt = null;
    });

    return () => {
      // Cleanup
      window.removeEventListener('beforeinstallprompt', () => {});
      window.removeEventListener('appinstalled', () => {});
    };
  }, []);

  return {
    canInstall: 'BeforeInstallPromptEvent' in window,
    isOnline: navigator.onLine,
  };
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  }
}
