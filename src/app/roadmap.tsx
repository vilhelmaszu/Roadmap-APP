import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, TextInput, View } from 'react-native';

import { InlineProjectDropdown } from '@/components/InlineProjectDropdown';
import { SideGoals } from '@/components/SideGoals';
import { NoteModal } from '@/components/NoteModal';
import { NoteNameModal } from '@/components/NoteNameModal';
import { PlanPoints } from '@/components/PlanPoints';
import { ConfirmModal } from '@/components/ConfirmModal';
import { ROADMAP_TABS, SubTabs } from '@/components/SubTabs';
import { AppText, Card, CheckBox, IconButton, ProgressBar, Screen, SectionHeader, useWide } from '@/components/ui';
import { goalProgress, roadmapProgress, timeframeColor, visionProgress } from '@/domain/logic';
import { Goal, Timeframe } from '@/domain/types';
import { useI18n } from '@/i18n';
import { tSeed } from '@/i18n/seedI18n';
import { useActiveGoals, useActiveNotes } from '@/store/hooks';
import { useStore } from '@/store/store';
import { Radius, Space } from '@/theme/themes';
import { useTheme } from '@/theme/ThemeProvider';

const TF_LABEL: Record<Timeframe, string> = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly', none: 'No timeframe' };

export default function Roadmap() {
  const { theme } = useTheme();
  const wide = useWide();
  const { lang } = useI18n();
  const vision = useStore((s) => s.vision);
  const goals = useActiveGoals();
  const notes = useActiveNotes();
  const toggleVisionPoint = useStore((s) => s.toggleVisionPoint);
  const addVisionPoint = useStore((s) => s.addVisionPoint);
  const removeVisionPoint = useStore((s) => s.removeVisionPoint);
  const updateVision = useStore((s) => s.updateVision);
  const addGoal = useStore((s) => s.addGoal);
  const addNote = useStore((s) => s.addNote);

  const [goalModal, setGoalModal] = useState(false);
  const [allGoalsOpen, setAllGoalsOpen] = useState(false);
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [naming, setNaming] = useState(false);
  const [editVision, setEditVision] = useState(false);
  const [detailGoalId, setDetailGoalId] = useState<string | null>(null);

  // Sub-tasks (parentId set) are rendered inside the parent's detail popup, not as top-level timeline rows.
  const longTerm = goals.filter(
    (g) => (g.timeframe === 'yearly' || g.timeframe === 'monthly' || g.timeframe === 'none') && !g.archived && !g.parentId,
  );
  const yearly = longTerm.filter((g) => g.timeframe === 'yearly');
  const monthly = longTerm.filter((g) => g.timeframe === 'monthly');
  const untimed = longTerm.filter((g) => g.timeframe === 'none');
  const vProgress = visionProgress(vision);
  const overall = roadmapProgress(goals);
  const thisYear = new Date().getFullYear();
  const donePoints = vision.points.filter((p) => p.done).length;
  const yearsLeftRaw = vision.indefinite ? null : Math.max(0, vision.targetYear - thisYear);

  return (
    <Screen title="Roadmap" subtitle={vision.indefinite ? 'An open-ended path.' : `Your path to ${vision.targetYear}.`}>
      <SubTabs tabs={ROADMAP_TABS} />
      <InlineProjectDropdown />
      <SideGoals />

      {/* === TOP ROW: Vision + Stats + Notes (3 columns when wide) === */}
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: Space.lg, alignItems: 'stretch' }}>
        {/* Vision card */}
        <Card elevated style={{ flex: wide ? 2 : undefined, borderColor: theme.colors.primary }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Ionicons name="telescope" size={15} color={theme.colors.primary} />
            <AppText color="primary" weight="800" size={11}>
              {vision.indefinite ? 'LONG-TERM MAIN GOAL' : `${vision.targetYear} MAIN GOAL`}
            </AppText>
            <View style={{ flex: 1 }} />
            <Pressable onPress={() => setEditVision(true)} hitSlop={8}>
              <Ionicons name="pencil" size={14} color={theme.colors.textMuted} />
            </Pressable>
          </View>
          <AppText weight="800" size={17}>
            {tSeed(vision.title, lang) || 'Set your long-term vision'}
          </AppText>
          <AppText color="textMuted" weight="500" size={13} style={{ marginTop: 4 }}>
            {tSeed(vision.why, lang) || 'Tap the pencil to write what you’re aiming for and why.'}
          </AppText>
          <View style={{ marginTop: Space.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <AppText color="textMuted" size={11} weight="800">
                PLAN PROGRESS · {donePoints}/{vision.points.length} POINTS
              </AppText>
              <AppText color="primary" size={11} weight="800">
                {Math.round(vProgress * 100)}%
              </AppText>
            </View>
            <ProgressBar progress={vProgress} height={6} />
          </View>
          <View style={{ marginTop: Space.md }}>
            <PlanPoints
              points={vision.points}
              onToggle={toggleVisionPoint}
              onAdd={addVisionPoint}
              onRemove={removeVisionPoint}
            />
          </View>
        </Card>

        {/* Stats grid */}
        <View style={{ flex: wide ? 1 : undefined, gap: Space.md }}>
          <StatBlock label="OVERALL" value={`${Math.round(overall * 100)}%`} color={theme.colors.primary} />
          <StatBlock label="PLAN POINTS" value={`${donePoints}/${vision.points.length}`} color={theme.colors.accent} />
          <StatBlock label="TARGET YEAR" value={vision.indefinite ? '∞' : `${vision.targetYear}`} color={theme.colors.success} />
          <StatBlock label="YEARS LEFT" value={yearsLeftRaw == null ? '∞' : `${yearsLeftRaw}`} color={theme.colors.warning} />
        </View>

        {/* Notes pad — moved into the top row */}
        <Card style={{ flex: wide ? 2 : undefined }}>
          <SectionHeader
            title="Notes"
            action={
              <Pressable
                onPress={() => setNaming(true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: theme.colors.primary,
                  borderRadius: Radius.pill,
                  paddingHorizontal: Space.md,
                  paddingVertical: 5,
                }}>
                <Ionicons name="add" size={14} color={theme.colors.primaryText} />
                <AppText weight="700" color="primaryText" size={12}>
                  New
                </AppText>
              </Pressable>
            }
          />
          {notes.length === 0 ? (
            <AppText color="textFaint" size={12} weight="500" style={{ marginTop: Space.md }}>
              No notes yet. Tap “New” to capture an idea.
            </AppText>
          ) : (
            <View style={{ gap: Space.sm, marginTop: Space.md }}>
              {notes.slice(0, 5).map((n) => (
                <Pressable
                  key={n.id}
                  onPress={() => setActiveNote(n.id)}
                  style={{
                    backgroundColor: theme.colors.surfaceAlt,
                    borderRadius: Radius.md,
                    padding: Space.sm,
                    gap: 2,
                  }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Ionicons name="document-text-outline" size={13} color={theme.colors.primary} />
                    <AppText weight="700" size={13} numberOfLines={1} style={{ flex: 1 }}>
                      {tSeed(n.title, lang) || 'Untitled note'}
                    </AppText>
                  </View>
                  <AppText color="textMuted" size={11} weight="500" numberOfLines={1}>
                    {tSeed(n.body, lang) || 'Empty — tap to write.'}
                  </AppText>
                </Pressable>
              ))}
              {notes.length > 5 ? (
                <AppText color="textFaint" size={11} weight="600">
                  +{notes.length - 5} more in Notes tab
                </AppText>
              ) : null}
            </View>
          )}
        </Card>
      </View>

      {/* === BOTTOM: Timeline takes full width, bigger expandable blocks === */}
      <Card>
        <SectionHeader
          title={vision.indefinite ? 'Your path' : `Path to ${vision.targetYear}`}
          action={
            <View style={{ flexDirection: 'row', gap: Space.sm }}>
              <Pressable
                onPress={() => setAllGoalsOpen(true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  borderRadius: Radius.pill,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  paddingHorizontal: Space.md,
                  paddingVertical: 5,
                }}>
                <Ionicons name="list" size={14} color={theme.colors.textMuted} />
                <AppText weight="700" color="textMuted" size={12}>
                  All goals
                </AppText>
              </Pressable>
              <Pressable
                onPress={() => setGoalModal(true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  borderRadius: Radius.pill,
                  borderWidth: 1,
                  borderColor: theme.colors.primary,
                  paddingHorizontal: Space.md,
                  paddingVertical: 5,
                }}>
                <Ionicons name="add" size={14} color={theme.colors.primary} />
                <AppText weight="700" color="primary" size={12}>
                  Roadmap goal
                </AppText>
              </Pressable>
            </View>
          }
        />
        <View style={{ marginTop: Space.lg, gap: Space.md }}>
          {/* Today node */}
          <View style={{ flexDirection: 'row', gap: Space.md, alignItems: 'center' }}>
            <Node active />
            <View style={{ flex: 1 }}>
              <AppText weight="800" size={14}>
                Today · {thisYear}
              </AppText>
              <AppText color="textMuted" size={12} weight="500">
                You are here. Every goal you complete moves the needle.
              </AppText>
            </View>
          </View>

          {monthly.length > 0 ? (
            <TimelineSection label="Monthly milestones" goals={monthly} onOpen={(id) => setDetailGoalId(id)} />
          ) : null}
          {yearly.length > 0 ? (
            <TimelineSection label="Yearly milestones" goals={yearly} onOpen={(id) => setDetailGoalId(id)} />
          ) : null}
          {untimed.length > 0 ? (
            <TimelineSection label="Ongoing — no timeframe" goals={untimed} onOpen={(id) => setDetailGoalId(id)} />
          ) : null}
          {longTerm.length === 0 ? (
            <AppText color="textFaint" size={13} weight="500" style={{ marginTop: 4 }}>
              No long-term goals yet. Tap “Roadmap goal” above to add one.
            </AppText>
          ) : null}

          {/* Vision-achieved node — only meaningful when there is a target year */}
          {vision.indefinite ? null : (
            <View style={{ flexDirection: 'row', gap: Space.md, alignItems: 'center', marginTop: Space.sm }}>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: theme.colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Ionicons name="star" size={13} color={theme.colors.primaryText} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText weight="800" size={14} color="primary">
                  {vision.targetYear} · Vision achieved
                </AppText>
                <AppText color="textMuted" size={12} weight="500" numberOfLines={1}>
                  {tSeed(vision.title, lang) || 'Your long-term vision'}
                </AppText>
              </View>
            </View>
          )}
        </View>
      </Card>

      <RoadmapGoalPopup
        visible={goalModal}
        onClose={() => setGoalModal(false)}
        onSubmit={(g) => {
          addGoal(g);
          setGoalModal(false);
        }}
      />

      <VisionEditPopup
        visible={editVision}
        vision={vision}
        key={editVision ? 'open' : 'closed'}
        onClose={() => setEditVision(false)}
        onSave={(patch) => {
          updateVision(patch);
          setEditVision(false);
        }}
      />

      <NoteModal noteId={activeNote} onClose={() => setActiveNote(null)} />
      <NoteNameModal
        visible={naming}
        onCancel={() => setNaming(false)}
        onConfirm={(title) => {
          setNaming(false);
          const id = addNote('project', title);
          setActiveNote(id);
        }}
      />

      <AllGoalsPopup visible={allGoalsOpen} goals={goals} onClose={() => setAllGoalsOpen(false)} />

      <GoalDetailPopup goalId={detailGoalId} onClose={() => setDetailGoalId(null)} />
    </Screen>
  );
}

function StatBlock({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Card style={{ flex: 1, paddingVertical: Space.md, paddingHorizontal: Space.md }}>
      <AppText color="textMuted" size={10} weight="800">
        {label}
      </AppText>
      <AppText size={22} weight="800" style={{ color, marginTop: 2 }}>
        {value}
      </AppText>
    </Card>
  );
}

function Node({ active, done, color }: { active?: boolean; done?: boolean; color?: string }) {
  const { theme } = useTheme();
  const c = done ? theme.colors.success : active ? color ?? theme.colors.primary : theme.colors.textFaint;
  return (
    <View style={{ alignItems: 'center', width: 22 }}>
      <View
        style={{
          width: 14,
          height: 14,
          borderRadius: 7,
          backgroundColor: done || active ? c : theme.colors.surface,
          borderWidth: 2,
          borderColor: c,
        }}
      />
    </View>
  );
}

function TimelineSection({
  label,
  goals,
  onOpen,
}: {
  label: string;
  goals: Goal[];
  onOpen: (id: string) => void;
}) {
  const { theme } = useTheme();
  const { lang } = useI18n();
  const allGoals = useActiveGoals();
  return (
    <View style={{ gap: Space.md, marginTop: Space.md }}>
      <AppText weight="800" size={12} color="textFaint" style={{ letterSpacing: 0.3 }}>
        {label.toUpperCase()}
      </AppText>
      {goals.map((g) => {
        const p = goalProgress(g);
        const done = p >= 1;
        const c = timeframeColor(g.timeframe);
        const subCount = allGoals.filter((x) => x.parentId === g.id && !x.archived).length;
        const subDone = allGoals.filter((x) => x.parentId === g.id && !x.archived && goalProgress(x) >= 1).length;
        const ptDone = g.points.filter((pt) => pt.done).length;
        const hasDesc = !!g.notes?.trim();
        return (
          <View key={g.id} style={{ flexDirection: 'row', gap: Space.md, alignItems: 'stretch' }}>
            <Node done={done} active={!done} color={c} />
            <Pressable
              onPress={() => onOpen(g.id)}
              style={{
                flex: 1,
                backgroundColor: theme.colors.surfaceAlt,
                borderRadius: Radius.lg,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderLeftWidth: 4,
                borderLeftColor: c,
                padding: Space.lg,
                gap: 6,
              }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Space.sm }}>
                <AppText weight="800" size={15} numberOfLines={2} style={{ flex: 1 }}>
                  {tSeed(g.title, lang)}
                </AppText>
                <AppText weight="800" size={14} style={{ color: c }}>
                  {Math.round(p * 100)}%
                </AppText>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.sm, flexWrap: 'wrap' }}>
                <AppText color="textMuted" size={11} weight="700">
                  {g.timeframe.toUpperCase()}
                </AppText>
                <View style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: theme.colors.textFaint }} />
                <AppText color="textMuted" size={11} weight="700">
                  {g.category.toUpperCase()}
                </AppText>
                {g.date ? (
                  <>
                    <View style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: theme.colors.textFaint }} />
                    <AppText color="textMuted" size={11} weight="600">
                      {g.date}
                    </AppText>
                  </>
                ) : null}
              </View>
              {hasDesc ? (
                <AppText color="textMuted" size={12} weight="500" numberOfLines={2}>
                  {g.notes}
                </AppText>
              ) : null}
              <View style={{ marginTop: 4 }}>
                <ProgressBar progress={p} height={5} color={c} />
              </View>
              {/* Sub-counts row — surfaces depth at a glance */}
              {g.points.length > 0 || subCount > 0 ? (
                <View style={{ flexDirection: 'row', gap: Space.md, marginTop: 4 }}>
                  {g.points.length > 0 ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="checkbox-outline" size={12} color={theme.colors.textMuted} />
                      <AppText size={11} weight="600" color="textMuted">
                        {ptDone}/{g.points.length} plan points
                      </AppText>
                    </View>
                  ) : null}
                  {subCount > 0 ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="git-branch-outline" size={12} color={theme.colors.textMuted} />
                      <AppText size={11} weight="600" color="textMuted">
                        {subDone}/{subCount} sub-tasks
                      </AppText>
                    </View>
                  ) : null}
                  <View style={{ flex: 1 }} />
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Ionicons name="expand-outline" size={11} color={theme.colors.textFaint} />
                    <AppText size={10} weight="700" color="textFaint">
                      TAP TO OPEN
                    </AppText>
                  </View>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-end' }}>
                  <Ionicons name="expand-outline" size={11} color={theme.colors.textFaint} />
                  <AppText size={10} weight="700" color="textFaint">
                    TAP TO OPEN
                  </AppText>
                </View>
              )}
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

