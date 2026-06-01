import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Radius, Space } from '@/theme/themes';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from './ui';

export type SubTab = { label: string; href: string; icon: string };

// A segmented in-page tab bar that swaps between two related routes
// (e.g. Roadmap ⇄ Goals), so the left sidebar can stay short and uncluttered.
export function SubTabs({ tabs }: { tabs: SubTab[] }) {
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignSelf: 'flex-start',
        gap: 4,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: Radius.pill,
        padding: 4,
        marginBottom: Space.sm,
      }}>
      {tabs.map((t) => {
        const active = pathname === t.href;
        return (
          <Pressable
            key={t.href}
            onPress={() => {
              if (!active) router.push(t.href as any);
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              borderRadius: Radius.pill,
              paddingHorizontal: Space.lg,
              paddingVertical: 8,
              backgroundColor: active ? theme.colors.primary : 'transparent',
            }}>
            <Ionicons
              name={t.icon as any}
              size={15}
              color={active ? theme.colors.primaryText : theme.colors.textMuted}
            />
            <AppText size={13} weight="700" color={active ? 'primaryText' : 'textMuted'}>
              {t.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

export const ROADMAP_TABS: SubTab[] = [
  { label: 'Roadmap', href: '/roadmap', icon: 'map' },
  { label: 'Goals', href: '/goals', icon: 'flag' },
];

export const GROWTH_TABS: SubTab[] = [
  { label: 'Growth', href: '/growth', icon: 'trending-up' },
  { label: 'Insights', href: '/insights', icon: 'analytics' },
];

export const TERRARIUM_TABS: SubTab[] = [
  { label: 'Terrarium', href: '/terrarium', icon: 'leaf' },
  { label: 'Achievements', href: '/achievements', icon: 'trophy' },
];
