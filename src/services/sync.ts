// Sync layer — bridges the local Zustand store and Supabase.
//
// Strategy: full-table reconcile per push (small data — 100s of rows max).
//   - On sign-in: if cloud is empty for this user → upload local (migration);
//     otherwise pull cloud and replace local.
//   - On any local state change → debounced upsert + delete reconcile per table.
//   - Realtime subscription → re-pull on change events from other devices.
//
// `unsubscribe()` undoes everything when the user signs out.

import { RealtimeChannel } from '@supabase/supabase-js';

import { Goal, GoalSet, Note, Profile, Project } from '@/domain/types';
import { useStore } from '@/store/store';

import { supabase } from './supabase';

// Tables we mirror. `goal_sets` is the DB name; in TS we call them `sets`.
type TableName = 'profiles' | 'projects' | 'goals' | 'notes' | 'goal_sets';
const SYNCED_TABLES: TableName[] = ['profiles', 'projects', 'goals', 'notes', 'goal_sets'];

// --- Mappers: zustand ↔ DB rows -------------------------------------------

function projectToRow(p: Project, userId: string) {
  return {
    user_id: userId,
    id: p.id,
    name: p.name,
    color: p.color,
    icon: p.icon,
    vision: p.vision,
    created_at: new Date(p.createdAt).toISOString(),
  };
}
function projectFromRow(r: any): Project {
  return {
    id: r.id,
    name: r.name,
    color: r.color,
    icon: r.icon,
    vision: r.vision,
    createdAt: new Date(r.created_at).getTime(),
  };
}

function goalToRow(g: Goal, userId: string) {
  return {
    user_id: userId,
    id: g.id,
    project_id: g.projectId ?? null,
    title: g.title,
    notes: g.notes ?? null,
    timeframe: g.timeframe,
    category: g.category,
    set_id: g.setId ?? null,
    parent_id: g.parentId ?? null,
    color: g.color ?? null,
    date: g.date ?? null,
    priority: g.priority ?? null,
    estimate_min: g.estimateMin ?? null,
    depends_on: g.dependsOn ?? null,
    recurrence: g.recurrence ?? null,
    reminders: g.reminders ?? null,
    order: g.order ?? null,
    habit_id: g.habitId ?? null,
    frozen: g.frozen ?? false,
    done: g.done,
    done_at: g.doneAt ? new Date(g.doneAt).toISOString() : null,
    missed_at: g.missedAt ? new Date(g.missedAt).toISOString() : null,
    points: g.points,
    created_at: new Date(g.createdAt).toISOString(),
    archived: g.archived ?? false,
    side: g.side ?? false,
  };
}
function goalFromRow(r: any): Goal {
  return {
    id: r.id,
    title: r.title,
    notes: r.notes ?? undefined,
    timeframe: r.timeframe,
    category: r.category,
    projectId: r.project_id ?? undefined,
    setId: r.set_id ?? undefined,
    parentId: r.parent_id ?? undefined,
    color: r.color ?? undefined,
    date: r.date ?? undefined,
    priority: r.priority ?? undefined,
    estimateMin: r.estimate_min ?? undefined,
    dependsOn: r.depends_on ?? undefined,
    recurrence: r.recurrence ?? undefined,
    reminders: r.reminders ?? undefined,
    order: r.order ?? undefined,
    habitId: r.habit_id ?? undefined,
    frozen: r.frozen ?? undefined,
    done: r.done,
    doneAt: r.done_at ? new Date(r.done_at).getTime() : undefined,
    missedAt: r.missed_at ? new Date(r.missed_at).getTime() : undefined,
    points: r.points ?? [],
    createdAt: new Date(r.created_at).getTime(),
    archived: r.archived ?? undefined,
    side: r.side ?? undefined,
  };
}

