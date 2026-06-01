import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, TextInput, View } from 'react-native';

import { Calendar } from '@/components/Calendar';
import { DraggableList } from '@/components/DraggableList';
import { FullCalendar } from '@/components/FullCalendar';
import { GoalItem } from '@/components/GoalItem';
import { InlineProjectDropdown } from '@/components/InlineProjectDropdown';
import { ROADMAP_TABS, SubTabs } from '@/components/SubTabs';
import { AppText, Card, Screen, SectionHeader, useWide } from '@/components/ui';
import { goalProgress, PRIORITY_COLOR, sortByOrder, timeframeColor } from '@/domain/logic';
import { Goal, Priority, Recurrence, Timeframe } from '@/domain/types';
import { useI18n } from '@/i18n';
import { tSeed } from '@/i18n/seedI18n';
import { useActiveGoals } from '@/store/hooks';
import { useStore } from '@/store/store';
import { Radius, Space } from '@/theme/themes';
import { useTheme } from '@/theme/ThemeProvider';

const TIMEFRAMES: Timeframe[] = ['none', 'daily', 'weekly', 'monthly', 'yearly'];
const TF_LABEL: Record<Timeframe, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
  none: 'No timeframe',
};
const COLORS = ['#6C8BFF', '#22D3EE', '#A855F7', '#F472B6', '#34D399', '#FBBF24', '#FB7185'];
const SET_ICONS = ['flag', 'school', 'rocket', 'fitness', 'briefcase', 'book', 'heart', 'bulb', 'cash', 'musical-notes'];
const PRIORITIES: Priority[] = ['low', 'medium', 'high'];
const RECURRENCES: Recurrence[] = ['none', 'daily', 'weekly', 'monthly'];
const REC_LABEL: Record<Recurrence, string> = { none: 'One-off', daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };
const ESTIMATES = [15, 30, 45, 60, 120];

