// InovaHR tenant dataset — okr-inovahr.inovahr-app.com (or ?tenant=inovahr)
import type { User, Objective, CheckIn, Alert } from "@/data/types";

export const company_id = "inovahr";
export const company_name = "InovaHR";
export const app_name = "InovaHR Strategy";
export const logo = "/logos/inovahr.png";

export const areas = ["Dirección General"];

export const subAreas: Record<string, string[]> = {};

export const users: User[] = [
  { id: "u1", name: "Martín Torres", email: "martin@inovahr.com", role: "admin", area: "Dirección General" },
];

export const objectives: Objective[] = [];

export const checkIns: CheckIn[] = [];

export const alerts: Alert[] = [];
