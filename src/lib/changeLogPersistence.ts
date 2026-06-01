import { supabase } from "@/integrations/supabase/client";

const table = () => (supabase as any).from("okr_change_log");

export interface ChangeLogEntry {
  tenantId: string;
  action: string;
  entityType: string;
  entityId: string;
  entityTitle?: string;
  details?: Record<string, unknown>;
  actorUserId?: string | null;
  actorName?: string;
}

export const logChange = async (entry: ChangeLogEntry) => {
  const { error } = await table().insert({
    tenant_id: entry.tenantId,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId,
    entity_title: entry.entityTitle ?? "",
    details: entry.details ?? {},
    actor_user_id: entry.actorUserId ?? null,
    actor_name: entry.actorName ?? "",
  });
  // Non-blocking: a failed log entry should not break the main operation.
  if (error) console.error("No se pudo registrar el cambio:", error.message);
};
