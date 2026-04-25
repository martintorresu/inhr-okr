import { supabase } from "@/integrations/supabase/client";
import type { CheckIn } from "@/data/types";

export type Confidence = "green" | "yellow" | "red";
export type Trend = "up" | "flat" | "down";
export type CheckInStatus = "pending" | "submitted";

export interface BlockerEntry {
  type: "resources" | "dependencies" | "alignment" | "priorities" | "other";
  description: string;
}

export interface CommitmentEntry {
  text: string;
  done?: boolean;
}

export interface InitiativeSnapshot {
  initiativeId: string;
  title: string;
  status: "not_started" | "in_progress" | "blocked" | "completed";
  impact: "low" | "medium" | "high";
}

export interface CheckInRecord {
  id: string;
  objectiveId: string;
  krId?: string | null;
  authorName: string;
  authorUserId?: string | null;
  checkinDate: string;
  comment: string;
  insight: string;
  leaderComment: string;
  progressAuto: number;
  progressManual: number;
  scoreAuto: number;
  scoreManual: number | null;
  confidence: Confidence;
  trend: Trend;
  status: CheckInStatus;
  blockers: BlockerEntry[];
  nextCommitments: CommitmentEntry[];
  initiativeSnapshots: InitiativeSnapshot[];
  createdAt?: string;
  updatedAt?: string;
}

const table = () => (supabase as any).from("okr_checkins");

const toRecord = (row: any): CheckInRecord => ({
  id: row.id,
  objectiveId: row.objective_id,
  krId: row.kr_id ?? null,
  authorName: row.author_name ?? "",
  authorUserId: row.author_user_id ?? null,
  checkinDate: row.checkin_date ?? "",
  comment: row.comment ?? "",
  insight: row.insight ?? "",
  leaderComment: row.leader_comment ?? "",
  progressAuto: row.progress_auto ?? 0,
  progressManual: row.progress_manual ?? 0,
  scoreAuto: Number(row.score_auto ?? 0),
  scoreManual: row.score_manual === null || row.score_manual === undefined ? null : Number(row.score_manual),
  confidence: (row.confidence ?? "green") as Confidence,
  trend: (row.trend ?? "flat") as Trend,
  status: (row.status ?? "submitted") as CheckInStatus,
  blockers: Array.isArray(row.blockers) ? row.blockers : [],
  nextCommitments: Array.isArray(row.next_commitments) ? row.next_commitments : [],
  initiativeSnapshots: Array.isArray(row.initiative_snapshots) ? row.initiative_snapshots : [],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toRow = (tenantId: string, ci: CheckInRecord) => ({
  id: ci.id,
  tenant_id: tenantId,
  objective_id: ci.objectiveId,
  kr_id: ci.krId ?? null,
  author_name: ci.authorName,
  author_user_id: ci.authorUserId ?? null,
  checkin_date: ci.checkinDate,
  comment: ci.comment ?? "",
  insight: ci.insight ?? "",
  leader_comment: ci.leaderComment ?? "",
  progress_auto: Math.round(ci.progressAuto ?? 0),
  progress_manual: Math.round(ci.progressManual ?? 0),
  score_auto: Number((ci.scoreAuto ?? 0).toFixed(2)),
  score_manual: ci.scoreManual === null || ci.scoreManual === undefined ? null : Number(ci.scoreManual.toFixed(2)),
  confidence: ci.confidence ?? "green",
  trend: ci.trend ?? "flat",
  status: ci.status ?? "submitted",
  blockers: ci.blockers ?? [],
  next_commitments: ci.nextCommitments ?? [],
  initiative_snapshots: ci.initiativeSnapshots ?? [],
});

export const loadTenantCheckIns = async (tenantId: string): Promise<CheckInRecord[]> => {
  const { data, error } = await table()
    .select("*")
    .eq("tenant_id", tenantId)
    .order("checkin_date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toRecord);
};

export const upsertCheckIn = async (tenantId: string, ci: CheckInRecord) => {
  const { error } = await table().upsert(toRow(tenantId, ci), { onConflict: "id" });
  if (error) throw error;
};

export const deleteCheckIn = async (tenantId: string, id: string) => {
  const { error } = await table().delete().eq("tenant_id", tenantId).eq("id", id);
  if (error) throw error;
};

// Seed from legacy mock CheckIn[] on first load.
export const seedCheckInsFromMocks = async (
  tenantId: string,
  mocks: CheckIn[]
): Promise<CheckInRecord[]> => {
  if (!mocks.length) return [];
  const records: CheckInRecord[] = mocks.map((m) => ({
    id: m.id,
    objectiveId: m.objectiveId,
    krId: null,
    authorName: m.author,
    authorUserId: null,
    checkinDate: m.date,
    comment: m.comment,
    insight: "",
    leaderComment: "",
    progressAuto: m.progress,
    progressManual: m.progress,
    scoreAuto: Math.min(1, Math.max(0, m.progress / 100)),
    scoreManual: null,
    confidence: m.progress >= 60 ? "green" : m.progress >= 35 ? "yellow" : "red",
    trend: "flat",
    status: "submitted",
    blockers: m.blockers ? [{ type: "other", description: m.blockers }] : [],
    nextCommitments: [],
    initiativeSnapshots: [],
  }));
  const { error } = await table().upsert(records.map((r) => toRow(tenantId, r)), { onConflict: "id" });
  if (error) throw error;
  return records;
};

// ===== Schedules =====

export type Frequency = "weekly" | "biweekly" | "monthly";

export interface CheckInSchedule {
  id: string;
  objectiveId: string;
  frequency: Frequency;
  nextDueDate: string | null;
  lastGeneratedAt: string | null;
}

const schedTable = () => (supabase as any).from("okr_checkin_schedules");

export const loadTenantSchedules = async (tenantId: string): Promise<CheckInSchedule[]> => {
  const { data, error } = await schedTable().select("*").eq("tenant_id", tenantId);
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    objectiveId: r.objective_id,
    frequency: (r.frequency ?? "biweekly") as Frequency,
    nextDueDate: r.next_due_date ?? null,
    lastGeneratedAt: r.last_generated_at ?? null,
  }));
};

export const upsertSchedule = async (tenantId: string, s: CheckInSchedule) => {
  const { error } = await schedTable().upsert(
    {
      id: s.id,
      tenant_id: tenantId,
      objective_id: s.objectiveId,
      frequency: s.frequency,
      next_due_date: s.nextDueDate,
      last_generated_at: s.lastGeneratedAt,
    },
    { onConflict: "id" }
  );
  if (error) throw error;
};
