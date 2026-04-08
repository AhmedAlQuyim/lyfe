import type { Milestone, Task, TaskStreakState } from './mock-data';

/**
 * Recomputes a goal's streak from its milestones.
 *
 * Only milestones with a `dueBy` date participate. For each such milestone,
 * sorted chronologically:
 *   - completed on time (completedAt <= dueBy)  → continues the streak
 *   - overdue and not completed (dueBy < today)  → breaks the streak
 *   - completed late (completedAt > dueBy)        → breaks the streak
 *   - future milestone (dueBy >= today)           → ignored (no opinion yet)
 *
 * Returns { current, longest } where `current` is the streak ending at the
 * most recently processed milestone, and `longest` is the all-time max.
 */
export function computeGoalStreak(
  milestones: Milestone[],
  today: string,
): { current: number; longest: number } {
  const timed = milestones
    .filter((m): m is Milestone & { dueBy: string } => Boolean(m.dueBy))
    .sort((a, b) => a.dueBy.localeCompare(b.dueBy));

  let current = 0;
  let longest = 0;

  for (const m of timed) {
    if (m.dueBy >= today) continue; // future — skip

    const onTime = m.completed && Boolean(m.completedAt) && m.completedAt! <= m.dueBy;
    if (onTime) {
      current++;
      if (current > longest) longest = current;
    } else {
      current = 0; // missed or late — reset
    }
  }

  return { current, longest };
}

/**
 * Updates the task streak given the full task list and the current streak state.
 *
 * Rules:
 *   - No tasks due today  → hold (return unchanged)
 *   - Not all done yet    → hold (return unchanged; once earned today, stays)
 *   - All done today:
 *       - Already counted today             → unchanged
 *       - Last completed date was yesterday → increment
 *       - Anything older (or null)          → reset to 1
 */
export function updateTaskStreak(
  tasks: Task[],
  streak: TaskStreakState,
  today: string,
): TaskStreakState {
  const todayTasks = tasks.filter(t => t.dueDate === today);
  if (todayTasks.length === 0) return streak;
  if (!todayTasks.every(t => t.completed)) return streak;
  if (streak.lastCompletedDate === today) return streak; // already earned

  const yesterday = getPrevDay(today);
  const newCurrent =
    streak.lastCompletedDate === yesterday ? streak.current + 1 : 1;
  const newLongest = Math.max(newCurrent, streak.longest);

  return { current: newCurrent, longest: newLongest, lastCompletedDate: today };
}

function getPrevDay(date: string): string {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().split('T')[0];
}