export default function Goals() {
  const { theme } = useTheme();
  const router = useRouter();
  const wide = useWide();
  const goals = useActiveGoals();
  const sets = useStore((s) => s.sets);
  const addGoal = useStore((s) => s.addGoal);
  const addSet = useStore((s) => s.addSet);
  const deleteSet = useStore((s) => s.deleteSet);
  const reorderGoals = useStore((s) => s.reorderGoals);

  const [modalDate, setModalDate] = useState<string | null>(null);
  // Goal-creation popup can be open with OR without a date (date-optional Quick add).
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [setModalOpen, setSetModalOpen] = useState(false);
  const [fullCalOpen, setFullCalOpen] = useState(false);
  const [activeSet, setActiveSet] = useState<string>('all');
  const [reorder, setReorder] = useState(false);
  const [query, setQuery] = useState('');

  const openGoalModal = (date: string | null) => {
    setModalDate(date);
    setGoalModalOpen(true);
  };
  const closeGoalModal = () => {
    setGoalModalOpen(false);
    setModalDate(null);
  };

  const q = query.trim().toLowerCase();
  // Top-level, active goals only (sub-goals render nested inside their parent).
  const visible = goals.filter(
    (g) =>
      !g.archived &&
      !g.parentId &&
      (activeSet === 'all' || g.setId === activeSet) &&
      (q === '' ||
        g.title.toLowerCase().includes(q) ||
        (g.notes ?? '').toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q)),
  );
  // Colored dots per date, by timeframe (yellow/red/blue/green).
  const markers = new Map<string, string[]>();
  // Richer per-date entries (title + color + timeframe) for the full-year view.
  const entries = new Map<string, { title: string; color: string; timeframe: string }[]>();
  for (const g of visible) {
    if (!g.date) continue;
    const color = timeframeColor(g.timeframe);
    const arr = markers.get(g.date) ?? [];
    arr.push(color);
    markers.set(g.date, arr);
    const earr = entries.get(g.date) ?? [];
    earr.push({ title: g.title, color, timeframe: g.timeframe });
    entries.set(g.date, earr);
  }
  const openNew = () => openGoalModal(new Date().toISOString().slice(0, 10));

  // Stats strip: active counts per timeframe (across the visible filter).
  const counts: Record<Timeframe, number> = {
    daily: visible.filter((g) => g.timeframe === 'daily').length,
    weekly: visible.filter((g) => g.timeframe === 'weekly').length,
    monthly: visible.filter((g) => g.timeframe === 'monthly').length,
    yearly: visible.filter((g) => g.timeframe === 'yearly').length,
    none: visible.filter((g) => g.timeframe === 'none').length,
  };
  const totalActive = counts.daily + counts.weekly + counts.monthly + counts.yearly + counts.none;

  return (
    <>
    <Screen title="Goals" subtitle="Plan by set and timeframe. Tap a date or use Quick add.">
      <SubTabs tabs={ROADMAP_TABS} />

      {/* Project switcher — mirrors the dropdown on /roadmap so projects can be changed without leaving Goals. */}
      <InlineProjectDropdown />

      {/* Stats strip */}
      <View style={{ flexDirection: 'row', gap: Space.sm, flexWrap: 'wrap' }}>
        {[
          { label: 'ACTIVE', value: totalActive, color: theme.colors.text },
          { label: 'DAILY', value: counts.daily, color: timeframeColor('daily') },
          { label: 'WEEKLY', value: counts.weekly, color: timeframeColor('weekly') },
          { label: 'MONTHLY', value: counts.monthly, color: timeframeColor('monthly') },
          { label: 'YEARLY', value: counts.yearly, color: timeframeColor('yearly') },
          { label: 'UNTIMED', value: counts.none, color: timeframeColor('none') },
        ].map((s) => (
          <View
            key={s.label}
            style={{
              flex: 1,
              minWidth: 90,
              backgroundColor: theme.colors.surface,
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: Radius.md,
              paddingVertical: Space.sm,
              paddingHorizontal: Space.md,
            }}>
            <AppText size={10} weight="800" color="textMuted">
              {s.label}
            </AppText>
            <AppText size={20} weight="800" style={{ color: s.color, marginTop: 2 }}>
              {s.value}
            </AppText>
          </View>
        ))}
      </View>

      {/* Search */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: Space.sm,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: Radius.md,
          paddingHorizontal: Space.md,
        }}>
        <Ionicons name="search" size={16} color={theme.colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search goals…"
          placeholderTextColor={theme.colors.textFaint}
          style={{ flex: 1, paddingVertical: Space.md, color: theme.colors.text, fontWeight: '500' }}
        />
        {query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color={theme.colors.textFaint} />
          </Pressable>
        ) : null}
      </View>

      {/* Set filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Space.sm }}>
        <SetChip label="All" color={theme.colors.primary} active={activeSet === 'all'} onPress={() => setActiveSet('all')} />
        {sets.map((s) => (
          <SetChip
            key={s.id}
            label={s.name}
            color={s.color}
            icon={s.icon}
            active={activeSet === s.id}
            onPress={() => setActiveSet(s.id)}
            onLongPress={() => {
              deleteSet(s.id);
              if (activeSet === s.id) setActiveSet('all');
            }}
          />
        ))}
        <Pressable
          onPress={() => setSetModalOpen(true)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            borderRadius: Radius.pill,
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderStyle: 'dashed',
            paddingHorizontal: Space.md,
            paddingVertical: 7,
          }}>
          <Ionicons name="add" size={15} color={theme.colors.textMuted} />
          <AppText weight="700" size={13} color="textMuted">
            New set
          </AppText>
        </Pressable>
      </ScrollView>

      <View style={{ flexDirection: wide ? 'row' : 'column', gap: Space.lg, alignItems: 'flex-start' }}>
        {/* Calendar (compact, corner) */}
        <Card style={{ flex: wide ? 1 : undefined, minWidth: wide ? 280 : undefined }}>
          <SectionHeader
            title="Calendar"
            action={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.sm }}>
                <Pressable
                  onPress={() => setFullCalOpen(true)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    borderRadius: Radius.pill,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    paddingHorizontal: Space.md,
                    paddingVertical: 6,
                  }}>
                  <Ionicons name="expand" size={15} color={theme.colors.textMuted} />
                  <AppText weight="700" color="textMuted" size={13}>
                    Full year
                  </AppText>
                </Pressable>
                <Pressable
                  onPress={() => openGoalModal(null)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: theme.colors.primary,
                    borderRadius: Radius.pill,
                    paddingHorizontal: Space.md,
                    paddingVertical: 6,
                  }}>
                  <Ionicons name="add" size={16} color={theme.colors.primaryText} />
                  <AppText weight="700" color="primaryText" size={13}>
                    Quick add
                  </AppText>
                </Pressable>
              </View>
            }
          />
          <View style={{ marginTop: Space.md }}>
            <Calendar markers={markers} selected={modalDate ?? undefined} onSelect={(d) => openGoalModal(d)} />
          </View>
        </Card>

        {/* Goals by timeframe — main area */}
        <View style={{ flex: wide ? 2 : undefined, gap: Space.md, width: wide ? undefined : '100%' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Pressable
              onPress={() => router.push('/archive')}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Ionicons name="archive-outline" size={15} color={theme.colors.textMuted} />
              <AppText size={13} weight="600" color="textMuted">
                Archive
              </AppText>
            </Pressable>
            <Pressable
              onPress={() => setReorder((r) => !r)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                borderRadius: Radius.pill,
                borderWidth: 1,
                borderColor: reorder ? theme.colors.primary : theme.colors.border,
                backgroundColor: reorder ? theme.colors.primary : 'transparent',
                paddingHorizontal: Space.md,
                paddingVertical: 6,
              }}>
              <Ionicons name="swap-vertical" size={15} color={reorder ? theme.colors.primaryText : theme.colors.textMuted} />
              <AppText size={13} weight="700" color={reorder ? 'primaryText' : 'textMuted'}>
                {reorder ? 'Done' : 'Reorder'}
              </AppText>
            </Pressable>
          </View>

          {TIMEFRAMES.map((tf) => {
            const group = sortByOrder(visible.filter((g) => g.timeframe === tf));
            if (group.length === 0) return null;
            return (
              <View key={tf} style={{ gap: Space.md }}>
                <SectionHeader title={TF_LABEL[tf]} />
                {reorder ? (
                  <DraggableList
                    data={group}
                    itemHeight={52}
                    gap={8}
                    onReorder={(ids) => reorderGoals(ids)}
                    renderItem={(g) => <ReorderRow goal={g} />}
                  />
                ) : (
                  group.map((g) => <GoalItem key={g.id} goal={g} />)
                )}
              </View>
            );
          })}
          {visible.length === 0 ? (
            <Card>
              <AppText color="textMuted">
                {activeSet === 'all' ? 'No goals yet. Add one from the calendar.' : 'No goals in this set yet.'}
              </AppText>
            </Card>
          ) : null}
        </View>
      </View>

      <FullCalendar
        visible={fullCalOpen}
        entries={entries}
        onClose={() => setFullCalOpen(false)}
        onAddGoal={(d) => {
          setFullCalOpen(false);
          openGoalModal(d);
        }}
      />

      <AddGoalModal
        visible={goalModalOpen}
        date={modalDate}
        defaultSetId={activeSet === 'all' ? undefined : activeSet}
        onClose={closeGoalModal}
        onSubmit={(g) => {
          addGoal(g);
          closeGoalModal();
        }}
      />

      <CreateSetModal
        visible={setModalOpen}
        onClose={() => setSetModalOpen(false)}
        onSubmit={(s) => {
          addSet(s);
          setSetModalOpen(false);
        }}
      />
    </Screen>

      {/* Quick-add floating button */}
      <Pressable
        onPress={openNew}
        style={{
          position: 'absolute',
          right: Space.xl,
          bottom: Space.xl,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: theme.colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.3,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        }}>
        <Ionicons name="add" size={30} color={theme.colors.primaryText} />
      </Pressable>
    </>
  );
}

