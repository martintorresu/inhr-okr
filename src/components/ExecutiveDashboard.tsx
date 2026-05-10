import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle, Sparkles, TrendingUp, TrendingDown, Minus, Loader2,
  Target, Users, ShieldAlert, Activity,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Objective, KeyResult } from "@/data/types";
import type { InitiativeWithContext } from "@/lib/initiativesPersistence";
import type { CheckInRecord, CheckInSchedule, Confidence } from "@/lib/checkInsPersistence";

interface Props {
  objectives: Objective[];
  initiatives: InitiativeWithContext[];
  checkIns: CheckInRecord[];
  schedules: CheckInSchedule[];
}

type KRStatus = "on_track" | "at_risk" | "critical" | "overdue";

const STALE_DAYS = 14;

const statusMeta: Record<KRStatus, { label: string; cls: string }> = {
  on_track: { label: "On track", cls: "bg-success/15 text-success border-success/30" },
  at_risk: { label: "En riesgo", cls: "bg-warning/15 text-warning border-warning/30" },
  critical: { label: "Crítico", cls: "bg-danger/15 text-danger border-danger/30" },
  overdue: { label: "Atrasado", cls: "bg-danger/15 text-danger border-danger/30" },
};

const daysSince = (iso?: string | null): number | null => {
  if (!iso) return null;
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return null;
  return Math.floor((Date.now() - d) / 86_400_000);
};

