import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { PlanPoint } from '@/domain/types';
import { useI18n } from '@/i18n';
import { tSeed } from '@/i18n/seedI18n';
import { Radius, Space } from '@/theme/themes';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText, CheckBox, IconButton } from './ui';

export function PlanPoints({
  points,
  onToggle,
  onAdd,
  onRemove,
}: {
  points: PlanPoint[];
  onToggle: (id: string) => void;
  onAdd?: (text: string) => void;
  onRemove?: (id: string) => void;
}) {
  const { theme } = useTheme();
  const { lang } = useI18n();
  const [text, setText] = useState('');

  const submit = () => {
    if (!text.trim() || !onAdd) return;
    onAdd(text.trim());
    setText('');
  };

  return (
    <View style={{ gap: Space.sm }}>
      {points.map((p) => (
        <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: Space.md }}>
          <Pressable onPress={() => onToggle(p.id)} hitSlop={6}>
            <CheckBox checked={p.done} size={22} />
          </Pressable>
          <AppText
            style={[{ flex: 1 }, p.done ? { textDecorationLine: 'line-through' } : null]}
            color={p.done ? 'textFaint' : 'text'}
            weight="600">
            {tSeed(p.text, lang)}
          </AppText>
          {onRemove ? <IconButton name="close" onPress={() => onRemove(p.id)} size={16} /> : null}
        </View>
      ))}

      {onAdd ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.sm, marginTop: 2 }}>
          <TextInput
            value={text}
            onChangeText={setText}
            onSubmitEditing={submit}
            placeholder="Add a plan point…"
            placeholderTextColor={theme.colors.textFaint}
            style={{
              flex: 1,
              color: theme.colors.text,
              backgroundColor: theme.colors.surfaceAlt,
              borderRadius: Radius.md,
              paddingHorizontal: Space.md,
              paddingVertical: Space.sm,
              fontWeight: '600',
            }}
          />
          <IconButton name="add-circle" onPress={submit} color={theme.colors.primary} size={26} />
        </View>
      ) : null}
    </View>
  );
}