function noteToRow(n: Note, userId: string) {
  return {
    user_id: userId,
    id: n.id,
    project_id: n.projectId ?? null,
    title: n.title,
    body: n.body,
    created_at: new Date(n.createdAt).toISOString(),
    updated_at: new Date(n.updatedAt).toISOString(),
  };
}
function noteFromRow(r: any): Note {
  return {
    id: r.id,
    title: r.title,
    body: r.body,
    projectId: r.project_id ?? undefined,
    createdAt: new Date(r.created_at).getTime(),
    updatedAt: new Date(r.updated_at).getTime(),
  };
}

function setToRow(s: GoalSet, userId: string) {
  return {
    user_id: userId,
    id: s.id,
    name: s.name,
    color: s.color,
    icon: s.icon,
    created_at: new Date(s.createdAt).toISOString(),
  };
}
function setFromRow(r: any): GoalSet {
  return {
    id: r.id,
    name: r.name,
    color: r.color,
    icon: r.icon,
    createdAt: new Date(r.created_at).getTime(),
  };
}

function profileToRow(p: Profile, userId: string, activeProjectId: string, onboarded: boolean, questDate: string, claimedQuests: string[]) {
  return {
    user_id: userId,
    name: p.name,
    xp: p.xp,
    streak_days: p.streakDays,
    best_streak: p.bestStreak,
    last_active_date: p.lastActiveDate ?? null,
    freeze_tokens: p.freezeTokens,
    stats: p.stats,
    active_project_id: activeProjectId,
    onboarded,
    quest_date: questDate || null,
    claimed_quests: claimedQuests,
  };
}

// --- Internal state --------------------------------------------------------

let currentUserId: string | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let unsubStore: (() => void) | null = null;
let realtimeChannels: RealtimeChannel[] = [];
let pulling = false; // Suppress local→cloud pushes while we apply cloud→local changes.
let listenerStarted = false;

// Public: track whether we're currently uploading or downloading.
type SyncStatus = 'idle' | 'pulling' | 'pushing' | 'error';
let _status: SyncStatus = 'idle';
let _statusListeners: Array<(s: SyncStatus) => void> = [];
function setStatus(s: SyncStatus) {
  _status = s;
  for (const l of _statusListeners) l(s);
}
export function getSyncStatus(): SyncStatus {
  return _status;
}
export function onSyncStatus(cb: (s: SyncStatus) => void): () => void {
  _statusListeners.push(cb);
  cb(_status);
  return () => {
    _statusListeners = _statusListeners.filter((x) => x !== cb);
  };
}

// --- Push (local → cloud) --------------------------------------------------

// Tiny helper so a failing call (RLS reject, missing column, etc.) screams
// in the console instead of silently no-op'ing.
async function check(label: string, p: PromiseLike<{ error: { message: string } | null }>) {
  const { error } = await p;
  if (error) console.error(`[sync] ${label} failed:`, error.message);
}

