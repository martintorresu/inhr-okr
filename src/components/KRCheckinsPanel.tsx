import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowDown, ArrowRight, ArrowUp, Calendar, MessageSquare, Target, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import type { Objective, KeyResult } from "@/data/types";
import type { InitiativeWithContext } from "@/lib/initiativesPersistence";
import {
  type CheckInRecord, type CheckInSchedule, type Frequency,
} from "@/lib/checkInsPersistence";
import { computeKRProgress } from "@/lib/okrProgress";

interface Props {
  objectives: Objective[];
  initiatives: InitiativeWithContext[];
  checkIns: CheckInRecord[];
  schedules: CheckInSchedule[];
  currentUserName?: string;
  currentUserId?: string | null;
  onUpsertCheckIn: (ci: CheckInRecord) => Promise<void>;
  onUpsertInitiative: (ini: InitiativeWithContext) => Promise<void>;
  onUpsertSchedule: (s: CheckInSchedule) => Promise<void>;
  onUpdateKR: (objectiveId: string, krId: string, current: number) => Promise<void>;
}

const freqDays: Record<Frequency, number> = { weekly: 7, biweekly: 14, monthly: 30 };
const freqLabel: Record<Frequency, string> = { weekly: "Semanal", biweekly: "Quincenal", monthly: "Mensual" };

const initiativeStatusLabel = {
  not_started: "No iniciada",
  in_progress: "En progreso",
  blocked: "Bloqueada",
  completed: "Completada",
} as const;

const progressColor = (p: number) => {
  if (p >= 70) return "bg-success";
  if (p >= 40) return "bg-warning";
  return "bg-danger";
};
const progressTextColor = (p: number) => {
  if (p >= 70) return "text-success";
  if (p >= 40) return "text-warning";
  return "text-danger";
};

const TrendIndicator = ({ prev, curr }: { prev?: number; curr: number }) => {
  if (prev === undefined) return <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />;
  if (curr > prev) return <ArrowUp className="w-3.5 h-3.5 text-success" />;
  if (curr < prev) return <ArrowDown className="w-3.5 h-3.5 text-danger" />;
  return <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />;
};

const todayISO = () => new Date().toISOString().slice(0, 10);
const daysBetween = (a: string, b: string) =>
  Math.round((new Date(a).getTime() - new Date(b).getTime()) / 86400000);

