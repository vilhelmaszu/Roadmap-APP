import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, TextInput, View } from 'react-native';

import { goalComplete, todayKey, uid } from '@/domain/logic';
import { Goal, Recurrence, Reminder, Timeframe } from '@/domain/types';
import { useSideGoals } from '@/store/hooks';
import { useStore } from '@/store/store';
import { Radius, Space } from '@/theme/themes';
import { useTheme } from '@/theme/ThemeProvider';
import { syncReminders } from '@/services/notifications';
import { AppText, Card, SectionHeader } from './ui';

// Side goals — small, persistent quick-tasks unattached to any project.
// Rendered on Home + Roadmap. "Did it" / "BS'd it" buttons award/penalize.
// Lifetime kept-vs-missed counts are shown in the header so the user can
// track how much they actually deliver.

const RECURRENCE_LABEL: Record<Recurrence, string> = {
  none: 'One-off',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

const RECS: Recurrence[] = ['none', 'daily', 'weekly', 'monthly'];

export function SideGoals() {
  const { theme } = useTheme();
  const sideGoals = useSideGoals();
  const allGoals = useStore((s) => s.goals);
  const addGoal = useStore((s) => s.addGoal);
  const toggleGoalDone = useStore((s) => s.toggleGoalDone);
  const toggleGoalMissed = useStore((s) => s.toggleGoalMissed);
  const [draft, setDraft] = useState('');
  const [editId, setEditId] = useState<string | null>(null);

  // Lifetime counts — include archived side goals (recurring ones get archived
  // on completion, so the live list undercounts).
  const lifetimeSide = allGoals.filter((g) => g.side);
  const kept = lifetimeSide.filter((g) => g.done).length;
  const bsd = lifetimeSide.filter((g) => g.missedAt).length;

  const onAdd = () => {
    const title = draft.trim();
    if (!title) return;
    addGoal({ title, timeframe: 'daily', category: 'Side', side: true, date: todayKey() });
    setDraft('');
  };

  return (
    <Card style={{ gap: Space.sm }}>
      <SectionHeader
        title="Side goals"
        action={
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <CountPill icon="checkmark-circle" label={`${kept} done`} color={theme.colors.success} />
            <CountPill icon="close-circle" label={`${bsd} BS'd`} color={theme.colors.danger} />
          </View>
        }
      />
      <AppText color="textMuted" size={12} weight="500">
        Quick tasks not tied to any project — daily posts, workouts, errands.
      </AppText>

      {sideGoals.length > 0 ? (
        <View style={{ gap: 6, marginTop: 4 }}>
          {sideGoals.map((g) => (
            <SideGoalRow
              key={g.id}
              goal={g}
              onDid={() => toggleGoalDone(g.id)}
              onBsd={() => toggleGoalMissed(g.id)}
              onEdit={() => setEditId(g.id)}
            />
          ))}
        </View>
      ) : null}

      {/* Inline quick-add: title only. Edit modal handles date / recurrence / reminders. */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.sm, marginTop: 6 }}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={onAdd}
          placeholder="Add a side goal — post today, workout Fri, etc."
          placeholderTextColor={theme.colors.textFaint}
          style={{
            flex: 1,
            color: theme.colors.text,
            backgroundColor: theme.colors.surfaceAlt,
            borderRadius: Radius.md,
            paddingHorizontal: Space.md,
            paddingVertical: Space.sm,
            fontSize: 13,
            fontWeight: '600',
          }}
        />
        <Pressable
          onPress={onAdd}
          disabled={!draft.trim()}
          style={{
            backgroundColor: draft.trim() ? theme.colors.primary : theme.colors.surfaceAlt,
            borderRadius: Radius.pill,
            paddingHorizontal: Space.md,
            paddingVertical: 8,
            opacity: draft.trim() ? 1 : 0.6,
          }}>
          <AppText weight="800" size={12} color={draft.trim() ? 'primaryText' : 'textFaint'}>
            Add
          </AppText>
        </Pressable>
      </View>

      <SideGoalEditModal goalId={editId} onClose={() => setEditId(null)} />
    </Card>
  );
}