function ReorderRow({ goal }: { goal: Goal }) {
  const { theme } = useTheme();
  const { lang } = useI18n();
  const color = timeframeColor(goal.timeframe);
  return (
    <View
      style={{
        height: 52,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Space.md,
        backgroundColor: theme.colors.surface,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderLeftWidth: 3,
        borderLeftColor: color,
        paddingHorizontal: Space.md,
      }}>
      <Ionicons name="reorder-three" size={20} color={theme.colors.textMuted} />
      {goal.priority ? <Ionicons name="flag" size={12} color={theme.colors[PRIORITY_COLOR[goal.priority]]} /> : null}
      <AppText weight="600" size={14} numberOfLines={1} style={{ flex: 1 }}>
        {tSeed(goal.title, lang)}
      </AppText>
      <AppText weight="700" size={12} style={{ color }}>
        {Math.round(goalProgress(goal) * 100)}%
      </AppText>
    </View>
  );
}

function SetChip({
  label,
  color,
  icon,
  active,
  onPress,
  onLongPress,
}: {
  label: string;
  color: string;
  icon?: string;
  active: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: Radius.pill,
        borderWidth: 1,
        borderColor: active ? color : theme.colors.border,
        backgroundColor: active ? color : theme.colors.surface,
        paddingHorizontal: Space.md,
        paddingVertical: 7,
      }}>
      {icon ? (
        <Ionicons name={icon as any} size={14} color={active ? theme.colors.primaryText : color} />
      ) : (
        <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: active ? theme.colors.primaryText : color }} />
      )}
      <AppText weight="700" size={13} color={active ? 'primaryText' : 'text'}>
        {label}
      </AppText>
    </Pressable>
  );
}

