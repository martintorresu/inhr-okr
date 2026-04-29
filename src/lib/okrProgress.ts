import type { KeyResult, Objective } from "@/data/types";

/**
 * Compute the live progress (0-100) of a Key Result based on current/initial/target,
 * respecting direction (higher_is_better | lower_is_better).
 * Falls back to the cached kr.progress when the inputs are not informative.
 */
export const computeKRProgress = (kr: KeyResult): number => {
  const init = Number(kr.initialValue ?? 0);
  const target = Number(kr.target ?? 0);
  const current = Number(kr.current ?? 0);

  if (target === init) {
    // No movement window defined — fall back to stored progress if any.
    return Math.max(0, Math.min(100, Math.round(Number(kr.progress ?? 0))));
  }

  const raw =
    kr.direction === "lower_is_better"
      ? ((init - current) / (init - target)) * 100
      : ((current - init) / (target - init)) * 100;

  return Math.max(0, Math.min(100, Math.round(raw)));
};

/**
 * Compute the live progress of an Objective as the (weighted) average of its KRs.
 * Uses kr.weight when present (and the weights sum to > 0), otherwise simple average.
 */
export const computeObjectiveProgress = (obj: Objective): number => {
  const krs = obj.keyResults ?? [];
  if (!krs.length) return 0;

  const totalWeight = krs.reduce((s, k) => s + (Number(k.weight) || 0), 0);

  if (totalWeight > 0) {
    const sum = krs.reduce(
      (s, k) => s + computeKRProgress(k) * (Number(k.weight) || 0),
      0
    );
    return Math.round(sum / totalWeight);
  }

  const sum = krs.reduce((s, k) => s + computeKRProgress(k), 0);
  return Math.round(sum / krs.length);
};

/**
 * Returns a copy of the objectives array with progress fields recomputed live.
 */
export const withLiveProgress = (objectives: Objective[]): Objective[] =>
  objectives.map((o) => ({
    ...o,
    keyResults: o.keyResults.map((k) => ({ ...k, progress: computeKRProgress(k) })),
    progress: computeObjectiveProgress(o),
  }));

/**
 * Override objective progress with the latest check-in's reported progress
 * when present. Falls back to live KR-based calculation otherwise.
 *
 * `checkIns` is expected to be ordered by date desc (as returned by loaders).
 */
export const withCheckInProgress = <T extends { id: string; progress: number }>(
  objectives: T[],
  checkIns: Array<{ objectiveId: string; progressManual?: number; progressAuto?: number }>
): T[] => {
  const latest = new Map<string, number>();
  for (const ci of checkIns) {
    if (latest.has(ci.objectiveId)) continue;
    const value =
      typeof ci.progressManual === "number" && ci.progressManual > 0
        ? ci.progressManual
        : ci.progressAuto ?? 0;
    latest.set(ci.objectiveId, value);
  }
  return objectives.map((o) => {
    const v = latest.get(o.id);
    return v !== undefined ? { ...o, progress: v } : o;
  });
};
