import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, Switch, TextInput, View } from 'react-native';

import {
  blockingGoals,
  computeHabit,
  formatEstimate,
  goalComplete,
  goalProgress,
  isBlocked,
  PRIORITY_COLOR,
  subGoalsOf,
  timeframeColor,
  uid,
} from '@/domain/logic';
import { Goal, Reminder } from '@/domain/types';
import { useI18n } from '@/i18n';
import { tSeed } from '@/i18n/seedI18n';
import { syncReminders } from '@/services/notifications';
import { useStore } from '@/store/store';
import { Radius, Space } from '@/theme/themes';
import { useTheme } from '@/theme/ThemeProvider';
import { ConfirmModal } from './ConfirmModal';
import { PlanPoints } from './PlanPoints';
import { AppText, Card, CheckBox, IconButton, ProgressBar } from './ui';

const TF_LABEL: Record<Goal['timeframe'], string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
  none: 'No timeframe',
};
const REC_LABEL: Record<string, string> = {
  daily: 'Repeats daily',
  weekly: 'Repeats weekly',
  monthly: 'Repeats monthly',
};

function Chip({ icon, label, color }: { icon: string; label: string; color?: string }) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: theme.colors.surfaceAlt,
        borderRadius: Radius.sm,
        paddingHorizontal: 7,
        paddingVertical: 3,
      }}>
      <Ionicons name={icon as any} size={11} color={color ?? theme.colors.textMuted} />
      <AppText size={11} weight="600" style={{ color: color ?? theme.colors.textMuted }}>
        {label}
      </AppText>
    </View>
  );
}

