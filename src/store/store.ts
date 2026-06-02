import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  buildAchievements,
  dailyQuests,
  goalComplete,
  levelFromXp,
  nextOccurrenceDate,
  POINT_XP,
  TIMEFRAME_XP,
  todayKey,
  uid,
  updateStreak,
} from '@/domain/logic';
import { seedActiveProjectId, seedGoals, seedNotes, seedProfile, seedProjects, seedSets, seedVision } from '@/domain/seed';
import { Goal, GoalSet, Note, Priority, Profile, Project, Recurrence, Reminder, Timeframe, Vision } from '@/domain/types';

// Default workspace seeded on first run. Existing data migrates into this.
const DEFAULT_PROJECT_ID = 'project-default';

function makeDefaultProject(vision: Vision): Project {
  return {
    id: DEFAULT_PROJECT_ID,
    name: 'My roadmap',
    color: '#6C8BFF',
    icon: 'rocket',
    vision,
    createdAt: Date.now(),
  };
}

type State = {
  projects: Project[];
  activeProjectId: string;
  // `vision` is a *mirror* of the active project's vision so legacy readers
  // (`useStore(s => s.vision)`) keep working. Always kept in sync with the
  // project entry, never updated alone.
  vision: Vision;
  goals: Goal[];
  sets: GoalSet[];
  notes: Note[];
  profile: Profile;
  questDate: string; // YYYY-MM-DD the current daily quests belong to
  claimedQuests: string[]; // quest ids already claimed today
  onboarded: boolean; // first-run welcome shown
  lastLevelUp: number | null;
  lastBadgeId: string | null;
  // Timestamp (ms) of the last successful Supabase pull. Used by the sync
  // layer to distinguish "local row added since last pull (pending push)"
  // from "local row that was deleted on cloud after last pull". 0 = never
  // pulled (first-ever sign-in on this device).
  lastSyncAt: number;
};

type AddGoalInput = {
  title: string;
  notes?: string;
  timeframe: Timeframe;
  category?: string;
  setId?: string;
  parentId?: string;
  color?: string;
  date?: string;
  priority?: Priority;
  estimateMin?: number;
  dependsOn?: string[];
  recurrence?: Recurrence;
  reminders?: Reminder[];
  points?: string[];
  // Side goals are global (no projectId), rendered in a dedicated section.
  side?: boolean;
};