// Centered popup (not a bottom sheet) so the dialog reads clearly.
function RoadmapGoalPopup({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (g: { title: string; notes: string; timeframe: Timeframe; category: string; color: string }) => void;
}) {
  const { theme } = useTheme();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('');
  const [tf, setTf] = useState<Timeframe>('yearly');

  // 'none' = an indefinite roadmap goal with no fixed timeframe.
  const TF: Timeframe[] = ['monthly', 'yearly', 'none'];
  const field = {
    color: theme.colors.text,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: Radius.md,
    padding: Space.md,
    fontSize: 15,
    fontWeight: '600' as const,
  };

  const submit = () => {
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      notes: notes.trim(),
      timeframe: tf,
      category: category.trim() || 'Roadmap',
      color: timeframeColor(tf),
    });
    setTitle('');
    setNotes('');
    setCategory('');
    setTf('yearly');
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: Space.xl }}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: 440,
            backgroundColor: theme.colors.surfaceElevated,
            borderRadius: Radius.xl,
            borderWidth: 1,
            borderColor: theme.colors.border,
            padding: Space.xl,
            gap: Space.md,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="flag" size={18} color={theme.colors.primary} />
            <AppText size={18} weight="800" style={{ flex: 1 }}>
              New roadmap goal
            </AppText>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={theme.colors.textMuted} />
            </Pressable>
          </View>

          <TextInput placeholder="Goal title" placeholderTextColor={theme.colors.textFaint} value={title} onChangeText={setTitle} style={field} />
          <TextInput
            placeholder="Notes / description (optional)"
            placeholderTextColor={theme.colors.textFaint}
            value={notes}
            onChangeText={setNotes}
            multiline
            style={[field, { minHeight: 60, textAlignVertical: 'top' }]}
          />
          <TextInput placeholder="Category (e.g. Career)" placeholderTextColor={theme.colors.textFaint} value={category} onChangeText={setCategory} style={field} />

          <AppText weight="700" size={11} color="textFaint">
            TIMEFRAME
          </AppText>
          <View style={{ flexDirection: 'row', gap: Space.sm }}>
            {TF.map((t) => (
              <Pressable
                key={t}
                onPress={() => setTf(t)}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingVertical: Space.md,
                  borderRadius: Radius.md,
                  backgroundColor: tf === t ? timeframeColor(t) : theme.colors.surfaceAlt,
                }}>
                <AppText weight="700" size={13} color={tf === t ? 'primaryText' : 'textMuted'}>
                  {t === 'none' ? 'Indefinite' : TF_LABEL[t]}
                </AppText>
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={submit}
            style={{ backgroundColor: theme.colors.primary, borderRadius: Radius.pill, paddingVertical: Space.md, alignItems: 'center', marginTop: Space.sm }}>
            <AppText weight="800" color="primaryText" size={15}>
              Add to roadmap
            </AppText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Quick centered popup to edit the long-term vision (title + why).
function VisionEditPopup({
  visible,
  vision,
  onClose,
  onSave,
}: {
  visible: boolean;
  vision: { title: string; why: string; targetYear: number; indefinite?: boolean };
  onClose: () => void;
  onSave: (patch: { title: string; why: string; targetYear: number; indefinite: boolean }) => void;
}) {
  const { theme } = useTheme();
  const [title, setTitle] = useState(vision.title);
  const [why, setWhy] = useState(vision.why);
  const [year, setYear] = useState(String(vision.targetYear));
  const [indefinite, setIndefinite] = useState(!!vision.indefinite);

  const field = {
    color: theme.colors.text,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: Radius.md,
    padding: Space.md,
    fontSize: 15,
    fontWeight: '600' as const,
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: Space.xl }}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: 440,
            backgroundColor: theme.colors.surfaceElevated,
            borderRadius: Radius.xl,
            borderWidth: 1,
            borderColor: theme.colors.border,
            padding: Space.xl,
            gap: Space.md,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="telescope" size={18} color={theme.colors.primary} />
            <AppText size={18} weight="800" style={{ flex: 1 }}>
              Long-term vision
            </AppText>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={theme.colors.textMuted} />
            </Pressable>
          </View>
          <TextInput
            placeholder="What are you aiming for?"
            placeholderTextColor={theme.colors.textFaint}
            value={title}
            onChangeText={setTitle}
            style={field}
          />
          <TextInput
            placeholder="Why does this matter?"
            placeholderTextColor={theme.colors.textFaint}
            value={why}
            onChangeText={setWhy}
            multiline
            style={[field, { minHeight: 80, textAlignVertical: 'top' }]}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.sm, flexWrap: 'wrap' }}>
            <AppText weight="700" size={12} color="textFaint">
              TARGET YEAR
            </AppText>
            <TextInput
              value={year}
              onChangeText={setYear}
              keyboardType="number-pad"
              maxLength={4}
              editable={!indefinite}
              style={[field, { width: 90, textAlign: 'center', opacity: indefinite ? 0.4 : 1 }]}
            />
            <Pressable
              onPress={() => setIndefinite((v) => !v)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                borderRadius: Radius.pill,
                borderWidth: 1,
                borderColor: indefinite ? theme.colors.primary : theme.colors.border,
                backgroundColor: indefinite ? theme.colors.primary : 'transparent',
                paddingHorizontal: Space.md,
                paddingVertical: 6,
              }}>
              <Ionicons
                name={indefinite ? 'infinite' : 'infinite-outline'}
                size={14}
                color={indefinite ? theme.colors.primaryText : theme.colors.textMuted}
              />
              <AppText size={12} weight="700" color={indefinite ? 'primaryText' : 'textMuted'}>
                Indefinite
              </AppText>
            </Pressable>
          </View>
          <AppText color="textFaint" size={11} weight="500">
            {indefinite
              ? 'No fixed end year — the roadmap stays open-ended.'
              : 'Set a target year, or mark it indefinite if there’s no deadline.'}
          </AppText>
          <Pressable
            onPress={() =>
              onSave({
                title: title.trim(),
                why: why.trim(),
                targetYear: parseInt(year, 10) || vision.targetYear,
                indefinite,
              })
            }
            style={{ backgroundColor: theme.colors.primary, borderRadius: Radius.pill, paddingVertical: Space.md, alignItems: 'center', marginTop: Space.sm }}>
            <AppText weight="800" color="primaryText" size={15}>
              Save vision
            </AppText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Full-page list of every roadmap goal in this project, grouped by date.
