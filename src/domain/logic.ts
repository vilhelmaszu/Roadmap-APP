import {
  Achievement,
  AchievementCategory,
  Creature,
  Goal,
  GoalSet,
  HabitStat,
  Priority,
  Profile,
  Recurrence,
  Timeframe,
  Vision,
} from './types';

// Display helpers for the (now optionally-indefinite) vision target year.
export function visionYearLabel(vision: Pick<Vision, 'targetYear' | 'indefinite'>): string {
  return vision.indefinite ? 'Ongoing' : String(vision.targetYear);
}

export function visionYearsLeft(vision: Pick<Vision, 'targetYear' | 'indefinite'>): number | null {
  if (vision.indefinite) return null;
  return Math.max(0, vision.targetYear - new Date().getFullYear());
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function todayKey(d = new Date()): string {
  const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return tz.toISOString().slice(0, 10);
}

// --- XP / leveling ----------------------------------------------------------
export const TIMEFRAME_XP: Record<Timeframe, number> = {
  daily: 15,
  weekly: 30,
  monthly: 60,
  yearly: 150,
  none: 20, // generic "did something" reward for an untimed goal
};
export const POINT_XP = 5;

// --- Timeframe colors (canonical, used everywhere) --------------------------
// yearly = yellow, monthly = red, weekly = blue, daily = green, none = gray.
export const TIMEFRAME_COLOR: Record<Timeframe, string> = {
  daily: '#34D399',
  weekly: '#3B82F6',
  monthly: '#EF4444',
  yearly: '#FBBF24',
  // 'none' = indefinite / ongoing — bright purple so it stands out instead
  // of fading into the chrome.
  none: '#A855F7',
};
export function timeframeColor(tf: Timeframe): string {
  return TIMEFRAME_COLOR[tf];
}

export function xpForLevel(level: number): number {
  return Math.round(50 * Math.pow(level, 1.6));
}

export function levelFromXp(xp: number): {
  level: number;
  intoLevel: number;
  span: number;
  progress: number;
} {
  let level = 1;
  let acc = 0;
  while (xp >= acc + xpForLevel(level)) {
    acc += xpForLevel(level);
    level += 1;
  }
  const span = xpForLevel(level);
  const intoLevel = xp - acc;
  return { level, intoLevel, span, progress: span === 0 ? 0 : intoLevel / span };
}

// --- Goal completion / progress --------------------------------------------
export function goalProgress(goal: Goal): number {
  if (goal.points.length > 0) {
    return goal.points.filter((p) => p.done).length / goal.points.length;
  }
  return goal.done ? 1 : 0;
}

export function goalComplete(goal: Goal): boolean {
  return goalProgress(goal) >= 1;
}

// --- Priority / estimate / dependencies / recurrence ------------------------
export const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

// Maps a priority to a semantic theme color key (resolved against the theme in UI).
export const PRIORITY_COLOR: Record<Priority, 'danger' | 'warning' | 'textMuted'> = {
  high: 'danger',
  medium: 'warning',
  low: 'textMuted',
};

export function formatEstimate(min?: number): string | null {
  if (!min || min <= 0) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

// A goal is blocked while any of its dependencies is still incomplete.
export function isBlocked(goal: Goal, all: Goal[]): boolean {
  if (!goal.dependsOn || goal.dependsOn.length === 0) return false;
  return goal.dependsOn.some((id) => {
    const dep = all.find((g) => g.id === id);
    return dep ? !goalComplete(dep) : false;
  });
}

export function blockingGoals(goal: Goal, all: Goal[]): Goal[] {
  if (!goal.dependsOn) return [];
  return goal.dependsOn
    .map((id) => all.find((g) => g.id === id))
    .filter((g): g is Goal => !!g && !goalComplete(g));
}

// Next calendar date (YYYY-MM-DD) for a recurring goal, based on its current date.
export function nextOccurrenceDate(from: string | undefined, rec: Recurrence): string | undefined {
  const base = from ? new Date(from + 'T00:00:00') : new Date();
  if (rec === 'daily') base.setDate(base.getDate() + 1);
  else if (rec === 'weekly') base.setDate(base.getDate() + 7);
  else if (rec === 'monthly') base.setMonth(base.getMonth() + 1);
  else return from;
  return todayKey(base);
}

export function sortByOrder<T extends { order?: number; createdAt: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ao = a.order ?? Number.MAX_SAFE_INTEGER;
    const bo = b.order ?? Number.MAX_SAFE_INTEGER;
    if (ao !== bo) return ao - bo;
    return a.createdAt - b.createdAt;
  });
}

