import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { todayKey } from '@/domain/logic';
import { Radius, Space } from '@/theme/themes';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText, useWide } from './ui';

type Entry = { title: string; color: string; timeframe: string };

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function keyFor(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function FullCalendar({
  visible,
  entries,
  onClose,
  onAddGoal,
  year: initialYear,
}: {
  visible: boolean;
  entries: Map<string, Entry[]>;
  onClose: () => void;
  onAddGoal: (dateKey: string) => void;
  year?: number;
}) {
  const { theme } = useTheme();
  const wide = useWide();
  const now = new Date();
  const [year, setYear] = useState(initialYear ?? now.getFullYear());
  const [selected, setSelected] = useState<string | null>(null);
  const today = todayKey();

  const selectedEntries = selected ? entries.get(selected) ?? [] : [];

  const monthCard = (m: number) => {
    const firstDay = new Date(year, m, 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    return (
      <View
        key={m}
        style={{
          width: wide ? '31%' : '100%',
          flexGrow: 1,
          minWidth: 220,
          backgroundColor: theme.colors.surface,
          borderRadius: Radius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          padding: Space.md,
          margin: '1%',
        }}>
        <AppText weight="800" size={14} style={{ marginBottom: Space.sm }}>
          {MONTHS[m]}
        </AppText>
        <View style={{ flexDirection: 'row' }}>
          {DOW.map((d, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center' }}>
              <AppText size={9} weight="700" color="textFaint">
                {d}
              </AppText>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {cells.map((d, i) => {
            if (d == null) return <View key={i} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} />;
            const k = keyFor(year, m, d);
            return (
              <Day
                key={i}
                day={d}
                dateKey={k}
                dots={entries.get(k)?.map((e) => e.color) ?? []}
                isToday={k === today}
                isSelected={k === selected}
                onPress={() => setSelected(k)}
              />
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: Space.lg,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          }}>
          <Pressable onPress={() => setYear((y) => y - 1)} hitSlop={10}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
          </Pressable>
          <AppText size={20} weight="800">
            {year}
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.lg }}>
            <Pressable onPress={() => setYear((y) => y + 1)} hitSlop={10}>
              <Ionicons name="chevron-forward" size={24} color={theme.colors.text} />
            </Pressable>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={26} color={theme.colors.text} />
            </Pressable>
          </View>
        </View>

        {/* Legend */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: Space.md,
            paddingHorizontal: Space.lg,
            paddingVertical: Space.md,
          }}>
          {[
            ['Daily', '#34D399'],
            ['Weekly', '#3B82F6'],
            ['Monthly', '#EF4444'],
            ['Yearly', '#FBBF24'],
          ].map(([label, color]) => (
            <View key={label as string} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color as string }} />
              <AppText size={12} weight="600" color="textMuted">
                {label}
              </AppText>
            </View>
          ))}
        </View>

        <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', padding: Space.md, paddingBottom: 160 }}>
          {Array.from({ length: 12 }).map((_, m) => monthCard(m))}
        </ScrollView>

        {/* Selected-day footer */}
        {selected ? (
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: theme.colors.surface,
              borderTopWidth: 1,
              borderTopColor: theme.colors.border,
              padding: Space.lg,
              gap: Space.sm,
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <AppText weight="800" size={15}>
                {selected}
              </AppText>
              <Pressable onPress={() => setSelected(null)} hitSlop={10}>
                <Ionicons name="close" size={20} color={theme.colors.textMuted} />
              </Pressable>
            </View>
            {selectedEntries.length ? (
              <View style={{ gap: 6 }}>
                {selectedEntries.slice(0, 4).map((e, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: e.color }} />
                    <AppText size={14} weight="600" numberOfLines={1} style={{ flex: 1 }}>
                      {e.title}
                    </AppText>
                    <AppText size={11} weight="700" color="textFaint">
                      {e.timeframe.toUpperCase()}
                    </AppText>
                  </View>
                ))}
                {selectedEntries.length > 4 ? (
                  <AppText size={12} weight="600" color="textMuted">
                    +{selectedEntries.length - 4} more
                  </AppText>
                ) : null}
              </View>
            ) : (
              <AppText size={13} weight="500" color="textMuted">
                No goals on this date yet.
              </AppText>
            )}
            <Pressable
              onPress={() => onAddGoal(selected)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                backgroundColor: theme.colors.primary,
                borderRadius: Radius.pill,
                paddingVertical: Space.md,
                marginTop: 4,
              }}>
              <Ionicons name="add" size={18} color={theme.colors.primaryText} />
              <AppText weight="700" color="primaryText" size={15}>
                Add a goal on this date
              </AppText>
            </Pressable>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

// One calendar day. Animates a spring "pop" + color fill when it becomes selected,
// and clearly tints days that already have goals so existing dates stand out.
function Day({
  day,
  dateKey,
  dots,
  isToday,
  isSelected,
  onPress,
}: {
  day: number;
  dateKey: string;
  dots: string[];
  isToday: boolean;
  isSelected: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const hasGoals = dots.length > 0;

  useEffect(() => {
    if (isSelected) {
      scale.value = withSpring(1.18, { damping: 8, stiffness: 220 });
    } else {
      scale.value = withTiming(1, { duration: 150 });
    }
  }, [isSelected, scale]);

  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const bg = isSelected
    ? theme.colors.primary
    : hasGoals
      ? theme.colors.surfaceAlt
      : isToday
        ? theme.colors.surfaceAlt
        : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: `${100 / 7}%`,
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
      })}>
      <Animated.View
        style={[
          {
            width: '86%',
            height: '86%',
            borderRadius: Radius.sm,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: bg,
            borderWidth: hasGoals && !isSelected ? 1 : isToday && !isSelected ? 1 : 0,
            borderColor: hasGoals ? theme.colors.primary : theme.colors.border,
          },
          aStyle,
        ]}>
        <AppText
          size={11}
          weight={isSelected || isToday || hasGoals ? '800' : '600'}
          color={isSelected ? 'primaryText' : 'text'}>
          {day}
        </AppText>
        {dots.length ? (
          <View style={{ flexDirection: 'row', gap: 1, marginTop: 1 }}>
            {dots.slice(0, 3).map((c, di) => (
              <View
                key={di}
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: isSelected ? theme.colors.primaryText : c,
                }}
              />
            ))}
          </View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}