type Actions = {
  // --- Projects ---
  addProject: (input: { name: string; color: string; icon: string; targetYear?: number; indefinite?: boolean }) => string;
  updateProject: (id: string, patch: { name?: string; color?: string; icon?: string }) => void;
  deleteProject: (id: string) => void;
  setActiveProject: (id: string) => void;
  // --- Goals / vision / etc ---
  toggleGoalDone: (id: string) => void;
  toggleGoalMissed: (id: string) => void;
  togglePoint: (goalId: string, pointId: string) => void;
  toggleVisionPoint: (pointId: string) => void;
  addGoal: (input: AddGoalInput) => void;
  addSubGoal: (parentId: string, title: string) => void;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  setArchived: (id: string, archived: boolean) => void;
  reorderGoals: (orderedIds: string[]) => void;
  addGoalPoint: (goalId: string, text: string) => void;
  removeGoalPoint: (goalId: string, pointId: string) => void;
  useFreeze: (id: string) => void;
  addSet: (input: { name: string; color: string; icon: string }) => void;
  updateSet: (id: string, patch: Partial<GoalSet>) => void;
  deleteSet: (id: string) => void;
  updateVision: (patch: Partial<Vision>) => void;
  addVisionPoint: (text: string) => void;
  removeVisionPoint: (id: string) => void;
  setName: (name: string) => void;
  addNote: (scope?: 'project' | 'global', title?: string) => string;
  updateNote: (id: string, patch: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  // Re-assign a note between its active project and the global library.
  setNoteScope: (id: string, scope: 'project' | 'global') => void;
  clearArchive: () => void;
  startFresh: () => void;
  resetRoadmap: () => void;
  claimQuest: (questId: string) => void;
  syncQuests: () => void;
  setOnboarded: (v: boolean) => void;
  exportData: () => string;
  importData: (json: string) => boolean;
  clearCelebrations: () => void;
  resetAll: () => void;
};

// Privacy gate: fresh installs land on an empty Default project. The morimake
// seed in `src/domain/seed.ts` is no longer auto-loaded — anyone visiting the
// deployed URL without signing in sees an empty app. Real data lives in
// Supabase and pulls down once the user signs in (see `services/sync.ts`).
// Sign-out wipes back to this initial state, so signed-out always = empty.
const emptyDefaultProject = makeDefaultProject({
  id: 'v1',
  title: '',
  why: '',
  targetYear: new Date().getFullYear() + 5,
  points: [],
});

const initial: State = {
  projects: [emptyDefaultProject],
  activeProjectId: emptyDefaultProject.id,
  vision: emptyDefaultProject.vision,
  goals: [],
  sets: [],
  notes: [],
  profile: {
    name: '',
    xp: 0,
    streakDays: 0,
    bestStreak: 0,
    lastActiveDate: undefined,
    freezeTokens: 0,
    stats: { daily: 0, weekly: 0, monthly: 0, yearly: 0, missed: 0 },
  },
  questDate: todayKey(),
  claimedQuests: [],
  onboarded: true, // No demo to walk through — straight to a blank signed-out app.
  lastLevelUp: null,
  lastBadgeId: null,
  lastSyncAt: 0,
};
// Imports below are kept for legacy paths (importData / migrate fallbacks).
// They no longer feed the initial state.
void seedActiveProjectId;
void seedGoals;
void seedNotes;
void seedProfile;
void seedProjects;

// Vision lives canonically inside the active project and is mirrored at state.vision.
// This helper updates BOTH so legacy `s.vision` readers stay correct.
function withVision(s: State, vision: Vision): Partial<State> {
  return {
    vision,
    projects: s.projects.map((p) => (p.id === s.activeProjectId ? { ...p, vision } : p)),
  };
}

function applyProgress(
  s: State,
  opts: { goals?: Goal[]; vision?: Vision; xpDelta: number; statBump?: Timeframe; positive: boolean },
): Partial<State> {
  const prevEarned = new Set(buildAchievements(s.profile).filter((a) => a.earned).map((a) => a.id));
  const prevLevel = levelFromXp(s.profile.xp).level;

  let profile: Profile = { ...s.profile, xp: Math.max(0, s.profile.xp + opts.xpDelta) };
  // 'none' goals don't have a Stats counter — skip the bump for them.
  if (opts.statBump && opts.statBump !== 'none') {
    profile = {
      ...profile,
      stats: { ...profile.stats, [opts.statBump]: profile.stats[opts.statBump] + 1 },
    };
  }
  if (opts.positive) profile = updateStreak(profile);

  const newLevel = levelFromXp(profile.xp).level;
  const leveledUp = opts.positive && newLevel > prevLevel;
  if (leveledUp) {
    // Each level-up grants a streak-freeze token.
    profile = { ...profile, freezeTokens: profile.freezeTokens + (newLevel - prevLevel) };
  }
  const newAch = buildAchievements(profile);
  const newBadge = newAch.find((a) => a.earned && !prevEarned.has(a.id));

  return {
    goals: opts.goals ?? s.goals,
    vision: opts.vision ?? s.vision,
    profile,
    lastLevelUp: opts.positive && newLevel > prevLevel ? newLevel : s.lastLevelUp,
    lastBadgeId: newBadge ? newBadge.id : s.lastBadgeId,
  };
}

export const useStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...initial,

      // --- Projects ---------------------------------------------------------
      addProject: ({ name, color, icon, targetYear, indefinite }) => {
        const id = uid();
        const year = targetYear ?? new Date().getFullYear() + 5;
        const project: Project = {
          id,
          name: name.trim() || 'Untitled project',
          color,
          icon,
          vision: { id: uid(), title: '', why: '', targetYear: year, indefinite, points: [] },
          createdAt: Date.now(),
        };
        set((s) => ({
          projects: [...s.projects, project],
          // Switch into the newly-created project for convenience.
          activeProjectId: id,
          vision: project.vision,
        }));
        return id;
      },

      updateProject: (id, patch) =>
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),

      // Deleting a project also drops all its goals and notes.
      deleteProject: (id) =>
        set((s) => {
          if (s.projects.length <= 1) return s; // keep at least one project alive
          const remaining = s.projects.filter((p) => p.id !== id);
          const nextActive =
            s.activeProjectId === id ? remaining[0].id : s.activeProjectId;
          const nextProject = remaining.find((p) => p.id === nextActive)!;
          return {
            projects: remaining,
            activeProjectId: nextActive,
            vision: nextProject.vision,
            goals: s.goals.filter((g) => g.projectId !== id),
            notes: s.notes.filter((n) => n.projectId !== id),
          };
        }),

      setActiveProject: (id) =>
        set((s) => {
          const project = s.projects.find((p) => p.id === id);
          if (!project) return s;
          return { activeProjectId: id, vision: project.vision };
        }),

      toggleGoalDone: (id) =>
        set((s) => {
          const goal = s.goals.find((g) => g.id === id);
          if (!goal) return s;
          const prevComplete = goalComplete(goal);
          const target = !prevComplete;
          let pointXp = 0;
          let points = goal.points;
          if (goal.points.length > 0) {
            points = goal.points.map((p) => {
              if (p.done !== target) pointXp += target ? POINT_XP : -POINT_XP;
              return { ...p, done: target };
            });
          }
          const recurring = target && !!goal.recurrence && goal.recurrence !== 'none';
          const ng: Goal = {
            ...goal,
            points,
            done: target,
            doneAt: target ? Date.now() : undefined,
            missedAt: target ? undefined : goal.missedAt,
            // A completed recurring goal moves to the archive; its next occurrence takes its place.
            archived: recurring ? true : goal.archived,
          };
          let goals = s.goals.map((g) => (g.id === id ? ng : g));
          if (recurring) {
            const next: Goal = {
              ...goal,
              id: uid(),
              habitId: goal.habitId ?? goal.id,
              date: nextOccurrenceDate(goal.date, goal.recurrence!),
              done: false,
              doneAt: undefined,
              missedAt: undefined,
              frozen: false,
              archived: false,
              createdAt: Date.now(),
              points: goal.points.map((p) => ({ ...p, id: uid(), done: false })),
              reminders: (goal.reminders ?? []).map((r) => ({ ...r })),
            };
            goals = [next, ...goals];
          }

          let xpDelta = pointXp;
          let statBump: Timeframe | undefined;
          if (!prevComplete && target) {
            xpDelta += TIMEFRAME_XP[goal.timeframe];
            statBump = goal.timeframe;
          } else if (prevComplete && !target) {
            xpDelta -= TIMEFRAME_XP[goal.timeframe];
          }
          return applyProgress(s, { goals, xpDelta, statBump, positive: target });
        }),

      toggleGoalMissed: (id) =>
        set((s) => {
          const goal = s.goals.find((g) => g.id === id);
          if (!goal) return s;
          const nowMissed = !goal.missedAt;
          let xpDelta = 0;
          let done = goal.done;
          let doneAt = goal.doneAt;
          // Marking a points-free goal missed clears its completion (and refunds its XP).
          if (nowMissed && goal.points.length === 0 && goal.done) {
            xpDelta = -TIMEFRAME_XP[goal.timeframe];
            done = false;
            doneAt = undefined;
          }
          // Missing a recurring goal settles this occurrence and rolls forward to the next.
          const recurring = nowMissed && !!goal.recurrence && goal.recurrence !== 'none';
          const ng: Goal = {
            ...goal,
            missedAt: nowMissed ? Date.now() : undefined,
            done,
            doneAt,
            archived: recurring ? true : goal.archived,
          };
          let goals = s.goals.map((g) => (g.id === id ? ng : g));
          if (recurring) {
            const next: Goal = {
              ...goal,
              id: uid(),
              habitId: goal.habitId ?? goal.id,
              date: nextOccurrenceDate(goal.date, goal.recurrence!),
              done: false,
              doneAt: undefined,
              missedAt: undefined,
              frozen: false,
              archived: false,
              createdAt: Date.now(),
              points: goal.points.map((p) => ({ ...p, id: uid(), done: false })),
              reminders: (goal.reminders ?? []).map((r) => ({ ...r })),
            };
            goals = [next, ...goals];
          }
          const stats = nowMissed
            ? { ...s.profile.stats, missed: s.profile.stats.missed + 1 }
            : s.profile.stats;
          const profile: Profile = { ...s.profile, xp: Math.max(0, s.profile.xp + xpDelta), stats };
          return { goals, profile };
        }),

      togglePoint: (goalId, pointId) =>
        set((s) => {
          const goal = s.goals.find((g) => g.id === goalId);
          if (!goal) return s;
          const pt = goal.points.find((p) => p.id === pointId);
          if (!pt) return s;
          const prevComplete = goalComplete(goal);
          const newDone = !pt.done;
          const points = goal.points.map((p) => (p.id === pointId ? { ...p, done: newDone } : p));
          let ng: Goal = { ...goal, points };
          const nowComplete = goalComplete(ng);
          ng = { ...ng, done: nowComplete, doneAt: nowComplete ? Date.now() : undefined };
          const goals = s.goals.map((g) => (g.id === goalId ? ng : g));

          let xpDelta = newDone ? POINT_XP : -POINT_XP;
          let statBump: Timeframe | undefined;
          if (!prevComplete && nowComplete) {
            xpDelta += TIMEFRAME_XP[goal.timeframe];
            statBump = goal.timeframe;
          } else if (prevComplete && !nowComplete) {
            xpDelta -= TIMEFRAME_XP[goal.timeframe];
          }
          return applyProgress(s, { goals, xpDelta, statBump, positive: newDone });
        }),

      toggleVisionPoint: (pointId) =>
        set((s) => {
          const pt = s.vision.points.find((p) => p.id === pointId);
          if (!pt) return s;
          const newDone = !pt.done;
          const points = s.vision.points.map((p) =>
            p.id === pointId ? { ...p, done: newDone } : p,
          );
          const vision = { ...s.vision, points };
          const progress = applyProgress(s, { vision, xpDelta: newDone ? POINT_XP : -POINT_XP, positive: newDone });
          return { ...progress, ...withVision(s, vision) };
        }),

      addGoal: (input) =>
        set((s) => {
          const id = uid();
          const recurring = !!input.recurrence && input.recurrence !== 'none';
          const goal: Goal = {
            id,
            title: input.title,
            notes: input.notes,
            timeframe: input.timeframe,
            category: input.category || 'General',
            // Side goals stay unattached so they're visible across every project.
            projectId: input.side ? undefined : s.activeProjectId,
            setId: input.setId,
            parentId: input.parentId,
            color: input.color,
            date: input.date,
            priority: input.priority,
            estimateMin: input.estimateMin,
            dependsOn: input.dependsOn,
            recurrence: input.recurrence,
            reminders: input.reminders,
            side: input.side,
            habitId: recurring ? id : undefined,
            order: -Date.now(), // newest sorts to the top
            done: false,
            createdAt: Date.now(),
            points: (input.points ?? [])
              .filter((t) => t.trim())
              .map((t) => ({ id: uid(), text: t.trim(), done: false })),
          };
          return { goals: [goal, ...s.goals] };
        }),

      addSubGoal: (parentId, title) =>
        set((s) => {
          const parent = s.goals.find((g) => g.id === parentId);
          if (!parent || !title.trim()) return s;
          return {
            goals: [
              {
                id: uid(),
                title: title.trim(),
                timeframe: parent.timeframe,
                category: parent.category,
                projectId: parent.projectId ?? s.activeProjectId,
                setId: parent.setId,
                parentId,
                color: parent.color,
                order: -Date.now(),
                done: false,
                createdAt: Date.now(),
                points: [],
              },
              ...s.goals,
            ],
          };
        }),

      updateGoal: (id, patch) =>
        set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) })),

      // Deleting a goal also removes its sub-goals and clears it from any dependency lists.
      deleteGoal: (id) =>
        set((s) => ({
          goals: s.goals
            .filter((g) => g.id !== id && g.parentId !== id)
            .map((g) => (g.dependsOn?.includes(id) ? { ...g, dependsOn: g.dependsOn.filter((d) => d !== id) } : g)),
        })),

      setArchived: (id, archived) =>
        set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, archived } : g)) })),

      reorderGoals: (orderedIds) =>
        set((s) => {
          const orderMap = new Map(orderedIds.map((gid, i) => [gid, i]));
          return {
            goals: s.goals.map((g) => (orderMap.has(g.id) ? { ...g, order: orderMap.get(g.id)! } : g)),
          };
        }),

      addGoalPoint: (goalId, text) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === goalId
              ? { ...g, points: [...g.points, { id: uid(), text: text.trim(), done: false }] }
              : g,
          ),
        })),

      removeGoalPoint: (goalId, pointId) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === goalId ? { ...g, points: g.points.filter((p) => p.id !== pointId) } : g,
          ),
        })),

      // Spend a streak-freeze token to shield a missed habit occurrence.
      useFreeze: (id) =>
        set((s) => {
          if (s.profile.freezeTokens <= 0) return s;
          const goal = s.goals.find((g) => g.id === id);
          if (!goal || goal.frozen) return s;
          return {
            goals: s.goals.map((g) => (g.id === id ? { ...g, frozen: true } : g)),
            profile: { ...s.profile, freezeTokens: s.profile.freezeTokens - 1 },
          };
        }),

      addSet: ({ name, color, icon }) =>
        set((s) => ({
          sets: [...s.sets, { id: uid(), name: name.trim(), color, icon, createdAt: Date.now() }],
        })),

      updateSet: (id, patch) =>
        set((s) => ({ sets: s.sets.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),

      // Deleting a set keeps its goals but unassigns them.
      deleteSet: (id) =>
        set((s) => ({
          sets: s.sets.filter((x) => x.id !== id),
          goals: s.goals.map((g) => (g.setId === id ? { ...g, setId: undefined } : g)),
        })),

      updateVision: (patch) => set((s) => withVision(s, { ...s.vision, ...patch })),

      addVisionPoint: (text) =>
        set((s) =>
          withVision(s, {
            ...s.vision,
            points: [...s.vision.points, { id: uid(), text: text.trim(), done: false }],
          }),
        ),

      removeVisionPoint: (id) =>
        set((s) => withVision(s, { ...s.vision, points: s.vision.points.filter((p) => p.id !== id) })),

      setName: (name) => set((s) => ({ profile: { ...s.profile, name } })),

      addNote: (scope = 'project', title) => {
        const id = uid();
        set((s) => ({
          notes: [
            {
              id,
              title: (title?.trim() || 'Untitled note'),
              body: '',
              // Global notes (projectId undefined) appear in every project.
              projectId: scope === 'global' ? undefined : s.activeProjectId,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
            ...s.notes,
          ],
        }));
        return id;
      },

      updateNote: (id, patch) =>
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n)),
        })),

      setNoteScope: (id, scope) =>
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id
              ? {
                  ...n,
                  projectId: scope === 'global' ? undefined : s.activeProjectId,
                  updatedAt: Date.now(),
                }
              : n,
          ),
        })),

      deleteNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),

      clearArchive: () => set((s) => ({ goals: s.goals.filter((g) => !g.archived) })),

      // Wipe goals + all progress (XP, level, achievements, streaks, quests). Keeps
      // name, themes, sets, notes, vision.
      startFresh: () =>
        set((s) => ({
          goals: [],
          profile: {
            name: s.profile.name,
            xp: 0,
            streakDays: 0,
            bestStreak: 0,
            lastActiveDate: undefined,
            freezeTokens: 0,
            stats: { daily: 0, weekly: 0, monthly: 0, yearly: 0, missed: 0 },
          },
          questDate: todayKey(),
          claimedQuests: [],
          lastLevelUp: null,
          lastBadgeId: null,
        })),

      // Clear the active project's long-term vision (keeps target year).
      resetRoadmap: () =>
        set((s) => withVision(s, { ...s.vision, title: '', why: '', points: [] })),

      // Roll the daily quest board over to today if it's stale.
      syncQuests: () =>
        set((s) => {
          const today = todayKey();
          if (s.questDate === today) return s;
          return { questDate: today, claimedQuests: [] };
        }),

      claimQuest: (questId) =>
        set((s) => {
          const today = todayKey();
          const questDate = s.questDate === today ? s.questDate : today;
          const claimed = s.questDate === today ? s.claimedQuests : [];
          if (claimed.includes(questId)) return s;
          const quest = dailyQuests(today).find((q) => q.id === questId);
          if (!quest) return s;
          if (quest.progress(s.goals, s.profile, today) < quest.target) return s;
          const next = applyProgress(s, { xpDelta: quest.xp, positive: false });
          return { ...next, questDate, claimedQuests: [...claimed, questId] };
        }),

      setOnboarded: (v) => set({ onboarded: v }),

      exportData: (): string => {
        const s = get();
        return JSON.stringify(
          {
            projects: s.projects,
            activeProjectId: s.activeProjectId,
            vision: s.vision,
            goals: s.goals,
            sets: s.sets,
            notes: s.notes,
            profile: s.profile,
          },
          null,
          2,
        );
      },

      importData: (json) => {
        try {
          const data = JSON.parse(json);
          if (!data || !Array.isArray(data.goals) || !data.profile) return false;
          // Old exports without projects: wrap the vision in a Default project.
          const projects: Project[] = Array.isArray(data.projects) && data.projects.length
            ? data.projects
            : [makeDefaultProject(data.vision ?? seedVision)];
          const activeProjectId =
            data.activeProjectId && projects.find((p: Project) => p.id === data.activeProjectId)
              ? data.activeProjectId
              : projects[0].id;
          const active = projects.find((p: Project) => p.id === activeProjectId)!;
          set({
            projects,
            activeProjectId,
            vision: active.vision,
            goals: data.goals,
            sets: Array.isArray(data.sets) ? data.sets : [],
            notes: Array.isArray(data.notes) ? data.notes : [],
            profile: data.profile,
          });
          return true;
        } catch {
          return false;
        }
      },

      clearCelebrations: () => set({ lastLevelUp: null, lastBadgeId: null }),

      resetAll: () => set({ ...initial }),
    }),
    {
      name: 'roadmap.store.v2',
      // Bumped from 2 → 3 with the privacy gate: every device with v2 state
      // had the morimake seed auto-loaded and we want to drop that. The
      // migrate() below returns `undefined` for v < 3 which makes Zustand
      // fall back to the (now empty) initial state. Signed-in users get
      // their cloud data back from the sync layer on next startSync.
      version: 3,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        projects: s.projects,
        activeProjectId: s.activeProjectId,
        vision: s.vision,
        goals: s.goals,
        sets: s.sets,
        notes: s.notes,
        profile: s.profile,
        questDate: s.questDate,
        claimedQuests: s.claimedQuests,
        onboarded: s.onboarded,
        lastSyncAt: s.lastSyncAt,
      }),
      // Backfill fields added after the original v2 shape was first persisted.
      migrate: (persisted: any, version: number) => {
        // Privacy gate: bumping to v3 wipes any locally-cached state from v2
        // so signed-out browsers stop showing the morimake seed. Cloud data
        // pulls back down for signed-in users via the sync layer.
        if (version < 3) return undefined as any;
        if (!persisted) return persisted;
        if (!Array.isArray(persisted.sets)) persisted.sets = seedSets;
        if (persisted.profile?.stats && persisted.profile.stats.missed == null) {
          persisted.profile.stats.missed = 0;
        }
        if (Array.isArray(persisted.goals)) {
          persisted.goals = persisted.goals.map((g: any, i: number) => ({
            ...g,
            order: g.order ?? i,
            reminders: g.reminders ?? [],
            habitId: g.habitId ?? (g.recurrence && g.recurrence !== 'none' ? g.id : undefined),
          }));
        }
        if (persisted.profile && persisted.profile.freezeTokens == null) {
          persisted.profile.freezeTokens = 0;
        }
        if (persisted.onboarded == null) persisted.onboarded = true; // existing users skip onboarding
        if (persisted.questDate == null) persisted.questDate = '';
        if (!Array.isArray(persisted.claimedQuests)) persisted.claimedQuests = [];
        if (!Array.isArray(persisted.notes)) persisted.notes = [];
        // Projects migration: wrap pre-projects data into a Default project.
        if (!Array.isArray(persisted.projects) || persisted.projects.length === 0) {
          const visionForDefault = persisted.vision ?? seedVision;
          const def = makeDefaultProject(visionForDefault);
          persisted.projects = [def];
          persisted.activeProjectId = def.id;
          // Stamp existing goals/notes with the default project id.
          if (Array.isArray(persisted.goals)) {
            persisted.goals = persisted.goals.map((g: any) => ({ ...g, projectId: g.projectId ?? def.id }));
          }
          if (Array.isArray(persisted.notes)) {
            persisted.notes = persisted.notes.map((n: any) => ({ ...n, projectId: n.projectId ?? def.id }));
          }
        } else if (!persisted.activeProjectId) {
          persisted.activeProjectId = persisted.projects[0].id;
        }
        // Ensure mirror is consistent.
        const active = persisted.projects.find((p: Project) => p.id === persisted.activeProjectId);
        if (active) persisted.vision = active.vision;
        return persisted;
      },
    },
  ),
);