const KRCard = ({
  obj, kr, initiatives, checkIns, schedule,
  currentUserName, currentUserId,
  onUpsertCheckIn, onUpsertInitiative, onUpsertSchedule, onUpdateKR,
}: {
  obj: Objective;
  kr: KeyResult;
  initiatives: InitiativeWithContext[];
  checkIns: CheckInRecord[];
  schedule?: CheckInSchedule;
  currentUserName?: string;
  currentUserId?: string | null;
  onUpsertCheckIn: Props["onUpsertCheckIn"];
  onUpsertInitiative: Props["onUpsertInitiative"];
  onUpsertSchedule: Props["onUpsertSchedule"];
  onUpdateKR: Props["onUpdateKR"];
}) => {
  const [value, setValue] = useState<string>(String(kr.current ?? ""));
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const krCheckIns = useMemo(
    () =>
      checkIns
        .filter((c) => c.krId === kr.id)
        .sort((a, b) => b.checkinDate.localeCompare(a.checkinDate)),
    [checkIns, kr.id]
  );

  const progress = computeKRProgress(kr);
  const lastTwo = krCheckIns.slice(0, 2);
  const prevProgress = lastTwo[1]?.progressManual;

  const frequency = (schedule?.frequency ?? "biweekly") as Frequency;
  const today = todayISO();
  const overdueDays = schedule?.nextDueDate ? daysBetween(today, schedule.nextDueDate) : null;
  const isOverdue = overdueDays !== null && overdueDays > 0;
  const isDueSoon = overdueDays !== null && overdueDays >= -2 && overdueDays <= 0;

  const handleFrequencyChange = async (newFreq: Frequency) => {
    const id = schedule?.id ?? `sch-${kr.id}`;
    const nextDue = today;
    try {
      await onUpsertSchedule({
        id,
        objectiveId: obj.id,
        krId: kr.id,
        frequency: newFreq,
        nextDueDate: schedule?.nextDueDate ?? nextDue,
        lastGeneratedAt: schedule?.lastGeneratedAt ?? null,
      });
      toast.success("Frecuencia actualizada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    }
  };

  const handleInitiativeStatus = async (ini: InitiativeWithContext, status: InitiativeWithContext["status"]) => {
    try {
      await onUpsertInitiative({ ...ini, status });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo actualizar");
    }
  };

  const handleSaveCheckIn = async () => {
    const num = Number(value);
    if (!Number.isFinite(num)) {
      toast.error("Valor inválido");
      return;
    }
    setSaving(true);
    try {
      const candidateKR: KeyResult = { ...kr, current: num };
      const newProgress = computeKRProgress(candidateKR);
      const ci: CheckInRecord = {
        id: `ci-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        objectiveId: obj.id,
        krId: kr.id,
        authorName: currentUserName ?? "Yo",
        authorUserId: currentUserId ?? null,
        checkinDate: today,
        comment: comment.trim().slice(0, 300),
        insight: "",
        leaderComment: "",
        progressAuto: newProgress,
        progressManual: newProgress,
        scoreAuto: Math.min(1, Math.max(0, newProgress / 100)),
        scoreManual: null,
        confidence: newProgress >= 70 ? "green" : newProgress >= 40 ? "yellow" : "red",
        trend: prevProgress === undefined
          ? "flat"
          : newProgress > prevProgress ? "up"
          : newProgress < prevProgress ? "down" : "flat",
        status: "completed",
        blockers: [],
        nextCommitments: [],
        initiativeSnapshots: [],
      };
      await onUpsertCheckIn(ci);
      await onUpdateKR(obj.id, kr.id, num);

      // Bump schedule next_due_date
      const days = freqDays[frequency];
      const nextDue = new Date();
      nextDue.setDate(nextDue.getDate() + days);
      await onUpsertSchedule({
        id: schedule?.id ?? `sch-${kr.id}`,
        objectiveId: obj.id,
        krId: kr.id,
        frequency,
        nextDueDate: nextDue.toISOString().slice(0, 10),
        lastGeneratedAt: new Date().toISOString(),
      });

      setComment("");
      toast.success("Check-in registrado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="text-xs text-muted-foreground truncate">{obj.title}</div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate">{kr.title}</span>
            </h3>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={frequency} onValueChange={(v) => handleFrequencyChange(v as Frequency)}>
              <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="biweekly">Quincenal</SelectItem>
                <SelectItem value="monthly">Mensual</SelectItem>
              </SelectContent>
            </Select>
            {isOverdue && (
              <Badge variant="outline" className="bg-danger/15 text-danger border-danger/30 text-xs gap-1">
                <AlertCircle className="w-3 h-3" /> Atrasado {overdueDays}d
              </Badge>
            )}
            {!isOverdue && isDueSoon && (
              <Badge variant="outline" className="bg-warning/15 text-warning border-warning/30 text-xs gap-1">
                <Calendar className="w-3 h-3" /> Pronto
              </Badge>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className={`font-semibold ${progressTextColor(progress)}`}>{progress}%</span>
              <TrendIndicator prev={prevProgress} curr={progress} />
            </div>
            <span className="text-muted-foreground">
              {kr.current} / {kr.target} {kr.unit ?? ""}
            </span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${progressColor(progress)} transition-all`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-[11px] text-muted-foreground">
            {freqLabel[frequency]} · próximo: {schedule?.nextDueDate ?? "—"}
          </div>
        </div>

        {/* Iniciativas */}
        {initiatives.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-foreground">Iniciativas ({initiatives.length})</div>
            <div className="space-y-1">
              {initiatives.map((ini) => (
                <div key={ini.id} className="flex items-center gap-2 text-xs bg-muted/30 rounded px-2 py-1.5">
                  <span className="flex-1 truncate">{ini.title}</span>
                  <span className="text-muted-foreground hidden sm:inline">{ini.responsible}</span>
                  <Select
                    value={ini.status}
                    onValueChange={(v) => handleInitiativeStatus(ini, v as InitiativeWithContext["status"])}
                  >
                    <SelectTrigger className="h-6 text-[11px] w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(initiativeStatusLabel).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Histórico corto */}
        {krCheckIns.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-foreground">Últimos check-ins</div>
            <div className="space-y-1">
              {krCheckIns.slice(0, 3).map((c) => (
                <div key={c.id} className="text-[11px] flex items-start gap-2 text-muted-foreground">
                  <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className={`font-semibold ${progressTextColor(c.progressManual)}`}>
                      {c.progressManual}%
                    </span>
                    {c.comment && <span className="ml-1.5 text-foreground">{c.comment}</span>}
                    <span className="ml-1.5">· {c.checkinDate} · {c.authorName}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick check-in */}
        <div className="flex items-end gap-2 pt-2 border-t border-border flex-wrap">
          <div className="flex-shrink-0">
            <label className="text-[11px] text-muted-foreground">Nuevo valor</label>
            <Input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="h-8 w-24 text-sm"
            />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="text-[11px] text-muted-foreground">Comentario (opcional)</label>
            <Input
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 300))}
              placeholder="Contexto, bloqueo, decisión..."
              maxLength={300}
              className="h-8 text-sm"
            />
          </div>
          <Button size="sm" onClick={handleSaveCheckIn} disabled={saving} className="h-8">
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const KRCheckinsPanel = ({
  objectives, initiatives, checkIns, schedules,
  currentUserName, currentUserId,
  onUpsertCheckIn, onUpsertInitiative, onUpsertSchedule, onUpdateKR,
}: Props) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "overdue" | "ontrack" | "risk">("all");

  const initiativesByKR = useMemo(() => {
    const m: Record<string, InitiativeWithContext[]> = {};
    initiatives.forEach((i) => { (m[i.krId] ||= []).push(i); });
    return m;
  }, [initiatives]);

  const scheduleByKR = useMemo(() => {
    const m: Record<string, CheckInSchedule> = {};
    schedules.forEach((s) => { if (s.krId) m[s.krId] = s; });
    return m;
  }, [schedules]);

  const allRows = useMemo(() => {
    const rows: { obj: Objective; kr: KeyResult }[] = [];
    objectives.forEach((obj) => obj.keyResults.forEach((kr) => rows.push({ obj, kr })));
    return rows;
  }, [objectives]);

  const today = todayISO();
  const filtered = useMemo(() => {
    return allRows.filter(({ obj, kr }) => {
      if (search) {
        const q = search.toLowerCase();
        if (!kr.title.toLowerCase().includes(q) && !obj.title.toLowerCase().includes(q)) return false;
      }
      const p = computeKRProgress(kr);
      const sched = scheduleByKR[kr.id];
      const overdue = sched?.nextDueDate ? daysBetween(today, sched.nextDueDate) > 0 : false;
      if (statusFilter === "overdue") return overdue;
      if (statusFilter === "risk") return p < 40;
      if (statusFilter === "ontrack") return p >= 70;
      return true;
    });
  }, [allRows, scheduleByKR, search, statusFilter, today]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Input
          placeholder="Buscar KR u OKR..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs h-8 text-sm"
        />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-40 h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="overdue">Atrasados</SelectItem>
            <SelectItem value="risk">En riesgo (&lt;40%)</SelectItem>
            <SelectItem value="ontrack">On track (&gt;70%)</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} de {allRows.length} KRs
        </span>
      </div>

      {filtered.length === 0 && (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground text-center">
            No hay KRs que coincidan con el filtro.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map(({ obj, kr }) => (
          <KRCard
            key={kr.id}
            obj={obj}
            kr={kr}
            initiatives={initiativesByKR[kr.id] ?? []}
            checkIns={checkIns}
            schedule={scheduleByKR[kr.id]}
            currentUserName={currentUserName}
            currentUserId={currentUserId}
            onUpsertCheckIn={onUpsertCheckIn}
            onUpsertInitiative={onUpsertInitiative}
            onUpsertSchedule={onUpsertSchedule}
            onUpdateKR={onUpdateKR}
          />
        ))}
      </div>
    </div>
  );
};

export default KRCheckinsPanel;
