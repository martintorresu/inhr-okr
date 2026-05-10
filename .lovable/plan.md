## Plan: Pestaña "Por KR" en Check-ins

Reutilizo la infraestructura existente (`okr_checkins`, `okr_initiatives`, `okr_checkin_schedules`) y añado lo mínimo necesario.

### 1. Migración de base de datos

Añadir `kr_id TEXT NULL` a `okr_checkin_schedules` para soportar frecuencia por KR conviviendo con la frecuencia por objetivo existente.

```sql
ALTER TABLE public.okr_checkin_schedules
  ADD COLUMN kr_id TEXT NULL;
CREATE INDEX idx_schedules_kr ON public.okr_checkin_schedules(tenant_id, kr_id);
```

(Sin tocar políticas RLS — las actuales por `tenant_id` siguen aplicando.)

### 2. Persistencia (`src/lib/checkInsPersistence.ts`)

- Extender `CheckInSchedule` con `krId?: string | null`.
- Mapear el nuevo campo en `loadTenantSchedules` / `upsertSchedule`.

### 3. Helper para actualizar `current` del KR

Nueva función `updateKRCurrent(tenantId, objectiveId, krId, current)` en `okrPersistence.ts` que:
- Lee el OKR.
- Reemplaza el KR dentro del array `key_results` con nuevo `current` y `progress` recalculado vía `computeKRProgress`.
- Recalcula progress del objetivo.
- Hace upsert del row.
- Devuelve el `Objective` actualizado para refrescar estado en `Index.tsx`.

### 4. Nuevo componente `KRCheckinsPanel.tsx`

Tarjeta por cada KR mostrando:

```text
┌────────────────────────────────────────────────────┐
│ KR: Aumentar NPS a 70                  [Semanal]   │
│ ████████████░░░░░  62%  ↑   (Atrasado 3d) │
│ Actual: 56 / Meta: 70 NPS                          │
│                                                    │
│ Iniciativas (3)                                    │
│  ☐ Encuesta trimestral · Ana · [En progreso ▾]    │
│  ☑ Plan de retención · Luis · [Completada ▾]      │
│                                                    │
│ Últimos check-ins                                  │
│  • 56 NPS · "Mejora tras lanzamiento" · 2d        │
│  • 50 NPS · "Bloqueo en CRM" · 9d                 │
│                                                    │
│ Nuevo check-in                                     │
│  [valor]  [comentario corto]    [Guardar]         │
└────────────────────────────────────────────────────┘
```

Reglas:
- Color barra: rojo <40, amarillo 40–70, verde >70 (tokens del design system).
- Tendencia comparando últimos 2 check-ins del KR.
- "Atrasado" si `next_due_date < hoy`. Selector de frecuencia inline (semanal/quincenal/mensual) que llama `onScheduleUpsert` con `krId`.
- Cambio de estado de iniciativa via dropdown reutiliza `handleInitiativeUpsert`.
- "Guardar" inserta `okr_checkins` con `krId`, `comment`, `progressManual` calculado desde valor/meta, y dispara `updateKRCurrent` para sobreescribir `kr.current`.

### 5. Integración en `CheckInsPage.tsx`

Añadir tercera `TabsTrigger value="por-kr"` (primera por defecto). Recibe `onUpdateKR` desde `Index.tsx`. No se toca la lógica de "Mi vista" ni "Vista equipo".

### 6. `Index.tsx`

- Nuevo handler `handleUpdateKR(objectiveId, krId, current)` que llama `updateKRCurrent` y refresca el array `objectives` en el state.
- Pasar `onUpdateKR` y los handlers existentes a `CheckInsPage`.

### 7. Multi-tenant

Todas las operaciones ya pasan por `activeTenantId` y RLS actual (`tenant_id IN (inhr, inovahr, grupoactitud)` + demo público para quimetal). No se requieren cambios.

### Archivos modificados/creados

- `supabase/migrations/<timestamp>_kr_schedules.sql` (nuevo)
- `src/lib/checkInsPersistence.ts` (campo `krId`)
- `src/lib/okrPersistence.ts` (función `updateKRCurrent`)
- `src/components/KRCheckinsPanel.tsx` (nuevo)
- `src/components/CheckInsPage.tsx` (nueva pestaña + prop)
- `src/pages/Index.tsx` (handler + prop)

### Lo que NO incluye este plan

- No reemplazo "Mi vista" ni "Vista equipo".
- No modifico la tabla `okr_checkins` (su `kr_id` ya existe).
- No agrego notificaciones automáticas de check-ins atrasados (solo badge visual).