const field = (theme: ReturnType<typeof useTheme>['theme']) => ({
  color: theme.colors.text,
  backgroundColor: theme.colors.surfaceAlt,
  borderRadius: Radius.md,
  padding: Space.md,
  fontSize: 16,
  fontWeight: '600' as const,
});

function Segmented<T extends string>({
  options,
  value,
  labelFor,
  onChange,
}: {
  options: T[];
  value: T;
  labelFor: (o: T) => string;
  onChange: (o: T) => void;
}) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: Space.sm, flexWrap: 'wrap' }}>
      {options.map((o) => {
        const sel = o === value;
        return (
          <Pressable
            key={o}
            onPress={() => onChange(o)}
            style={{
              paddingHorizontal: Space.md,
              paddingVertical: Space.sm,
              borderRadius: Radius.sm,
              backgroundColor: sel ? theme.colors.primary : theme.colors.surfaceAlt,
            }}>
            <AppText weight="700" size={13} color={sel ? 'primaryText' : 'textMuted'}>
              {labelFor(o)}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

function CreateSetModal({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (s: { name: string; color: string; icon: string }) => void;
}) {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [icon, setIcon] = useState(SET_ICONS[0]);

  const submit = () => {
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), color, icon });
    setName('');
    setColor(COLORS[0]);
    setIcon(SET_ICONS[0]);
  };

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: Radius.xl,
            borderTopRightRadius: Radius.xl,
            borderTopWidth: 1,
            borderColor: theme.colors.border,
          }}>
          <ScrollView contentContainerStyle={{ padding: Space.xl, gap: Space.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="albums" size={18} color={theme.colors.primary} />
              <AppText size={20} weight="700">
                New set
              </AppText>
            </View>
            <AppText color="textMuted" size={13} weight="500">
              Group goals by topic — e.g. Marketing, Fitness, Finances.
            </AppText>

            <TextInput
              placeholder="Set name"
              placeholderTextColor={theme.colors.textFaint}
              value={name}
              onChangeText={setName}
              style={field(theme)}
            />

            <AppText weight="700" size={12} color="textFaint">
              COLOR
            </AppText>
            <View style={{ flexDirection: 'row', gap: Space.sm, flexWrap: 'wrap' }}>
              {COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setColor(c)}
                  style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: c, borderWidth: color === c ? 3 : 0, borderColor: theme.colors.text }}
                />
              ))}
            </View>

            <AppText weight="700" size={12} color="textFaint">
              ICON
            </AppText>
            <View style={{ flexDirection: 'row', gap: Space.sm, flexWrap: 'wrap' }}>
              {SET_ICONS.map((ic) => (
                <Pressable
                  key={ic}
                  onPress={() => setIcon(ic)}
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: Radius.md,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: icon === ic ? color : theme.colors.surfaceAlt,
                  }}>
                  <Ionicons name={ic as any} size={20} color={icon === ic ? theme.colors.primaryText : theme.colors.textMuted} />
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={submit}
              style={{ backgroundColor: theme.colors.primary, borderRadius: Radius.pill, paddingVertical: Space.md, alignItems: 'center', marginTop: Space.sm }}>
              <AppText weight="700" color="primaryText" size={16}>
                Create set
              </AppText>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function AddGoalModal({
  visible,
  date,
  defaultSetId,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  date: string | null;
  defaultSetId?: string;
  onClose: () => void;
  onSubmit: (g: {
    title: string;
    notes: string;
    timeframe: Timeframe;
    category: string;
    setId?: string;
    color: string;
    date?: string;
    priority?: Priority;
    estimateMin?: number;
    dependsOn?: string[];
    recurrence: Recurrence;
    points: string[];
  }) => void;
}) {
  const { theme } = useTheme();
  const sets = useStore((s) => s.sets);
  const goals = useStore((s) => s.goals);

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('');
  const [tf, setTf] = useState<Timeframe>('daily');
  const [setId, setSetId] = useState<string | undefined>(defaultSetId);
  const [priority, setPriority] = useState<Priority | undefined>(undefined);
  const [estimate, setEstimate] = useState('');
  const [recurrence, setRecurrence] = useState<Recurrence>('none');
  const [deps, setDeps] = useState<string[]>([]);
  const [pointText, setPointText] = useState('');
  const [points, setPoints] = useState<string[]>([]);

  const depCandidates = goals.filter((g) => !g.archived && !g.parentId);

  const reset = () => {
    setTitle('');
    setNotes('');
    setCategory('');
    setTf('daily');
    setSetId(defaultSetId);
    setPriority(undefined);
    setEstimate('');
    setRecurrence('none');
    setDeps([]);
    setPointText('');
    setPoints([]);
  };

  const submit = () => {
    if (!title.trim()) return;
    const estimateMin = parseInt(estimate, 10);
    onSubmit({
      title: title.trim(),
      notes: notes.trim(),
      timeframe: tf,
      category: category.trim() || 'General',
      setId,
      color: timeframeColor(tf),
      date: date ?? undefined,
      priority,
      estimateMin: estimateMin > 0 ? estimateMin : undefined,
      dependsOn: deps.length ? deps : undefined,
      recurrence,
      points,
    });
    reset();
  };

  const addPoint = () => {
    if (!pointText.trim()) return;
    setPoints((p) => [...p, pointText.trim()]);
    setPointText('');
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.55)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: Space.xl,
        }}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: 560,
            maxHeight: '92%',
            backgroundColor: theme.colors.surface,
            borderRadius: Radius.xl,
            borderWidth: 1,
            borderColor: theme.colors.border,
            overflow: 'hidden',
          }}>
          <ScrollView contentContainerStyle={{ padding: Space.xl, gap: Space.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="calendar" size={18} color={theme.colors.primary} />
              <AppText size={20} weight="700" style={{ flex: 1 }}>
                {date ? `New goal · ${date}` : 'New goal'}
              </AppText>
              <Pressable onPress={onClose} hitSlop={10}>
                <Ionicons name="close" size={24} color={theme.colors.textMuted} />
              </Pressable>
            </View>

            <TextInput placeholder="Goal title" placeholderTextColor={theme.colors.textFaint} value={title} onChangeText={setTitle} style={field(theme)} />
            <TextInput
              placeholder="Notes / description (optional)"
              placeholderTextColor={theme.colors.textFaint}
              value={notes}
              onChangeText={setNotes}
              multiline
              style={[field(theme), { minHeight: 60, textAlignVertical: 'top' }]}
            />
            <TextInput placeholder="Category (e.g. Health)" placeholderTextColor={theme.colors.textFaint} value={category} onChangeText={setCategory} style={field(theme)} />

            {sets.length > 0 ? (
              <>
                <AppText weight="700" size={12} color="textFaint">
                  SET
                </AppText>
                <View style={{ flexDirection: 'row', gap: Space.sm, flexWrap: 'wrap' }}>
                  <SetChip label="None" color={theme.colors.textFaint} active={!setId} onPress={() => setSetId(undefined)} />
                  {sets.map((s) => (
                    <SetChip key={s.id} label={s.name} color={s.color} icon={s.icon} active={setId === s.id} onPress={() => setSetId(s.id)} />
                  ))}
                </View>
              </>
            ) : null}

            <AppText weight="700" size={12} color="textFaint">
              TIMEFRAME
            </AppText>
            <Segmented options={TIMEFRAMES} value={tf} labelFor={(t) => TF_LABEL[t]} onChange={setTf} />

            <AppText weight="700" size={12} color="textFaint">
              PRIORITY
            </AppText>
            <View style={{ flexDirection: 'row', gap: Space.sm, flexWrap: 'wrap' }}>
              <Pressable
                onPress={() => setPriority(undefined)}
                style={{ paddingHorizontal: Space.md, paddingVertical: Space.sm, borderRadius: Radius.sm, backgroundColor: !priority ? theme.colors.primary : theme.colors.surfaceAlt }}>
                <AppText weight="700" size={13} color={!priority ? 'primaryText' : 'textMuted'}>
                  None
                </AppText>
              </Pressable>
              {PRIORITIES.map((p) => {
                const sel = priority === p;
                return (
                  <Pressable
                    key={p}
                    onPress={() => setPriority(p)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                      paddingHorizontal: Space.md,
                      paddingVertical: Space.sm,
                      borderRadius: Radius.sm,
                      backgroundColor: sel ? theme.colors.primary : theme.colors.surfaceAlt,
                    }}>
                    <Ionicons name="flag" size={12} color={sel ? theme.colors.primaryText : theme.colors[PRIORITY_COLOR[p]]} />
                    <AppText weight="700" size={13} color={sel ? 'primaryText' : 'textMuted'}>
                      {p[0].toUpperCase() + p.slice(1)}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            <AppText weight="700" size={12} color="textFaint">
              TIME ESTIMATE (MIN)
            </AppText>
            <View style={{ flexDirection: 'row', gap: Space.sm, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextInput
                placeholder="e.g. 30"
                placeholderTextColor={theme.colors.textFaint}
                value={estimate}
                onChangeText={setEstimate}
                keyboardType="number-pad"
                style={[field(theme), { width: 90 }]}
              />
              {ESTIMATES.map((m) => (
                <Pressable
                  key={m}
                  onPress={() => setEstimate(String(m))}
                  style={{ paddingHorizontal: Space.md, paddingVertical: Space.sm, borderRadius: Radius.sm, backgroundColor: theme.colors.surfaceAlt }}>
                  <AppText weight="600" size={13} color="textMuted">
                    {m}m
                  </AppText>
                </Pressable>
              ))}
            </View>

            <AppText weight="700" size={12} color="textFaint">
              RECURRENCE
            </AppText>
            <Segmented options={RECURRENCES} value={recurrence} labelFor={(r) => REC_LABEL[r]} onChange={setRecurrence} />

            {depCandidates.length > 0 ? (
              <>
                <AppText weight="700" size={12} color="textFaint">
                  DEPENDS ON (must finish first)
                </AppText>
                <View style={{ gap: Space.sm }}>
                  {depCandidates.map((g) => {
                    const sel = deps.includes(g.id);
                    return (
                      <Pressable
                        key={g.id}
                        onPress={() => setDeps((d) => (sel ? d.filter((x) => x !== g.id) : [...d, g.id]))}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: Space.sm }}>
                        <Ionicons name={sel ? 'checkbox' : 'square-outline'} size={20} color={sel ? theme.colors.primary : theme.colors.textFaint} />
                        <AppText size={14} weight="500" color={sel ? 'text' : 'textMuted'} numberOfLines={1} style={{ flex: 1 }}>
                          {g.title}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : null}

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.sm }}>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: timeframeColor(tf) }} />
              <AppText size={12} weight="600" color="textMuted">
                Color is set automatically by timeframe.
              </AppText>
            </View>

            <AppText weight="700" size={12} color="textFaint">
              PLAN POINTS
            </AppText>
            {points.map((p, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: Space.sm }}>
                <Ionicons name="ellipse" size={8} color={theme.colors.primary} />
                <AppText style={{ flex: 1 }} weight="500">
                  {p}
                </AppText>
                <Pressable onPress={() => setPoints((arr) => arr.filter((_, idx) => idx !== i))} hitSlop={8}>
                  <Ionicons name="close" size={16} color={theme.colors.textFaint} />
                </Pressable>
              </View>
            ))}
            <View style={{ flexDirection: 'row', gap: Space.sm, alignItems: 'center' }}>
              <TextInput
                placeholder="Add a plan point…"
                placeholderTextColor={theme.colors.textFaint}
                value={pointText}
                onChangeText={setPointText}
                onSubmitEditing={addPoint}
                style={[field(theme), { flex: 1 }]}
              />
              <Pressable onPress={addPoint} hitSlop={8}>
                <Ionicons name="add-circle" size={28} color={theme.colors.primary} />
              </Pressable>
            </View>

            <Pressable
              onPress={submit}
              style={{ backgroundColor: theme.colors.primary, borderRadius: Radius.pill, paddingVertical: Space.md, alignItems: 'center', marginTop: Space.sm }}>
              <AppText weight="700" color="primaryText" size={16}>
                Create goal
              </AppText>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