export function subGoalsOf(all: Goal[], parentId: string): Goal[] {
  return sortByOrder(all.filter((g) => g.parentId === parentId && !g.archived));
}

// --- Habits (lineage of recurring occurrences) ------------------------------
// A completed occurrence extends the streak; a frozen one preserves it without
// extending; a settled (archived) miss breaks it; the pending current one is ignored.
export function computeHabit(all: Goal[], habitId: string): HabitStat | null {
  const instances = all.filter((g) => g.habitId === habitId);
  if (instances.length === 0) return null;
  const sorted = [...instances].sort((a, b) => {
    const ad = a.date ?? '';
    const bd = b.date ?? '';
    if (ad !== bd) return ad < bd ? -1 : 1;
    return a.createdAt - b.createdAt;
  });
  const ref = sorted[sorted.length - 1];

  const settled = sorted.filter((g) => g.archived);
  const completed = settled.filter((g) => goalComplete(g)).length;
  const total = settled.length;

  let best = 0;
  let run = 0;
  for (const g of sorted) {
    if (goalComplete(g)) {
      run += 1;
      best = Math.max(best, run);
    } else if (g.frozen) {
      // preserve the run
    } else if (g.archived) {
      run = 0;
    }
  }

  let current = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    const g = sorted[i];
    if (goalComplete(g)) current += 1;
    else if (g.frozen) continue;
    else if (g.archived) break;
  }

  return {
    habitId,
    title: ref.title,
    color: ref.color,
    recurrence: ref.recurrence ?? 'daily',
    current,
    best,
    total,
    completed,
    consistency: total ? completed / total : 0,
  };
}

export function habitStats(all: Goal[]): HabitStat[] {
  const ids = Array.from(new Set(all.filter((g) => g.habitId).map((g) => g.habitId!)));
  return ids
    .map((id) => computeHabit(all, id))
    .filter((h): h is HabitStat => !!h)
    .sort((a, b) => b.current - a.current);
}

// --- Insights / analytics ---------------------------------------------------
const DAY_MS = 86400000;
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function completionsByDay(goals: Goal[], days: number): { key: string; count: number }[] {
  const map = new Map<string, number>();
  for (const g of goals) {
    if (g.doneAt) {
      const k = todayKey(new Date(g.doneAt));
      map.set(k, (map.get(k) ?? 0) + 1);
    }
  }
  const out: { key: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const k = todayKey(new Date(Date.now() - i * DAY_MS));
    out.push({ key: k, count: map.get(k) ?? 0 });
  }
  return out;
}

export function completionsByWeekday(goals: Goal[]): number[] {
  const counts = [0, 0, 0, 0, 0, 0, 0]; // Monday … Sunday
  for (const g of goals) {
    if (g.doneAt) {
      const idx = (new Date(g.doneAt).getDay() + 6) % 7;
      counts[idx] += 1;
    }
  }
  return counts;
}

export function weeklyTrend(goals: Goal[], weeks: number): { label: string; count: number }[] {
  const out: { label: string; count: number }[] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const end = Date.now() - w * 7 * DAY_MS;
    const start = end - 7 * DAY_MS;
    const count = goals.filter((g) => g.doneAt && g.doneAt > start && g.doneAt <= end).length;
    out.push({ label: w === 0 ? 'Now' : `${w}w`, count });
  }
  return out;
}

