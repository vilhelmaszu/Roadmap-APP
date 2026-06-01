import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { ConfirmModal } from '@/components/ConfirmModal';
import { AppText, Card, IconButton, Screen } from '@/components/ui';
import { goalComplete, timeframeColor, todayKey } from '@/domain/logic';
import { Goal, Timeframe } from '@/domain/types';
import { useI18n } from '@/i18n';
import { tSeed } from '@/i18n/seedI18n';
import { useActiveGoals } from '@/store/hooks';
import { useStore } from '@/store/store';
import { Radius, Space } from '@/theme/themes';
import { useTheme } from '@/theme/ThemeProvider';

const TF_LABEL: Record<Goal['timeframe'], string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
  none: 'No timeframe',
};

// Order sections largest-window-first so big milestones lead.
const TF_ORDER: Timeframe[] = ['yearly', 'monthly', 'weekly', 'daily', 'none'];

export default function Archive() {
  const { theme } = useTheme();
  const goals = useActiveGoals();
  const clearArchive = useStore((s) => s.clearArchive);
  const [confirmClear, setConfirmClear] = useState(false);
  const archived = goals
    .filter((g) => g.archived)
    .sort((a, b) => (b.doneAt ?? b.createdAt) - (a.doneAt ?? a.createdAt));

  // Bucket by timeframe so each section reads on its own.
  const buckets: Record<Timeframe, Goal[]> = { daily: [], weekly: [], monthly: [], yearly: [], none: [] };
  for (const g of archived) buckets[g.timeframe].push(g);

  return (
    <Screen title="Archive" subtitle="Completed and archived goals — your track record.">
      {/* Header strip: total + per-timeframe counters + clear */}
      {archived.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm, alignItems: 'center' }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              backgroundColor: theme.colors.surface,
              borderRadius: Radius.pill,
              borderWidth: 1,
              borderColor: theme.colors.border,
              paddingHorizontal: Space.md,
              paddingVertical: 6,
            }}>
            <Ionicons name="archive" size={14} color={theme.colors.textMuted} />
            <AppText size={12} weight="700" color="textMuted">
              {archived.length} TOTAL
            </AppText>
          </View>
          {TF_ORDER.map((tf) => {
            const n = buckets[tf].length;
            if (n === 0) return null;
            const c = timeframeColor(tf);
            return (
              <View
                key={tf}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  borderRadius: Radius.pill,
                  borderWidth: 1,
                  borderColor: c,
                  paddingHorizontal: Space.md,
                  paddingVertical: 6,
                }}>
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: c }} />
                <AppText size={12} weight="800" style={{ color: c }}>
                  {n} {TF_LABEL[tf].toUpperCase()}
                </AppText>
              </View>
            );
          })}
          <View style={{ flex: 1 }} />
          <Pressable
            onPress={() => setConfirmClear(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              borderRadius: Radius.pill,
              borderWidth: 1,
              borderColor: theme.colors.danger,
              paddingHorizontal: Space.md,
              paddingVertical: 6,
            }}>
            <Ionicons name="trash-outline" size={14} color={theme.colors.danger} />
            <AppText size={12} weight="700" color="danger">
              Clear archive
            </AppText>
          </Pressable>
        </View>
      ) : null}

      {archived.length === 0 ? (
        <Card>
          <AppText color="textMuted">
            Nothing archived yet. Completing a recurring goal, or archiving one from its menu, files it here.
          </AppText>
        </Card>
      ) : (
        <View style={{ gap: Space.lg }}>
          {TF_ORDER.map((tf) => {
            const items = buckets[tf];
            if (items.length === 0) return null;
            const c = timeframeColor(tf);
            return (
              <View key={tf} style={{ gap: Space.sm }}>
                {/* Section header with timeframe color + count */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c }} />
                  <AppText weight="800" size={14} style={{ color: c, letterSpacing: 0.3 }}>
                    {TF_LABEL[tf].toUpperCase()}
                  </AppText>
                  <View
                    style={{
                      backgroundColor: theme.colors.surfaceAlt,
                      borderRadius: Radius.pill,
                      paddingHorizontal: 7,
                      paddingVertical: 1,
                    }}>
                    <AppText size={11} weight="800" color="textMuted">
                      {items.length}
                    </AppText>
                  </View>
                  <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.border }} />
                </View>
                <View style={{ gap: Space.md }}>
                  {items.map((g) => (
                    <ArchiveRow key={g.id} goal={g} />
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      )}
      <ConfirmModal
        visible={confirmClear}
        title="Clear archive?"
        body={`Permanently delete all ${archived.length} archived goal${archived.length === 1 ? '' : 's'}. This cannot be undone.`}
        confirmLabel="Clear archive"
        danger
        icon="trash"
        onConfirm={clearArchive}
        onClose={() => setConfirmClear(false)}
      />
    </Screen>
  );
}

function ArchiveRow({ goal }: { goal: Goal }) {
  const { theme } = useTheme();
  const { lang } = useI18n();
  const setArchived = useStore((s) => s.setArchived);
  const deleteGoal = useStore((s) => s.deleteGoal);
  const set = useStore((s) => s.sets.find((x) => x.id === goal.setId));
  const complete = goalComplete(goal);
  const color = timeframeColor(goal.timeframe);
  const when = goal.doneAt ? todayKey(new Date(goal.doneAt)) : null;

  return (
    <Card style={{ borderLeftWidth: 3, borderLeftColor: color, flexDirection: 'row', alignItems: 'center', gap: Space.md }}>
      <View
        style={{
          width: 30,
          height: 30,
          borderRadius: 15,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: complete ? theme.colors.success : theme.colors.surfaceAlt,
        }}>
        <Ionicons
          name={complete ? 'checkmark' : 'archive'}
          size={16}
          color={complete ? theme.colors.primaryText : theme.colors.textMuted}
        />
      </View>
      <View style={{ flex: 1 }}>
        <AppText weight="600" size={15} numberOfLines={1}>
          {tSeed(goal.title, lang)}
        </AppText>
        <AppText color="textMuted" size={11} weight="600" style={{ marginTop: 2 }}>
          {set ? `${set.name.toUpperCase()} · ` : ''}
          {TF_LABEL[goal.timeframe].toUpperCase()}
          {when ? ` · completed ${when}` : ''}
        </AppText>
      </View>
      <Pressable
        onPress={() => setArchived(goal.id, false)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          borderRadius: Radius.pill,
          borderWidth: 1,
          borderColor: theme.colors.border,
          paddingHorizontal: Space.md,
          paddingVertical: 6,
        }}>
        <Ionicons name="arrow-undo" size={14} color={theme.colors.textMuted} />
        <AppText size={12} weight="600" color="textMuted">
          Restore
        </AppText>
      </Pressable>
      <IconButton name="trash-outline" onPress={() => deleteGoal(goal.id)} />
    </Card>
  );
}
