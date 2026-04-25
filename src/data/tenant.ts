// Tenant detection — switches dataset based on hostname.
// Add ?tenant=quimetal to force a tenant (useful in preview).
import * as inhr from "@/data/tenants/inhr";
import * as quimetal from "@/data/tenants/quimetal";
import * as inovahr from "@/data/tenants/inovahr";

type TenantModule = typeof inhr;

const detectTenantId = (): string => {
  if (typeof window === "undefined") return "inhr";
  const host = window.location.hostname;
  const qs = new URLSearchParams(window.location.search).get("tenant");
  if (qs) return qs;
  // Demo tenant (Quimetal dataset) — canonical demo domain.
  if (host.includes("okr-demo")) return "quimetal";
  // okr-inhr.inovahr-app.com is the InovaHR tenant app (not to be confused with the "inhr" demo tenant).
  if (host.includes("okr-inhr.inovahr-app.com")) return "inovahr";
  if (host.includes("okr-inovahr")) return "inovahr";
  return "inhr";
};

const tenantId = detectTenantId();

const tenants: Record<string, TenantModule> = {
  inhr,
  quimetal: quimetal as unknown as TenantModule,
  inovahr: inovahr as unknown as TenantModule,
};

export const activeTenant: TenantModule = tenants[tenantId] ?? inhr;
export const activeTenantId = tenantId;

if (typeof document !== "undefined") {
  document.documentElement.setAttribute("data-tenant", tenantId);
}