export function GoalItem({ goal }: { goal: Goal }) {
  const { theme } = useTheme();
  const { lang } = useI18n();
  const goals = useStore((s) => s.goals);
  const toggleGoalDone = useStore((s) => s.toggleGoalDone);
  const toggleGoalMissed = useStore((s) => s.toggleGoalMissed);
  const togglePoint = useStore((s) => s.togglePoint);
  const addGoalPoint = useStore((s) => s.addGoalPoint);
  const removeGoalPoint = useStore((s) => s.removeGoalPoint);
  const deleteGoal = useStore((s) => s.deleteGoal);
  const updateGoal = useStore((s) => s.updateGoal);
  const addSubGoal = useStore((s) => s.addSubGoal);
  const setArchived = useStore((s) => s.setArchived);
  const useFreeze = useStore((s) => s.useFreeze);
  const freezeTokens = useStore((s) => s.profile.freezeTokens);
  const set = useStore((s) => s.sets.find((x) => x.id === goal.setId));

  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(goal.notes ?? '');
  const [subText, setSubText] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const progress = goalProgress(goal);
  const complete = goalComplete(goal);
  const missed = !!goal.missedAt && !complete;
  const blocked = isBlocked(goal, goals);
  const blockers = blocked ? blockingGoals(goal, goals) : [];
  const subs = subGoalsOf(goals, goal.id);
  const color = timeframeColor(goal.timeframe);
  const estimate = formatEstimate(goal.estimateMin);
  const reminders = goal.reminders ?? [];
  const activeReminders = reminders.filter((r) => r.enabled).length;
  const habit = goal.habitId ? computeHabit(goals, goal.habitId) : null;
  const lastMiss = goal.habitId
    ? goals
        .filter((g) => g.habitId === goal.habitId && g.archived && !!g.missedAt && !goalComplete(g) && !g.frozen)
        .sort((a, b) => ((a.date ?? '') < (b.date ?? '') ? 1 : -1))[0]
    : undefined;

  const accent = missed ? theme.colors.danger : blocked ? theme.colors.textFaint : color;

  const onComplete = () => {
    if (blocked && !complete) return;
    if (!complete) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    toggleGoalDone(goal.id);
  };

  const commitNotes = () => {
    if (notes !== (goal.notes ?? '')) updateGoal(goal.id, { notes });
  };

  const applyReminders = async (next: Reminder[]) => {
    updateGoal(goal.id, { reminders: next });
    const synced = await syncReminders({ ...goal, reminders: next });
    updateGoal(goal.id, { reminders: synced });
  };

  return (
    <Card
      style={{
        borderLeftWidth: 3,
        borderLeftColor: accent,
        gap: Space.sm,
        opacity: missed ? 0.85 : 1,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.md }}>
        <Pressable onPress={onComplete} hitSlop={6} disabled={blocked && !complete}>
          {blocked && !complete ? (
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 7,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: theme.colors.textFaint,
              }}>
              <Ionicons name="lock-closed" size={12} color={theme.colors.textFaint} />
            </View>
          ) : (
            <CheckBox checked={complete} />
          )}
        </Pressable>

        <Pressable style={{ flex: 1 }} onPress={() => setOpen((o) => !o)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {goal.priority ? (
              <Ionicons name="flag" size={12} color={theme.colors[PRIORITY_COLOR[goal.priority]]} />
            ) : null}
            <AppText
              weight="700"
              size={15}
              color={complete || missed ? 'textFaint' : 'text'}
              style={[{ flexShrink: 1 }, complete || missed ? { textDecorationLine: 'line-through' } : null]}>
              {tSeed(goal.title, lang)}
            </AppText>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
            {set ? (
              <AppText size={11} weight="700" style={{ color: set.color }}>
                {set.name.toUpperCase()}
              </AppText>
            ) : null}
            <AppText color="textMuted" size={11} weight="600">
              {TF_LABEL[goal.timeframe].toUpperCase()} · {goal.category.toUpperCase()}
              {goal.date ? ` · ${goal.date}` : ''}
            </AppText>
          </View>
        </Pressable>

        <AppText weight="700" size={13} style={{ color: accent }}>
          {Math.round(progress * 100)}%
        </AppText>
        <IconButton
          name={missed ? 'close-circle' : 'close-circle-outline'}
          onPress={() => toggleGoalMissed(goal.id)}
          color={missed ? theme.colors.danger : theme.colors.textFaint}
          size={20}
        />
        <IconButton name="trash-outline" onPress={() => setConfirmDelete(true)} />
      </View>

      <ProgressBar progress={progress} height={6} color={accent} />

      {/* Metadata chips */}
      {goal.priority || estimate || goal.recurrence === 'daily' || goal.recurrence === 'weekly' || goal.recurrence === 'monthly' || activeReminders > 0 || subs.length > 0 || blocked || missed ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {missed ? <Chip icon="close-circle" label="Missed" color={theme.colors.danger} /> : null}
          {blocked ? (
            <Chip icon="lock-closed" label={`Blocked by ${blockers.length}`} color={theme.colors.textFaint} />
          ) : null}
          {goal.priority ? (
            <Chip
              icon="flag"
              label={`${goal.priority[0].toUpperCase()}${goal.priority.slice(1)} priority`}
              color={theme.colors[PRIORITY_COLOR[goal.priority]]}
            />
          ) : null}
          {estimate ? <Chip icon="time-outline" label={estimate} /> : null}
          {goal.recurrence && goal.recurrence !== 'none' ? (
            <Chip icon="repeat" label={REC_LABEL[goal.recurrence]} />
          ) : null}
          {habit && habit.current > 0 ? (
            <Chip icon="flame" label={`${habit.current}-day streak`} color={theme.colors.warning} />
          ) : null}
          {activeReminders > 0 ? (
            <Chip icon="notifications" label={`${activeReminders} reminder${activeReminders > 1 ? 's' : ''}`} />
          ) : null}
          {subs.length > 0 ? <Chip icon="git-branch" label={`${subs.length} sub-goals`} /> : null}
        </View>
      ) : null}

      <Pressable
        onPress={() => setOpen((o) => !o)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={15} color={theme.colors.textMuted} />
        <AppText color="textMuted" size={12} weight="600">
          {goal.points.length > 0
            ? `${goal.points.filter((p) => p.done).length}/${goal.points.length} plan points`
            : 'Details'}
        </AppText>
      </Pressable>

      {open ? (
        <View style={{ gap: Space.md, marginTop: 2 }}>
          {blocked ? (
            <View style={{ gap: 4 }}>
              <AppText size={11} weight="700" color="textFaint">
                BLOCKED UNTIL COMPLETE
              </AppText>
              {blockers.map((b) => (
                <AppText key={b.id} size={13} weight="600" color="textMuted">
                  • {tSeed(b.title, lang)}
                </AppText>
              ))}
            </View>
          ) : null}

          {/* Description */}
          <View style={{ gap: 6 }}>
            <AppText size={11} weight="700" color="textFaint">
              DESCRIPTION
            </AppText>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              onBlur={commitNotes}
              onEndEditing={commitNotes}
              multiline
              placeholder="Write anything about this goal…"
              placeholderTextColor={theme.colors.textFaint}
              style={{
                color: theme.colors.text,
                backgroundColor: theme.colors.surfaceAlt,
                borderRadius: Radius.md,
                padding: Space.md,
                minHeight: 52,
                textAlignVertical: 'top',
                fontWeight: '500',
                fontSize: 14,
              }}
            />
          </View>

          {/* Plan points */}
          <View style={{ gap: 6 }}>
            <AppText size={11} weight="700" color="textFaint">
              PLAN POINTS
            </AppText>
            <PlanPoints
              points={goal.points}
              onToggle={(pid) => togglePoint(goal.id, pid)}
              onAdd={(text) => addGoalPoint(goal.id, text)}
              onRemove={(pid) => removeGoalPoint(goal.id, pid)}
            />
          </View>

          {/* Sub-goals */}
          <View style={{ gap: 6 }}>
            <AppText size={11} weight="700" color="textFaint">
              SUB-GOALS
            </AppText>
            {subs.map((sg) => (
              <View key={sg.id} style={{ flexDirection: 'row', alignItems: 'center', gap: Space.sm }}>
                <Pressable onPress={() => toggleGoalDone(sg.id)} hitSlop={6}>
                  <CheckBox checked={goalComplete(sg)} size={20} />
                </Pressable>
                <AppText
                  style={[{ flex: 1 }, goalComplete(sg) ? { textDecorationLine: 'line-through' } : null]}
                  color={goalComplete(sg) ? 'textFaint' : 'text'}
                  weight="500"
                  size={14}>
                  {tSeed(sg.title, lang)}
                </AppText>
                <IconButton name="close" onPress={() => deleteGoal(sg.id)} size={15} />
              </View>
            ))}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.sm }}>
              <TextInput
                value={subText}
                onChangeText={setSubText}
                onSubmitEditing={() => {
                  if (subText.trim()) {
                    addSubGoal(goal.id, subText.trim());
                    setSubText('');
                  }
                }}
                placeholder="Add a sub-goal…"
                placeholderTextColor={theme.colors.textFaint}
                style={{
                  flex: 1,
                  color: theme.colors.text,
                  backgroundColor: theme.colors.surfaceAlt,
                  borderRadius: Radius.md,
                  paddingHorizontal: Space.md,
                  paddingVertical: Space.sm,
                  fontWeight: '500',
                }}
              />
              <IconButton
                name="add-circle"
                color={theme.colors.primary}
                size={26}
                onPress={() => {
                  if (subText.trim()) {
                    addSubGoal(goal.id, subText.trim());
                    setSubText('');
                  }
                }}
              />
            </View>
          </View>

          {/* Habit */}
          {habit ? (
            <View style={{ gap: Space.sm }}>
              <AppText size={11} weight="700" color="textFaint">
                HABIT
              </AppText>
              <View style={{ flexDirection: 'row', gap: Space.xl }}>
                {[
                  { label: 'STREAK', value: `${habit.current}` },
                  { label: 'BEST', value: `${habit.best}` },
                  { label: 'CONSISTENCY', value: `${Math.round(habit.consistency * 100)}%` },
                ].map((s) => (
                  <View key={s.label}>
                    <AppText size={18} weight="700" color="text">
                      {s.value}
                    </AppText>
                    <AppText size={10} weight="700" color="textMuted">
                      {s.label}
                    </AppText>
                  </View>
                ))}
              </View>
              {lastMiss ? (
                <Pressable
                  disabled={freezeTokens <= 0}
                  onPress={() => useFreeze(lastMiss.id)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    alignSelf: 'flex-start',
                    backgroundColor: theme.colors.surfaceAlt,
                    borderRadius: Radius.sm,
                    paddingHorizontal: Space.md,
                    paddingVertical: Space.sm,
                    opacity: freezeTokens <= 0 ? 0.5 : 1,
                  }}>
                  <Ionicons name="snow" size={15} color={theme.colors.accent} />
                  <AppText size={13} weight="700" color="text">
                    {freezeTokens > 0 ? `Repair streak · ${freezeTokens} freeze left` : 'No freeze tokens'}
                  </AppText>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {/* Reminders */}
          <RemindersEditor reminders={reminders} onChange={applyReminders} />

          {/* Footer actions */}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
            <Pressable
              onPress={() => setArchived(goal.id, !goal.archived)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Ionicons name="archive-outline" size={15} color={theme.colors.textMuted} />
              <AppText size={12} weight="600" color="textMuted">
                {goal.archived ? 'Unarchive' : 'Archive'}
              </AppText>
            </Pressable>
          </View>
        </View>
      ) : null}

      <ConfirmModal
        visible={confirmDelete}
        title="Delete this goal?"
        body={`"${tSeed(goal.title, lang)}" and any sub-goals or plan points will be permanently removed.`}
        confirmLabel="Delete"
        danger
        icon="trash"
        onConfirm={() => deleteGoal(goal.id)}
        onClose={() => setConfirmDelete(false)}
      />
    </Card>
  );
}

function RemindersEditor({
  reminders,
  onChange,
}: {
  reminders: Reminder[];
  onChange: (next: Reminder[]) => void;
}) {
  const { theme } = useTheme();
  const [hh, setHh] = useState('09');
  const [mm, setMm] = useState('00');

  const pad = (n: number) => n.toString().padStart(2, '0');

  const add = () => {
    const hour = Math.max(0, Math.min(23, parseInt(hh, 10) || 0));
    const minute = Math.max(0, Math.min(59, parseInt(mm, 10) || 0));
    onChange([...reminders, { id: uid(), hour, minute, enabled: true }]);
  };

  const timeField = {
    width: 46,
    textAlign: 'center' as const,
    color: theme.colors.text,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: Radius.sm,
    paddingVertical: Space.sm,
    fontWeight: '700' as const,
    fontSize: 15,
  };

  return (
    <View style={{ gap: 6 }}>
      <AppText size={11} weight="700" color="textFaint">
        REMINDERS
      </AppText>
      {reminders.map((r) => (
        <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: Space.sm }}>
          <Ionicons name="notifications-outline" size={16} color={theme.colors.textMuted} />
          <AppText style={{ flex: 1 }} weight="600" size={14} color={r.enabled ? 'text' : 'textFaint'}>
            {pad(r.hour)}:{pad(r.minute)}
          </AppText>
          <Switch
            value={r.enabled}
            onValueChange={(v) =>
              onChange(reminders.map((x) => (x.id === r.id ? { ...x, enabled: v } : x)))
            }
            trackColor={{ false: theme.colors.track, true: theme.colors.primary }}
            thumbColor="#FFFFFF"
          />
          <IconButton name="close" size={15} onPress={() => onChange(reminders.filter((x) => x.id !== r.id))} />
        </View>
      ))}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <TextInput value={hh} onChangeText={setHh} keyboardType="number-pad" maxLength={2} style={timeField} />
        <AppText weight="800">:</AppText>
        <TextInput value={mm} onChangeText={setMm} keyboardType="number-pad" maxLength={2} style={timeField} />
        <Pressable
          onPress={add}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            backgroundColor: theme.colors.surfaceAlt,
            borderRadius: Radius.sm,
            paddingHorizontal: Space.md,
            paddingVertical: Space.sm,
          }}>
          <Ionicons name="add" size={15} color={theme.colors.primary} />
          <AppText size={13} weight="700" color="primary">
            Add reminder
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}
