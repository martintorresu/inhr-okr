// Tenant detection — switches dataset based on hostname.
// Add ?tenant=quimetal to force a tenant (useful in preview).
import * as inhr from "@/data/tenants/inhr";
import * as quimetal from "@/data/tenants/quimetal";

type TenantModule = typeof inhr;

const detectTenantId = (): string => {
  if (typeof window === "undefined") return "inhr";
  const host = window.location.hostname;
  const qs = new URLSearchParams(window.location.search).get("tenant");
  if (qs) return qs;
  if (host.includes("okr-quimetal")) return "quimetal";
  return "inhr";
};

const tenantId = detectTenantId();

const tenants: Record<string, TenantModule> = {
  inhr,
  quimetal: quimetal as unknown as TenantModule,
};

export const activeTenant: TenantModule = tenants[tenantId] ?? inhr;
export const activeTenantId = tenantId;
