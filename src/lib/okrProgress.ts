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
