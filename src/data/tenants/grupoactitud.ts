// Grupo Actitud tenant — okr-grupoactitud.inovahr-app.com (or ?tenant=grupoactitud)
import type { User, Objective, CheckIn, Alert } from "@/data/types";

export const company_id = "grupoactitud";
export const company_name = "Grupo Actitud";
export const app_name = "OKR by InHR";
export const logo: string | null = null;

export const areas = [
  "Dirección General",
  "Comercial",
  "Operaciones",
  "Personas",
  "Finanzas",
];

export const subAreas: Record<string, string[]> = {};

export const users: User[] = [
  {
    id: "u1",
    name: "Admin Grupo Actitud",
    email: "admin@grupoactitud.com",
    role: "admin",
    area: "Dirección General",
  },
];

export const objectives: Objective[] = [];

export const checkIns: CheckIn[] = [];

export const alerts: Alert[] = [];
