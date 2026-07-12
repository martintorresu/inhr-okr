// InHR (default demo) tenant — original mock data
import type { User, Objective, CheckIn, Alert } from "@/data/types";

export const company_id = "inhr";
export const company_name = "InHR";
export const app_name = "InHR Strategy";
export const logo: string | null = null;

export const areas = [
  "Dirección General",
  "Tecnología",
  "Comercial",
  "Operaciones",
  "Talento Humano",
];

export const subAreas: Record<string, string[]> = {};

export const users: User[] = [
  { id: "u1", name: "María González", email: "maria@demo.com", role: "admin", area: "Dirección General" },
  { id: "u2", name: "Carlos Ruiz", email: "carlos@demo.com", role: "okr_leader", area: "Tecnología" },
  { id: "u3", name: "Ana Torres", email: "ana@demo.com", role: "okr_leader", area: "Comercial" },
  { id: "u4", name: "Luis Méndez", email: "luis@demo.com", role: "initiative_leader", area: "Tecnología" },
  { id: "u5", name: "Sofía Herrera", email: "sofia@demo.com", role: "initiative_leader", area: "Operaciones" },
  { id: "u6", name: "Pedro Castillo", email: "pedro@demo.com", role: "initiative_leader", area: "Comercial" },
  { id: "u7", name: "Laura Vega", email: "laura@demo.com", role: "viewer", area: "Talento Humano" },
  { id: "u8", name: "Diego Flores", email: "diego@demo.com", role: "viewer", area: "Tecnología" },
  { id: "u9", name: "Camila Ríos", email: "camila@demo.com", role: "viewer", area: "Comercial" },
  { id: "u10", name: "Andrés Morales", email: "andres@demo.com", role: "viewer", area: "Operaciones" },
];

