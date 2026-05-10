import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowDown, ArrowRight, ArrowUp, Calendar, MessageSquare, Target,
  AlertCircle, AlertTriangle, Sparkles, CheckCircle2, Activity,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Objective, KeyResult } from "@/data/types";
import type { InitiativeWithContext } from "@/lib/initiativesPersistence";
import {
  type CheckInRecord, type CheckInSchedule, type Frequency,
  type Confidence, type BlockerEntry,
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

const blockerTypeLabel: Record<BlockerEntry["type"], string> = {
  resources: "Recursos",
  dependencies: "Dependencias",
  alignment: "Alineamiento",
  priorities: "Prioridades",
  other: "Otro",
};

const confidenceLabel: Record<Confidence, string> = {
  green: "On track",
  yellow: "En riesgo",
  red: "Crítico",
};

const confidenceCls: Record<Confidence, string> = {
  green: "bg-success/15 text-success border-success/30",
  yellow: "bg-warning/15 text-warning border-warning/30",
  red: "bg-danger/15 text-danger border-danger/30",
};

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

const todayISO = () => new Date().toISOString().slice(0, 10);
const daysBetween = (a: string, b: string) =>
  Math.round((new Date(a).getTime() - new Date(b).getTime()) / 86400000);

const TrendIndicator = ({ prev, curr }: { prev?: number; curr: number }) => {
  if (prev === undefined) return <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />;
  if (curr > prev) return <ArrowUp className="w-3.5 h-3.5 text-success" />;
  if (curr < prev) return <ArrowDown className="w-3.5 h-3.5 text-danger" />;
  return <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />;
};

// ---------- alerts & summary ----------
interface KRStatus {
  overdue: boolean;
  overdueDays: number | null;
  atRisk: boolean;
  stalled: boolean;
  noActivity: boolean;
  daysSinceLast: number | null;
  level: Confidence;
  message: string;
}

const computeKRStatus = (
  kr: KeyResult,
  krCheckIns: CheckInRecord[],
  schedule?: CheckInSchedule
): KRStatus => {
  const today = todayISO();
  const progress = computeKRProgress(kr);
  const overdueDays = schedule?.nextDueDate ? daysBetween(today, schedule.nextDueDate) : null;
  const overdue = overdueDays !== null && overdueDays > 0;

  const last = krCheckIns[0];
  const prev = krCheckIns[1];
  const daysSinceLast = last ? daysBetween(today, last.checkinDate) : null;
  const noActivity = !last;
  const stalled =
    !!last && !!prev &&
    (last.progressManual ?? 0) <= (prev.progressManual ?? 0);

  const atRisk = progress < 40;

  let level: Confidence = "green";
  let message = "Buen progreso sostenido";

  if (noActivity) {
    level = "yellow";
    message = "Sin actualización reciente";
  } else if (overdue) {
    level = "red";
    message = `Check-in atrasado ${overdueDays} día${overdueDays === 1 ? "" : "s"}`;
  } else if (atRisk) {
    level = "red";
    message = "KR en riesgo por bajo avance";
  } else if (stalled) {
    level = "yellow";
    message = "Estancado: 2 check-ins sin mejora";
  } else if (last?.confidence === "red") {
    level = "red";
    message = "Reportado como crítico";
  } else if (last?.confidence === "yellow") {
    level = "yellow";
    message = "Reportado en riesgo";
  } else if (progress >= 70) {
    level = "green";
    message = "On track";
  } else {
    level = "yellow";
    message = "Avance moderado, requiere atención";
  }

  return { overdue, overdueDays, atRisk, stalled, noActivity, daysSinceLast, level, message };
};

interface InitiativeMetrics {
  total: number;
  in_progress: number;
  blocked: number;
  completed: number;
  pctCompleted: number;
}
const computeInitiativeMetrics = (inis: InitiativeWithContext[]): InitiativeMetrics => {
  const total = inis.length;
  const in_progress = inis.filter((i) => i.status === "in_progress").length;
  const blocked = inis.filter((i) => i.status === "blocked").length;
  const completed = inis.filter((i) => i.status === "completed").length;
  const pctCompleted = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { total, in_progress, blocked, completed, pctCompleted };
};

// ---------- check-in dialog ----------
interface DraftState {
  value: string;
  comment: string;
  confidence: Confidence;
  nextCommitment: string;
  blockerType: BlockerEntry["type"];
  blockerDescription: string;
}

const emptyDraft = (kr: KeyResult): DraftState => ({
  value: String(kr.current ?? ""),
  comment: "",
  confidence: "green",
  nextCommitment: "",
  blockerType: "other",
  blockerDescription: "",
});

const CheckInDialog = ({
  open, onOpenChange, kr, obj, draft, setDraft, onSave, saving, projectedProgress,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  kr: KeyResult;
  obj: Objective;
  draft: DraftState;
  setDraft: (d: DraftState) => void;
  onSave: () => void;
  saving: boolean;
  projectedProgress: number;
}) => {
  const blockerRequired = projectedProgress < 40;
  const canSave =
    draft.value.trim() !== "" &&
    Number.isFinite(Number(draft.value)) &&
    draft.nextCommitment.trim().length > 0 &&
    (!blockerRequired || draft.blockerDescription.trim().length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">
            Nuevo check-in · {kr.title}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">{obj.title}</p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Valor */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Nuevo valor *</Label>
              <Input
                type="number"
                value={draft.value}
                onChange={(e) => setDraft({ ...draft, value: e.target.value })}
                className="h-9"
              />
              <div className="text-[11px] text-muted-foreground">
                Meta: {kr.target} {kr.unit ?? ""}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Progreso proyectado</Label>
              <div className={`h-9 flex items-center font-semibold ${progressTextColor(projectedProgress)}`}>
                {projectedProgress}%
              </div>
            </div>
          </div>

          {/* Estado del KR */}
          <div className="space-y-1.5">
            <Label className="text-xs">Estado del KR *</Label>
            <Select
              value={draft.confidence}
              onValueChange={(v) => setDraft({ ...draft, confidence: v as Confidence })}
            >
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="green">On track</SelectItem>
                <SelectItem value="yellow">En riesgo</SelectItem>
                <SelectItem value="red">Crítico</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bloqueo */}
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              Bloqueo {blockerRequired && <span className="text-danger">* (obligatorio si progreso &lt; 40%)</span>}
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <Select
                value={draft.blockerType}
                onValueChange={(v) => setDraft({ ...draft, blockerType: v as BlockerEntry["type"] })}
              >
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(blockerTypeLabel).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                className="h-9 col-span-2"
                placeholder={blockerRequired ? "Describe el bloqueo (obligatorio)" : "Describe el bloqueo (opcional)"}
                value={draft.blockerDescription}
                onChange={(e) => setDraft({ ...draft, blockerDescription: e.target.value.slice(0, 300) })}
                maxLength={300}
              />
            </div>
          </div>

          {/* Próximo compromiso */}
          <div className="space-y-1.5">
            <Label className="text-xs">Próximo compromiso *</Label>
            <Input
              className="h-9"
              placeholder="Acción concreta para el próximo período"
              value={draft.nextCommitment}
              onChange={(e) => setDraft({ ...draft, nextCommitment: e.target.value.slice(0, 300) })}
              maxLength={300}
            />
          </div>

          {/* Comentario */}
          <div className="space-y-1.5">
            <Label className="text-xs">Comentario (opcional)</Label>
            <Textarea
              rows={2}
              maxLength={300}
              value={draft.comment}
              onChange={(e) => setDraft({ ...draft, comment: e.target.value.slice(0, 300) })}
              placeholder="Contexto, decisiones, aprendizaje..."
              className="text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={onSave} disabled={!canSave || saving}>
            {saving ? "Guardando..." : "Guardar check-in"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ---------- KR card ----------
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
  const [draft, setDraft] = useState<DraftState>(() => emptyDraft(kr));
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const krCheckIns = useMemo(
    () =>
      checkIns
        .filter((c) => c.krId === kr.id)
        .sort((a, b) => b.checkinDate.localeCompare(a.checkinDate)),
    [checkIns, kr.id]
  );

  const progress = computeKRProgress(kr);
  const prevProgress = krCheckIns[1]?.progressManual;
  const status = useMemo(() => computeKRStatus(kr, krCheckIns, schedule), [kr, krCheckIns, schedule]);
  const iniMetrics = useMemo(() => computeInitiativeMetrics(initiatives), [initiatives]);

  const projectedProgress = useMemo(() => {
    const num = Number(draft.value);
    if (!Number.isFinite(num)) return progress;
    return computeKRProgress({ ...kr, current: num });
  }, [draft.value, kr, progress]);

  const frequency = (schedule?.frequency ?? "biweekly") as Frequency;
  const today = todayISO();

  const openDialog = () => {
    setDraft(emptyDraft(kr));
    setOpen(true);
  };

  const handleFrequencyChange = async (newFreq: Frequency) => {
    const id = schedule?.id ?? `sch-${kr.id}`;
    try {
      await onUpsertSchedule({
        id,
        objectiveId: obj.id,
        krId: kr.id,
        frequency: newFreq,
        nextDueDate: schedule?.nextDueDate ?? today,
        lastGeneratedAt: schedule?.lastGeneratedAt ?? null,
      });
      toast.success("Frecuencia actualizada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    }
  };

  const handleInitiativeStatus = async (ini: InitiativeWithContext, newStatus: InitiativeWithContext["status"]) => {
    try {
      await onUpsertInitiative({ ...ini, status: newStatus });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo actualizar");
    }
  };

  const fetchAIInsight = async (newCurrent: number, comment: string): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke("review-kr", {
        body: {
          kr_id: kr.id,
          objective: obj.title,
          keyResult: kr.title,
          source: "manual",
          context: {
            metric: kr.unit ?? "",
            baseline: kr.initialValue ?? 0,
            target: kr.target,
            current: newCurrent,
            owner: obj.owner,
            notes: comment,
          },
        },
      });
      if (error) throw error;
      const summary: string = data?.ai_review?.summary ?? "";
      return summary;
    } catch (e) {
      console.warn("review-kr no disponible:", e);
      return "";
    }
  };

  const handleSave = async () => {
    const num = Number(draft.value);
    if (!Number.isFinite(num)) {
      toast.error("Valor inválido");
      return;
    }
    if (draft.nextCommitment.trim().length === 0) {
      toast.error("Próximo compromiso es obligatorio");
      return;
    }
    if (projectedProgress < 40 && draft.blockerDescription.trim().length === 0) {
      toast.error("Debes registrar el bloqueo (progreso < 40%)");
      return;
    }

    setSaving(true);
    try {
      // 1. AI insight (best-effort, non-blocking failure)
      toast.message("Analizando con IA...");
      const insight = await fetchAIInsight(num, draft.comment);

      const blockers: BlockerEntry[] = draft.blockerDescription.trim()
        ? [{ type: draft.blockerType, description: draft.blockerDescription.trim() }]
        : [];
      const nextCommitments = draft.nextCommitment.trim()
        ? [{ text: draft.nextCommitment.trim(), done: false }]
        : [];

      const ci: CheckInRecord = {
        id: `ci-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        objectiveId: obj.id,
        krId: kr.id,
        authorName: currentUserName ?? "Yo",
        authorUserId: currentUserId ?? null,
        checkinDate: today,
        comment: draft.comment.trim().slice(0, 300),
        insight,
        leaderComment: "",
        progressAuto: projectedProgress,
        progressManual: projectedProgress,
        scoreAuto: Math.min(1, Math.max(0, projectedProgress / 100)),
        scoreManual: null,
        confidence: draft.confidence,
        trend: prevProgress === undefined
          ? "flat"
          : projectedProgress > prevProgress ? "up"
          : projectedProgress < prevProgress ? "down" : "flat",
        status: "completed",
        blockers,
        nextCommitments,
        initiativeSnapshots: [],
      };

      await onUpsertCheckIn(ci);
      await onUpdateKR(obj.id, kr.id, num);

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

      toast.success("Check-in guardado");
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        {/* Resumen ejecutivo */}
        <div className={`rounded-md border px-3 py-2 ${confidenceCls[status.level]}`}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-xs font-semibold">
              {status.level === "red" ? <AlertTriangle className="w-3.5 h-3.5" /> :
               status.level === "yellow" ? <AlertCircle className="w-3.5 h-3.5" /> :
               <CheckCircle2 className="w-3.5 h-3.5" />}
              {confidenceLabel[status.level]}
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {status.overdue && (
                <Badge variant="outline" className="bg-danger/15 text-danger border-danger/30 text-[10px] gap-1">
                  Atrasado {status.overdueDays}d
                </Badge>
              )}
              {status.atRisk && (
                <Badge variant="outline" className="bg-danger/15 text-danger border-danger/30 text-[10px]">
                  En riesgo
                </Badge>
              )}
              {status.stalled && (
                <Badge variant="outline" className="bg-warning/15 text-warning border-warning/30 text-[10px]">
                  Estancado
                </Badge>
              )}
            </div>
          </div>
          <div className="text-xs mt-1">{status.message}</div>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="text-xs text-muted-foreground truncate">{obj.title}</div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate">{kr.title}</span>
            </h3>
          </div>
          <Select value={frequency} onValueChange={(v) => handleFrequencyChange(v as Frequency)}>
            <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="biweekly">Quincenal</SelectItem>
              <SelectItem value="monthly">Mensual</SelectItem>
            </SelectContent>
          </Select>
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
            <div className={`h-full ${progressColor(progress)} transition-all`} style={{ width: `${progress}%` }} />
          </div>
          <div className="text-[11px] text-muted-foreground flex items-center gap-2">
            <Calendar className="w-3 h-3" />
            {freqLabel[frequency]} · próximo: {schedule?.nextDueDate ?? "—"}
            {status.daysSinceLast !== null && (
              <span>· último check-in hace {status.daysSinceLast}d</span>
            )}
          </div>
        </div>

        {/* Iniciativas: métricas */}
        {iniMetrics.total > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-foreground">
                <Activity className="w-3 h-3" />
                <span className="font-medium">Ejecución</span>
                <span className="text-muted-foreground">
                  {iniMetrics.completed}/{iniMetrics.total} ({iniMetrics.pctCompleted}%)
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-primary">{iniMetrics.in_progress} en curso</span>
                {iniMetrics.blocked > 0 && (
                  <span className="text-danger font-medium">{iniMetrics.blocked} bloqueada{iniMetrics.blocked === 1 ? "" : "s"}</span>
                )}
              </div>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${iniMetrics.pctCompleted}%` }} />
            </div>
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

        {/* Histórico */}
        {krCheckIns.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-foreground">Últimos check-ins</div>
            <div className="space-y-1.5">
              {krCheckIns.slice(0, 3).map((c) => (
                <div key={c.id} className="text-[11px] space-y-1">
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className={`font-semibold ${progressTextColor(c.progressManual)}`}>
                        {c.progressManual}%
                      </span>
                      <Badge variant="outline" className={`ml-1.5 px-1 py-0 text-[10px] ${confidenceCls[c.confidence]}`}>
                        {confidenceLabel[c.confidence]}
                      </Badge>
                      {c.comment && <span className="ml-1.5 text-foreground">{c.comment}</span>}
                      <span className="ml-1.5">· {c.checkinDate} · {c.authorName}</span>
                    </div>
                  </div>
                  {c.blockers?.length > 0 && (
                    <div className="ml-5 text-danger flex items-start gap-1">
                      <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                      <span>
                        {c.blockers.map((b) => `${blockerTypeLabel[b.type]}: ${b.description}`).join(" · ")}
                      </span>
                    </div>
                  )}
                  {c.nextCommitments?.length > 0 && (
                    <div className="ml-5 text-foreground/80">
                      → {c.nextCommitments.map((n) => n.text).join(" · ")}
                    </div>
                  )}
                  {c.insight && (
                    <div className="ml-5 flex items-start gap-1 bg-primary/5 border border-primary/20 rounded px-2 py-1 text-foreground">
                      <Sparkles className="w-3 h-3 mt-0.5 text-primary shrink-0" />
                      <span className="italic">{c.insight}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="pt-2 border-t border-border">
          <Button size="sm" className="w-full h-8" onClick={openDialog}>
            Registrar check-in
          </Button>
        </div>
      </CardContent>

      <CheckInDialog
        open={open}
        onOpenChange={setOpen}
        kr={kr}
        obj={obj}
        draft={draft}
        setDraft={setDraft}
        onSave={handleSave}
        saving={saving}
        projectedProgress={projectedProgress}
      />
    </Card>
  );
};

// ---------- panel ----------
const KRCheckinsPanel = ({
  objectives, initiatives, checkIns, schedules,
  currentUserName, currentUserId,
  onUpsertCheckIn, onUpsertInitiative, onUpsertSchedule, onUpdateKR,
}: Props) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "overdue" | "ontrack" | "risk" | "stalled">("all");

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

  const checkInsByKR = useMemo(() => {
    const m: Record<string, CheckInRecord[]> = {};
    checkIns.forEach((c) => { if (c.krId) (m[c.krId] ||= []).push(c); });
    Object.values(m).forEach((arr) => arr.sort((a, b) => b.checkinDate.localeCompare(a.checkinDate)));
    return m;
  }, [checkIns]);

  const allRows = useMemo(() => {
    const rows: { obj: Objective; kr: KeyResult }[] = [];
    objectives.forEach((obj) => obj.keyResults.forEach((kr) => rows.push({ obj, kr })));
    return rows;
  }, [objectives]);

  const filtered = useMemo(() => {
    return allRows.filter(({ obj, kr }) => {
      if (search) {
        const q = search.toLowerCase();
        if (!kr.title.toLowerCase().includes(q) && !obj.title.toLowerCase().includes(q)) return false;
      }
      if (statusFilter === "all") return true;
      const krCis = checkInsByKR[kr.id] ?? [];
      const st = computeKRStatus(kr, krCis, scheduleByKR[kr.id]);
      if (statusFilter === "overdue") return st.overdue;
      if (statusFilter === "risk") return st.atRisk;
      if (statusFilter === "stalled") return st.stalled;
      if (statusFilter === "ontrack") return st.level === "green";
      return true;
    });
  }, [allRows, scheduleByKR, checkInsByKR, search, statusFilter]);

  // Counts for header summary
  const summary = useMemo(() => {
    let red = 0, yellow = 0, green = 0, overdue = 0;
    allRows.forEach(({ kr }) => {
      const st = computeKRStatus(kr, checkInsByKR[kr.id] ?? [], scheduleByKR[kr.id]);
      if (st.level === "red") red++;
      else if (st.level === "yellow") yellow++;
      else green++;
      if (st.overdue) overdue++;
    });
    return { red, yellow, green, overdue };
  }, [allRows, checkInsByKR, scheduleByKR]);

  return (
    <div className="space-y-4">
      {/* Resumen global */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Card><CardContent className="p-3">
          <div className="text-[11px] text-muted-foreground">On track</div>
          <div className="text-xl font-bold text-success">{summary.green}</div>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <div className="text-[11px] text-muted-foreground">En riesgo</div>
          <div className="text-xl font-bold text-warning">{summary.yellow}</div>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <div className="text-[11px] text-muted-foreground">Críticos</div>
          <div className="text-xl font-bold text-danger">{summary.red}</div>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <div className="text-[11px] text-muted-foreground">Atrasados</div>
          <div className="text-xl font-bold text-danger">{summary.overdue}</div>
        </CardContent></Card>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Input
          placeholder="Buscar KR u OKR..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs h-8 text-sm"
        />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-44 h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="overdue">Atrasados</SelectItem>
            <SelectItem value="risk">En riesgo (&lt;40%)</SelectItem>
            <SelectItem value="stalled">Estancados</SelectItem>
            <SelectItem value="ontrack">On track</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} de {allRows.length} KRs
        </span>
      </div>

      {filtered.length === 0 && (
        <Card><CardContent className="p-6 text-sm text-muted-foreground text-center">
          No hay KRs que coincidan con el filtro.
        </CardContent></Card>
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
