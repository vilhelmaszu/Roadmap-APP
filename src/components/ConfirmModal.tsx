import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, View } from 'react-native';

import { Radius, Space } from '@/theme/themes';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from './ui';

// Reusable confirmation dialog. Centered popup, used by every destructive action
// (Start fresh, Reset roadmap, Reset everything, Clear archive, Delete X, etc.)
export function ConfirmModal({
  visible,
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger,
  icon,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  icon?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const accent = danger ? theme.colors.danger : theme.colors.primary;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.55)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: Space.xl,
        }}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: 380,
            backgroundColor: theme.colors.surfaceElevated,
            borderRadius: Radius.xl,
            borderWidth: 1,
            borderColor: theme.colors.border,
            padding: Space.xl,
            gap: Space.md,
          }}>
          <View style={{ alignItems: 'center', gap: Space.sm }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: theme.colors.surfaceAlt,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons
                name={(icon ?? (danger ? 'warning' : 'help-circle')) as any}
                size={26}
                color={accent}
              />
            </View>
            <AppText size={18} weight="800" style={{ textAlign: 'center' }}>
              {title}
            </AppText>
            {body ? (
              <AppText color="textMuted" size={14} weight="500" style={{ textAlign: 'center' }}>
                {body}
              </AppText>
            ) : null}
          </View>

          <View style={{ flexDirection: 'row', gap: Space.sm, marginTop: Space.sm }}>
            <Pressable
              onPress={onClose}
              style={{
                flex: 1,
                backgroundColor: theme.colors.surfaceAlt,
                borderRadius: Radius.pill,
                paddingVertical: Space.md,
                alignItems: 'center',
              }}>
              <AppText weight="700" color="text" size={14}>
                {cancelLabel}
              </AppText>
            </Pressable>
            <Pressable
              onPress={() => {
                onConfirm();
                onClose();
              }}
              style={{
                flex: 1,
                backgroundColor: accent,
                borderRadius: Radius.pill,
                paddingVertical: Space.md,
                alignItems: 'center',
              }}>
              <AppText weight="800" color="primaryText" size={14}>
                {confirmLabel}
              </AppText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
