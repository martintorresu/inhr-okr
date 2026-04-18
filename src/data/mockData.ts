// Tenant-aware mockData facade.
// Re-exports the active tenant's dataset so existing component imports keep working.
import { activeTenant } from "@/data/tenant";

export type { User, KeyResult, Objective, Initiative, Task, CheckIn, Alert } from "@/data/types";

export const areas = activeTenant.areas;
export const subAreas = activeTenant.subAreas;
export const users = activeTenant.users;
export const objectives = activeTenant.objectives;
export const checkIns = activeTenant.checkIns;
export const alerts = activeTenant.alerts;

export const areaProgress = areas.map((area) => {
  const areaObjs = objectives.filter((o) => o.area === area);
  const avg = areaObjs.length > 0 ? Math.round(areaObjs.reduce((s, o) => s + o.progress, 0) / areaObjs.length) : 0;
  return { area, progress: avg, objectives: areaObjs.length };
});

export const globalProgress = objectives.length
  ? Math.round(objectives.reduce((s, o) => s + o.progress, 0) / objectives.length)
  : 0;

export const roleLabels: Record<string, string> = {
  admin: "Administrador",
  okr_leader: "Líder OKR",
  initiative_leader: "Líder de Iniciativa",
  viewer: "Visor",
};
