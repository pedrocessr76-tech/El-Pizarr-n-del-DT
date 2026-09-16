import { useEffect, useRef, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const INSTALL_PROMPT_SEEN_KEY = 'pwa.install.prompt.seen';

export interface PwaRegistrationState {
  needRefresh: boolean;
  offlineReady: boolean;
  canInstall: boolean;
  updateSW: () => Promise<void>;
  promptInstall: () => Promise<void>;
  dismissInstall: () => void;
}

function hasInstallPromptBeenDismissed(): boolean {
  return localStorage.getItem(INSTALL_PROMPT_SEEN_KEY) === '1';
}

async function checkForUpdate(): Promise<void> {
  if (!('serviceWorker' in navigator) || !navigator.onLine) return;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) await registration.update();
  } catch {
    /* red caída o registro no disponible: se reintenta en el próximo tick */
  }
}

export function usePwaRegistration(): PwaRegistrationState {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const updateSWRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);
  const firstRun = useRef(false);

  useEffect(() => {
    if (firstRun.current) return;
    firstRun.current = true;

    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh: () => setNeedRefresh(true),
      onOfflineReady: () => setOfflineReady(true),
      onRegisterError: (error) => {
        if (import.meta.env.DEV) console.warn('[pwa] Registro del service worker falló', error);
      },
    });
    updateSWRef.current = updateSW;

    const periodicCheck = window.setInterval(() => {
      void checkForUpdate();
    }, 60 * 60 * 1000);

    const onBeforeInstallPrompt = (event: Event) => {
      if (hasInstallPromptBeenDismissed()) return;
      event.preventDefault();
      deferredPrompt.current = event as BeforeInstallPromptEvent;
      setCanInstall(true);
    };

    const onAppInstalled = () => {
      localStorage.setItem(INSTALL_PROMPT_SEEN_KEY, '1');
      deferredPrompt.current = null;
      setCanInstall(false);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      window.clearInterval(periodicCheck);
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const updateApp = async () => {
    setNeedRefresh(false);
    const swUpdater = updateSWRef.current;
    if (swUpdater) await swUpdater(true);
    else window.location.reload();
  };

  const promptInstall = async () => {
    const prompt = deferredPrompt.current;
    if (!prompt) return;
    deferredPrompt.current = null;
    setCanInstall(false);
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === 'accepted') localStorage.setItem(INSTALL_PROMPT_SEEN_KEY, '1');
  };

  const dismissInstall = () => {
    deferredPrompt.current = null;
    setCanInstall(false);
  };

  return { needRefresh, offlineReady, canInstall, updateSW: updateApp, promptInstall, dismissInstall };
}