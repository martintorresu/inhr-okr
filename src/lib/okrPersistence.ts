import { supabase } from "@/integrations/supabase/client";
import type { Objective } from "@/data/mockData";

const table = () => (supabase as any).from("okr_objectives");

const normalizeObjective = (row: any): Objective => ({
  id: row.id,
  title: row.title ?? "",
  description: row.description ?? "",
  area: row.area ?? "",
  owner: row.owner ?? "",
  level: row.level ?? "area",
  parentId: row.parent_id ?? undefined,
  progress: row.progress ?? 0,
  status: row.status ?? "draft",
  contributors: row.contributors ?? [],
  keyResults: Array.isArray(row.key_results) ? row.key_results : [],
  quarter: row.quarter ?? "Q2 2026",
});

const toRow = (tenantId: string, objective: Objective) => ({
  id: objective.id,
  tenant_id: tenantId,
  title: objective.title,
  description: objective.description ?? "",
  area: objective.area,
  owner: objective.owner,
  level: objective.level,
  parent_id: objective.parentId ?? null,
  progress: objective.progress ?? 0,
  status: objective.status,
  contributors: objective.contributors ?? [],
  key_results: objective.keyResults ?? [],
  quarter: objective.quarter,
});

export const loadTenantObjectives = async (tenantId: string): Promise<Objective[]> => {
  const { data, error } = await table()
    .select("*")
    .eq("tenant_id", tenantId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(normalizeObjective);
};

export const replaceTenantObjectives = async (tenantId: string, objectives: Objective[]) => {
  const current = await loadTenantObjectives(tenantId);
  const nextIds = new Set(objectives.map((objective) => objective.id));
  const removed = current.filter((objective) => !nextIds.has(objective.id));

  if (objectives.length) {
    const { error } = await table().upsert(
      objectives.map((objective) => toRow(tenantId, objective)),
      { onConflict: "id" }
    );
    if (error) throw error;
  }

  await Promise.all(
    removed.map(async (objective) => {
      const { error } = await table().delete().eq("tenant_id", tenantId).eq("id", objective.id);
      if (error) throw error;
    })
  );
};
