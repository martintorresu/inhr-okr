import { useMemo, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, Ban, Bell, ArrowRight, X, Trash2 } from "lucide-react";
import { activeTenantId } from "@/data/tenant";
import type { Objective } from "@/data/types";
import type { InitiativeWithContext } from "@/lib/initiativesPersistence";
import type { CheckInRecord, CheckInSchedule } from "@/lib/checkInsPersistence";

const STALE_DAYS = 14;
const DISMISS_KEY = `okr-dismissed-alerts:${activeTenantId}`;

const loadDismissed = (): Set<string> => {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
};

const saveDismissed = (ids: Set<string>) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DISMISS_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
};

interface AlertsPageProps {
  objectives: Objective[];
  initiatives: InitiativeWithContext[];
  checkIns: CheckInRecord[];
  schedules: CheckInSchedule[];
  onNavigate?: (page: string) => void;
}

interface AlertItem {
  id: string;
  type: "risk" | "overdue" | "blocked" | "checkin" | "stale";
  message: string;
  detail?: string;
  date: string;
  severity: "high" | "medium";
}

const iconMap: Record<AlertItem["type"], typeof AlertTriangle> = {
  risk: AlertTriangle,
  overdue: Clock,
  blocked: Ban,
  checkin: Bell,
  stale: Clock,
};

export const computeAlerts = (
  objectives: Objective[],
  initiatives: InitiativeWithContext[],
  checkIns: CheckInRecord[],
  schedules: CheckInSchedule[]
): AlertItem[] => {
  const alerts: AlertItem[] = [];
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);

  const lastByObj: Record<string, CheckInRecord | undefined> = {};
  [...checkIns]
    .filter((c) => c.status === "completed")
    .sort((a, b) => b.checkinDate.localeCompare(a.checkinDate))
    .forEach((c) => { if (!lastByObj[c.objectiveId]) lastByObj[c.objectiveId] = c; });

  // Pending check-ins (auto-generated)
  checkIns.filter((c) => c.status === "pending").forEach((c) => {
    const obj = objectives.find((o) => o.id === c.objectiveId);
    alerts.push({
      id: `pending-${c.id}`,
      type: "checkin",
      message: `Check-in pendiente: ${obj?.title ?? c.objectiveId}`,
      detail: `Programado para ${c.checkinDate}`,
      date: c.checkinDate,
      severity: c.checkinDate < todayIso ? "high" : "medium",
    });
  });

  // Schedule overdue (no pending row but next_due_date < today)
  schedules.forEach((s) => {
    if (!s.nextDueDate || s.nextDueDate >= todayIso) return;
    const hasPending = checkIns.some(
      (c) => c.objectiveId === s.objectiveId && c.status === "pending"
    );
    if (hasPending) return;
    const obj = objectives.find((o) => o.id === s.objectiveId);
    alerts.push({
      id: `overdue-${s.id}`,
      type: "overdue",
      message: `Check-in vencido: ${obj?.title ?? s.objectiveId}`,
      detail: `Debía hacerse el ${s.nextDueDate}`,
      date: s.nextDueDate,
      severity: "high",
    });
  });

  objectives.forEach((obj) => {
    const last = lastByObj[obj.id];

    // Confidence = red
    if (last?.confidence === "red") {
      alerts.push({
        id: `risk-${obj.id}`,
        type: "risk",
        message: `OKR off track: ${obj.title}`,
        detail: `${last.progressManual}% — ${last.authorName}`,
        date: last.checkinDate,
        severity: "high",
      });
    } else if (last?.confidence === "yellow") {
      alerts.push({
        id: `risk-${obj.id}`,
        type: "risk",
        message: `OKR en riesgo: ${obj.title}`,
        detail: `${last.progressManual}%`,
        date: last.checkinDate,
        severity: "medium",
      });
    }

    // Stale (no recent submitted check-in)
    if (last) {
      const days = Math.floor(
        (today.getTime() - new Date(last.checkinDate).getTime()) / 86400000
      );
      if (days > STALE_DAYS) {
        alerts.push({
          id: `stale-${obj.id}`,
          type: "stale",
          message: `OKR sin actualizar: ${obj.title}`,
          detail: `${days} días desde el último check-in`,
          date: last.checkinDate,
          severity: days > STALE_DAYS * 2 ? "high" : "medium",
        });
      }
    }
  });

  // Blocked initiatives
  initiatives.filter((i) => i.status === "blocked").forEach((i) => {
    alerts.push({
      id: `blocked-${i.id}`,
      type: "blocked",
      message: `Iniciativa bloqueada: ${i.title}`,
      detail: i.responsible,
      date: i.endDate || todayIso,
      severity: "high",
    });
  });

  // Sort: high first, then date desc
  return alerts.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === "high" ? -1 : 1;
    return b.date.localeCompare(a.date);
  });
};

// An alert is "obsolete" when its underlying event is in the past:
// overdue check-ins, past-due pending check-ins, and stale OKRs.
const isObsolete = (a: AlertItem): boolean => {
  const todayIso = new Date().toISOString().slice(0, 10);
  if (a.type === "overdue" || a.type === "stale") return true;
  if (a.type === "checkin" && a.date < todayIso) return true;
  return false;
};

const AlertsPage = ({ objectives, initiatives, checkIns, schedules, onNavigate }: AlertsPageProps) => {
  const [dismissed, setDismissed] = useState<Set<string>>(() => loadDismissed());

  const allAlerts = useMemo(
    () => computeAlerts(objectives, initiatives, checkIns, schedules),
    [objectives, initiatives, checkIns, schedules]
  );

  const alerts = useMemo(
    () => allAlerts.filter((a) => !dismissed.has(a.id)),
    [allAlerts, dismissed]
  );

  const obsoleteCount = useMemo(
    () => alerts.filter(isObsolete).length,
    [alerts]
  );

  const dismissOne = useCallback((id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveDismissed(next);
      return next;
    });
  }, []);

  const clearObsolete = useCallback(() => {
    setDismissed((prev) => {
      const next = new Set(prev);
      alerts.filter(isObsolete).forEach((a) => next.add(a.id));
      saveDismissed(next);
      return next;
    });
  }, [alerts]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Alertas</h2>
          <p className="text-muted-foreground text-sm mt-1">{alerts.length} alertas activas</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearObsolete}
            disabled={obsoleteCount === 0}
            className="gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Limpiar obsoletas{obsoleteCount > 0 ? ` (${obsoleteCount})` : ""}
          </Button>
          {onNavigate && (
            <Button variant="outline" size="sm" onClick={() => onNavigate("checkins")} className="gap-2">
              Ir a check-ins <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {alerts.length === 0 && (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground text-center">
            🎉 Sin alertas activas. Todo bajo control.
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {alerts.map((a) => {
          const Icon = iconMap[a.type];
          const isHigh = a.severity === "high";
          return (
            <Card key={a.id}>
              <CardContent className="p-5 flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isHigh ? "bg-danger/10" : "bg-warning/10"}`}>
                  <Icon className={`w-5 h-5 ${isHigh ? "text-danger" : "text-warning"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{a.message}</p>
                  {a.detail && <p className="text-xs text-muted-foreground mt-0.5">{a.detail}</p>}
                  <p className="text-xs text-muted-foreground mt-1">{a.date}</p>
                </div>
                <span className={`text-xs font-semibold uppercase ${isHigh ? "text-danger" : "text-warning"}`}>
                  {isHigh ? "Alta" : "Media"}
                </span>
                <button
                  type="button"
                  onClick={() => dismissOne(a.id)}
                  aria-label="Descartar alerta"
                  className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AlertsPage;