async function pushAll() {
  const sb = supabase();
  if (!sb || !currentUserId) return;
  const uid = currentUserId;
  setStatus('pushing');
  try {
    const s = useStore.getState();

    // projects
    await check('projects upsert', sb.from('projects').upsert(s.projects.map((p) => projectToRow(p, uid))));
    const projectIds = s.projects.map((p) => p.id);
    if (projectIds.length > 0) {
      await check('projects delete', sb.from('projects').delete().eq('user_id', uid).not('id', 'in', `(${projectIds.map(quote).join(',')})`));
    } else {
      await check('projects delete-all', sb.from('projects').delete().eq('user_id', uid));
    }

    // goals
    if (s.goals.length > 0) await check('goals upsert', sb.from('goals').upsert(s.goals.map((g) => goalToRow(g, uid))));
    const goalIds = s.goals.map((g) => g.id);
    if (goalIds.length > 0) {
      await check('goals delete', sb.from('goals').delete().eq('user_id', uid).not('id', 'in', `(${goalIds.map(quote).join(',')})`));
    } else {
      await check('goals delete-all', sb.from('goals').delete().eq('user_id', uid));
    }

    // notes
    if (s.notes.length > 0) await check('notes upsert', sb.from('notes').upsert(s.notes.map((n) => noteToRow(n, uid))));
    const noteIds = s.notes.map((n) => n.id);
    if (noteIds.length > 0) {
      await check('notes delete', sb.from('notes').delete().eq('user_id', uid).not('id', 'in', `(${noteIds.map(quote).join(',')})`));
    } else {
      await check('notes delete-all', sb.from('notes').delete().eq('user_id', uid));
    }

    // sets
    if (s.sets.length > 0) await check('sets upsert', sb.from('goal_sets').upsert(s.sets.map((x) => setToRow(x, uid))));
    const setIds = s.sets.map((x) => x.id);
    if (setIds.length > 0) {
      await check('sets delete', sb.from('goal_sets').delete().eq('user_id', uid).not('id', 'in', `(${setIds.map(quote).join(',')})`));
    } else {
      await check('sets delete-all', sb.from('goal_sets').delete().eq('user_id', uid));
    }

    // profile (single row per user, upsert keyed on user_id)
    await check('profile upsert', sb.from('profiles').upsert(profileToRow(s.profile, uid, s.activeProjectId, s.onboarded, s.questDate, s.claimedQuests)));

    setStatus('idle');
  } catch (e) {
    console.warn('[sync] push failed', e);
    setStatus('error');
  }
}

// PostgREST `not in` filter expects quoted-string list for text columns.
function quote(s: string): string {
  return `"${s.replace(/"/g, '""')}"`;
}

function schedulePush() {
  if (pulling || !currentUserId) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    void pushAll();
  }, 600);
}

// --- Pull (cloud → local) --------------------------------------------------

async function pullAll(uid: string): Promise<{ hasCloudData: boolean }> {
  const sb = supabase();
  if (!sb) return { hasCloudData: false };
  setStatus('pulling');
  try {
    pulling = true;
    const [projectsRes, goalsRes, notesRes, setsRes, profileRes] = await Promise.all([
      sb.from('projects').select('*').eq('user_id', uid),
      sb.from('goals').select('*').eq('user_id', uid),
      sb.from('notes').select('*').eq('user_id', uid),
      sb.from('goal_sets').select('*').eq('user_id', uid),
      sb.from('profiles').select('*').eq('user_id', uid).maybeSingle(),
    ]);

    const projects = (projectsRes.data ?? []).map(projectFromRow);
    const goals = (goalsRes.data ?? []).map(goalFromRow);
    const notes = (notesRes.data ?? []).map(noteFromRow);
    const sets = (setsRes.data ?? []).map(setFromRow);
    const hasCloudData = projects.length + goals.length + notes.length + sets.length > 0 || !!profileRes.data;

    if (hasCloudData) {
      const p = profileRes.data;
      // Per-table preserve-on-empty: if cloud has 0 rows for a table but local
      // has rows, keep the local rows so a partial cloud (e.g. earlier upsert
      // failed for one table due to a missing column) doesn't wipe them out.
      // The always-push that runs after pullAll will then upload the preserved
      // local rows to fill the cloud gap.
      useStore.setState((s) => {
        const mergedProjects = projects.length > 0 ? projects : s.projects;
        const activeId = p?.active_project_id ?? mergedProjects[0]?.id ?? s.activeProjectId;
        return {
          projects: mergedProjects,
          goals: goals.length > 0 ? goals : s.goals,
          notes: notes.length > 0 ? notes : s.notes,
          sets: sets.length > 0 ? sets : s.sets,
          activeProjectId: activeId,
          vision: mergedProjects.find((x) => x.id === activeId)?.vision ?? s.vision,
          profile: p
            ? {
                name: p.name ?? '',
                xp: p.xp ?? 0,
                streakDays: p.streak_days ?? 0,
                bestStreak: p.best_streak ?? 0,
                lastActiveDate: p.last_active_date ?? undefined,
                freezeTokens: p.freeze_tokens ?? 0,
                stats: p.stats ?? { daily: 0, weekly: 0, monthly: 0, yearly: 0, missed: 0 },
              }
            : s.profile,
          onboarded: p?.onboarded ?? s.onboarded,
          questDate: p?.quest_date ?? s.questDate,
          claimedQuests: Array.isArray(p?.claimed_quests) ? p.claimed_quests : s.claimedQuests,
        };
      });
    }
    setStatus('idle');
    return { hasCloudData };
  } catch (e) {
    console.warn('[sync] pull failed', e);
    setStatus('error');
    return { hasCloudData: false };
  } finally {
    pulling = false;
  }
}

