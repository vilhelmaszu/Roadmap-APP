import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, TextInput, View } from 'react-native';

import { unlockVault } from '@/services/vault';
import { Radius, Space } from '@/theme/themes';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from './ui';

// Passphrase prompt. Two modes:
//   - "setup"  → first time encrypting; ask for passphrase + confirmation, big warning.
//   - "unlock" → opening an existing encrypted note; just ask for the passphrase.
export function VaultUnlockModal({
  visible,
  mode,
  onCancel,
  onUnlocked,
}: {
  visible: boolean;
  mode: 'setup' | 'unlock';
  onCancel: () => void;
  onUnlocked: () => void;
}) {
  const { theme } = useTheme();
  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Reset draft fields when the modal opens so old typed text doesn't linger.
  useEffect(() => {
    if (visible) {
      setPass('');
      setConfirm('');
      setError(null);
    }
  }, [visible]);

  const submit = () => {
    setError(null);
    const trimmed = pass.trim();
    if (trimmed.length < 8) {
      setError('Passphrase must be at least 8 characters.');
      return;
    }
    if (mode === 'setup' && trimmed !== confirm.trim()) {
      setError('Passphrases do not match.');
      return;
    }
    unlockVault(trimmed);
    onUnlocked();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        onPress={onCancel}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.6)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: Space.lg,
        }}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: 440,
            backgroundColor: theme.colors.surface,
            borderRadius: Radius.xl,
            borderWidth: 1,
            borderColor: theme.colors.border,
            padding: Space.lg,
            gap: Space.md,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="lock-closed" size={20} color={theme.colors.primary} />
            <AppText weight="800" size={16}>
              {mode === 'setup' ? 'Set vault passphrase' : 'Unlock vault'}
            </AppText>
          </View>

          {mode === 'setup' ? (
            <View
              style={{
                borderRadius: Radius.md,
                backgroundColor: theme.colors.warning + '22',
                borderWidth: 1,
                borderColor: theme.colors.warning,
                padding: Space.md,
                gap: 4,
              }}>
              <AppText weight="800" size={12} style={{ color: theme.colors.warning }}>
                IMPORTANT
              </AppText>
              <AppText size={12} weight="600">
                If you forget this passphrase, every encrypted note will be permanently
                unreadable. There is no reset.
              </AppText>
            </View>
          ) : (
            <AppText color="textMuted" size={13} weight="500">
              Enter your passphrase to view encrypted notes. The passphrase lives only
              in this browser tab&apos;s memory until you reload or lock the vault.
            </AppText>
          )}

          <TextInput
            value={pass}
            onChangeText={setPass}
            placeholder="Passphrase"
            placeholderTextColor={theme.colors.textFaint}
            secureTextEntry
            autoFocus
            onSubmitEditing={mode === 'unlock' ? submit : undefined}
            style={{
              color: theme.colors.text,
              backgroundColor: theme.colors.surfaceAlt,
              borderRadius: Radius.md,
              paddingHorizontal: Space.md,
              paddingVertical: Space.sm,
              fontSize: 14,
              fontWeight: '600',
            }}
          />

          {mode === 'setup' ? (
            <TextInput
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Confirm passphrase"
              placeholderTextColor={theme.colors.textFaint}
              secureTextEntry
              onSubmitEditing={submit}
              style={{
                color: theme.colors.text,
                backgroundColor: theme.colors.surfaceAlt,
                borderRadius: Radius.md,
                paddingHorizontal: Space.md,
                paddingVertical: Space.sm,
                fontSize: 14,
                fontWeight: '600',
              }}
            />
          ) : null}

          {error ? (
            <AppText size={12} weight="700" style={{ color: theme.colors.danger }}>
              {error}
            </AppText>
          ) : null}

          <View style={{ flexDirection: 'row', gap: Space.sm, justifyContent: 'flex-end' }}>
            <Pressable
              onPress={onCancel}
              style={{
                paddingHorizontal: Space.md,
                paddingVertical: Space.sm,
                borderRadius: Radius.pill,
                borderWidth: 1,
                borderColor: theme.colors.border,
              }}>
              <AppText weight="700" size={13} color="textMuted">
                Cancel
              </AppText>
            </Pressable>
            <Pressable
              onPress={submit}
              style={{
                paddingHorizontal: Space.md,
                paddingVertical: Space.sm,
                borderRadius: Radius.pill,
                backgroundColor: theme.colors.primary,
              }}>
              <AppText weight="800" size={13} color="primaryText">
                {mode === 'setup' ? 'Set passphrase' : 'Unlock'}
              </AppText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
