import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { ProgressRing } from '@/components/ProgressRing';
import { GROWTH_TABS, SubTabs } from '@/components/SubTabs';
import { AppText, Card, ProgressBar, Screen, SectionHeader, useWide } from '@/components/ui';
import { useActiveGoals } from '@/store/hooks';
import {
  completionRate,
  levelFromXp,
  planPointsTotals,
  roadmapProgress,
  timeframeColor,
  todayKey,
  totalCompleted,
  xpForLevel,
} from '@/domain/logic';
import { Timeframe } from '@/domain/types';
import { useStore } from '@/store/store';
import { Radius, Space } from '@/theme/themes';
import { useTheme } from '@/theme/ThemeProvider';

const TFS: Timeframe[] = ['daily', 'weekly', 'monthly', 'yearly'];
const TF_LABEL: Record<Timeframe, string> = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly', none: 'No timeframe' };

export default function Growth() {
  const { theme } = useTheme();
  const wide = useWide();
  const profile = useStore((s) => s.profile);
  const goals = useActiveGoals();
  const vision = useStore((s) => s.vision);

  const lvl = levelFromXp(profile.xp);
  const rate = completionRate(profile);
  const points = planPointsTotals(goals, vision);
  const completed = totalCompleted(profile);
  const missed = profile.stats.missed;
  const roadmap = roadmapProgress(goals);

  // Which timeframes to show in the lifetime-completions chart (multi-select).
  const [shown, setShown] = useState<Set<Timeframe>>(new Set(TFS));
  const toggleTf = (tf: Timeframe) =>
    setShown((prev) => {
      const next = new Set(prev);
      if (next.has(tf)) next.delete(tf);
      else next.add(tf);
      return next.size === 0 ? new Set(TFS) : next; // never empty
    });

  // Completion-rate ring split into completed (green) + missed (red).
  const attempts = completed + missed;
  const ringSegments = attempts
    ? [
        { value: completed / attempts, color: theme.colors.success },
        { value: missed / attempts, color: theme.colors.danger },
      ]
    : undefined;

  // Cumulative completions across the last 14 days — the "growth curve".
  const days = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(Date.now() - (13 - i) * 86400000);
    return todayKey(d);
  });
  const perDay = days.map(
    (k) => goals.filter((g) => g.doneAt && todayKey(new Date(g.doneAt)) === k).length,
  );
  let run = 0;
  const cumulative = perDay.map((c) => (run += c));
  const maxCum = Math.max(1, ...cumulative);

  const STAT_ROWS: { tf: Timeframe; label: string; value: number; color: string }[] = [
    { tf: 'daily', label: 'Daily goals', value: profile.stats.daily, color: timeframeColor('daily') },
    { tf: 'weekly', label: 'Weekly goals', value: profile.stats.weekly, color: timeframeColor('weekly') },
    { tf: 'monthly', label: 'Monthly goals', value: profile.stats.monthly, color: timeframeColor('monthly') },
    { tf: 'yearly', label: 'Yearly goals', value: profile.stats.yearly, color: timeframeColor('yearly') },
  ];
  const visibleRows = STAT_ROWS.filter((r) => shown.has(r.tf));
  const maxStat = Math.max(1, ...visibleRows.map((r) => r.value));

  return (
    <Screen title="Growth" subtitle="The scale of how far you've come.">
      <SubTabs tabs={GROWTH_TABS} />
      {/* Headline rings */}
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: Space.lg }}>
        <Card style={{ flex: 1 }}>
          <SectionHeader title="Level" />
          <View style={{ alignItems: 'center', marginTop: Space.md }}>
            <ProgressRing
              size={130}
              stroke={12}
              progress={lvl.progress}
              label={`Lvl ${lvl.level}`}
              caption={`${lvl.intoLevel}/${lvl.span} XP`}
              gradientId="gLevel"
            />
            <AppText color="textMuted" size={12} weight="700" style={{ marginTop: Space.sm }}>
              {profile.xp} total XP · {xpForLevel(lvl.level + 1)} XP to next
            </AppText>
          </View>
        </Card>

        <Card style={{ flex: 1 }}>
          <SectionHeader title="Completion rate" />
          <View style={{ alignItems: 'center', marginTop: Space.md }}>
            <ProgressRing
              size={130}
              stroke={12}
              progress={rate}
              label={`${Math.round(rate * 100)}%`}
              segments={ringSegments}
              gradientId="gRate"
            />
            <View style={{ flexDirection: 'row', gap: Space.xl, marginTop: Space.sm }}>
              <View style={{ alignItems: 'center' }}>
                <AppText size={20} weight="800" color="success">
                  {completed}
                </AppText>
                <AppText size={11} weight="700" color="textMuted">
                  COMPLETED
                </AppText>
              </View>
              <View style={{ alignItems: 'center' }}>
                <AppText size={20} weight="800" color="danger">
                  {missed}
                </AppText>
                <AppText size={11} weight="700" color="textMuted">
                  MISSED
                </AppText>
              </View>
            </View>
          </View>
        </Card>
      </View>

      {/* Growth curve */}
      <Card>
        <SectionHeader
          title="Growth curve"
          action={
            <AppText color="textMuted" size={12} weight="700">
              {cumulative[cumulative.length - 1]} in 14 days
            </AppText>
          }
        />
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 5, marginTop: Space.lg }}>
          {cumulative.map((c, i) => (
            <View key={i} style={{ flex: 1, justifyContent: 'flex-end', height: '100%' }}>
              <View
                style={{
                  height: `${(c / maxCum) * 100}%`,
                  minHeight: 4,
                  backgroundColor: theme.colors.primary,
                  borderTopLeftRadius: Radius.sm,
                  borderTopRightRadius: Radius.sm,
                  opacity: 0.4 + (i / cumulative.length) * 0.6,
                }}
              />
            </View>
          ))}
        </View>
      </Card>

      {/* Plan points + roadmap */}
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: Space.lg }}>
        <Card style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <AppText weight="800">Plan points built</AppText>
            <AppText color="primary" weight="800">
              {points.done}/{points.total}
            </AppText>
          </View>
          <ProgressBar progress={points.total ? points.done / points.total : 0} />
          <AppText color="textMuted" size={12} weight="600" style={{ marginTop: 8 }}>
            Across every goal and your vision.
          </AppText>
        </Card>

        <Card style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <AppText weight="800">Overall roadmap</AppText>
            <AppText color="primary" weight="800">
              {Math.round(roadmap * 100)}%
            </AppText>
          </View>
          <ProgressBar progress={roadmap} />
          <AppText color="textMuted" size={12} weight="600" style={{ marginTop: 8 }}>
            Weighted across all your timeframes.
          </AppText>
        </Card>
      </View>

      {/* Lifetime totals */}
      <Card>
        <SectionHeader title="Lifetime completions" />
        {/* Timeframe filter chips */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm, marginTop: Space.md }}>
          {TFS.map((tf) => {
            const on = shown.has(tf);
            const c = timeframeColor(tf);
            return (
              <Pressable
                key={tf}
                onPress={() => toggleTf(tf)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  borderRadius: Radius.pill,
                  borderWidth: 1,
                  borderColor: on ? c : theme.colors.border,
                  backgroundColor: on ? c : 'transparent',
                  paddingHorizontal: Space.md,
                  paddingVertical: 6,
                }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: on ? theme.colors.primaryText : c,
                  }}
                />
                <AppText size={12} weight="700" style={{ color: on ? theme.colors.primaryText : theme.colors.textMuted }}>
                  {TF_LABEL[tf]}
                </AppText>
              </Pressable>
            );
          })}
        </View>
        <View style={{ gap: Space.md, marginTop: Space.lg }}>
          {visibleRows.map((r) => (
            <View key={r.label} style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <AppText weight="700" size={13}>
                  {r.label}
                </AppText>
                <AppText weight="800" size={13} style={{ color: r.color }}>
                  {r.value}
                </AppText>
              </View>
              <ProgressBar progress={r.value / maxStat} height={7} color={r.color} />
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Space.lg }}>
          <Ionicons name="flame" size={16} color={theme.colors.warning} />
          <AppText color="textMuted" size={13} weight="700">
            Best streak: {profile.bestStreak} days · Current: {profile.streakDays}
          </AppText>
        </View>
      </Card>
    </Screen>
  );
}