// --- Realtime --------------------------------------------------------------

function startRealtime(uid: string) {
  stopRealtime();
  const sb = supabase();
  if (!sb) return;
  for (const table of SYNCED_TABLES) {
    const ch = sb
      .channel(`sync:${table}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `user_id=eq.${uid}` },
        () => {
          // Cheap reaction: re-pull everything. Small data, fine.
          void pullAll(uid);
        },
      )
      .subscribe();
    realtimeChannels.push(ch);
  }
}

function stopRealtime() {
  const sb = supabase();
  for (const ch of realtimeChannels) {
    try {
      sb?.removeChannel(ch);
    } catch {
      // ignore
    }
  }
  realtimeChannels = [];
}

// --- Store change subscription --------------------------------------------

function startStoreWatcher() {
  if (unsubStore) return;
  let prev = snapshot(useStore.getState());
  unsubStore = useStore.subscribe((state) => {
    const next = snapshot(state);
    if (next === prev) return;
    prev = next;
    schedulePush();
  });
}

function stopStoreWatcher() {
  if (unsubStore) {
    unsubStore();
    unsubStore = null;
  }
}

// Compact stringification of synced state — used as a cheap diff signal.
function snapshot(s: ReturnType<typeof useStore.getState>): string {
  return JSON.stringify({
    p: s.projects,
    g: s.goals,
    n: s.notes,
    se: s.sets,
    pr: s.profile,
    a: s.activeProjectId,
    o: s.onboarded,
    qd: s.questDate,
    cq: s.claimedQuests,
  });
}

// --- Public lifecycle ------------------------------------------------------

// Call once on sign-in. Pulls cloud → local (preserving any local table the
// cloud is empty for), then pushes back so partial-cloud gaps get filled.
// This handles both brand-new accounts AND accounts where an earlier upsert
// failed (e.g. a missing column) and left one table empty in the cloud.
// Starts realtime + change watcher.
export async function startSync(userId: string): Promise<void> {
  if (currentUserId === userId) return;
  currentUserId = userId;

  await pullAll(userId);
  await pushAll();

  startRealtime(userId);
  startStoreWatcher();
}

// Call on sign-out. Stops realtime + watcher AND wipes local state back to
// the empty initial — so a signed-out browser shows exactly what a fresh
// visitor would see (no leftover goals/notes from the previous account).
export function stopSync(): void {
  currentUserId = null;
  // Unsubscribe FIRST so the resetAll() below doesn't push DELETE to cloud.
  stopStoreWatcher();
  stopRealtime();
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  useStore.getState().resetAll();
  setStatus('idle');
}

// Hook into Supabase auth state — kept idempotent so it's safe to call repeatedly.
export function attachAuthListener(): void {
  if (listenerStarted) return;
  const sb = supabase();
  if (!sb) return;
  listenerStarted = true;
  sb.auth.onAuthStateChange((_event, session) => {
    if (session?.user?.id) {
      void startSync(session.user.id);
    } else {
      stopSync();
    }
  });
  // If the user was already signed in when the page loaded, kick off sync now.
  sb.auth.getUser().then(({ data }) => {
    if (data.user?.id) void startSync(data.user.id);
  });
}