const ExecutiveDashboard = ({ objectives, initiatives, checkIns, schedules }: Props) => {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string>("");

  // ============= Derived data =============
  const data = useMemo(() => {
    // index check-ins by KR (latest first)
    const ciByKR: Record<string, CheckInRecord[]> = {};
    const ciByObj: Record<string, CheckInRecord[]> = {};
    [...checkIns]
      .sort((a, b) => b.checkinDate.localeCompare(a.checkinDate))
      .forEach((c) => {
        if (c.krId) (ciByKR[c.krId] ||= []).push(c);
        (ciByObj[c.objectiveId] ||= []).push(c);
      });

    const schedByKR: Record<string, CheckInSchedule> = {};
    schedules.forEach((s) => { if (s.krId) schedByKR[s.krId] = s; });

    const initByKR: Record<string, InitiativeWithContext[]> = {};
    initiatives.forEach((i) => { (initByKR[i.krId] ||= []).push(i); });

    interface KRRow {
      kr: KeyResult;
      obj: Objective;
      status: KRStatus;
      daysSinceCheckin: number | null;
      lastConfidence: Confidence;
      blockedInitiatives: number;
      consecutiveRedCycles: number;
      stagnant: boolean;
    }

    const krRows: KRRow[] = [];
    objectives.forEach((obj) => {
      obj.keyResults.forEach((kr) => {
        const cis = ciByKR[kr.id] ?? [];
        const last = cis[0];
        const lastConf = (last?.confidence ?? "green") as Confidence;
        const ds = daysSince(last?.checkinDate);
        const sched = schedByKR[kr.id];
        const overdueBySched = sched?.nextDueDate ? new Date(sched.nextDueDate).getTime() < Date.now() : false;
        const overdueByStale = ds !== null && ds > STALE_DAYS;
        const isOverdue = overdueBySched || overdueByStale || (ds === null && (kr.progress ?? 0) < 100);

        let status: KRStatus;
        if (lastConf === "red" || (kr.progress ?? 0) < 25) status = "critical";
        else if (isOverdue) status = "overdue";
        else if (lastConf === "yellow" || (kr.progress ?? 0) < 50) status = "at_risk";
        else status = "on_track";

        // consecutive red cycles
        let consecutiveRedCycles = 0;
        for (const c of cis) {
          if (c.confidence === "red") consecutiveRedCycles++;
          else break;
        }

        // stagnant: 2+ check-ins without progress improvement
        let stagnant = false;
        if (cis.length >= 2 && cis[0].progressManual <= cis[1].progressManual) stagnant = true;

        const inis = initByKR[kr.id] ?? [];
        const blockedInitiatives = inis.filter((i) => i.status === "blocked").length;

        krRows.push({
          kr, obj, status, daysSinceCheckin: ds, lastConfidence: lastConf,
          blockedInitiatives, consecutiveRedCycles, stagnant,
        });
      });
    });

    // ===== Per objective =====
    const objSummaries = objectives.map((obj) => {
      const rows = krRows.filter((r) => r.obj.id === obj.id);
      const total = rows.length || 1;
      const counts = {
        on_track: rows.filter((r) => r.status === "on_track").length,
        at_risk: rows.filter((r) => r.status === "at_risk").length,
        critical: rows.filter((r) => r.status === "critical").length,
        overdue: rows.filter((r) => r.status === "overdue").length,
      };
      const avg = rows.length
        ? Math.round(rows.reduce((s, r) => s + (r.kr.progress ?? 0), 0) / rows.length)
        : 0;
      const criticalRatio = counts.critical / total;
      const okRatio = counts.on_track / total;
      let color: "green" | "yellow" | "red";
      if (criticalRatio >= 0.3) color = "red";
      else if (okRatio >= 0.7) color = "green";
      else color = "yellow";
      return { obj, counts, avg, color, totalKRs: rows.length };
    });

    // ===== Top KRs at risk =====
    const risky = krRows
      .filter((r) => r.status === "critical" || r.status === "at_risk" || r.status === "overdue")
      .sort((a, b) => {
        const order: Record<KRStatus, number> = { critical: 0, overdue: 1, at_risk: 2, on_track: 3 };
        if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
        return (a.kr.progress ?? 0) - (b.kr.progress ?? 0);
      })
      .slice(0, 5);

    // ===== Leaders ranking =====
    const ownersMap: Record<string, { krs: typeof krRows; checkInsCount: number }> = {};
    krRows.forEach((r) => {
      const owner = r.obj.owner || "—";
      (ownersMap[owner] ||= { krs: [], checkInsCount: 0 }).krs.push(r);
    });
    Object.entries(ownersMap).forEach(([owner, v]) => {
      const objIds = new Set(v.krs.map((r) => r.obj.id));
      v.checkInsCount = checkIns.filter((c) => objIds.has(c.objectiveId)).length;
    });
    const leaders = Object.entries(ownersMap).map(([owner, v]) => {
      const total = v.krs.length || 1;
      const onTrack = v.krs.filter((r) => r.status === "on_track").length;
      const critical = v.krs.filter((r) => r.status === "critical").length;
      const pctOnTrack = Math.round((onTrack / total) * 100);
      const pctCritical = Math.round((critical / total) * 100);
      // score: on_track positivo, critical negativo, ponderado por # check-ins
      const checkinDensity = v.checkInsCount / total; // promedio
      const score = Math.max(0, Math.min(100, Math.round(pctOnTrack - pctCritical * 1.5 + checkinDensity * 5)));
      return { owner, totalKRs: v.krs.length, pctOnTrack, pctCritical, checkinDensity, score };
    }).sort((a, b) => b.score - a.score);

    // ===== Alerts =====
    const alerts: { type: string; severity: "high" | "medium"; message: string }[] = [];
    krRows.forEach((r) => {
      if (r.daysSinceCheckin !== null && r.daysSinceCheckin > STALE_DAYS) {
        alerts.push({
          type: "stale", severity: "medium",
          message: `${r.kr.title} sin check-in hace ${r.daysSinceCheckin} días (${r.obj.owner})`,
        });
      } else if (r.daysSinceCheckin === null) {
        alerts.push({
          type: "no-checkin", severity: "medium",
          message: `${r.kr.title} aún no tiene check-ins (${r.obj.owner})`,
        });
      }
      if (r.consecutiveRedCycles >= 2) {
        alerts.push({
          type: "red-streak", severity: "high",
          message: `${r.kr.title} en rojo por ${r.consecutiveRedCycles} ciclos consecutivos`,
        });
      }
      if (r.stagnant && r.status !== "on_track") {
        alerts.push({
          type: "stagnant", severity: "medium",
          message: `${r.kr.title} estancado (sin avance entre últimos check-ins)`,
        });
      }
    });

    // ===== Global indicators =====
    const totalKRs = krRows.length || 1;
    const globals = {
      totalKRs: krRows.length,
      pctOnTrack: Math.round((krRows.filter((r) => r.status === "on_track").length / totalKRs) * 100),
      pctAtRisk: Math.round((krRows.filter((r) => r.status === "at_risk" || r.status === "overdue").length / totalKRs) * 100),
      pctCritical: Math.round((krRows.filter((r) => r.status === "critical").length / totalKRs) * 100),
      avgProgress: krRows.length
        ? Math.round(krRows.reduce((s, r) => s + (r.kr.progress ?? 0), 0) / krRows.length)
        : 0,
    };

    // ===== Blockers breakdown =====
    const blockerCounts: Record<string, number> = {};
    checkIns.forEach((c) => {
      c.blockers.forEach((b) => {
        blockerCounts[b.type] = (blockerCounts[b.type] ?? 0) + 1;
      });
    });

    return { objSummaries, risky, leaders, alerts: alerts.slice(0, 10), globals, blockerCounts, krRows };
  }, [objectives, initiatives, checkIns, schedules]);

  const generateAISummary = async () => {
    setAiLoading(true);
    try {
      // areas with highest critical concentration
      const areaStats: Record<string, { total: number; critical: number; atRisk: number }> = {};
      data.krRows.forEach((r) => {
        const a = r.obj.area || "—";
        const s = (areaStats[a] ||= { total: 0, critical: 0, atRisk: 0 });
        s.total += 1;
        if (r.status === "critical") s.critical += 1;
        if (r.status === "at_risk" || r.status === "overdue") s.atRisk += 1;
      });

      const payload = {
        globals: data.globals,
        topAreasAtRisk: Object.entries(areaStats)
          .map(([area, s]) => ({ area, ...s, pctCritical: Math.round((s.critical / s.total) * 100) }))
          .sort((a, b) => b.pctCritical - a.pctCritical)
          .slice(0, 5),
        topRiskyKRs: data.risky.slice(0, 5).map((r) => ({
          kr: r.kr.title, owner: r.obj.owner, area: r.obj.area,
          progress: r.kr.progress, status: r.status,
          daysSinceCheckin: r.daysSinceCheckin,
        })),
        blockerCounts: data.blockerCounts,
        leadersBottom3: [...data.leaders].sort((a, b) => a.score - b.score).slice(0, 3),
        alertsCount: data.alerts.length,
      };

      const { data: resp, error } = await supabase.functions.invoke("exec-summary", { body: payload });
      if (error) throw error;
      if ((resp as any)?.error) throw new Error((resp as any).error);
      setAiSummary((resp as any)?.summary ?? "");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo generar el resumen");
    } finally {
      setAiLoading(false);
    }
  };

  const colorRing: Record<"green" | "yellow" | "red", string> = {
    green: "bg-success",
    yellow: "bg-warning",
    red: "bg-danger",
  };

  return (
    <div className="space-y-6">
      {/* ===== Indicadores globales ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={<Activity className="w-4 h-4" />} label="KRs on track" value={`${data.globals.pctOnTrack}%`} tone="success" />
        <KpiCard icon={<AlertTriangle className="w-4 h-4" />} label="En riesgo" value={`${data.globals.pctAtRisk}%`} tone="warning" />
        <KpiCard icon={<ShieldAlert className="w-4 h-4" />} label="Críticos" value={`${data.globals.pctCritical}%`} tone="danger" />
        <KpiCard icon={<Target className="w-4 h-4" />} label="Cumplimiento promedio" value={`${data.globals.avgProgress}%`} tone="primary" />
      </div>

      {/* ===== Resumen IA ===== */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> Resumen ejecutivo (IA)
          </CardTitle>
          <Button size="sm" onClick={generateAISummary} disabled={aiLoading}>
            {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span className="ml-1.5">{aiSummary ? "Regenerar" : "Generar"}</span>
          </Button>
        </CardHeader>
        <CardContent>
          {aiSummary ? (
            <div className="text-sm whitespace-pre-line text-foreground/90 leading-relaxed">{aiSummary}</div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Genera un resumen de 30 segundos con IA: dónde está el problema, quién es responsable y qué hacer.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ===== Objetivos ===== */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4" /> Estado por Objetivo
          </CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.objSummaries.length === 0 && (
              <p className="text-sm text-muted-foreground">Sin objetivos para analizar.</p>
            )}
            {data.objSummaries.map(({ obj, counts, avg, color, totalKRs }) => (
              <div key={obj.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors">
                <div className={`w-2.5 h-10 rounded-full shrink-0 ${colorRing[color]}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{obj.title}</div>
                  <div className="text-xs text-muted-foreground">{obj.area} · {obj.owner} · {totalKRs} KRs</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-xs">{counts.on_track}</Badge>
                  <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 text-xs">{counts.at_risk}</Badge>
                  <Badge variant="outline" className="bg-danger/10 text-danger border-danger/30 text-xs">{counts.critical}</Badge>
                  {counts.overdue > 0 && (
                    <Badge variant="outline" className="bg-muted text-muted-foreground text-xs">⏱ {counts.overdue}</Badge>
                  )}
                  <span className="text-sm font-semibold w-10 text-right tabular-nums">{avg}%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ===== Ranking KRs en riesgo ===== */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" /> Top KRs en riesgo
          </CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.risky.length === 0 && (
              <p className="text-sm text-muted-foreground">Ningún KR en riesgo. 🎉</p>
            )}
            {data.risky.map((r) => (
              <div key={r.kr.id} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{r.kr.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.obj.owner} · {r.obj.area}
                    {r.daysSinceCheckin !== null
                      ? ` · ${r.daysSinceCheckin}d sin check-in`
                      : " · sin check-ins"}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge variant="outline" className={`${statusMeta[r.status].cls} text-xs`}>
                    {statusMeta[r.status].label}
                  </Badge>
                  <span className="text-xs font-medium tabular-nums">{r.kr.progress ?? 0}%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ===== Ranking líderes ===== */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" /> Ranking de líderes
          </CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.leaders.length === 0 && (
              <p className="text-sm text-muted-foreground">Sin datos de owners.</p>
            )}
            {data.leaders.map((l) => (
              <div key={l.owner} className="flex items-center gap-3 p-2.5 rounded-lg border border-border">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{l.owner}</div>
                  <div className="text-xs text-muted-foreground">
                    {l.totalKRs} KRs · {l.checkinDensity.toFixed(1)} check-ins/KR
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs shrink-0">
                  <span className="text-success">{l.pctOnTrack}% OK</span>
                  <span className="text-danger">{l.pctCritical}% crít.</span>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold tabular-nums">{l.score}</span>
                    {l.score >= 70 ? <TrendingUp className="w-3.5 h-3.5 text-success" />
                      : l.score >= 40 ? <Minus className="w-3.5 h-3.5 text-warning" />
                      : <TrendingDown className="w-3.5 h-3.5 text-danger" />}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ===== Alertas ===== */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-danger" /> Alertas ejecutivas
          </CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.alerts.length === 0 && (
              <p className="text-sm text-muted-foreground">Sin alertas activas.</p>
            )}
            {data.alerts.map((a, i) => (
              <div key={i} className={`flex items-start gap-2 p-2.5 rounded-lg border text-sm ${
                a.severity === "high"
                  ? "border-danger/30 bg-danger/5 text-danger"
                  : "border-warning/30 bg-warning/5 text-warning-foreground"
              }`}>
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="text-foreground/90">{a.message}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const KpiCard = ({
  icon, label, value, tone,
}: { icon: React.ReactNode; label: string; value: string; tone: "success" | "warning" | "danger" | "primary" }) => {
  const toneCls: Record<typeof tone, string> = {
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/10",
    danger: "text-danger bg-danger/10",
    primary: "text-primary bg-primary/10",
  };
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${toneCls[tone]}`}>{icon}</div>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-xl font-bold text-foreground tabular-nums">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExecutiveDashboard;
