// Demo tenant dataset — okr-demo.inovahr-app.com
import type { User, Objective, CheckIn, Alert } from "@/data/types";

export const company_id = "quimetal";
export const company_name = "DemoEnterprise";
export const app_name = "OKR by InHR";
export const logo = "/logos/demoenterprise.png";

export const areas = [
  "Dirección General",
  "Administración y Finanzas",
  "Comercial",
  "Operaciones",
  "Personas",
];

export const subAreas: Record<string, string[]> = {
  Personas: ["Desarrollo Organizacional"],
};

export const users: User[] = [
  { id: "u1", name: "Alfredo Claro", email: "alfredo.claro@quimetal.com", role: "admin", area: "Dirección General" },
  { id: "u2", name: "Maximiliano Mondaca", email: "maximiliano.mondaca@quimetal.com", role: "okr_leader", area: "Administración y Finanzas" },
  { id: "u3", name: "Marcelo Quinteros", email: "marcelo.quinteros@quimetal.com", role: "okr_leader", area: "Comercial" },
  { id: "u4", name: "Rodrigo Vivallos", email: "rodrigo.vivallos@quimetal.com", role: "okr_leader", area: "Operaciones" },
  { id: "u5", name: "Carolina Castillo", email: "carolina.castillo@quimetal.com", role: "okr_leader", area: "Personas" },
  { id: "u6", name: "Claudia León", email: "claudia.leon@quimetal.com", role: "initiative_leader", area: "Personas / Desarrollo Organizacional" },
];

export const objectives: Objective[] = [
  // ===== OKRs estratégicos empresa (3) =====
  {
    id: "qobj1",
    title: "Crecer ventas un 25% en mercados industriales clave",
    description: "Consolidar liderazgo en minería y metalurgia expandiendo cuentas estratégicas y nuevos productos químicos.",
    area: "Dirección General",
    owner: "Alfredo Claro",
    level: "company",
    progress: 58,
    status: "on_track",
    quarter: "Q2 2026",
    keyResults: [
      {
        id: "qkr1", title: "Aumentar ventas a USD 18M", type: "numeric", current: 13.5, target: 18, unit: "M USD", progress: 75, objectiveId: "qobj1",
        initiatives: [
          { id: "qini1", title: "Plan comercial cuentas estratégicas", responsible: "Marcelo Quinteros", krId: "qkr1", startDate: "2026-01-15", endDate: "2026-06-30", progress: 70, status: "in_progress", tasks: [{ id: "qt1", title: "Mapear top 20 cuentas", completed: true }, { id: "qt2", title: "Visitas técnicas Q2", completed: false }] },
        ],
      },
      {
        id: "qkr2", title: "Lanzar 3 nuevos productos químicos", type: "numeric", current: 1, target: 3, unit: "productos", progress: 33, objectiveId: "qobj1",
        initiatives: [
          { id: "qini2", title: "Validación piloto nuevos productos", responsible: "Rodrigo Vivallos", krId: "qkr2", startDate: "2026-02-01", endDate: "2026-06-30", progress: 40, status: "in_progress", tasks: [{ id: "qt3", title: "Pruebas en planta cliente", completed: true }] },
        ],
      },
    ],
  },
  {
    id: "qobj2",
    title: "Mejorar margen operacional al 22%",
    description: "Optimizar costos de producción y mix de productos para asegurar rentabilidad sostenida.",
    area: "Dirección General",
    owner: "Alfredo Claro",
    level: "company",
    progress: 45,
    status: "at_risk",
    quarter: "Q2 2026",
    keyResults: [
      {
        id: "qkr3", title: "Reducir costos directos en 8%", type: "numeric", current: 3, target: 8, unit: "%", progress: 38, objectiveId: "qobj2",
        initiatives: [
          { id: "qini3", title: "Renegociar materias primas críticas", responsible: "Maximiliano Mondaca", krId: "qkr3", startDate: "2026-01-20", endDate: "2026-06-30", progress: 50, status: "in_progress", tasks: [{ id: "qt4", title: "RFQ proveedores principales", completed: true }] },
        ],
      },
      {
        id: "qkr4", title: "Margen operacional ≥22%", type: "numeric", current: 18, target: 22, unit: "%", progress: 50, objectiveId: "qobj2",
        initiatives: [],
      },
    ],
  },
  {
    id: "qobj3",
    title: "Consolidar la transformación digital de Quimetal",
    description: "Digitalizar procesos clave de operación y gestión para habilitar decisiones basadas en datos.",
    area: "Dirección General",
    owner: "Alfredo Claro",
    level: "company",
    progress: 40,
    status: "on_track",
    quarter: "Q2 2026",
    keyResults: [
      {
        id: "qkr5", title: "Digitalizar 70% de procesos críticos", type: "numeric", current: 35, target: 70, unit: "%", progress: 50, objectiveId: "qobj3",
        initiatives: [
          { id: "qini4", title: "Implementar ERP módulo producción", responsible: "Rodrigo Vivallos", krId: "qkr5", startDate: "2026-02-01", endDate: "2026-08-30", progress: 45, status: "in_progress", tasks: [{ id: "qt5", title: "Levantamiento de requerimientos", completed: true }] },
        ],
      },
    ],
  },

  // ===== OKRs por área (1-2 cada una) =====
  {
    id: "qobj4",
    title: "Asegurar liquidez y control financiero",
    description: "Mantener flujo de caja saludable y reducir riesgos financieros.",
    area: "Administración y Finanzas",
    owner: "Maximiliano Mondaca",
    level: "area",
    progress: 65,
    status: "on_track",
    quarter: "Q2 2026",
    keyResults: [
      {
        id: "qkr6", title: "Reducir días de cobranza a 45", type: "numeric", current: 58, target: 45, unit: "días", progress: 55, objectiveId: "qobj4",
        initiatives: [
          { id: "qini5", title: "Plan de cobranza proactiva", responsible: "Maximiliano Mondaca", krId: "qkr6", startDate: "2026-02-15", endDate: "2026-06-30", progress: 60, status: "in_progress", tasks: [{ id: "qt6", title: "Segmentar cartera vencida", completed: true }] },
        ],
      },
      {
        id: "qkr7", title: "Cierre contable mensual <5 días hábiles", type: "numeric", current: 7, target: 5, unit: "días", progress: 70, objectiveId: "qobj4",
        initiatives: [],
      },
    ],
  },
  {
    id: "qobj5",
    title: "Expandir cartera de clientes industriales",
    description: "Diversificar la base de clientes en sectores de alto valor.",
    area: "Comercial",
    owner: "Marcelo Quinteros",
    level: "area",
    progress: 48,
    status: "on_track",
    quarter: "Q2 2026",
    keyResults: [
      {
        id: "qkr8", title: "Incorporar 12 nuevos clientes industriales", type: "numeric", current: 5, target: 12, unit: "clientes", progress: 42, objectiveId: "qobj5",
        initiatives: [
          { id: "qini6", title: "Campaña outbound minería + metalurgia", responsible: "Marcelo Quinteros", krId: "qkr8", startDate: "2026-02-01", endDate: "2026-06-30", progress: 50, status: "in_progress", tasks: [{ id: "qt7", title: "Lista de prospectos validada", completed: true }] },
        ],
      },
    ],
  },
  {
    id: "qobj6",
    title: "Elevar eficiencia y seguridad operacional en planta",
    description: "Mejorar productividad de planta y mantener cero accidentes graves.",
    area: "Operaciones",
    owner: "Rodrigo Vivallos",
    level: "area",
    progress: 60,
    status: "on_track",
    quarter: "Q2 2026",
    keyResults: [
      {
        id: "qkr9", title: "OEE de planta ≥85%", type: "numeric", current: 78, target: 85, unit: "%", progress: 65, objectiveId: "qobj6",
        initiatives: [
          { id: "qini7", title: "Mantenimiento predictivo equipos críticos", responsible: "Rodrigo Vivallos", krId: "qkr9", startDate: "2026-01-20", endDate: "2026-06-30", progress: 55, status: "in_progress", tasks: [{ id: "qt8", title: "Sensorización línea principal", completed: true }] },
        ],
      },
      {
        id: "qkr10", title: "Cero accidentes con tiempo perdido", type: "numeric", current: 0, target: 0, unit: "casos", progress: 100, objectiveId: "qobj6",
        initiatives: [],
      },
    ],
  },
  {
    id: "qobj7",
    title: "Fortalecer cultura y desarrollo del talento Quimetal",
    description: "Mejorar engagement y capacidades clave del equipo.",
    area: "Personas",
    owner: "Carolina Castillo",
    level: "area",
    progress: 35,
    status: "behind",
    quarter: "Q2 2026",
    keyResults: [
      {
        id: "qkr11", title: "eNPS ≥55", type: "numeric", current: 38, target: 55, unit: "pts", progress: 40, objectiveId: "qobj7",
        initiatives: [
          { id: "qini8", title: "Programa de Desarrollo Organizacional", responsible: "Claudia León", krId: "qkr11", startDate: "2026-02-01", endDate: "2026-08-30", progress: 30, status: "in_progress", tasks: [{ id: "qt9", title: "Diagnóstico cultural", completed: true }, { id: "qt10", title: "Plan de liderazgo intermedio", completed: false }] },
        ],
      },
      {
        id: "qkr12", title: "100% líderes con plan de desarrollo individual", type: "numeric", current: 25, target: 100, unit: "%", progress: 25, objectiveId: "qobj7",
        initiatives: [],
      },
    ],
  },
];

