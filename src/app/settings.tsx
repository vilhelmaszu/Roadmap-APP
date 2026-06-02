import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

import { ConfirmModal } from '@/components/ConfirmModal';
import { AppText, Card, Screen, SectionHeader } from '@/components/ui';
import { buildAchievements, levelFromXp, totalCompleted } from '@/domain/logic';
import { Project } from '@/domain/types';
import { useI18n } from '@/i18n';
import { tSeed } from '@/i18n/seedI18n';
import { signInWithGoogle, signOut, useAuthUser } from '@/services/auth';
import { triggerInstall, useInstallState } from '@/services/install';
import { supabaseConfigured } from '@/services/supabase';
import { forceSync, getSyncStatus, onSyncStatus } from '@/services/sync';
import { isVaultUnlocked, lockVault, onVaultLockChange } from '@/services/vault';
import { VaultUnlockModal } from '@/components/VaultUnlockModal';
import { useStore } from '@/store/store';
import { DESIGNS } from '@/theme/design';
import { Radius, Space, THEMES, themeUnlocked, UnlockContext, unlockLabel } from '@/theme/themes';
import { useTheme } from '@/theme/ThemeProvider';

export default function Settings() {
  const { theme, themeId, setThemeId, design, designId, setDesignId } = useTheme();
  const profile = useStore((s) => s.profile);
  const setName = useStore((s) => s.setName);
  const resetAll = useStore((s) => s.resetAll);
  const startFresh = useStore((s) => s.startFresh);
  const resetRoadmap = useStore((s) => s.resetRoadmap);
  const exportData = useStore((s) => s.exportData);
  const importData = useStore((s) => s.importData);

  const [dataOpen, setDataOpen] = useState(false);
  const [exported, setExported] = useState('');
  const [importText, setImportText] = useState('');
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [themeOpen, setThemeOpen] = useState(false);
  // Pending destructive confirmation. null = nothing to confirm.
  const [confirm, setConfirm] = useState<{
    title: string;
    body: string;
    confirmLabel: string;
    action: () => void;
  } | null>(null);

  const ctx: UnlockContext = {
    level: levelFromXp(profile.xp).level,
    earnedAchievements: buildAchievements(profile).filter((a) => a.earned).length,
    bestStreak: profile.bestStreak,
    completedGoals: totalCompleted(profile),
  };

  const Swatches = ({ t }: { t: (typeof THEMES)[number] }) => (
    <View style={{ flexDirection: 'row', gap: 5 }}>
      {[t.colors.primary, t.colors.accent, t.colors.surface].map((c, i) => (
        <View
          key={i}
          style={{
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: c,
            borderWidth: 1,
            borderColor: t.colors.border,
          }}
        />
      ))}
    </View>
  );

  return (
    <Screen>
      <AppText size={26} weight="800">
        Settings
      </AppText>

      {/* Name */}
      <Card>
        <SectionHeader title="Your name" />
        <TextInput
          value={profile.name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={theme.colors.textFaint}
          style={{
            marginTop: Space.md,
            color: theme.colors.text,
            backgroundColor: theme.colors.surfaceAlt,
            borderRadius: Radius.md,
            padding: Space.md,
            fontSize: 16,
            fontWeight: '600',
          }}
        />
      </Card>

      {/* Language */}
      <LanguageCard />

      {/* Cloud sign-in (Supabase) */}
      <AccountCard />

      {/* Install as PWA */}
      <InstallCard />

      {/* Secure vault for encrypted notes (API keys etc.) */}
      <VaultCard />

      {/* Projects management */}
      <ProjectsCard />


      {/* Design presets */}
      <Card>
        <SectionHeader title="Design" />
        <AppText color="textMuted" size={13} weight="600" style={{ marginTop: 4 }}>
          Change the whole app's look — shape, type, and feel.
        </AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Space.md, marginTop: Space.lg }}>
          {DESIGNS.map((d) => {
            const selected = d.id === designId;
            return (
              <Pressable
                key={d.id}
                onPress={() => setDesignId(d.id)}
                style={{
                  width: '47%',
                  flexGrow: 1,
                  minWidth: 150,
                  borderRadius: d.radius,
                  borderWidth: selected ? 2 : Math.max(1, d.borderWidth),
                  borderColor: selected ? theme.colors.primary : theme.colors.border,
                  backgroundColor: theme.colors.surfaceAlt,
                  padding: Space.md,
                  gap: 4,
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <AppText weight={d.titleWeight} size={15} style={{ letterSpacing: d.titleSpacing }}>
                    {d.uppercaseTitles ? d.name.toUpperCase() : d.name}
                  </AppText>
                  {selected ? (
                    <Ionicons name="checkmark-circle" size={18} color={theme.colors.primary} />
                  ) : null}
                </View>
                {/* mini shape preview */}
                <View style={{ flexDirection: 'row', gap: 5, marginVertical: 4 }}>
                  {[theme.colors.primary, theme.colors.accent, theme.colors.surface].map((c, i) => (
                    <View
                      key={i}
                      style={{
                        width: 22,
                        height: 14,
                        borderRadius: d.radius === 0 ? 0 : Math.min(d.radius, 7),
                        backgroundColor: c,
                        borderWidth: d.borderWidth,
                        borderColor: theme.colors.border,
                      }}
                    />
                  ))}
                </View>
                <AppText color="textMuted" size={11} weight="500">
                  {d.tagline}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </Card>

      {/* Themes — hidden when the active design locks its own palette (Neon) */}
      {design.enforcedColors ? null : (
      <Card>
        <SectionHeader title="Theme" />
        <AppText color="textMuted" size={13} weight="600" style={{ marginTop: 4 }}>
          Switch the whole app between dark and light styles.
        </AppText>
        {/* Current selection — tap to open the dropdown */}
        <Pressable
          onPress={() => setThemeOpen((o) => !o)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: Space.md,
            marginTop: Space.lg,
            backgroundColor: theme.colors.surfaceAlt,
            borderRadius: Radius.md,
            borderWidth: 1,
            borderColor: theme.colors.border,
            padding: Space.md,
          }}>
          <Swatches t={theme} />
          <View style={{ flex: 1 }}>
            <AppText weight="800">{theme.name}</AppText>
            <AppText color="textMuted" size={11} weight="700">
              {theme.mode === 'dark' ? 'DARK' : 'LIGHT'}
            </AppText>
          </View>
          <Ionicons name={themeOpen ? 'chevron-up' : 'chevron-down'} size={18} color={theme.colors.textMuted} />
        </Pressable>

        {themeOpen ? (
          <View
            style={{
              marginTop: Space.sm,
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: Radius.md,
              overflow: 'hidden',
            }}>
            <ScrollView style={{ maxHeight: 320 }} nestedScrollEnabled>
              {THEMES.map((t, i) => {
                const selected = t.id === themeId;
                const unlocked = themeUnlocked(t, ctx);
                return (
                  <Pressable
                    key={t.id}
                    disabled={!unlocked}
                    onPress={() => {
                      setThemeId(t.id);
                      setThemeOpen(false);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: Space.md,
                      paddingHorizontal: Space.md,
                      paddingVertical: Space.md,
                      backgroundColor: selected ? theme.colors.surfaceAlt : theme.colors.surface,
                      borderTopWidth: i === 0 ? 0 : 1,
                      borderTopColor: theme.colors.border,
                      opacity: unlocked ? 1 : 0.55,
                    }}>
                    <Swatches t={t} />
                    <View style={{ flex: 1 }}>
                      <AppText weight="700">{t.name}</AppText>
                      {unlocked ? (
                        <AppText color="textFaint" size={11} weight="700">
                          {t.mode === 'dark' ? 'DARK' : 'LIGHT'}
                        </AppText>
                      ) : (
                        <AppText color="textFaint" size={11} weight="700">
                          {t.unlock ? unlockLabel(t.unlock) : 'Locked'}
                        </AppText>
                      )}
                    </View>
                    {selected ? (
                      <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                    ) : !unlocked ? (
                      <Ionicons name="lock-closed" size={16} color={theme.colors.textFaint} />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}
      </Card>
      )}

      {/* Stats */}
      <Card>
        <SectionHeader title="Stats" />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: Space.md }}>
          <View>
            <AppText size={22} weight="800" color="primary">
              {profile.bestStreak}
            </AppText>
            <AppText color="textMuted" size={12} weight="700">
              BEST STREAK
            </AppText>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <AppText size={22} weight="800" color="primary">
              {profile.xp}
            </AppText>
            <AppText color="textMuted" size={12} weight="700">
              TOTAL XP
            </AppText>
          </View>
        </View>
      </Card>

      {/* Backup & restore */}
      <Card>
        <Pressable
          onPress={() => {
            const next = !dataOpen;
            setDataOpen(next);
            if (next) setExported(exportData());
          }}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.sm }}>
            <Ionicons name="cloud-download-outline" size={18} color={theme.colors.primary} />
            <AppText weight="700">Backup & restore</AppText>
          </View>
          <Ionicons name={dataOpen ? 'chevron-up' : 'chevron-down'} size={18} color={theme.colors.textMuted} />
        </Pressable>

        {dataOpen ? (
          <View style={{ gap: Space.md, marginTop: Space.lg }}>
            <AppText color="textMuted" size={13} weight="500">
              Your data lives only on this device. Copy the export to back it up, or paste a backup to restore.
            </AppText>

            <AppText size={11} weight="700" color="textFaint">
              EXPORT
            </AppText>
            <TextInput
              value={exported}
              multiline
              editable={false}
              style={{
                color: theme.colors.textMuted,
                backgroundColor: theme.colors.surfaceAlt,
                borderRadius: Radius.md,
                padding: Space.md,
                minHeight: 90,
                maxHeight: 150,
                fontSize: 11,
                textAlignVertical: 'top',
              }}
            />

            <AppText size={11} weight="700" color="textFaint">
              IMPORT
            </AppText>
            <TextInput
              value={importText}
              onChangeText={setImportText}
              multiline
              placeholder="Paste a backup here…"
              placeholderTextColor={theme.colors.textFaint}
              style={{
                color: theme.colors.text,
                backgroundColor: theme.colors.surfaceAlt,
                borderRadius: Radius.md,
                padding: Space.md,
                minHeight: 70,
                fontSize: 12,
                textAlignVertical: 'top',
              }}
            />
            {importMsg ? (
              <AppText size={12} weight="700" color={importMsg.ok ? 'success' : 'danger'}>
                {importMsg.text}
              </AppText>
            ) : null}
            <Pressable
              onPress={() => {
                const ok = importData(importText);
                setImportMsg({ ok, text: ok ? 'Backup restored.' : 'Could not read that backup.' });
                if (ok) setImportText('');
              }}
              style={{
                alignSelf: 'flex-start',
                backgroundColor: theme.colors.primary,
                borderRadius: Radius.pill,
                paddingHorizontal: Space.lg,
                paddingVertical: Space.sm,
              }}>
              <AppText weight="700" color="primaryText" size={13}>
                Restore from backup
              </AppText>
            </Pressable>
          </View>
        ) : null}
      </Card>

      {/* Start fresh */}
      <Card>
        <SectionHeader title="Start over" />
        <AppText color="textMuted" size={13} weight="500" style={{ marginTop: 4 }}>
          Begin from a clean slate. Your name, themes, sets, and notes are always kept.
        </AppText>

        <Pressable
          onPress={() =>
            setConfirm({
              title: 'Start fresh?',
              body: 'This clears all goals, archive, XP, level, achievements, streaks & quests. Your name, themes, sets, and notes are kept.',
              confirmLabel: 'Start fresh',
              action: startFresh,
            })
          }
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: Space.sm,
            marginTop: Space.lg,
            backgroundColor: theme.colors.surfaceAlt,
            borderRadius: Radius.md,
            padding: Space.md,
          }}>
          <Ionicons name="sparkles-outline" size={18} color={theme.colors.text} />
          <View style={{ flex: 1 }}>
            <AppText weight="700">Start fresh</AppText>
            <AppText color="textMuted" size={12} weight="500">
              Clears all goals, archive, XP, level, achievements, streaks & quests.
            </AppText>
          </View>
        </Pressable>

        <Pressable
          onPress={() =>
            setConfirm({
              title: 'Reset roadmap?',
              body: 'This clears your long-term vision title, why, and plan points. Goals are not touched.',
              confirmLabel: 'Reset roadmap',
              action: resetRoadmap,
            })
          }
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: Space.sm,
            marginTop: Space.md,
            backgroundColor: theme.colors.surfaceAlt,
            borderRadius: Radius.md,
            padding: Space.md,
          }}>
          <Ionicons name="map-outline" size={18} color={theme.colors.text} />
          <View style={{ flex: 1 }}>
            <AppText weight="700">Reset roadmap</AppText>
            <AppText color="textMuted" size={12} weight="500">
              Clears your long-term vision and its plan points only.
            </AppText>
          </View>
        </Pressable>
      </Card>

      {/* Reset everything */}
      <Pressable
        onPress={() =>
          setConfirm({
            title: 'Reset everything?',
            body: 'This wipes ALL data: goals, vision, sets, notes, themes, design choice, name, and progress. You cannot undo this.',
            confirmLabel: 'Wipe everything',
            action: resetAll,
          })
        }>
        <Card style={{ borderColor: theme.colors.danger }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.sm }}>
            <Ionicons name="refresh" size={18} color={theme.colors.danger} />
            <AppText color="danger" weight="800">
              Reset everything (incl. demo data)
            </AppText>
          </View>
        </Card>
      </Pressable>

      <ConfirmModal
        visible={!!confirm}
        title={confirm?.title ?? ''}
        body={confirm?.body}
        confirmLabel={confirm?.confirmLabel}
        danger
        onConfirm={() => confirm?.action()}
        onClose={() => setConfirm(null)}
      />
    </Screen>
  );
}

// Sign-in / sign-out via Supabase. Hidden if EXPO_PUBLIC_SUPABASE_* env is
// missing — keeps the local-first experience clean for unconfigured installs.
function AccountCard() {
  const { theme } = useTheme();
  const configured = supabaseConfigured();
  const { user, loading } = useAuthUser();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!configured) {
    return (
      <Card>
        <SectionHeader title="Account" />
        <AppText color="textMuted" size={13} weight="500">
          Cloud sync isn't configured yet. Add EXPO_PUBLIC_SUPABASE_URL and
          EXPO_PUBLIC_SUPABASE_ANON_KEY to .env and restart the dev server to
          enable it.
        </AppText>
      </Card>
    );
  }

  const doSignIn = async () => {
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
  const doSignOut = async () => {
    setBusy(true);
    try {
      await signOut();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <SectionHeader title="Account" />
      <AppText color="textMuted" size={13} weight="500" style={{ marginBottom: Space.md }}>
        Sign in with Google to sync goals, notes, and progress across devices.
        Without sign-in everything stays on this device only.
      </AppText>
      {loading ? (
        <AppText color="textMuted" size={13} weight="500">
          Loading…
        </AppText>
      ) : user ? (
        <View style={{ gap: Space.md }}>
          <AppText weight="700" size={14}>
            Signed in as {user.email ?? user.name ?? user.id}
          </AppText>
          <View style={{ flexDirection: 'row', gap: Space.sm, flexWrap: 'wrap' }}>
            <SyncButton />
            <Pressable
              onPress={doSignOut}
              disabled={busy}
              style={{
                paddingHorizontal: Space.lg,
                paddingVertical: Space.sm,
                borderRadius: Radius.pill,
                borderWidth: 1,
                borderColor: theme.colors.border,
                opacity: busy ? 0.6 : 1,
              }}>
              <AppText weight="700" size={13} color="textMuted">
                Sign out
              </AppText>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={{ gap: Space.md }}>
          <Pressable
            onPress={doSignIn}
            disabled={busy}
            style={{
              alignSelf: 'flex-start',
              flexDirection: 'row',
              alignItems: 'center',
              gap: Space.sm,
              paddingHorizontal: Space.lg,
              paddingVertical: Space.sm,
              borderRadius: Radius.pill,
              backgroundColor: theme.colors.primary,
              opacity: busy ? 0.6 : 1,
            }}>
            <Ionicons name="logo-google" size={16} color={theme.colors.primaryText} />
            <AppText weight="800" color="primaryText" size={13}>
              {busy ? 'Signing in…' : 'Sign in with Google'}
            </AppText>
          </Pressable>
          {error ? (
            <AppText size={12} weight="600" style={{ color: theme.colors.danger }}>
              {error}
            </AppText>
          ) : null}
        </View>
      )}
    </Card>
  );
}

// "Sync now" button — calls forceSync to flush any pending pushes and pull
// the latest cloud state. Lights up while running and surfaces errors.
function SyncButton() {
  const { theme } = useTheme();
  const [status, setStatus] = useState(getSyncStatus());
  useEffect(() => onSyncStatus(setStatus), []);
  const busy = status === 'pulling' || status === 'pushing';
  const label = busy ? 'Syncing…' : status === 'error' ? 'Retry sync' : 'Sync now';
  return (
    <Pressable
      onPress={() => void forceSync()}
      disabled={busy}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: Space.lg,
        paddingVertical: Space.sm,
        borderRadius: Radius.pill,
        backgroundColor: status === 'error' ? theme.colors.danger : theme.colors.primary,
        opacity: busy ? 0.6 : 1,
      }}>
      <Ionicons
        name="sync"
        size={14}
        color={theme.colors.primaryText}
      />
      <AppText weight="800" size={13} color="primaryText">
        {label}
      </AppText>
    </Pressable>
  );
}

// Install card — surfaces Chrome's deferred install prompt as an explicit
// button. iOS Safari doesn't fire `beforeinstallprompt`, so we show
// Add-to-Home-Screen instructions instead.
function InstallCard() {
  const { theme } = useTheme();
  const { isWeb, isIOS, installed, canInstall } = useInstallState();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Native builds — install via the app store / sideload flow, not this card.
  if (!isWeb) return null;

  const onInstall = async () => {
    setBusy(true);
    setMsg(null);
    const outcome = await triggerInstall();
    setBusy(false);
    if (outcome === 'accepted') setMsg('Installing…');
    else if (outcome === 'dismissed') setMsg('Install dismissed — you can try again any time.');
    else setMsg('Your browser hasn’t offered an install prompt yet. Try reloading the page and waiting a few seconds.');
  };

  return (
    <Card>
      <SectionHeader title="Install" />
      {installed ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
          <AppText size={13} weight="700">
            Installed — Roadmap is running as an app.
          </AppText>
        </View>
      ) : isIOS ? (
        <View style={{ gap: Space.sm }}>
          <AppText color="textMuted" size={13} weight="500">
            iOS doesn&rsquo;t offer an install button. To add Roadmap to your home screen:
          </AppText>
          <AppText size={13} weight="600">
            1. Tap the Share button (square with up-arrow) in Safari{'\n'}
            2. Scroll down and tap &ldquo;Add to Home Screen&rdquo;{'\n'}
            3. Tap &ldquo;Add&rdquo;
          </AppText>
        </View>
      ) : (
        <View style={{ gap: Space.md }}>
          <AppText color="textMuted" size={13} weight="500">
            Install Roadmap on this device so it launches like a native app
            (full screen, on your home screen, faster cold-starts, works offline).
          </AppText>
          <Pressable
            onPress={onInstall}
            disabled={busy || !canInstall}
            style={{
              alignSelf: 'flex-start',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingHorizontal: Space.lg,
              paddingVertical: Space.sm,
              borderRadius: Radius.pill,
              backgroundColor: canInstall ? theme.colors.primary : theme.colors.surfaceAlt,
              opacity: busy ? 0.6 : 1,
            }}>
            <Ionicons
              name="download-outline"
              size={16}
              color={canInstall ? theme.colors.primaryText : theme.colors.textMuted}
            />
            <AppText
              weight="800"
              size={13}
              color={canInstall ? 'primaryText' : 'textMuted'}>
              {busy ? 'Installing…' : 'Install Roadmap'}
            </AppText>
          </Pressable>
          {!canInstall ? (
            <AppText size={11} weight="600" color="textFaint">
              No install prompt available yet. Reload the page and wait a few seconds
              — Chrome only offers it after the page has registered as a real PWA.
            </AppText>
          ) : null}
          {msg ? (
            <AppText size={12} weight="600" color="textMuted">
              {msg}
            </AppText>
          ) : null}
        </View>
      )}
    </Card>
  );
}

