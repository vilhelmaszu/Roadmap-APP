import { useEffect, useState } from 'react';
import { Modal, Pressable, TextInput, View } from 'react-native';

import { Radius, Space } from '@/theme/themes';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from './ui';

// Single-input modal that prompts for a note title before creating it.
// Confirm calls onConfirm(title) with the trimmed value; Cancel just closes.
export function NoteNameModal({
  visible,
  onCancel,
  onConfirm,
  placeholder = 'Note title',
}: {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (title: string) => void;
  placeholder?: string;
}) {
  const { theme } = useTheme();
  const [title, setTitle] = useState('');

  // Reset draft each time it opens — never carry over the previous title.
  useEffect(() => {
    if (visible) setTitle('');
  }, [visible]);

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        onPress={onCancel}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.55)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: Space.lg,
        }}>
        <Pressable
          onPress={() => {}}
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
          <AppText weight="800" size={16}>
            Name your note
          </AppText>
          <TextInput
            value={title}
            onChangeText={setTitle}
            onSubmitEditing={submit}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textFaint}
            autoFocus
            style={{
              color: theme.colors.text,
              backgroundColor: theme.colors.surfaceAlt,
              borderRadius: Radius.md,
              paddingHorizontal: Space.md,
              paddingVertical: Space.sm,
              fontSize: 15,
              fontWeight: '600',
            }}
          />
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
              <AppText weight="700" color="textMuted" size={13}>
                Cancel
              </AppText>
            </Pressable>
            <Pressable
              onPress={submit}
              disabled={!title.trim()}
              style={{
                paddingHorizontal: Space.md,
                paddingVertical: Space.sm,
                borderRadius: Radius.pill,
                backgroundColor: title.trim() ? theme.colors.primary : theme.colors.surfaceAlt,
                opacity: title.trim() ? 1 : 0.6,
              }}>
              <AppText weight="800" color={title.trim() ? 'primaryText' : 'textFaint'} size={13}>
                Create
              </AppText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
