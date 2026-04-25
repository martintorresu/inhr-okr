import { supabase } from "@/integrations/supabase/client";
import type { Initiative, Objective, Task } from "@/data/types";

export interface InitiativeWithContext extends Initiative {
  objectiveId?: string;
  objectiveTitle?: string;
  krTitle?: string;
}

const table = () => (supabase as any).from("okr_initiatives");

const normalize = (row: any): InitiativeWithContext => ({
  id: row.id,
  title: row.title ?? "",
  responsible: row.responsible ?? "",
  krId: row.kr_id ?? "",
  objectiveId: row.objective_id ?? undefined,
  startDate: row.start_date ?? "",
  endDate: row.end_date ?? "",
  progress: row.progress ?? 0,
  status: row.status ?? "in_progress",
  tasks: Array.isArray(row.tasks) ? (row.tasks as Task[]) : [],
});

const toRow = (tenantId: string, ini: InitiativeWithContext) => ({
  id: ini.id,
  tenant_id: tenantId,
  kr_id: ini.krId,
  objective_id: ini.objectiveId ?? null,
  title: ini.title,
  description: "",
  responsible: ini.responsible,
  start_date: ini.startDate || null,
  end_date: ini.endDate || null,
  progress: ini.progress ?? 0,
  status: ini.status,
  tasks: ini.tasks ?? [],
});

export const loadTenantInitiatives = async (tenantId: string): Promise<InitiativeWithContext[]> => {
  const { data, error } = await table()
    .select("*")
    .eq("tenant_id", tenantId)
    .order("end_date", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []).map(normalize);
};

export const upsertInitiative = async (tenantId: string, ini: InitiativeWithContext) => {
  const { error } = await table().upsert(toRow(tenantId, ini), { onConflict: "id" });
  if (error) throw error;
};

export const deleteInitiative = async (tenantId: string, id: string) => {
  const { error } = await table().delete().eq("tenant_id", tenantId).eq("id", id);
  if (error) throw error;
};

// Seeds the table from objectives' embedded initiatives (first run per tenant).
export const seedInitiativesFromObjectives = async (
  tenantId: string,
  objectives: Objective[]
): Promise<InitiativeWithContext[]> => {
  const seeded: InitiativeWithContext[] = [];
  objectives.forEach((obj) => {
    obj.keyResults.forEach((kr) => {
      kr.initiatives.forEach((ini) => {
        seeded.push({ ...ini, objectiveId: obj.id });
      });
    });
  });
  if (!seeded.length) return [];
  const { error } = await table().upsert(
    seeded.map((ini) => toRow(tenantId, ini)),
    { onConflict: "id" }
  );
  if (error) throw error;
  return seeded;
};