export function completionsBySet(
  goals: Goal[],
  sets: GoalSet[],
): { name: string; color: string; count: number }[] {
  const map = new Map<string, number>();
  for (const g of goals) {
    if (g.doneAt) {
      const key = g.setId ?? 'none';
      map.set(key, (map.get(key) ?? 0) + 1);
    }
  }
  const rows = sets.map((s) => ({ name: s.name, color: s.color, count: map.get(s.id) ?? 0 }));
  const none = map.get('none') ?? 0;
  if (none) rows.push({ name: 'Unsorted', color: '#7C8598', count: none });
  return rows.filter((r) => r.count > 0).sort((a, b) => b.count - a.count);
}

export function weeklyReview(goals: Goal[]): { thisWeek: number; lastWeek: number; delta: number } {
  const now = Date.now();
  const week = 7 * DAY_MS;
  const thisWeek = goals.filter((g) => g.doneAt && g.doneAt > now - week).length;
  const lastWeek = goals.filter((g) => g.doneAt && g.doneAt > now - 2 * week && g.doneAt <= now - week).length;
  return { thisWeek, lastWeek, delta: thisWeek - lastWeek };
}

export function buildInsights(
  goals: Goal[],
  sets: GoalSet[],
  profile: Profile,
): { icon: string; text: string }[] {
  const out: { icon: string; text: string }[] = [];

  const wd = completionsByWeekday(goals);
  const maxWd = Math.max(...wd);
  if (maxWd > 0) {
    out.push({ icon: 'calendar', text: `${WEEKDAYS[wd.indexOf(maxWd)]} is your most productive day (${maxWd} completions).` });
  }

  const bySet = completionsBySet(goals, sets);
  if (bySet.length) {
    out.push({ icon: 'albums', text: `${bySet[0].name} is your top focus with ${bySet[0].count} completions.` });
  }

  const rev = weeklyReview(goals);
  if (rev.thisWeek || rev.lastWeek) {
    if (rev.delta > 0) out.push({ icon: 'trending-up', text: `Up ${rev.delta} vs last week — momentum is building.` });
    else if (rev.delta < 0) out.push({ icon: 'trending-down', text: `Down ${Math.abs(rev.delta)} from last week. One win today turns it around.` });
    else out.push({ icon: 'remove-outline', text: `Holding steady at ${rev.thisWeek} completions this week.` });
  }

  const habits = habitStats(goals);
  if (habits.length && habits[0].current > 0) {
    out.push({ icon: 'flame', text: `"${habits[0].title}" is on a ${habits[0].current}-day streak — keep it alive.` });
  }

  out.push({
    icon: 'checkmark-done',
    text: `${Math.round(completionRate(profile) * 100)}% completion rate across ${totalCompleted(profile)} finished goals.`,
  });

  return out;
}

// --- Ranks (title earned from level) ---------------------------------------
export const RANKS: { name: string; minLevel: number }[] = [
  { name: 'Novice', minLevel: 1 },
  { name: 'Apprentice', minLevel: 3 },
  { name: 'Adept', minLevel: 5 },
  { name: 'Strategist', minLevel: 8 },
  { name: 'Expert', minLevel: 12 },
  { name: 'Master', minLevel: 18 },
  { name: 'Grandmaster', minLevel: 30 },
  { name: 'Visionary', minLevel: 45 },
  { name: 'Legend', minLevel: 60 },
];

export function rankForLevel(level: number): { name: string; next?: { name: string; level: number } } {
  let current = RANKS[0];
  let next: { name: string; level: number } | undefined;
  for (let i = 0; i < RANKS.length; i++) {
    if (level >= RANKS[i].minLevel) current = RANKS[i];
    else {
      next = { name: RANKS[i].name, level: RANKS[i].minLevel };
      break;
    }
  }
  return { name: current.name, next };
}

// --- Daily quests -----------------------------------------------------------
export type QuestDef = {
  id: string;
  label: string;
  description: string;
  icon: string;
  target: number;
  xp: number;
  progress: (goals: Goal[], profile: Profile, todayK: string) => number;
};

const doneToday = (goals: Goal[], t: string) =>
  goals.filter((g) => g.doneAt && todayKey(new Date(g.doneAt)) === t);

