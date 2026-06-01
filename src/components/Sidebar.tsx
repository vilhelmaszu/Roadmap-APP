import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { roadmapProgress, visionYearLabel, visionYearsLeft } from '@/domain/logic';
import { useT } from '@/i18n';
import { useActiveGoals } from '@/store/hooks';
import { useStore } from '@/store/store';
import { Radius, Space } from '@/theme/themes';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText, ProgressBar, useWide } from './ui';

type NavItem = { href: string; labelKey: string; icon: any; alts?: string[] };

// Paired routes share one sidebar entry; the secondary opens via in-page sub-tabs.
// Roadmap⇄Goals, Growth⇄Insights, Terrarium⇄Achievements.
const NAV: NavItem[] = [
  { href: '/', labelKey: 'nav.home', icon: 'home' },
  { href: '/roadmap', labelKey: 'nav.roadmap', icon: 'map', alts: ['/goals'] },
  { href: '/growth', labelKey: 'nav.growth', icon: 'trending-up', alts: ['/insights'] },
  { href: '/terrarium', labelKey: 'nav.terrarium', icon: 'leaf', alts: ['/achievements'] },
  { href: '/notes', labelKey: 'nav.notes', icon: 'document-text' },
  { href: '/archive', labelKey: 'nav.archive', icon: 'archive' },
  { href: '/settings', labelKey: 'nav.settings', icon: 'settings' },
];

export function Sidebar() {
  const { theme } = useTheme();
  const wide = useWide();
  const router = useRouter();
  const pathname = usePathname();
  const t = useT();
  const goals = useActiveGoals();
  const vision = useStore((s) => s.vision);
  const progress = roadmapProgress(goals);
  const yearsLeft = visionYearsLeft(vision);

  const width = wide ? 232 : 72;

  return (
    <View
      style={{
        width,
        backgroundColor: theme.colors.surface,
        borderRightWidth: 1,
        borderRightColor: theme.colors.border,
        paddingTop: Space.xl,
        paddingHorizontal: wide ? Space.md : Space.sm,
        paddingBottom: Space.lg,
        justifyContent: 'space-between',
      }}>
      <View style={{ gap: Space.xs }}>
        {/* Brand */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: Space.sm,
            paddingHorizontal: wide ? Space.sm : 0,
            justifyContent: wide ? 'flex-start' : 'center',
            marginBottom: Space.lg,
          }}>
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              backgroundColor: theme.colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons name="rocket" size={18} color={theme.colors.primaryText} />
          </View>
          {wide ? (
            <View>
              <AppText weight="800" size={15}>
                Roadmap
              </AppText>
              <AppText color="textFaint" size={11} weight="700">
                {vision.indefinite ? 'Ongoing vision' : `${vision.targetYear} vision`}
              </AppText>
            </View>
          ) : null}
        </View>

        {NAV.map((item) => {
          const active = pathname === item.href || (item.alts?.includes(pathname) ?? false);
          return (
            <Pressable
              key={item.href}
              onPress={() => router.push(item.href as any)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: Space.md,
                justifyContent: wide ? 'flex-start' : 'center',
                paddingVertical: Space.md,
                paddingHorizontal: wide ? Space.md : 0,
                borderRadius: Radius.md,
                backgroundColor: active ? theme.colors.surfaceAlt : 'transparent',
              }}>
              <Ionicons
                name={item.icon}
                size={20}
                color={active ? theme.colors.primary : theme.colors.textMuted}
              />
              {wide ? (
                <AppText weight={active ? '800' : '600'} color={active ? 'text' : 'textMuted'}>
                  {t(item.labelKey as any)}
                </AppText>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {/* Footer: roadmap progress */}
      {wide ? (
        <View
          style={{
            backgroundColor: theme.colors.surfaceAlt,
            borderRadius: Radius.md,
            padding: Space.md,
            gap: 6,
          }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <AppText size={11} weight="800" color="textMuted">
              ROADMAP
            </AppText>
            <AppText size={11} weight="800" color="primary">
              {Math.round(progress * 100)}%
            </AppText>
          </View>
          <ProgressBar progress={progress} height={6} />
          <AppText size={11} weight="700" color="textFaint">
            {yearsLeft == null ? 'Ongoing' : `${yearsLeft} years left`}
          </AppText>
        </View>
      ) : (
        <View style={{ alignItems: 'center' }}>
          <AppText size={11} weight="800" color="primary">
            {Math.round(progress * 100)}%
          </AppText>
        </View>
      )}
    </View>
  );
}
