import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';

import { CelebrationOverlay } from '@/components/CelebrationOverlay';
import { ProgressRing } from '@/components/ProgressRing';
import { SideGoals } from '@/components/SideGoals';
import {
  AppText,
  Card,
  Pill,
  ProgressBar,
  Screen,
  SectionHeader,
  useWide,
} from '@/components/ui';
import {
  completionForTimeframe,
  dailyQuests,
  goalComplete,
  goalProgress,
  levelFromXp,
  rankForLevel,
  roadmapProgress,
  timeframeColor,
  todayKey,
} from '@/domain/logic';
import { Goal } from '@/domain/types';
import { useI18n } from '@/i18n';
import { tSeed } from '@/i18n/seedI18n';
import { useActiveGoals } from '@/store/hooks';
import { useStore } from '@/store/store';
import { Radius, Space } from '@/theme/themes';
import { useTheme } from '@/theme/ThemeProvider';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function Stat({ value, label, color = 'text' }: { value: string; label: string; color?: 'text' | 'primary' | 'warning' | 'success' }) {
  return (
    <View>
      <AppText size={20} weight="800" color={color}>
        {value}
      </AppText>
      <AppText size={11} weight="700" color="textMuted">
        {label}
      </AppText>
    </View>
  );
}

export default function Dashboard() {
  const { theme } = useTheme();
  const router = useRouter();
  const wide = useWide();
  const profile = useStore((s) => s.profile);
  const goals = useActiveGoals();
  const vision = useStore((s) => s.vision);
  const syncQuests = useStore((s) => s.syncQuests);

  // Roll the quest board over to today on mount.
  useEffect(() => {
    syncQuests();
  }, [syncQuests]);

  const lvl = levelFromXp(profile.xp);
  const rank = rankForLevel(lvl.level);
  const roadmap = roadmapProgress(goals);
  const today = todayKey();
  const todays = goals.filter((g) => g.timeframe === 'daily' || g.date === today);

  // 7-day completion chart
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    return { key: todayKey(d), label: d.getDate() };
  });
  const counts = days.map(
    (day) => goals.filter((g) => g.doneAt && todayKey(new Date(g.doneAt)) === day.key).length,
  );
  const maxCount = Math.max(1, ...counts);

  // top goals by progress (in-progress first)
  const topGoals = [...goals]
    .filter((g) => !g.archived)
    .sort((a, b) => goalProgress(b) - goalProgress(a))
    .slice(0, 5);

  return (
    <Screen title="Dashboard" subtitle="Your roadmap at a glance — what's done, what's next.">
      <CelebrationOverlay />

      {/* Status strip + focus CTA */}
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: Space.lg }}>
        <Card style={{ flex: wide ? 3 : undefined }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <AppText color="textMuted" weight="600">
                {greeting()},
              </AppText>
              <AppText size={22} weight="800">
                {profile.name}
              </AppText>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
                <Ionicons name="ribbon" size={13} color={theme.colors.primary} />
                <AppText size={12} weight="700" color="primary">
                  {rank.name}
                </AppText>
                {rank.next ? (
                  <AppText size={11} weight="600" color="textFaint">
                    · {rank.next.name} at Lv {rank.next.level}
                  </AppText>
                ) : null}
              </View>
            </View>
            <Pill
              label={`${profile.streakDays} day streak`}
              color={theme.colors.warning}
              icon={<Ionicons name="flame" size={15} color={theme.colors.warning} />}
            />
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: Space.lg,
              flexWrap: 'wrap',
              gap: Space.lg,
            }}>
            <Stat value={`${Math.round(roadmap * 100)}%`} label="ROADMAP DONE" color="primary" />
            <Stat value={`Lvl ${lvl.level}`} label={`${lvl.intoLevel}/${lvl.span} XP`} />
            <Stat value={`${profile.xp}`} label="TOTAL XP" />
            <Stat value={vision.indefinite ? '∞' : `${vision.targetYear}`} label="VISION YEAR" />
          </View>
          <View style={{ marginTop: Space.md }}>
            <ProgressBar progress={lvl.progress} />
          </View>
        </Card>

        <Pressable style={{ flex: wide ? 2 : undefined }} onPress={() => router.push('/goals')}>
          <Card elevated style={{ borderColor: theme.colors.primary, height: '100%', justifyContent: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.md }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: theme.colors.surfaceAlt,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Ionicons name="add" size={24} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText weight="800" size={16}>
                  Add a goal
                </AppText>
                <AppText color="textMuted" size={13} weight="600">
                  Pick a date on the calendar
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
            </View>
          </Card>
        </Pressable>
      </View>

      {/* Side goals — unattached quick tasks (post today, workout, etc.) */}
      <SideGoals />

      {/* Daily quests */}
      <QuestsCard />

      {/* 7-day progress + rings */}
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: Space.lg }}>
        <Card style={{ flex: wide ? 3 : undefined }}>
          <SectionHeader title="7-day progress" />
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 8, marginTop: Space.lg }}>
            {counts.map((c, i) => (
              <View key={i} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                <View style={{ flex: 1, width: '100%', justifyContent: 'flex-end' }}>
                  <View
                    style={{
                      height: `${(c / maxCount) * 100}%`,
                      minHeight: 4,
                      backgroundColor: c > 0 ? theme.colors.primary : theme.colors.track,
                      borderRadius: Radius.sm,
                    }}
                  />
                </View>
                <AppText size={10} weight="700" color="textFaint">
                  {days[i].label}
                </AppText>
              </View>
            ))}
          </View>
        </Card>

        <Card style={{ flex: wide ? 2 : undefined }}>
          <SectionHeader title="By timeframe" />
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: Space.md }}>
            <ProgressRing size={78} stroke={9} progress={completionForTimeframe(goals, 'daily')} caption="Daily" gradientId="rDaily" />
            <ProgressRing size={78} stroke={9} progress={completionForTimeframe(goals, 'monthly')} caption="Monthly" gradientId="rMonth" />
            <ProgressRing size={78} stroke={9} progress={completionForTimeframe(goals, 'yearly')} caption="Yearly" gradientId="rYear" />
          </View>
        </Card>
      </View>

      {/* Top goals */}
      <Card>
        <SectionHeader title="Top goals" action={<AppText color="textMuted" size={12} weight="700">{goals.length} total</AppText>} />
        <View style={{ gap: Space.md, marginTop: Space.lg }}>
          {topGoals.map((g) => (
            <View key={g.id} style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <AppText weight="700" numberOfLines={1} style={{ flex: 1 }}>
                  {g.title}
                </AppText>
                <AppText weight="800" size={13} style={{ color: timeframeColor(g.timeframe) }}>
                  {Math.round(goalProgress(g) * 100)}%
                </AppText>
              </View>
              <ProgressBar progress={goalProgress(g)} height={7} color={timeframeColor(g.timeframe)} />
            </View>
          ))}
        </View>
      </Card>

      {/* Today */}
      <View style={{ gap: Space.md }}>
        <SectionHeader title="Today's focus" />
        {todays.length === 0 ? (
          <Card>
            <AppText color="textMuted">Nothing for today. Add a goal to get started.</AppText>
          </Card>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Space.md }}>
            {todays.map((g) => (
              <GridGoal key={g.id} goal={g} wide={wide} />
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

function GridGoal({ goal, wide }: { goal: Goal; wide: boolean }) {
  const { theme } = useTheme();
  const router = useRouter();
  const { lang } = useI18n();
  const progress = goalProgress(goal);
  const color = timeframeColor(goal.timeframe);
  return (
    <Pressable style={{ width: wide ? '32%' : '100%' }} onPress={() => router.push('/goals')}>
      <Card style={{ borderLeftWidth: 4, borderLeftColor: color, gap: Space.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <AppText weight="800" numberOfLines={1} style={{ flex: 1 }}>
            {tSeed(goal.title, lang)}
          </AppText>
          {goalComplete(goal) ? <Ionicons name="checkmark-circle" size={18} color={color} /> : null}
        </View>
        <AppText color="textMuted" size={11} weight="700">
          {goal.category.toUpperCase()}
        </AppText>
        <ProgressBar progress={progress} height={7} color={color} />
        <AppText size={12} weight="800" style={{ color }}>
          {Math.round(progress * 100)}%
        </AppText>
      </Card>
    </Pressable>
  );
}

function QuestsCard() {
  const { theme } = useTheme();
  const goals = useActiveGoals();
  const profile = useStore((s) => s.profile);
  const claimedQuests = useStore((s) => s.claimedQuests);
  const questDate = useStore((s) => s.questDate);
  const claimQuest = useStore((s) => s.claimQuest);

  const today = todayKey();
  const quests = dailyQuests(today);
  const claimed = questDate === today ? claimedQuests : [];
  const doneCount = quests.filter((q) => claimed.includes(q.id)).length;

  return (
    <Card>
      <SectionHeader
        title="Daily quests"
        action={
          <AppText color="textMuted" size={12} weight="700">
            {doneCount}/{quests.length} claimed
          </AppText>
        }
      />
      <View style={{ gap: Space.md, marginTop: Space.lg }}>
        {quests.map((q) => {
          const progress = q.progress(goals, profile, today);
          const ratio = Math.min(1, progress / q.target);
          const isClaimed = claimed.includes(q.id);
          const eligible = progress >= q.target && !isClaimed;
          return (
            <View key={q.id} style={{ flexDirection: 'row', alignItems: 'center', gap: Space.md }}>
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: Radius.sm,
                  backgroundColor: theme.colors.surfaceAlt,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Ionicons
                  name={(isClaimed ? 'checkmark' : q.icon) as any}
                  size={18}
                  color={isClaimed ? theme.colors.success : theme.colors.primary}
                />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <AppText weight="700" size={14}>
                    {q.label}
                  </AppText>
                  <AppText weight="700" size={12} color={isClaimed ? 'success' : 'textMuted'}>
                    +{q.xp} XP
                  </AppText>
                </View>
                <AppText color="textMuted" size={12} weight="500">
                  {q.description} · {Math.min(progress, q.target)}/{q.target}
                </AppText>
                <ProgressBar progress={ratio} height={5} color={isClaimed ? theme.colors.success : undefined} />
              </View>
              <Pressable
                disabled={!eligible}
                onPress={() => claimQuest(q.id)}
                style={{
                  borderRadius: Radius.pill,
                  paddingHorizontal: Space.md,
                  paddingVertical: 7,
                  backgroundColor: eligible ? theme.colors.primary : theme.colors.surfaceAlt,
                  opacity: isClaimed ? 0.6 : 1,
                }}>
                <AppText weight="700" size={12} color={eligible ? 'primaryText' : 'textMuted'}>
                  {isClaimed ? 'Done' : 'Claim'}
                </AppText>
              </Pressable>
            </View>
          );
        })}
      </View>
    </Card>
  );
}
