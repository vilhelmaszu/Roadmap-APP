import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Creature } from '@/components/Creature';
import { SubTabs, TERRARIUM_TABS } from '@/components/SubTabs';
import { Terrarium } from '@/components/Terrarium';
import { AppText, Card, Screen, SectionHeader, useWide } from '@/components/ui';
import { buildCreatures } from '@/domain/logic';
import { useStore } from '@/store/store';
import { Radius, Space } from '@/theme/themes';
import { useTheme } from '@/theme/ThemeProvider';

export default function TerrariumScreen() {
  const { theme } = useTheme();
  const wide = useWide();
  const profile = useStore((s) => s.profile);
  const all = useMemo(() => buildCreatures(profile), [profile]);
  const earned = all.filter((c) => c.earned);
  const [showLocked, setShowLocked] = useState(true);

  // Earned creatures always roam; locked ones drift as faint silhouettes
  // (toggleable) so the habitat feels alive and teases what's still to come.
  const inhabitants = showLocked ? all : earned;

  return (
    <Screen title="Terrarium" subtitle="Your creatures roam free. Earn achievements to bring more to life.">
      <SubTabs tabs={TERRARIUM_TABS} />
      <Card style={{ padding: Space.md }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: Space.md,
            paddingHorizontal: Space.sm,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="paw" size={16} color={theme.colors.primary} />
            <AppText weight="700" size={14}>
              {earned.length} of {all.length} alive
            </AppText>
          </View>
          <Pressable
            onPress={() => setShowLocked((v) => !v)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              borderRadius: Radius.pill,
              borderWidth: 1,
              borderColor: showLocked ? theme.colors.primary : theme.colors.border,
              backgroundColor: showLocked ? theme.colors.primary : 'transparent',
              paddingHorizontal: Space.md,
              paddingVertical: 6,
            }}>
            <Ionicons
              name={showLocked ? 'eye' : 'eye-off'}
              size={14}
              color={showLocked ? theme.colors.primaryText : theme.colors.textMuted}
            />
            <AppText size={12} weight="700" color={showLocked ? 'primaryText' : 'textMuted'}>
              Show undiscovered
            </AppText>
          </Pressable>
        </View>

        <Terrarium creatures={inhabitants} height={wide ? 420 : 340} />

        {earned.length === 0 ? (
          <AppText color="textMuted" size={13} weight="500" style={{ marginTop: Space.md, textAlign: 'center' }}>
            No creatures discovered yet — complete achievements to hatch your first.
          </AppText>
        ) : null}
      </Card>

      {/* Roster */}
      <View style={{ gap: Space.md }}>
        <SectionHeader title="Inhabitants" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Space.md }}>
          {all.map((c) => {
            const seed = parseInt(c.id.replace(/\D/g, ''), 10) || 0;
            return (
              <View
                key={c.id}
                style={{
                  width: '31%',
                  minWidth: 120,
                  flexGrow: 1,
                  alignItems: 'center',
                  backgroundColor: theme.colors.surface,
                  borderRadius: Radius.lg,
                  borderWidth: 1,
                  borderColor: c.earned ? theme.colors.primary : theme.colors.border,
                  paddingVertical: Space.md,
                  gap: 4,
                }}>
                <Creature
                  tier={c.tier}
                  seed={seed}
                  size={56}
                  earned={c.earned}
                  silhouette={theme.colors.textFaint}
                />
                <AppText weight="700" size={13}>
                  {c.earned ? c.name : '???'}
                </AppText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Ionicons name="flame" size={10} color={theme.colors.warning} />
                  <AppText size={10} weight="700" color="textMuted">
                    TIER {c.tier}
                  </AppText>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </Screen>
  );
}
