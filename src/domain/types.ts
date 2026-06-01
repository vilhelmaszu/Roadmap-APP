// 'none' is for goals without a fixed cadence (one-off, no timeframe).
export type Timeframe = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'none';

export type Priority = 'low' | 'medium' | 'high';

export type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly';

export type PlanPoint = {
  id: string;
  text: string;
  done: boolean;
};

export type Reminder = {
  id: string;
  hour: number; // 0-23
  minute: number; // 0-59
  enabled: boolean;
  notificationId?: string; // OS-scheduled id, used to cancel/reschedule
};

export type Goal = {
  id: string;
  title: string;
  notes?: string; // free-form description the user can edit
  timeframe: Timeframe;
  category: string;
  projectId?: string; // workspace this goal belongs to
  setId?: string; // optional grouping into a user-created set
  parentId?: string; // set on sub-goals — points at the parent goal
  color?: string;
  date?: string; // YYYY-MM-DD (calendar)
  priority?: Priority;
  estimateMin?: number; // estimated effort in minutes
  dependsOn?: string[]; // goal ids that must complete before this can start
  recurrence?: Recurrence;
  reminders?: Reminder[];
  order?: number; // manual sort order within its list
  habitId?: string; // links recurring occurrences into one habit lineage
  frozen?: boolean; // a missed occurrence shielded by a streak-freeze token
  done: boolean;
  doneAt?: number;
  missedAt?: number; // set when the user marks a goal as missed
  points: PlanPoint[];
  createdAt: number;
  archived?: boolean;
  // Side goals are unattached to any project — global throwaway tasks like
  // "post today" or "workout Friday". They have no projectId and render in
  // their own compact section on Home + Roadmap, not in the regular goal lists.
  side?: boolean;
};

// A free-form roadmap note the user can create and write into.
export type Note = {
  id: string;
  title: string;
  body: string;
  projectId?: string; // workspace this note belongs to
  createdAt: number;
  updatedAt: number;
};

// A user-created collection of goals (e.g. "Marketing", "Fitness").
export type GoalSet = {
  id: string;
  name: string;
  color: string;
  icon: string; // Ionicons name
  createdAt: number;
};

export type Vision = {
  id: string;
  title: string;
  why: string;
  targetYear: number;
  // When true, the roadmap has no fixed end year — displays as "Ongoing".
  indefinite?: boolean;
  points: PlanPoint[];
};

// A workspace. Each project owns its own vision and scopes its own goals/notes.
// XP, level, achievements, streaks, quests, and creatures stay global across
// projects so progression accumulates across whatever you're working on.
export type Project = {
  id: string;
  name: string;
  color: string;
  icon: string; // Ionicons name
  vision: Vision;
  createdAt: number;
};

export type Stats = {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
  missed: number; // lifetime count of goals marked missed
};

export type Profile = {
  name: string;
  xp: number;
  streakDays: number;
  bestStreak: number;
  lastActiveDate?: string; // YYYY-MM-DD
  freezeTokens: number; // streak-freeze tokens; spend one to shield a missed habit day
  stats: Stats; // lifetime completion counters (monotonic)
};

export type AchievementCategory = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'streak' | 'level';

export type Achievement = {
  id: string;
  category: AchievementCategory;
  label: string;
  description: string;
  icon: string; // Ionicons name
  threshold: number;
  current: number;
  earned: boolean;
};

// Aggregated stats for one habit (a lineage of recurring goal occurrences).
export type HabitStat = {
  habitId: string;
  title: string;
  color?: string;
  recurrence: Recurrence;
  current: number; // current consecutive completed streak
  best: number; // longest streak ever
  consistency: number; // completed / settled occurrences (0..1)
  total: number; // settled occurrences (excludes the pending current one)
  completed: number;
};

// A collectible "alien animal head" unlocked by a specific achievement.
// tier drives how wild/elaborate the rendered creature looks (1 = tame, 8 = wildest).
export type Creature = {
  id: string;
  achievementId: string; // achievement that unlocks it
  name: string;
  tier: number; // 1..8
  earned: boolean;
};
