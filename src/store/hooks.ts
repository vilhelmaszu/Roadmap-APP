import { useMemo } from 'react';

import { useStore } from './store';

// Currently-selected project (always exists — there's at least one).
// Selecting by id + projects array keeps the reference stable across re-renders.
export function useActiveProject() {
  const projects = useStore((s) => s.projects);
  const activeProjectId = useStore((s) => s.activeProjectId);
  return useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? projects[0],
    [projects, activeProjectId],
  );
}

export function useActiveProjectId() {
  return useStore((s) => s.activeProjectId);
}

// Goals filtered to the active project. Memoized so the filtered array reference
// stays stable across renders (Zustand sees new ref → infinite loop otherwise).
// Side goals (g.side === true) are global throwaway tasks rendered separately,
// so they're excluded from this list.
export function useActiveGoals() {
  const goals = useStore((s) => s.goals);
  const activeProjectId = useStore((s) => s.activeProjectId);
  return useMemo(
    () => goals.filter((g) => !g.side && (!g.projectId || g.projectId === activeProjectId)),
    [goals, activeProjectId],
  );
}

// Side goals — global one-off / recurring tasks (post today, workout, etc).
// Always visible regardless of active project. Excludes archived.
export function useSideGoals() {
  const goals = useStore((s) => s.goals);
  return useMemo(() => goals.filter((g) => g.side && !g.archived), [goals]);
}

// Notes filtered to the active project.
export function useActiveNotes() {
  const notes = useStore((s) => s.notes);
  const activeProjectId = useStore((s) => s.activeProjectId);
  return useMemo(
    () => notes.filter((n) => !n.projectId || n.projectId === activeProjectId),
    [notes, activeProjectId],
  );
}
