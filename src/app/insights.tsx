import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { GROWTH_TABS, SubTabs } from '@/components/SubTabs';
import { AppText, Card, ProgressBar, Screen, SectionHeader, useWide } from '@/components/ui';
import { useActiveGoals } from '@/store/hooks';
import {
  buildInsights,
  completionsByDay,
  completionsBySet,
  completionsByWeekday,
  habitStats,
  weeklyReview,
  weeklyTrend,
} from '@/domain/logic';
import { useStore } from '@/store/store';
import { Radius, Space } from '@/theme/themes';
import { useTheme } from '@/theme/ThemeProvider';

const WD = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const HEAT_WEEKS = 12;

export default function Insights() {
  const { theme } = useTheme();
  const wide = useWide();
  const goals = useActiveGoals();
  const sets = useStore((s) => s.sets);
  const profile = useStore((s) => s.profile);

  const insights = buildInsights(goals, sets, profile);
  const review = weeklyReview(goals);
  const trend = weeklyTrend(goals, 8);
  const trendMax = Math.max(1, ...trend.map((t) => t.count));
  const bySet = completionsBySet(goals, sets);
  const setMax = Math.max(1, ...bySet.map((s) => s.count));
  const weekday = completionsByWeekday(goals);
  const wdMax = Math.max(1, ...weekday);
  const heat = completionsByDay(goals, HEAT_WEEKS * 7);
  const heatMax = Math.max(1, ...heat.map((h) => h.count));
  const habits = habitStats(goals);

  // Chunk heatmap days into columns of 7 (weeks).
  const weeks: { key: string; count: number }[][] = [];
  for (let i = 0; i < heat.length; i += 7) weeks.push(heat.slice(i, i + 7));

  const heatColor = (count: number) => {
    if (count <= 0) return theme.colors.track;
    const t = Math.min(1, count / heatMax);
    const op = 0.35 + t * 0.65;
    return withAlpha(theme.colors.primary, op);
  };

  return (
    <Screen title="Insights" subtitle="Patterns and trends from everything you've completed.">
      <SubTabs tabs={GROWTH_TABS} />
      {/* Weekly review + freeze tokens */}
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: Space.lg }}>
        <Card style={{ flex: 1 }}>
          <SectionHeader title="This week" />
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: Space.md, marginTop: Space.md }}>
            <AppText size={34} weight="800" color="primary">
              {review.thisWeek}
            </AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 8 }}>
              <Ionicons
                name={review.delta >= 0 ? 'arrow-up' : 'arrow-down'}
                size={14}
                color={review.delta >= 0 ? theme.colors.success : theme.colors.danger}
              />
              <AppText size={13} weight="700" style={{ color: review.delta >= 0 ? theme.colors.success : theme.colors.danger }}>
                {Math.abs(review.delta)} vs last week
              </AppText>
            </View>
          </View>
          <AppText color="textMuted" size={12} weight="600" style={{ marginTop: 4 }}>
            {review.lastWeek} completed the week before.
          </AppText>
        </Card>

        <Card style={{ flex: 1 }}>
          <SectionHeader title="Streak freezes" />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.md, marginTop: Space.md }}>
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: Radius.md,
                backgroundColor: theme.colors.surfaceAlt,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons name="snow" size={24} color={theme.colors.accent} />
            </View>
            <View style={{ flex: 1, flexShrink: 1 }}>
              <AppText size={26} weight="800">
                {profile.freezeTokens}
              </AppText>
              <AppText color="textMuted" size={12} weight="600">
                Earn one each level-up. Spend to repair a broken habit streak.
              </AppText>
            </View>
          </View>
        </Card>
      </View>

      {/* Insight cards */}
      <View style={{ gap: Space.md }}>
        <SectionHeader title="What the data says" />
        {insights.map((ins, i) => (
          <Card key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: Space.md }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: Radius.sm,
                backgroundColor: theme.colors.surfaceAlt,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons name={ins.icon as any} size={18} color={theme.colors.primary} />
            </View>
            <AppText weight="500" size={14} style={{ flex: 1 }}>
              {ins.text}
            </AppText>
          </Card>
        ))}
      </View>

      {/* Activity heatmap */}
      <Card>
        <SectionHeader
          title="Activity"
          action={
            <AppText color="textMuted" size={12} weight="600">
              last {HEAT_WEEKS} weeks
            </AppText>
          }
        />
        <View style={{ flexDirection: 'row', gap: Space.sm, marginTop: Space.lg }}>
          <View style={{ justifyContent: 'space-between', paddingVertical: 1 }}>
            {WD.map((d, i) => (
              <AppText key={i} size={9} weight="700" color="textFaint" style={{ height: 13 }}>
                {d}
              </AppText>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 3, flex: 1 }}>
            {weeks.map((week, wi) => (
              <View key={wi} style={{ gap: 3, flex: 1 }}>
                {week.map((day) => (
                  <View
                    key={day.key}
                    style={{ width: '100%', aspectRatio: 1, maxHeight: 13, borderRadius: 2, backgroundColor: heatColor(day.count) }}
                  />
                ))}
              </View>
            ))}
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: Space.md }}>
          <AppText size={10} weight="700" color="textFaint">
            Less
          </AppText>
          {[0, 0.45, 0.7, 1].map((op, i) => (
            <View
              key={i}
              style={{ width: 11, height: 11, borderRadius: 2, backgroundColor: op === 0 ? theme.colors.track : withAlpha(theme.colors.primary, op) }}
            />
          ))}
          <AppText size={10} weight="700" color="textFaint">
            More
          </AppText>
        </View>
      </Card>

      {/* Weekly trend */}
      <Card>
        <SectionHeader title="Weekly trend" />
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 110, gap: 6, marginTop: Space.lg }}>
          {trend.map((t, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
              <View style={{ flex: 1, width: '100%', justifyContent: 'flex-end' }}>
                <View
                  style={{
                    height: `${(t.count / trendMax) * 100}%`,
                    minHeight: 3,
                    backgroundColor: theme.colors.primary,
                    borderTopLeftRadius: Radius.sm,
                    borderTopRightRadius: Radius.sm,
                  }}
                />
              </View>
              <AppText size={10} weight="700" color="textFaint">
                {t.label}
              </AppText>
            </View>
          ))}
        </View>
      </Card>

      {/* Breakdown + weekday */}
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: Space.lg }}>
        <Card style={{ flex: 1 }}>
          <SectionHeader title="Where your effort goes" />
          <View style={{ gap: Space.md, marginTop: Space.lg }}>
            {bySet.length === 0 ? (
              <AppText color="textMuted" size={13}>
                Complete some goals to see your focus split.
              </AppText>
            ) : (
              bySet.map((s) => (
                <View key={s.name} style={{ gap: 5 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <AppText weight="600" size={13}>
                      {s.name}
                    </AppText>
                    <AppText weight="700" size={13} style={{ color: s.color }}>
                      {s.count}
                    </AppText>
                  </View>
                  <ProgressBar progress={s.count / setMax} height={7} color={s.color} />
                </View>
              ))
            )}
          </View>
        </Card>

        <Card style={{ flex: 1 }}>
          <SectionHeader title="By day of week" />
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 110, gap: 6, marginTop: Space.lg }}>
            {weekday.map((c, i) => (
              <View key={i} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                <View style={{ flex: 1, width: '100%', justifyContent: 'flex-end' }}>
                  <View
                    style={{
                      height: `${(c / wdMax) * 100}%`,
                      minHeight: 3,
                      backgroundColor: c === wdMax ? theme.colors.primary : theme.colors.accent,
                      borderTopLeftRadius: Radius.sm,
                      borderTopRightRadius: Radius.sm,
                    }}
                  />
                </View>
                <AppText size={10} weight="700" color="textFaint">
                  {WD[i]}
                </AppText>
              </View>
            ))}
          </View>
        </Card>
      </View>

      {/* Habits */}
      <View style={{ gap: Space.md }}>
        <SectionHeader title="Habits" />
        {habits.length === 0 ? (
          <Card>
            <AppText color="textMuted" size={13}>
              Make a goal recurring (daily/weekly/monthly) to start tracking a habit streak.
            </AppText>
          </Card>
        ) : (
          habits.map((h) => (
            <Card key={h.habitId} style={{ borderLeftWidth: 3, borderLeftColor: h.color ?? theme.colors.primary, gap: Space.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <AppText weight="700" size={15} numberOfLines={1} style={{ flex: 1 }}>
                  {h.title}
                </AppText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="flame" size={16} color={theme.colors.warning} />
                  <AppText weight="800" size={15} style={{ color: theme.colors.warning }}>
                    {h.current}
                  </AppText>
                </View>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <AppText color="textMuted" size={12} weight="600">
                  Best {h.best} · {h.completed}/{h.total} kept
                </AppText>
                <AppText color="textMuted" size={12} weight="700">
                  {Math.round(h.consistency * 100)}% consistent
                </AppText>
              </View>
              <ProgressBar progress={h.consistency} height={6} color={h.color ?? theme.colors.primary} />
            </Card>
          ))
        )}
      </View>
    </Screen>
  );
}

// Blend a hex color with an opacity over an assumed dark/light backdrop by returning rgba.
function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
