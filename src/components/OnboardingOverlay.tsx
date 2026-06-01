import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, View } from 'react-native';

import { useStore } from '@/store/store';
import { Radius, Space } from '@/theme/themes';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from './ui';

const POINTS: { icon: string; title: string; body: string }[] = [
  { icon: 'flag', title: 'Set goals across timeframes', body: 'Daily, weekly, monthly, yearly — all feeding one long-term vision.' },
  { icon: 'repeat', title: 'Build habits that stick', body: 'Make goals recurring, track streaks, and repair a slip with a freeze token.' },
  { icon: 'analytics', title: 'See your growth', body: 'Insights, completion rate, and an activity heatmap show your momentum.' },
  { icon: 'color-palette', title: 'Make it yours', body: 'Fifteen themes — unlock more as you level up.' },
];

export function OnboardingOverlay() {
  const { theme } = useTheme();
  const onboarded = useStore((s) => s.onboarded);
  const setOnboarded = useStore((s) => s.setOnboarded);

  if (onboarded) return null;

  return (
    <Modal transparent animationType="fade" visible onRequestClose={() => setOnboarded(true)}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.6)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: Space.xl,
        }}>
        <View
          style={{
            backgroundColor: theme.colors.surfaceElevated,
            borderRadius: Radius.xl,
            borderWidth: 1,
            borderColor: theme.colors.border,
            padding: Space.xxl,
            width: '100%',
            maxWidth: 420,
            gap: Space.lg,
          }}>
          <View style={{ alignItems: 'center', gap: Space.sm }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: Radius.lg,
                backgroundColor: theme.colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons name="rocket" size={28} color={theme.colors.primaryText} />
            </View>
            <AppText size={22} weight="800">
              Welcome to Roadmap
            </AppText>
            <AppText color="textMuted" size={14} weight="500" style={{ textAlign: 'center' }}>
              Turn a long-term vision into daily progress.
            </AppText>
          </View>

          <View style={{ gap: Space.md }}>
            {POINTS.map((p) => (
              <View key={p.title} style={{ flexDirection: 'row', gap: Space.md, alignItems: 'flex-start' }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: Radius.sm,
                    backgroundColor: theme.colors.surfaceAlt,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Ionicons name={p.icon as any} size={18} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText weight="700" size={14}>
                    {p.title}
                  </AppText>
                  <AppText color="textMuted" size={13} weight="500">
                    {p.body}
                  </AppText>
                </View>
              </View>
            ))}
          </View>

          <Pressable
            onPress={() => setOnboarded(true)}
            style={{
              backgroundColor: theme.colors.primary,
              borderRadius: Radius.pill,
              paddingVertical: Space.md,
              alignItems: 'center',
            }}>
            <AppText weight="700" color="primaryText" size={16}>
              Get started
            </AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