const QUEST_POOL: QuestDef[] = [
  {
    id: 'triple',
    label: 'Triple play',
    description: 'Complete 3 goals today',
    icon: 'checkmark-done',
    target: 3,
    xp: 30,
    progress: (g, _p, t) => doneToday(g, t).length,
  },
  {
    id: 'bigday',
    label: 'Big day',
    description: 'Complete 5 goals today',
    icon: 'rocket',
    target: 5,
    xp: 55,
    progress: (g, _p, t) => doneToday(g, t).length,
  },
  {
    id: 'priority',
    label: 'Tackle what matters',
    description: 'Complete a high-priority goal',
    icon: 'flag',
    target: 1,
    xp: 25,
    progress: (g, _p, t) => doneToday(g, t).filter((x) => x.priority === 'high').length,
  },
  {
    id: 'variety',
    label: 'Well rounded',
    description: 'Complete goals in 2 different sets',
    icon: 'albums',
    target: 2,
    xp: 25,
    progress: (g, _p, t) => new Set(doneToday(g, t).filter((x) => x.setId).map((x) => x.setId)).size,
  },
  {
    id: 'streak',
    label: 'Stay consistent',
    description: 'Keep your streak alive today',
    icon: 'flame',
    target: 1,
    xp: 20,
    progress: (_g, p, t) => (p.lastActiveDate === t ? 1 : 0),
  },
];

// Deterministically pick 3 quests for a given day so they're stable until tomorrow.
export function dailyQuests(dateKey: string): QuestDef[] {
  let h = 0;
  for (const c of dateKey) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const pool = [...QUEST_POOL];
  const picked: QuestDef[] = [];
  for (let i = 0; i < 3 && pool.length; i++) {
    const idx = h % pool.length;
    picked.push(pool.splice(idx, 1)[0]);
    h = Math.floor(h / 7) + 13;
  }
  return picked;
}

export function visionProgress(vision: Vision): number {
  if (vision.points.length === 0) return 0;
  return vision.points.filter((p) => p.done).length / vision.points.length;
}

// --- Roadmap rollup ---------------------------------------------------------
const WEIGHT: Record<Timeframe, number> = { daily: 1, weekly: 2, monthly: 4, yearly: 8, none: 1 };

export function roadmapProgress(goals: Goal[]): number {
  const active = goals.filter((g) => !g.archived);
  if (active.length === 0) return 0;
  let num = 0;
  let den = 0;
  for (const g of active) {
    num += goalProgress(g) * WEIGHT[g.timeframe];
    den += WEIGHT[g.timeframe];
  }
  return den === 0 ? 0 : num / den;
}

export function completionForTimeframe(goals: Goal[], tf: Timeframe): number {
  const group = goals.filter((g) => g.timeframe === tf && !g.archived);
  if (group.length === 0) return 0;
  return group.filter((g) => goalComplete(g)).length / group.length;
}

// --- Streak -----------------------------------------------------------------
export function updateStreak(profile: Profile): Profile {
  const today = todayKey();
  if (profile.lastActiveDate === today) return profile;
  const yesterday = todayKey(new Date(Date.now() - 86400000));
  const streakDays = profile.lastActiveDate === yesterday ? profile.streakDays + 1 : 1;
  return {
    ...profile,
    streakDays,
    bestStreak: Math.max(profile.bestStreak, streakDays),
    lastActiveDate: today,
  };
}

// --- Achievements (tiered) --------------------------------------------------
export const ACHIEVEMENT_TIERS: Record<
  Exclude<AchievementCategory, never>,
  { thresholds: number[]; icon: string; noun: string }
> = {
  daily: { thresholds: [50, 100, 200, 500, 1000, 2000], icon: 'sunny', noun: 'daily goals' },
  weekly: { thresholds: [20, 50, 100, 250, 500], icon: 'calendar', noun: 'weekly goals' },
  monthly: { thresholds: [10, 25, 50, 100, 250], icon: 'calendar-number', noun: 'monthly goals' },
  yearly: { thresholds: [3, 5, 10, 25, 50], icon: 'ribbon', noun: 'yearly goals' },
  streak: { thresholds: [3, 7, 30, 100, 365], icon: 'flame', noun: 'day streak' },
  level: { thresholds: [5, 10, 25, 50], icon: 'star', noun: 'level' },
};