function CountPill({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderRadius: Radius.pill,
        backgroundColor: color + '22',
        paddingHorizontal: 8,
        paddingVertical: 2,
      }}>
      <Ionicons name={icon as any} size={12} color={color} />
      <AppText size={11} weight="800" style={{ color }}>
        {label}
      </AppText>
    </View>
  );
}

function SideGoalRow({
  goal,
  onDid,
  onBsd,
  onEdit,
}: {
  goal: Goal;
  onDid: () => void;
  onBsd: () => void;
  onEdit: () => void;
}) {
  const { theme } = useTheme();
  const done = goalComplete(goal);
  const bsd = !!goal.missedAt;
  const recurring = goal.recurrence && goal.recurrence !== 'none';
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 6,
        paddingHorizontal: Space.sm,
        borderRadius: Radius.md,
        backgroundColor: theme.colors.surfaceAlt,
        opacity: bsd ? 0.7 : 1,
      }}>
      <Pressable onPress={onEdit} style={{ flex: 1 }}>
        <AppText
          weight="700"
          size={13}
          numberOfLines={1}
          style={done ? { textDecorationLine: 'line-through', color: theme.colors.textFaint } : null}>
          {goal.title}
        </AppText>
        {goal.date || recurring || (goal.reminders && goal.reminders.length > 0) ? (
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
            {goal.date ? <MiniChip icon="calendar" label={goal.date} /> : null}
            {recurring ? <MiniChip icon="repeat" label={RECURRENCE_LABEL[goal.recurrence!]} /> : null}
            {goal.reminders && goal.reminders.length > 0 ? (
              <MiniChip icon="alarm" label={`${goal.reminders.filter((r) => r.enabled).length}`} />
            ) : null}
          </View>
        ) : null}
      </Pressable>
      <ActionBtn
        icon="checkmark"
        active={done && !bsd}
        activeColor={theme.colors.success}
        onPress={onDid}
        label="Did it"
      />
      <ActionBtn
        icon="close"
        active={bsd}
        activeColor={theme.colors.danger}
        onPress={onBsd}
        label="BS'd it"
      />
    </View>
  );
}

function MiniChip({ icon, label }: { icon: string; label: string }) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
      <Ionicons name={icon as any} size={10} color={theme.colors.textMuted} />
      <AppText size={10} weight="700" color="textMuted">
        {label}
      </AppText>
    </View>
  );
}

function ActionBtn({
  icon,
  active,
  activeColor,
  onPress,
  label,
}: {
  icon: string;
  active: boolean;
  activeColor: string;
  onPress: () => void;
  label: string;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityLabel={label}
      style={{
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: active ? activeColor : theme.colors.surface,
        borderWidth: 1,
        borderColor: active ? activeColor : theme.colors.border,
      }}>
      <Ionicons name={icon as any} size={14} color={active ? '#fff' : theme.colors.textMuted} />
    </Pressable>
  );
}

// --- Edit popup -----------------------------------------------------------
// Lets the user tweak date, recurrence, reminders, or delete a side goal.
// Title is editable inline above the rest.