// Vault card — shows the lock state and lets the user unlock / lock without
// having to open a specific encrypted note first.
function VaultCard() {
  const { theme } = useTheme();
  const [, force] = useState(0);
  const [unlockOpen, setUnlockOpen] = useState(false);

  useEffect(() => onVaultLockChange(() => force((x) => x + 1)), []);

  const notes = useStore((s) => s.notes);
  const encryptedCount = notes.filter((n) => n.secure).length;
  const unlocked = isVaultUnlocked();

  return (
    <Card>
      <SectionHeader title="Vault" />
      <AppText color="textMuted" size={13} weight="500" style={{ marginBottom: Space.md }}>
        Encrypt sensitive notes (API keys, passwords) so they&apos;re unreadable on
        the server and after sign-out. One passphrase covers all your encrypted
        notes; it lives only in this browser tab&apos;s memory.
      </AppText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.md, flexWrap: 'wrap' }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: Space.md,
            paddingVertical: 5,
            borderRadius: Radius.pill,
            backgroundColor: unlocked ? theme.colors.success + '22' : theme.colors.surfaceAlt,
            borderWidth: 1,
            borderColor: unlocked ? theme.colors.success : theme.colors.border,
          }}>
          <Ionicons
            name={unlocked ? 'lock-open' : 'lock-closed'}
            size={13}
            color={unlocked ? theme.colors.success : theme.colors.textMuted}
          />
          <AppText
            size={12}
            weight="800"
            style={{ color: unlocked ? theme.colors.success : theme.colors.textMuted }}>
            {unlocked ? 'UNLOCKED' : 'LOCKED'}
          </AppText>
        </View>
        <AppText size={12} weight="600" color="textMuted">
          {encryptedCount} encrypted {encryptedCount === 1 ? 'note' : 'notes'}
        </AppText>
        <View style={{ flex: 1 }} />
        {unlocked ? (
          <Pressable
            onPress={lockVault}
            style={{
              paddingHorizontal: Space.md,
              paddingVertical: 6,
              borderRadius: Radius.pill,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}>
            <AppText weight="700" size={12} color="textMuted">
              Lock vault
            </AppText>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => setUnlockOpen(true)}
            style={{
              paddingHorizontal: Space.md,
              paddingVertical: 6,
              borderRadius: Radius.pill,
              backgroundColor: theme.colors.primary,
            }}>
            <AppText weight="800" size={12} color="primaryText">
              Unlock
            </AppText>
          </Pressable>
        )}
      </View>
      <VaultUnlockModal
        visible={unlockOpen}
        mode={encryptedCount === 0 ? 'setup' : 'unlock'}
        onCancel={() => setUnlockOpen(false)}
        onUnlocked={() => setUnlockOpen(false)}
      />
    </Card>
  );
}

