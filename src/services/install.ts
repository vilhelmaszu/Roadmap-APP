// PWA install — captures Chrome's `beforeinstallprompt` event at page load
// so we can trigger the native install dialog from a button click later.
//
// Why it needs to live in a service: `beforeinstallprompt` fires exactly once
// on a fresh page load and the event has to be `preventDefault`'d immediately
// to keep it usable. If a React component subscribes lazily (after first
// render) it almost always misses the event.

import { Platform } from 'react-native';
import { useEffect, useState } from 'react';

// Minimal shape of the deferred install prompt event Chrome/Edge expose.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
let listeners: Array<() => void> = [];

function emit() {
  for (const fn of listeners) fn();
}

// Wire the global listeners exactly once. Safe to call multiple times.
let attached = false;
export function attachInstallListener(): void {
  if (attached) return;
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  attached = true;

  // If the app is already running in standalone mode, treat it as installed.
  if (window.matchMedia?.('(display-mode: standalone)').matches) {
    installed = true;
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    emit();
  });

  window.addEventListener('appinstalled', () => {
    installed = true;
    deferredPrompt = null;
    emit();
  });
}

// Hook: returns the current install state so the button can render correctly.
export function useInstallState() {
  const [, force] = useState(0);
  useEffect(() => {
    const cb = () => force((x) => x + 1);
    listeners.push(cb);
    return () => {
      listeners = listeners.filter((f) => f !== cb);
    };
  }, []);

  const isWeb = Platform.OS === 'web';
  const isIOS =
    isWeb &&
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as any).MSStream;

  return {
    isWeb,
    isIOS,
    installed,
    canInstall: !!deferredPrompt && !installed,
  };
}

// Trigger the native install dialog. Resolves with the user's choice.
export async function triggerInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferredPrompt) return 'unavailable';
  try {
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    deferredPrompt = null; // Prompt can only be used once.
    if (choice.outcome === 'accepted') installed = true;
    emit();
    return choice.outcome;
  } catch {
    return 'dismissed';
  }
}