export const checkIns: CheckIn[] = [
  { id: "qci1", objectiveId: "qobj1", date: "2026-03-26", comment: "Pipeline comercial robusto, cuentas mineras avanzando.", progress: 58, author: "Alfredo Claro" },
  { id: "qci2", objectiveId: "qobj2", date: "2026-03-28", comment: "Renegociación con proveedores en curso, impacto parcial.", progress: 45, blockers: "Volatilidad precio insumos", author: "Maximiliano Mondaca" },
  { id: "qci3", objectiveId: "qobj5", date: "2026-03-22", comment: "Buen ritmo de prospección, foco en metalurgia.", progress: 48, author: "Marcelo Quinteros" },
  { id: "qci4", objectiveId: "qobj6", date: "2026-03-29", comment: "OEE mejorando con mantenimiento predictivo.", progress: 60, author: "Rodrigo Vivallos" },
  { id: "qci5", objectiveId: "qobj7", date: "2026-03-18", comment: "Programa DO con avance lento, presupuesto en revisión.", progress: 35, blockers: "Aprobación presupuesto formación", author: "Carolina Castillo" },
];

export const alerts: Alert[] = [
  { id: "qa1", type: "risk", message: "OKR 'Mejorar margen operacional' en riesgo — 45% de avance", objectiveId: "qobj2", date: "2026-04-05", severity: "high" },
  { id: "qa2", type: "risk", message: "OKR 'Cultura y desarrollo del talento' atrasado — 35% de avance", objectiveId: "qobj7", date: "2026-04-04", severity: "high" },
  { id: "qa3", type: "checkin", message: "Check-in pendiente para 'Transformación digital'", objectiveId: "qobj3", date: "2026-04-08", severity: "medium" },
  { id: "qa4", type: "overdue", message: "Iniciativa 'Programa de Desarrollo Organizacional' con avance bajo", objectiveId: "qobj7", date: "2026-04-06", severity: "medium" },
];
