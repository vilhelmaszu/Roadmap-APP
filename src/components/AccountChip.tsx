import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

import { signInWithGoogle, signOut, useAuthUser } from '@/services/auth';
import { supabaseConfigured } from '@/services/supabase';
import { Radius, Space } from '@/theme/themes';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText, useWide } from './ui';

// Persistent account chip in the top-right corner of every screen.
//   - Hidden entirely when Supabase env isn't configured.
//   - Signed out → "Sign in with Google" button.
//   - Signed in → name (or email) + chevron; tap opens a small menu with Sign out.

export function AccountChip() {
  const { theme } = useTheme();
  const { user, loading } = useAuthUser();
  const wide = useWide();
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!supabaseConfigured()) return null;
  if (loading) return null;

  const display = user ? (user.name?.trim() || user.email || 'Account') : null;

  const onSignIn = async () => {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      setError(e?.message || 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  };
  const onSignOut = async () => {
    setMenuOpen(false);
    setBusy(true);
    try {
      await signOut();
    } finally {
      setBusy(false);
    }
  };

  return (
    <View
      style={{
        position: 'absolute',
        top: Space.md,
        right: Space.lg,
        zIndex: 50,
      }}>
      {user ? (
        <Pressable
          onPress={() => setMenuOpen(true)}
          disabled={busy}
          accessibilityLabel={display ?? 'Account'}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: wide ? 8 : 0,
            paddingHorizontal: wide ? Space.md : 4,
            paddingVertical: wide ? 6 : 4,
            borderRadius: Radius.pill,
            borderWidth: 1,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
            opacity: busy ? 0.6 : 1,
          }}>
          {/* Avatar circle — first initial of name/email. On mobile this is
              the entire chip; on wide screens the name + chevron sit next to it. */}
          <View
            style={{
              width: wide ? 22 : 28,
              height: wide ? 22 : 28,
              borderRadius: wide ? 11 : 14,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.colors.primary,
            }}>
            <AppText size={wide ? 11 : 13} weight="800" color="primaryText">
              {(display ?? '?').slice(0, 1).toUpperCase()}
            </AppText>
          </View>
          {wide ? (
            <>
              <AppText size={13} weight="700" numberOfLines={1} style={{ maxWidth: 180 }}>
                {display}
              </AppText>
              <Ionicons name="chevron-down" size={14} color={theme.colors.textMuted} />
            </>
          ) : null}
        </Pressable>
      ) : (
        <Pressable
          onPress={onSignIn}
          disabled={busy}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: Space.md,
            paddingVertical: 6,
            borderRadius: Radius.pill,
            backgroundColor: theme.colors.primary,
            opacity: busy ? 0.6 : 1,
          }}>
          <Ionicons name="logo-google" size={14} color={theme.colors.primaryText} />
          <AppText size={12} weight="800" color="primaryText">
            {busy ? 'Signing in…' : 'Sign in with Google'}
          </AppText>
        </Pressable>
      )}

      {error ? (
        <View
          style={{
            marginTop: 6,
            paddingHorizontal: Space.md,
            paddingVertical: 4,
            borderRadius: Radius.md,
            backgroundColor: theme.colors.danger + '22',
            borderWidth: 1,
            borderColor: theme.colors.danger,
            maxWidth: 280,
          }}>
          <AppText size={11} weight="700" style={{ color: theme.colors.danger }}>
            {error}
          </AppText>
        </View>
      ) : null}

      {/* Tap-anywhere dropdown menu for signed-in actions */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable onPress={() => setMenuOpen(false)} style={{ flex: 1 }}>
          <View
            style={{
              position: 'absolute',
              top: Space.md + 42,
              right: Space.lg,
              minWidth: 200,
              backgroundColor: theme.colors.surface,
              borderRadius: Radius.md,
              borderWidth: 1,
              borderColor: theme.colors.border,
              padding: Space.sm,
              gap: 2,
            }}>
            <View style={{ paddingHorizontal: Space.sm, paddingVertical: 4, gap: 2 }}>
              <AppText size={11} weight="800" color="textMuted">
                SIGNED IN
              </AppText>
              <AppText size={13} weight="700" numberOfLines={1}>
                {user?.email ?? user?.name ?? user?.id}
              </AppText>
            </View>
            <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: 4 }} />
            <Pressable
              onPress={onSignOut}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingHorizontal: Space.sm,
                paddingVertical: 8,
                borderRadius: Radius.sm,
              }}>
              <Ionicons name="log-out-outline" size={16} color={theme.colors.danger} />
              <AppText size={13} weight="700" style={{ color: theme.colors.danger }}>
                Sign out
              </AppText>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
