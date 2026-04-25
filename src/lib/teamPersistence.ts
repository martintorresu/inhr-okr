import { supabase } from "@/integrations/supabase/client";
import type { User } from "@/data/types";

export interface TeamMember extends User {
  phone?: string;
}

const table = () => (supabase as any).from("team_members");

const normalize = (row: any): TeamMember => ({
  id: row.id,
  name: row.name ?? "",
  email: row.email ?? "",
  phone: row.phone ?? "",
  role: (row.role ?? "viewer") as User["role"],
  area: row.area ?? "",
});

const toRow = (tenantId: string, m: TeamMember) => ({
  id: m.id,
  tenant_id: tenantId,
  name: m.name,
  email: m.email || null,
  phone: m.phone || null,
  role: m.role,
  area: m.area || "",
});

export const loadTenantTeam = async (tenantId: string): Promise<TeamMember[]> => {
  const { data, error } = await table()
    .select("*")
    .eq("tenant_id", tenantId)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(normalize);
};

export const upsertTeamMember = async (tenantId: string, m: TeamMember) => {
  const { error } = await table().upsert(toRow(tenantId, m), { onConflict: "id" });
  if (error) throw error;
};

export const deleteTeamMember = async (tenantId: string, id: string) => {
  const { error } = await table().delete().eq("tenant_id", tenantId).eq("id", id);
  if (error) throw error;
};

// Seed inicial desde mocks (primer arranque por tenant).
export const seedTeamFromMocks = async (
  tenantId: string,
  mockUsers: User[]
): Promise<TeamMember[]> => {
  if (!mockUsers.length) return [];
  const members: TeamMember[] = mockUsers.map((u) => ({ ...u, phone: "" }));
  const { error } = await table().upsert(
    members.map((m) => toRow(tenantId, m)),
    { onConflict: "id" }
  );
  if (error) throw error;
  return members;
};