// --- Growth metrics ---------------------------------------------------------
export function totalCompleted(profile: Profile): number {
  const s = profile.stats;
  return s.daily + s.weekly + s.monthly + s.yearly;
}

// completed / (completed + missed) — how reliably goals get finished.
export function completionRate(profile: Profile): number {
  const done = totalCompleted(profile);
  const attempts = done + profile.stats.missed;
  return attempts === 0 ? 0 : done / attempts;
}

export function planPointsTotals(goals: Goal[], vision: Vision): { done: number; total: number } {
  let done = 0;
  let total = 0;
  for (const g of goals) {
    if (g.archived) continue;
    total += g.points.length;
    done += g.points.filter((p) => p.done).length;
  }
  total += vision.points.length;
  done += vision.points.filter((p) => p.done).length;
  return { done, total };
}

// --- Creatures (alien collectibles unlocked by achievements) ----------------
// Ordered easiest → wildest. tier drives the rendered creature's complexity.
export const CREATURE_DEFS: { achievementId: string; name: string; tier: number }[] = [
  { achievementId: 'daily-50', name: 'Nibbo', tier: 1 },
  { achievementId: 'weekly-20', name: 'Quill', tier: 2 },
  { achievementId: 'monthly-10', name: 'Vex', tier: 2 },
  { achievementId: 'level-10', name: 'Zorp', tier: 3 },
  { achievementId: 'daily-200', name: 'Glimmer', tier: 3 },
  { achievementId: 'streak-30', name: 'Murv', tier: 4 },
  { achievementId: 'yearly-5', name: 'Throx', tier: 4 },
  { achievementId: 'monthly-50', name: 'Kaalu', tier: 5 },
  { achievementId: 'weekly-100', name: 'Phloon', tier: 5 },
  { achievementId: 'daily-1000', name: 'Xenth', tier: 6 },
  { achievementId: 'level-25', name: 'Obscura', tier: 6 },
  { achievementId: 'yearly-25', name: 'Drelvar', tier: 7 },
  { achievementId: 'monthly-250', name: 'Sovereign', tier: 7 },
  { achievementId: 'streak-365', name: 'Aeon Wyrm', tier: 8 },
  { achievementId: 'daily-2000', name: 'Voidspawn', tier: 8 },
  { achievementId: 'yearly-50', name: 'Cosmarch', tier: 8 },
];

export function buildCreatures(profile: Profile): Creature[] {
  const earned = new Set(buildAchievements(profile).filter((a) => a.earned).map((a) => a.id));
  return CREATURE_DEFS.map((c, i) => ({
    id: `creature-${i}`,
    achievementId: c.achievementId,
    name: c.name,
    tier: c.tier,
    earned: earned.has(c.achievementId),
  }));
}

export function creatureForAchievement(profile: Profile, achievementId: string): Creature | undefined {
  return buildCreatures(profile).find((c) => c.achievementId === achievementId);
}

export function buildAchievements(profile: Profile): Achievement[] {
  const level = levelFromXp(profile.xp).level;
  const currentFor: Record<AchievementCategory, number> = {
    daily: profile.stats.daily,
    weekly: profile.stats.weekly,
    monthly: profile.stats.monthly,
    yearly: profile.stats.yearly,
    streak: profile.bestStreak,
    level,
  };

  const out: Achievement[] = [];
  (Object.keys(ACHIEVEMENT_TIERS) as AchievementCategory[]).forEach((cat) => {
    const { thresholds, icon, noun } = ACHIEVEMENT_TIERS[cat];
    const current = currentFor[cat];
    thresholds.forEach((threshold) => {
      out.push({
        id: `${cat}-${threshold}`,
        category: cat,
        label:
          cat === 'level'
            ? `Reach level ${threshold}`
            : cat === 'streak'
              ? `${threshold}-day streak`
              : `Complete ${threshold} ${noun}`,
        description:
          cat === 'level'
            ? `Climb to level ${threshold}`
            : cat === 'streak'
              ? `Stay consistent for ${threshold} days`
              : `${current}/${threshold} ${noun}`,
        icon,
        threshold,
        current,
        earned: current >= threshold,
      });
    });
  });
  return out;
}
