import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { Creature } from '@/components/Creature';
import { SubTabs, TERRARIUM_TABS } from '@/components/SubTabs';
import { AppText, Card, ProgressBar, Screen, SectionHeader } from '@/components/ui';
import { buildAchievements, buildCreatures } from '@/domain/logic';
import { Achievement, AchievementCategory, Creature as CreatureType } from '@/domain/types';
import { useStore } from '@/store/store';
import { Radius, Space } from '@/theme/themes';
import { useTheme } from '@/theme/ThemeProvider';

const GROUPS: { key: AchievementCategory; title: string }[] = [
  { key: 'daily', title: 'Daily goals' },
  { key: 'weekly', title: 'Weekly goals' },
  { key: 'monthly', title: 'Monthly goals' },
  { key: 'yearly', title: 'Yearly goals' },
  { key: 'streak', title: 'Streaks' },
  { key: 'level', title: 'Levels' },
];

export default function Achievements() {
  const { theme } = useTheme();
  const profile = useStore((s) => s.profile);
  const all = buildAchievements(profile);
  const earned = all.filter((a) => a.earned).length;
  const labelFor = (id: string) => all.find((a) => a.id === id)?.label ?? 'Locked achievement';
  const creatures = buildCreatures(profile);
  const creaturesEarned = creatures.filter((c) => c.earned).length;

  return (
    <Screen title="Achievements" subtitle={`${earned} of ${all.length} unlocked`}>
      <SubTabs tabs={TERRARIUM_TABS} />
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <AppText weight="800">Overall</AppText>
          <AppText color="primary" weight="800">
            {Math.round((earned / all.length) * 100)}%
          </AppText>
        </View>
        <ProgressBar progress={all.length ? earned / all.length : 0} />
      </Card>

      {/* Creature collection */}
      <View style={{ gap: Space.md }}>
        <SectionHeader
          title="Creatures"
          action={
            <AppText color="textMuted" size={12} weight="700">
              {creaturesEarned}/{creatures.length} discovered
            </AppText>
          }
        />
        <AppText color="textMuted" size={13} weight="500">
          Milestone emblems earned for your most demanding achievements. Difficulty determines their form.
        </AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Space.md }}>
          {creatures.map((c) => (
            <CreatureCard key={c.id} c={c} unlockLabel={labelFor(c.achievementId)} />
          ))}
        </View>
      </View>

      {GROUPS.map((group) => {
        const items = all.filter((a) => a.category === group.key);
        return (
          <View key={group.key} style={{ gap: Space.md }}>
            <SectionHeader title={group.title} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Space.md }}>
              {items.map((a) => (
                <AchievementCard key={a.id} a={a} />
              ))}
            </View>
          </View>
        );
      })}
    </Screen>
  );
}

function CreatureCard({ c, unlockLabel }: { c: CreatureType; unlockLabel: string }) {
  const { theme } = useTheme();
  const seed = parseInt(c.id.replace(/\D/g, ''), 10) || 0;
  return (
    <View
      style={{
        width: '31%',
        minWidth: 140,
        flexGrow: 1,
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: c.earned ? theme.colors.primary : theme.colors.border,
        padding: Space.lg,
        gap: Space.sm,
      }}>
      <View
        style={{
          width: 90,
          height: 90,
          borderRadius: 45,
          backgroundColor: theme.colors.surfaceAlt,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Creature tier={c.tier} seed={seed} size={78} earned={c.earned} silhouette={theme.colors.textFaint} />
      </View>
      <AppText weight="800">{c.earned ? c.name : '???'}</AppText>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          backgroundColor: theme.colors.surfaceAlt,
          borderRadius: Radius.pill,
          paddingHorizontal: Space.sm,
          paddingVertical: 2,
        }}>
        <Ionicons name="flame" size={11} color={theme.colors.warning} />
        <AppText size={11} weight="800" color="textMuted">
          TIER {c.tier}
        </AppText>
      </View>
      {c.earned ? (
        <AppText color="primary" size={11} weight="700">
          Discovered
        </AppText>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="lock-closed" size={11} color={theme.colors.textFaint} />
          <AppText color="textFaint" size={11} weight="700" numberOfLines={2} style={{ textAlign: 'center' }}>
            {unlockLabel}
          </AppText>
        </View>
      )}
    </View>
  );
}

function AchievementCard({ a }: { a: Achievement }) {
  const { theme } = useTheme();
  const pct = Math.min(1, a.current / a.threshold);
  return (
    <View
      style={{
        width: '31%',
        minWidth: 150,
        flexGrow: 1,
        backgroundColor: theme.colors.surface,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: a.earned ? theme.colors.primary : theme.colors.border,
        padding: Space.lg,
        gap: Space.sm,
        opacity: a.earned ? 1 : 0.7,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: theme.colors.surfaceAlt,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Ionicons
            name={(a.earned ? a.icon : 'lock-closed') as any}
            size={22}
            color={a.earned ? theme.colors.primary : theme.colors.textFaint}
          />
        </View>
        {a.earned ? <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} /> : null}
      </View>
      <AppText weight="800">{a.label}</AppText>
      {!a.earned ? (
        <>
          <ProgressBar progress={pct} height={6} />
          <AppText color="textMuted" size={11} weight="700">
            {a.current}/{a.threshold}
          </AppText>
        </>
      ) : (
        <AppText color="primary" size={12} weight="700">
          Unlocked
        </AppText>
      )}
    </View>
  );
}
