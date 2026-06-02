import '@/global.css';

import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AccountChip } from '@/components/AccountChip';
import { OnboardingOverlay } from '@/components/OnboardingOverlay';
import { Sidebar } from '@/components/Sidebar';
import { I18nProvider } from '@/i18n';
import { attachInstallListener } from '@/services/install';
import { configureNotifications } from '@/services/notifications';
import { attachAuthListener } from '@/services/sync';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

function Root() {
  const { theme } = useTheme();
  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: theme.colors.bg }}>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      <Sidebar />
      <View style={{ flex: 1 }}>
        <Slot />
        <AccountChip />
      </View>
      <OnboardingOverlay />
    </View>
  );
}

export default function RootLayout() {
  useEffect(() => {
    configureNotifications();
    // Wire up Supabase auth → start/stop sync. No-op if Supabase isn't configured.
    attachAuthListener();
    // Capture the PWA install prompt as early as possible — the event fires
    // once on first load and gets lost if we subscribe lazily.
    attachInstallListener();

    // PWA bits — web only.
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    // Inject manifest link if absent (Expo's auto-generated one would also work
    // but pointing at our explicit /manifest.webmanifest keeps the icon list deterministic).
    if (!document.querySelector('link[rel="manifest"]')) {
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = '/manifest.webmanifest';
      document.head.appendChild(link);
    }
    // Theme-color meta lets mobile Chrome tint the address bar to match the app.
    if (!document.querySelector('meta[name="theme-color"]')) {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = '#0F1115';
      document.head.appendChild(meta);
    }
    // Register the service worker — silently no-op if registration fails (e.g. http:).
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <I18nProvider>
            <Root />
          </I18nProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