// Smaller typography so more fits on screen; clear empty-state when nothing's there.
function AllGoalsPopup({
  visible,
  goals,
  onClose,
}: {
  visible: boolean;
  goals: Goal[];
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const { lang } = useI18n();
  const list = goals.filter((g) => !g.archived);

  // Group by date string (or "No date"); sort groups chronologically.
  const groups = new Map<string, Goal[]>();
  for (const g of list) {
    const k = g.date ?? '__nodate__';
    const arr = groups.get(k) ?? [];
    arr.push(g);
    groups.set(k, arr);
  }
  const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
    if (a === '__nodate__') return 1;
    if (b === '__nodate__') return -1;
    return a.localeCompare(b);
  });

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: Space.lg,
            paddingVertical: Space.md,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="list" size={20} color={theme.colors.primary} />
            <AppText size={18} weight="800">
              All roadmap goals
            </AppText>
            <View
              style={{
                backgroundColor: theme.colors.surfaceAlt,
                borderRadius: Radius.pill,
                paddingHorizontal: 8,
                paddingVertical: 2,
              }}>
              <AppText size={11} weight="700" color="textMuted">
                {list.length}
              </AppText>
            </View>
          </View>
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: Space.lg, paddingVertical: Space.md, paddingBottom: Space.xxl, gap: Space.md }}>
          {list.length === 0 ? (
            <Card>
              <AppText color="textMuted" size={13} weight="500">
                No goals in this project yet. Use “Roadmap goal” or “Quick add” on the Goals tab to create one.
              </AppText>
            </Card>
          ) : (
            sortedKeys.map((k) => {
              const items = groups.get(k)!;
              const headerLabel = k === '__nodate__' ? 'No date' : k;
              return (
                <View key={k} style={{ gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <Ionicons name="calendar-outline" size={12} color={theme.colors.textMuted} />
                    <AppText weight="800" size={11} color="textFaint">
                      {headerLabel.toUpperCase()}
                    </AppText>
                    <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.border }} />
                    <AppText size={10} weight="700" color="textFaint">
                      {items.length}
                    </AppText>
                  </View>
                  {items.map((g) => {
                    const p = goalProgress(g);
                    const c = timeframeColor(g.timeframe);
                    return (
                      <View
                        key={g.id}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: Space.sm,
                          backgroundColor: theme.colors.surface,
                          borderRadius: Radius.md,
                          borderWidth: 1,
                          borderColor: theme.colors.border,
                          borderLeftWidth: 3,
                          borderLeftColor: c,
                          paddingHorizontal: Space.md,
                          paddingVertical: 8,
                        }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c }} />
                        <View style={{ flex: 1 }}>
                          <AppText weight="700" size={13} numberOfLines={1}>
                            {tSeed(g.title, lang)}
                          </AppText>
                          <AppText color="textMuted" size={10} weight="600" numberOfLines={1}>
                            {g.timeframe.toUpperCase()} · {g.category.toUpperCase()}
                          </AppText>
                        </View>
                        <View style={{ width: 60 }}>
                          <ProgressBar progress={p} height={4} color={c} />
                          <AppText size={10} weight="700" style={{ color: c, textAlign: 'right', marginTop: 2 }}>
                            {Math.round(p * 100)}%
                          </AppText>
                        </View>
                      </View>
                    );
                  })}
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// Full-page expandable detail view for a roadmap goal — shows title, description
// (editable inline), plan-points checklist (toggleable + addable), and sub-tasks.
function GoalDetailPopup({ goalId, onClose }: { goalId: string | null; onClose: () => void }) {
  const { theme } = useTheme();
  const { lang } = useI18n();
  const allGoals = useActiveGoals();
  const goal = allGoals.find((g) => g.id === goalId) ?? null;
  const updateGoal = useStore((s) => s.updateGoal);
  const togglePoint = useStore((s) => s.togglePoint);
  const addGoalPoint = useStore((s) => s.addGoalPoint);
  const removeGoalPoint = useStore((s) => s.removeGoalPoint);
  const addSubGoal = useStore((s) => s.addSubGoal);
  const toggleGoalDone = useStore((s) => s.toggleGoalDone);
  const deleteGoal = useStore((s) => s.deleteGoal);

  const [notesDraft, setNotesDraft] = useState('');
  const [pointDraft, setPointDraft] = useState('');
  const [subDraft, setSubDraft] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [syncedGoalId, setSyncedGoalId] = useState<string | null>(null);

  // Sync local notes draft when popup opens with a different goal.
  if (goal && syncedGoalId !== goal.id) {
    setSyncedGoalId(goal.id);
    setNotesDraft(goal.notes ?? '');
  }

  if (!goal) {
    return (
      <Modal visible={false} onRequestClose={onClose}>
        <View />
      </Modal>
    );
  }

  const c = timeframeColor(goal.timeframe);
  const p = goalProgress(goal);
  const subs = allGoals.filter((g) => g.parentId === goal.id && !g.archived);
  const ptDone = goal.points.filter((pt) => pt.done).length;

  const commitNotes = () => {
    if (notesDraft !== (goal.notes ?? '')) updateGoal(goal.id, { notes: notesDraft });
  };

  return (
    <Modal transparent visible={!!goalId} animationType="fade" onRequestClose={onClose}>
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
          maxWidth: 720,
          maxHeight: '92%',
          backgroundColor: theme.colors.bg,
          borderRadius: Radius.xl,
          borderWidth: 1,
          borderColor: theme.colors.border,
          overflow: 'hidden',
        }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: Space.lg,
            paddingVertical: Space.md,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: c }} />
            <AppText size={16} weight="800" numberOfLines={1} style={{ flex: 1 }}>
              {tSeed(goal.title, lang)}
            </AppText>
            <View
              style={{
                borderRadius: Radius.pill,
                borderWidth: 1,
                borderColor: c,
                paddingHorizontal: Space.sm,
                paddingVertical: 2,
              }}>
              <AppText size={11} weight="800" style={{ color: c }}>
                {goal.timeframe.toUpperCase()}
              </AppText>
            </View>
          </View>
          <Pressable onPress={() => setConfirmDelete(true)} hitSlop={10} style={{ marginLeft: Space.md }}>
            <Ionicons name="trash-outline" size={20} color={theme.colors.danger} />
          </Pressable>
          <Pressable onPress={onClose} hitSlop={10} style={{ marginLeft: Space.md }}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: Space.lg, gap: Space.lg, paddingBottom: Space.xxl }}>
          {/* Overview block */}
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <AppText weight="800" size={14}>
                Progress
              </AppText>
              <AppText weight="800" size={18} style={{ color: c }}>
                {Math.round(p * 100)}%
              </AppText>
            </View>
            <View style={{ marginTop: Space.sm }}>
              <ProgressBar progress={p} height={8} color={c} />
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Space.md, marginTop: Space.md }}>
              <DetailMetaChip icon="pricetag-outline" label={goal.category || 'General'} />
              {goal.date ? <DetailMetaChip icon="calendar-outline" label={goal.date} /> : null}
              {goal.recurrence && goal.recurrence !== 'none' ? (
                <DetailMetaChip icon="repeat" label={`Repeats ${goal.recurrence}`} />
              ) : null}
              {goal.priority ? <DetailMetaChip icon="flag" label={`${goal.priority} priority`} /> : null}
            </View>
            <Pressable
              onPress={() => toggleGoalDone(goal.id)}
              style={{
                marginTop: Space.lg,
                backgroundColor: p >= 1 ? theme.colors.surfaceAlt : c,
                borderRadius: Radius.pill,
                paddingVertical: Space.md,
                alignItems: 'center',
                borderWidth: p >= 1 ? 1 : 0,
                borderColor: theme.colors.border,
              }}>
              <AppText weight="800" size={14} color={p >= 1 ? 'text' : 'primaryText'}>
                {p >= 1 ? 'Reopen goal' : 'Mark as complete'}
              </AppText>
            </Pressable>
          </Card>

          {/* Description */}
          <Card>
            <SectionHeader title="Description" />
            <TextInput
              value={notesDraft}
              onChangeText={setNotesDraft}
              onBlur={commitNotes}
              onEndEditing={commitNotes}
              multiline
              placeholder="What does this goal involve? Why does it matter?"
              placeholderTextColor={theme.colors.textFaint}
              style={{
                marginTop: Space.md,
                color: theme.colors.text,
                backgroundColor: theme.colors.surfaceAlt,
                borderRadius: Radius.md,
                padding: Space.md,
                minHeight: 100,
                textAlignVertical: 'top',
                fontWeight: '500',
                fontSize: 14,
              }}
            />
          </Card>

          {/* Plan points */}
          <Card>
            <SectionHeader
              title="Plan points"
              action={
                goal.points.length > 0 ? (
                  <AppText size={11} weight="700" color="textMuted">
                    {ptDone}/{goal.points.length}
                  </AppText>
                ) : undefined
              }
            />
            <View style={{ gap: Space.sm, marginTop: Space.md }}>
              {goal.points.map((pt) => (
                <View key={pt.id} style={{ flexDirection: 'row', alignItems: 'center', gap: Space.md }}>
                  <Pressable onPress={() => togglePoint(goal.id, pt.id)} hitSlop={6}>
                    <CheckBox checked={pt.done} size={22} />
                  </Pressable>
                  <AppText
                    style={[{ flex: 1 }, pt.done ? { textDecorationLine: 'line-through' } : null]}
                    color={pt.done ? 'textFaint' : 'text'}
                    weight="500">
                    {tSeed(pt.text, lang)}
                  </AppText>
                  <IconButton name="close" size={15} onPress={() => removeGoalPoint(goal.id, pt.id)} />
                </View>
              ))}
              <View style={{ flexDirection: 'row', gap: Space.sm, alignItems: 'center' }}>
                <TextInput
                  value={pointDraft}
                  onChangeText={setPointDraft}
                  onSubmitEditing={() => {
                    if (pointDraft.trim()) {
                      addGoalPoint(goal.id, pointDraft.trim());
                      setPointDraft('');
                    }
                  }}
                  placeholder="Add a plan point…"
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
                    if (pointDraft.trim()) {
                      addGoalPoint(goal.id, pointDraft.trim());
                      setPointDraft('');
                    }
                  }}
                />
              </View>
            </View>
          </Card>

          {/* Sub-tasks */}
          <Card>
            <SectionHeader
              title="Sub-tasks"
              action={
                subs.length > 0 ? (
                  <AppText size={11} weight="700" color="textMuted">
                    {subs.filter((s) => goalProgress(s) >= 1).length}/{subs.length}
                  </AppText>
                ) : undefined
              }
            />
            <AppText color="textMuted" size={12} weight="500" style={{ marginTop: 4 }}>
              Break this goal into smaller tasks.
            </AppText>
            <View style={{ gap: Space.sm, marginTop: Space.md }}>
              {subs.map((sg) => {
                const sp = goalProgress(sg);
                const sc = timeframeColor(sg.timeframe);
                return (
                  <View
                    key={sg.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: Space.sm,
                      backgroundColor: theme.colors.surfaceAlt,
                      borderRadius: Radius.md,
                      borderLeftWidth: 3,
                      borderLeftColor: sc,
                      paddingHorizontal: Space.md,
                      paddingVertical: Space.sm,
                    }}>
                    <Pressable onPress={() => toggleGoalDone(sg.id)} hitSlop={4}>
                      <CheckBox checked={sp >= 1} size={20} />
                    </Pressable>
                    <AppText
                      style={[{ flex: 1 }, sp >= 1 ? { textDecorationLine: 'line-through' } : null]}
                      color={sp >= 1 ? 'textFaint' : 'text'}
                      weight="600"
                      size={14}>
                      {tSeed(sg.title, lang)}
                    </AppText>
                    <AppText size={11} weight="700" style={{ color: sc }}>
                      {Math.round(sp * 100)}%
                    </AppText>
                    <IconButton name="close" size={14} onPress={() => deleteGoal(sg.id)} />
                  </View>
                );
              })}
              <View style={{ flexDirection: 'row', gap: Space.sm, alignItems: 'center' }}>
                <TextInput
                  value={subDraft}
                  onChangeText={setSubDraft}
                  onSubmitEditing={() => {
                    if (subDraft.trim()) {
                      addSubGoal(goal.id, subDraft.trim());
                      setSubDraft('');
                    }
                  }}
                  placeholder="Add a sub-task…"
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
                    if (subDraft.trim()) {
                      addSubGoal(goal.id, subDraft.trim());
                      setSubDraft('');
                    }
                  }}
                />
              </View>
            </View>
          </Card>
        </ScrollView>

        <ConfirmModal
          visible={confirmDelete}
          title="Delete this goal?"
          body={`"${tSeed(goal.title, lang)}" and any sub-tasks or plan points will be permanently removed.`}
          confirmLabel="Delete"
          danger
          icon="trash"
          onConfirm={() => {
            deleteGoal(goal.id);
            onClose();
          }}
          onClose={() => setConfirmDelete(false)}
        />
      </Pressable>
      </Pressable>
    </Modal>
  );
}

function DetailMetaChip({ icon, label }: { icon: string; label: string }) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: theme.colors.surfaceAlt,
        borderRadius: Radius.pill,
        paddingHorizontal: Space.md,
        paddingVertical: 5,
      }}>
      <Ionicons name={icon as any} size={12} color={theme.colors.textMuted} />
      <AppText size={11} weight="700" color="textMuted">
        {label}
      </AppText>
    </View>
  );
}