function SideGoalEditModal({ goalId, onClose }: { goalId: string | null; onClose: () => void }) {
  const { theme } = useTheme();
  const goal = useStore((s) => s.goals.find((g) => g.id === goalId));
  const updateGoal = useStore((s) => s.updateGoal);
  const deleteGoal = useStore((s) => s.deleteGoal);

  if (!goal) return null;

  const setRecurrence = (r: Recurrence) => updateGoal(goal.id, { recurrence: r === 'none' ? undefined : r });
  const setDate = (d: string | undefined) => updateGoal(goal.id, { date: d });

  const toggleReminder = async (hour: number) => {
    const current = goal.reminders ?? [];
    const existing = current.find((r) => r.hour === hour && r.minute === 0);
    let next: Reminder[];
    if (existing) {
      next = current.filter((r) => r !== existing);
    } else {
      next = [...current, { id: uid(), hour, minute: 0, enabled: true }];
    }
    const synced = await syncReminders({ ...goal, reminders: next });
    updateGoal(goal.id, { reminders: synced });
  };

  const reminderHours = (goal.reminders ?? []).filter((r) => r.enabled).map((r) => r.hour);

  return (
    <Modal visible={!!goalId} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.55)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: Space.lg,
        }}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: 480,
            backgroundColor: theme.colors.surface,
            borderRadius: Radius.xl,
            borderWidth: 1,
            borderColor: theme.colors.border,
            padding: Space.lg,
            gap: Space.md,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="flash" size={18} color={theme.colors.primary} />
            <TextInput
              value={goal.title}
              onChangeText={(t) => updateGoal(goal.id, { title: t })}
              placeholder="Side goal"
              placeholderTextColor={theme.colors.textFaint}
              style={{ flex: 1, color: theme.colors.text, fontSize: 16, fontWeight: '700' }}
            />
            <Pressable
              onPress={() => {
                deleteGoal(goal.id);
                onClose();
              }}
              hitSlop={8}>
              <Ionicons name="trash-outline" size={18} color={theme.colors.danger} />
            </Pressable>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={20} color={theme.colors.textMuted} />
            </Pressable>
          </View>

          {/* Date — quick picks + raw YYYY-MM-DD input */}
          <View style={{ gap: 6 }}>
            <AppText size={11} weight="800" color="textMuted">
              DATE
            </AppText>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
              <DateChip label="Today" date={todayKey()} active={goal.date === todayKey()} onPress={setDate} />
              <DateChip label="Tomorrow" date={tomorrowKey()} active={goal.date === tomorrowKey()} onPress={setDate} />
              <DateChip label="None" date={undefined} active={!goal.date} onPress={setDate} />
            </View>
            <TextInput
              value={goal.date ?? ''}
              onChangeText={(t) => setDate(t || undefined)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.colors.textFaint}
              style={{
                color: theme.colors.text,
                backgroundColor: theme.colors.surfaceAlt,
                borderRadius: Radius.md,
                paddingHorizontal: Space.md,
                paddingVertical: 6,
                fontSize: 13,
                fontWeight: '600',
              }}
            />
          </View>

          {/* Recurrence */}
          <View style={{ gap: 6 }}>
            <AppText size={11} weight="800" color="textMuted">
              REPEAT
            </AppText>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
              {RECS.map((r) => {
                const active = (goal.recurrence ?? 'none') === r;
                return (
                  <Pressable
                    key={r}
                    onPress={() => setRecurrence(r)}
                    style={{
                      paddingHorizontal: Space.md,
                      paddingVertical: 5,
                      borderRadius: Radius.pill,
                      borderWidth: 1,
                      borderColor: active ? theme.colors.primary : theme.colors.border,
                      backgroundColor: active ? theme.colors.primary : 'transparent',
                    }}>
                    <AppText size={11} weight="800" color={active ? 'primaryText' : 'textMuted'}>
                      {RECURRENCE_LABEL[r]}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Reminders — preset hour chips */}
          <View style={{ gap: 6 }}>
            <AppText size={11} weight="800" color="textMuted">
              REMINDERS
            </AppText>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
              {[8, 12, 18, 21].map((h) => {
                const active = reminderHours.includes(h);
                return (
                  <Pressable
                    key={h}
                    onPress={() => toggleReminder(h)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingHorizontal: Space.md,
                      paddingVertical: 5,
                      borderRadius: Radius.pill,
                      borderWidth: 1,
                      borderColor: active ? theme.colors.warning : theme.colors.border,
                      backgroundColor: active ? theme.colors.warning : 'transparent',
                    }}>
                    <Ionicons name="alarm" size={11} color={active ? '#fff' : theme.colors.textMuted} />
                    <AppText size={11} weight="800" color={active ? 'primaryText' : 'textMuted'}>
                      {String(h).padStart(2, '0')}:00
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
            <AppText size={10} weight="500" color="textFaint">
              Reminders fire on a real device build. Web is a no-op.
            </AppText>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function DateChip({
  label,
  date,
  active,
  onPress,
}: {
  label: string;
  date: string | undefined;
  active: boolean;
  onPress: (d: string | undefined) => void;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={() => onPress(date)}
      style={{
        paddingHorizontal: Space.md,
        paddingVertical: 5,
        borderRadius: Radius.pill,
        borderWidth: 1,
        borderColor: active ? theme.colors.primary : theme.colors.border,
        backgroundColor: active ? theme.colors.primary : 'transparent',
      }}>
      <AppText size={11} weight="800" color={active ? 'primaryText' : 'textMuted'}>
        {label}
      </AppText>
    </Pressable>
  );
}

function tomorrowKey(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}
