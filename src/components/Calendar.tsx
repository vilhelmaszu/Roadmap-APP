import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { todayKey } from '@/domain/logic';
import { Radius, Space } from '@/theme/themes';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from './ui';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function keyFor(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function Calendar({
  markers,
  selected,
  onSelect,
}: {
  markers: Map<string, string[]>; // dateKey -> list of dot colors (by timeframe)
  selected?: string;
  onSelect: (dateKey: string) => void;
}) {
  const { theme } = useTheme();
  const now = new Date();
  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const today = todayKey();

  const firstDay = new Date(view.y, view.m, 1);
  // Monday-first offset
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const shift = (delta: number) => {
    setView((v) => {
      const m = v.m + delta;
      if (m < 0) return { y: v.y - 1, m: 11 };
      if (m > 11) return { y: v.y + 1, m: 0 };
      return { y: v.y, m };
    });
  };

  return (
    <View style={{ gap: Space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={() => shift(-1)} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.textMuted} />
        </Pressable>
        <AppText weight="800" size={16}>
          {MONTHS[view.m]} {view.y}
        </AppText>
        <Pressable onPress={() => shift(1)} hitSlop={10}>
          <Ionicons name="chevron-forward" size={22} color={theme.colors.textMuted} />
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row' }}>
        {DOW.map((d, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <AppText size={11} weight="800" color="textFaint">
              {d}
            </AppText>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((d, i) => {
          if (d == null) return <View key={i} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} />;
          const k = keyFor(view.y, view.m, d);
          const isToday = k === today;
          const isSelected = k === selected;
          const dots = markers.get(k) ?? [];
          return (
            <View key={i} style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 3 }}>
              <Pressable
                onPress={() => onSelect(k)}
                style={{
                  flex: 1,
                  borderRadius: Radius.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isSelected
                    ? theme.colors.primary
                    : isToday
                      ? theme.colors.surfaceAlt
                      : 'transparent',
                  borderWidth: isToday && !isSelected ? 1 : 0,
                  borderColor: theme.colors.primary,
                }}>
                <AppText
                  weight={isToday || isSelected ? '800' : '600'}
                  color={isSelected ? 'primaryText' : 'text'}>
                  {d}
                </AppText>
                {dots.length ? (
                  <View style={{ flexDirection: 'row', gap: 2, marginTop: 2 }}>
                    {dots.slice(0, 4).map((color, di) => (
                      <View
                        key={di}
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: 3,
                          backgroundColor: isSelected ? theme.colors.primaryText : color,
                        }}
                      />
                    ))}
                  </View>
                ) : null}
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