function LanguageCard() {
  const { theme } = useTheme();
  const { lang, setLang, t } = useI18n();
  const LANGS: { id: 'en' | 'lt'; label: string; flag: string }[] = [
    { id: 'en', label: 'English', flag: '🇬🇧' },
    { id: 'lt', label: 'Lietuvių', flag: '🇱🇹' },
  ];
  return (
    <Card>
      <SectionHeader title={t('settings.language')} />
      <AppText color="textMuted" size={13} weight="500" style={{ marginTop: 4 }}>
        {t('settings.languageHint')}
      </AppText>
      <View style={{ flexDirection: 'row', gap: Space.sm, marginTop: Space.md }}>
        {LANGS.map((l) => {
          const sel = lang === l.id;
          return (
            <Pressable
              key={l.id}
              onPress={() => setLang(l.id)}
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: Space.md,
                borderRadius: Radius.md,
                backgroundColor: sel ? theme.colors.primary : theme.colors.surfaceAlt,
                borderWidth: 1,
                borderColor: sel ? theme.colors.primary : theme.colors.border,
              }}>
              <AppText size={20}>{l.flag}</AppText>
              <AppText weight="700" size={13} color={sel ? 'primaryText' : 'text'} style={{ marginTop: 2 }}>
                {l.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

function ProjectsCard() {
  const { theme } = useTheme();
  const { lang } = useI18n();
  const projects = useStore((s) => s.projects);
  const activeProjectId = useStore((s) => s.activeProjectId);
  const updateProject = useStore((s) => s.updateProject);
  const deleteProject = useStore((s) => s.deleteProject);
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<Project | null>(null);

  return (
    <Card>
      <SectionHeader title="Projects" />
      <AppText color="textMuted" size={13} weight="500" style={{ marginTop: 4 }}>
        Switch projects from the sidebar. Each keeps its own goals, vision, and notes. XP and achievements are shared.
      </AppText>
      <View style={{ gap: Space.sm, marginTop: Space.md }}>
        {projects.map((p) => {
          const isActive = p.id === activeProjectId;
          const isEditing = editing === p.id;
          return (
            <View
              key={p.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: Space.md,
                backgroundColor: theme.colors.surfaceAlt,
                borderRadius: Radius.md,
                padding: Space.md,
                borderWidth: isActive ? 1 : 0,
                borderColor: isActive ? theme.colors.primary : 'transparent',
              }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: p.color,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Ionicons name={p.icon as any} size={16} color="#fff" />
              </View>
              {isEditing ? (
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  onBlur={() => {
                    if (editName.trim()) updateProject(p.id, { name: editName.trim() });
                    setEditing(null);
                  }}
                  autoFocus
                  style={{
                    flex: 1,
                    color: theme.colors.text,
                    fontSize: 14,
                    fontWeight: '700',
                  }}
                />
              ) : (
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <AppText weight="700" size={14}>
                      {tSeed(p.name, lang)}
                    </AppText>
                    {isActive ? (
                      <View
                        style={{
                          backgroundColor: theme.colors.primary,
                          borderRadius: Radius.pill,
                          paddingHorizontal: 6,
                          paddingVertical: 1,
                        }}>
                        <AppText size={9} weight="800" color="primaryText">
                          ACTIVE
                        </AppText>
                      </View>
                    ) : null}
                  </View>
                  <AppText color="textMuted" size={11} weight="500" numberOfLines={1}>
                    {tSeed(p.vision.title, lang) || 'No vision yet'}
                  </AppText>
                </View>
              )}
              <Pressable
                onPress={() => {
                  setEditName(p.name);
                  setEditing(p.id);
                }}
                hitSlop={6}>
                <Ionicons name="pencil" size={15} color={theme.colors.textMuted} />
              </Pressable>
              <Pressable
                onPress={() => setConfirmDelete(p)}
                disabled={projects.length <= 1}
                hitSlop={6}
                style={{ opacity: projects.length <= 1 ? 0.3 : 1 }}>
                <Ionicons name="trash-outline" size={15} color={theme.colors.danger} />
              </Pressable>
            </View>
          );
        })}
      </View>
      <ConfirmModal
        visible={!!confirmDelete}
        title={`Delete "${confirmDelete?.name ?? ''}"?`}
        body="All goals and notes in this project will be permanently removed. Your XP and achievements stay."
        confirmLabel="Delete project"
        danger
        icon="trash"
        onConfirm={() => confirmDelete && deleteProject(confirmDelete.id)}
        onClose={() => setConfirmDelete(null)}
      />
    </Card>
  );
}