export const objectives: Objective[] = [
  {
    id: "obj1",
    title: "Incrementar ingresos recurrentes un 40%",
    description: "Expandir la base de clientes y mejorar retención para alcanzar $2.4M ARR",
    area: "Dirección General",
    owner: "María González",
    level: "company",
    progress: 62,
    status: "on_track",
    quarter: "Q2 2026",
    keyResults: [
      { id: "kr1", title: "Alcanzar $2.4M ARR", type: "numeric", current: 1.9, target: 2.4, unit: "M USD", progress: 79, objectiveId: "obj1",
        initiatives: [
          { id: "ini1", title: "Lanzar plan Enterprise", responsible: "Ana Torres", krId: "kr1", startDate: "2026-01-15", endDate: "2026-04-30", progress: 85, status: "in_progress", tasks: [{ id: "t1", title: "Definir pricing Enterprise", completed: true }, { id: "t2", title: "Crear landing page", completed: true }, { id: "t3", title: "Configurar billing", completed: false }] },
        ] },
      { id: "kr2", title: "Reducir churn a <3%", type: "numeric", current: 4.2, target: 3, unit: "%", progress: 45, objectiveId: "obj1",
        initiatives: [
          { id: "ini2", title: "Programa de onboarding automatizado", responsible: "Luis Méndez", krId: "kr2", startDate: "2026-02-01", endDate: "2026-05-15", progress: 60, status: "in_progress", tasks: [{ id: "t4", title: "Diseñar flujo onboarding", completed: true }, { id: "t5", title: "Implementar emails automáticos", completed: false }] },
        ] },
      { id: "kr3", title: "Cerrar 15 cuentas enterprise", type: "numeric", current: 9, target: 15, unit: "cuentas", progress: 60, objectiveId: "obj1",
        initiatives: [
          { id: "ini3", title: "Campaña ABM para enterprise", responsible: "Pedro Castillo", krId: "kr3", startDate: "2026-01-20", endDate: "2026-06-30", progress: 55, status: "in_progress", tasks: [{ id: "t6", title: "Identificar 50 cuentas target", completed: true }, { id: "t7", title: "Crear contenido personalizado", completed: true }, { id: "t8", title: "Ejecutar secuencias outbound", completed: false }] },
        ] },
    ],
  },
  {
    id: "obj2",
    title: "Alcanzar excelencia en la plataforma tecnológica",
    description: "Mejorar estabilidad, rendimiento y experiencia de usuario",
    area: "Tecnología",
    owner: "Carlos Ruiz",
    level: "area",
    progress: 73,
    status: "on_track",
    quarter: "Q2 2026",
    keyResults: [
      { id: "kr4", title: "Uptime >99.9%", type: "numeric", current: 99.85, target: 99.9, unit: "%", progress: 85, objectiveId: "obj2",
        initiatives: [
          { id: "ini4", title: "Implementar monitoreo avanzado", responsible: "Luis Méndez", krId: "kr4", startDate: "2026-01-10", endDate: "2026-03-30", progress: 90, status: "in_progress", tasks: [{ id: "t9", title: "Setup Datadog", completed: true }, { id: "t10", title: "Configurar alertas", completed: true }] },
        ] },
      { id: "kr5", title: "Reducir tiempo de carga <1.5s", type: "numeric", current: 2.1, target: 1.5, unit: "s", progress: 60, objectiveId: "obj2",
        initiatives: [
          { id: "ini5", title: "Optimización de queries y caché", responsible: "Diego Flores", krId: "kr5", startDate: "2026-02-15", endDate: "2026-05-30", progress: 45, status: "in_progress", tasks: [{ id: "t11", title: "Auditar queries lentos", completed: true }, { id: "t12", title: "Implementar Redis cache", completed: false }] },
        ] },
    ],
  },
  {
    id: "obj3",
    title: "Expandir presencia en mercado latinoamericano",
    description: "Posicionar la marca en 3 nuevos países de LATAM",
    area: "Comercial",
    owner: "Ana Torres",
    level: "area",
    progress: 38,
    status: "at_risk",
    quarter: "Q2 2026",
    keyResults: [
      { id: "kr6", title: "Lanzar en 3 países nuevos", type: "numeric", current: 1, target: 3, unit: "países", progress: 33, objectiveId: "obj3",
        initiatives: [
          { id: "ini6", title: "Estudio de mercado Colombia", responsible: "Pedro Castillo", krId: "kr6", startDate: "2026-01-15", endDate: "2026-04-15", progress: 70, status: "in_progress", tasks: [{ id: "t13", title: "Análisis competidores", completed: true }, { id: "t14", title: "Validar pricing local", completed: false }] },
        ] },
      { id: "kr7", title: "Generar 200 leads calificados", type: "numeric", current: 78, target: 200, unit: "leads", progress: 39, objectiveId: "obj3",
        initiatives: [
          { id: "ini7", title: "Estrategia content marketing LATAM", responsible: "Camila Ríos", krId: "kr7", startDate: "2026-02-01", endDate: "2026-06-30", progress: 25, status: "in_progress", tasks: [{ id: "t15", title: "Crear blog en español", completed: true }, { id: "t16", title: "Webinars mensuales", completed: false }] },
        ] },
    ],
  },
  {
    id: "obj4",
    title: "Optimizar operaciones y reducir costos un 20%",
    description: "Automatizar procesos clave y mejorar eficiencia operacional",
    area: "Operaciones",
    owner: "Sofía Herrera",
    level: "area",
    progress: 55,
    status: "on_track",
    quarter: "Q2 2026",
    keyResults: [
      { id: "kr8", title: "Automatizar 80% procesos manuales", type: "numeric", current: 56, target: 80, unit: "%", progress: 70, objectiveId: "obj4",
        initiatives: [
          { id: "ini8", title: "Implementar RPA en facturación", responsible: "Sofía Herrera", krId: "kr8", startDate: "2026-01-20", endDate: "2026-05-15", progress: 65, status: "in_progress", tasks: [{ id: "t17", title: "Mapear procesos actuales", completed: true }, { id: "t18", title: "Configurar bots RPA", completed: false }] },
        ] },
      { id: "kr9", title: "Reducir costos operativos en $150K", type: "numeric", current: 60, target: 150, unit: "K USD", progress: 40, objectiveId: "obj4",
        initiatives: [
          { id: "ini9", title: "Renegociar contratos proveedores", responsible: "Andrés Morales", krId: "kr9", startDate: "2026-03-01", endDate: "2026-06-30", progress: 30, status: "in_progress", tasks: [{ id: "t19", title: "Auditar proveedores actuales", completed: true }, { id: "t20", title: "Ejecutar renegociación", completed: false }] },
        ] },
    ],
  },
  {
    id: "obj5",
    title: "Fortalecer cultura de alto desempeño",
    description: "Mejorar engagement y desarrollar talento clave",
    area: "Talento Humano",
    owner: "Laura Vega",
    level: "area",
    progress: 28,
    status: "behind",
    quarter: "Q2 2026",
    keyResults: [
      { id: "kr10", title: "eNPS >60", type: "numeric", current: 42, target: 60, unit: "pts", progress: 35, objectiveId: "obj5",
        initiatives: [
          { id: "ini10", title: "Programa de reconocimiento", responsible: "Laura Vega", krId: "kr10", startDate: "2026-02-01", endDate: "2026-06-30", progress: 20, status: "blocked", tasks: [{ id: "t21", title: "Definir framework de reconocimiento", completed: true }, { id: "t22", title: "Implementar plataforma", completed: false }] },
        ] },
    ],
  },
];

export const checkIns: CheckIn[] = [
  { id: "ci1", objectiveId: "obj1", date: "2026-03-25", comment: "Buen avance en Enterprise. Pipeline fuerte para Q2.", progress: 62, author: "María González" },
  { id: "ci2", objectiveId: "obj2", date: "2026-03-28", comment: "Monitoreo implementado. Quedan optimizaciones de performance.", progress: 73, author: "Carlos Ruiz" },
  { id: "ci3", objectiveId: "obj3", date: "2026-03-20", comment: "Colombia avanza bien pero Perú y Chile están retrasados.", progress: 38, blockers: "Falta equipo local en Chile", author: "Ana Torres" },
  { id: "ci4", objectiveId: "obj4", date: "2026-03-27", comment: "RPA de facturación en fase de pruebas.", progress: 55, author: "Sofía Herrera" },
  { id: "ci5", objectiveId: "obj5", date: "2026-03-15", comment: "Plataforma de reconocimiento bloqueada por presupuesto.", progress: 28, blockers: "Aprobación de presupuesto pendiente", author: "Laura Vega" },
];

export const alerts: Alert[] = [];
