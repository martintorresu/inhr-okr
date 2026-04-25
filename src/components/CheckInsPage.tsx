import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle, ArrowDown, ArrowRight, ArrowUp, MessageSquare,
  Plus, Trash2, Pencil, ShieldCheck, LineChart as LineChartIcon,
} from "lucide-react";
import CheckInTimeline from "@/components/CheckInTimeline";
import { toast } from "sonner";
import type { Objective } from "@/data/types";
import type { InitiativeWithContext } from "@/lib/initiativesPersistence";
import type { TeamMember } from "@/lib/teamPersistence";
import {
  type CheckInRecord, type Confidence, type Trend, type BlockerEntry,
  type CommitmentEntry, type InitiativeSnapshot,
  type CheckInSchedule, type Frequency,
} from "@/lib/checkInsPersistence";

interface CheckInsPageProps {
  objectives: Objective[];
  initiatives: InitiativeWithContext[];
  team: TeamMember[];
  checkIns: CheckInRecord[];
  isAdmin: boolean;
  currentUserName?: string;
  currentUserId?: string | null;
  onUpsert: (ci: CheckInRecord) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  schedules: CheckInSchedule[];
  onScheduleUpsert: (s: CheckInSchedule) => Promise<void>;
}

const confidenceMeta: Record<Confidence, { label: string; cls: string }> = {
  green: { label: "On track", cls: "bg-success/15 text-success border-success/30" },
  yellow: { label: "Riesgo", cls: "bg-warning/15 text-warning border-warning/30" },
  red: { label: "Off track", cls: "bg-danger/15 text-danger border-danger/30" },
};

const TrendIcon = ({ t }: { t: Trend }) =>
  t === "up" ? <ArrowUp className="w-3.5 h-3.5 text-success" />
  : t === "down" ? <ArrowDown className="w-3.5 h-3.5 text-danger" />
  : <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />;

const blockerLabel: Record<BlockerEntry["type"], string> = {
  resources: "Recursos",
  dependencies: "Dependencias",
  alignment: "Alineamiento",
  priorities: "Prioridades",
  other: "Otro",
};

const initiativeStatusLabel: Record<InitiativeSnapshot["status"], string> = {
  not_started: "No iniciada",
  in_progress: "En progreso",
  blocked: "Bloqueada",
  completed: "Completada",
};

const initiativeStatusCls: Record<InitiativeSnapshot["status"], string> = {
  not_started: "bg-muted text-muted-foreground",
  in_progress: "bg-primary/15 text-primary",
  blocked: "bg-danger/15 text-danger",
  completed: "bg-success/15 text-success",
};

const emptyDraft = (objectiveId: string, authorName: string, authorUserId?: string | null): CheckInRecord => ({
  id: `ci-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  objectiveId,
  krId: null,
  authorName,
  authorUserId: authorUserId ?? null,
  checkinDate: new Date().toISOString().slice(0, 10),
  comment: "",
  insight: "",
  leaderComment: "",
  progressAuto: 0,
  progressManual: 0,
  scoreAuto: 0,
  scoreManual: null,
  confidence: "green",
  trend: "flat",
  status: "submitted",
  blockers: [],
  nextCommitments: [],
  initiativeSnapshots: [],
});

const CheckInsPage = ({
  objectives, initiatives, team, checkIns, isAdmin, currentUserName, currentUserId,
  onUpsert, onDelete, schedules, onScheduleUpsert,
}: CheckInsPageProps) => {
  const [tab, setTab] = useState<"individual" | "admin">("individual");
  const [editor, setEditor] = useState<{ open: boolean; draft: CheckInRecord | null }>({ open: false, draft: null });
  const [filterRisk, setFilterRisk] = useState<"all" | Confidence>("all");
  const [timelineObj, setTimelineObj] = useState<Objective | null>(null);

  const objectiveById = useMemo(() => Object.fromEntries(objectives.map((o) => [o.id, o])), [objectives]);
  const initiativesByKR = useMemo(() => {
    const m: Record<string, InitiativeWithContext[]> = {};
    initiatives.forEach((i) => { (m[i.krId] ||= []).push(i); });
    return m;
  }, [initiatives]);

  const myCheckIns = useMemo(
    () => checkIns.filter((c) => !currentUserName || c.authorName === currentUserName),
    [checkIns, currentUserName]
  );

  // Latest checkin per objective for admin view.
  const latestByObjective = useMemo(() => {
    const m: Record<string, CheckInRecord> = {};
    [...checkIns].sort((a, b) => b.checkinDate.localeCompare(a.checkinDate)).forEach((c) => {
      if (!m[c.objectiveId]) m[c.objectiveId] = c;
    });
    return m;
  }, [checkIns]);

  const adminRows = useMemo(() => {
    return objectives.map((obj) => {
      const last = latestByObjective[obj.id];
      const inis = obj.keyResults.flatMap((kr) => initiativesByKR[kr.id] ?? []);
      const blockedInis = inis.filter((i) => i.status === "blocked").length;
      return { obj, last, blockedInis, totalInis: inis.length };
    }).filter((r) => filterRisk === "all" || (r.last?.confidence ?? "green") === filterRisk)
      .sort((a, b) => {
        const order: Record<Confidence, number> = { red: 0, yellow: 1, green: 2 };
        const ac = a.last?.confidence ?? "green";
        const bc = b.last?.confidence ?? "green";
        return order[ac] - order[bc];
      });
  }, [objectives, latestByObjective, initiativesByKR, filterRisk]);

  const openNew = () => {
    if (!objectives.length) {
      toast.error("Crea primero un OKR");
      return;
    }
    const d = emptyDraft(objectives[0].id, currentUserName ?? "Yo", currentUserId);
    syncAuto(d, objectives[0]);
    setEditor({ open: true, draft: d });
  };

  const openEdit = (ci: CheckInRecord) => setEditor({ open: true, draft: { ...ci } });

  const syncAuto = (draft: CheckInRecord, obj: Objective) => {
    // Auto progress = average KR progress; auto score = progress/100 (0..1)
    const krs = obj.keyResults;
    const avg = krs.length ? Math.round(krs.reduce((s, k) => s + (k.progress ?? 0), 0) / krs.length) : 0;
    draft.progressAuto = avg;
    draft.scoreAuto = Math.min(1, Math.max(0, avg / 100));
    if (!draft.progressManual) draft.progressManual = avg;
    // Snapshot iniciativas vinculadas a los KRs del OKR
    draft.initiativeSnapshots = obj.keyResults.flatMap((kr) =>
      (initiativesByKR[kr.id] ?? []).map<InitiativeSnapshot>((i) => ({
        initiativeId: i.id,
        title: i.title,
        status: i.status,
        impact: "medium",
      }))
    );
  };

  const save = async () => {
    if (!editor.draft) return;
    try {
      await onUpsert(editor.draft);
      toast.success("Check-in guardado");
      setEditor({ open: false, draft: null });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    }
  };

  const remove = async (id: string) => {
    try {
      await onDelete(id);
      toast.success("Check-in eliminado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo eliminar");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Check-ins</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Seguimiento continuo: progreso, scoring y bloqueos por OKR
          </p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" /> Nuevo check-in
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "individual" | "admin")}>
        <TabsList>
          <TabsTrigger value="individual">Mi vista</TabsTrigger>
          <TabsTrigger value="admin" disabled={!isAdmin} className="gap-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Vista equipo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="mt-4 space-y-3">
          {myCheckIns.length === 0 && (
            <Card><CardContent className="p-6 text-sm text-muted-foreground text-center">
              Aún no tienes check-ins. Crea el primero.
            </CardContent></Card>
          )}
          {myCheckIns.map((ci) => (
            <CheckInCard
              key={ci.id} ci={ci} obj={objectiveById[ci.objectiveId]}
              onEdit={() => openEdit(ci)} onDelete={() => remove(ci.id)} canManage
            />
          ))}
        </TabsContent>

        <TabsContent value="admin" className="mt-4 space-y-4">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Filtrar por riesgo:</Label>
            <Select value={filterRisk} onValueChange={(v) => setFilterRisk(v as any)}>
              <SelectTrigger className="w-40 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="red">Off track</SelectItem>
                <SelectItem value="yellow">En riesgo</SelectItem>
                <SelectItem value="green">On track</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Estado consolidado por OKR</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>OKR</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead className="text-center">Avance</TableHead>
                    <TableHead className="text-center">Score (auto / man.)</TableHead>
                    <TableHead className="text-center">Confianza</TableHead>
                    <TableHead className="text-center">Iniciativas</TableHead>
                    <TableHead className="text-right">Último check-in</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminRows.map(({ obj, last, blockedInis, totalInis }) => {
                    const conf = (last?.confidence ?? "green") as Confidence;
                    const meta = confidenceMeta[conf];
                    return (
                      <TableRow key={obj.id}>
                        <TableCell className="max-w-[280px]">
                          <div className="font-medium text-sm truncate">{obj.title}</div>
                          <div className="text-xs text-muted-foreground">{obj.area}</div>
                        </TableCell>
                        <TableCell className="text-sm">{obj.owner}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="font-medium">{last?.progressManual ?? obj.progress}%</span>
                            {last && <TrendIcon t={last.trend} />}
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {last ? (
                            <>
                              {last.scoreAuto.toFixed(2)} / {last.scoreManual !== null ? last.scoreManual.toFixed(2) : "—"}
                            </>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={`${meta.cls} text-xs`}>{meta.label}</Badge>
                        </TableCell>
                        <TableCell className="text-center text-xs">
                          <span className="text-muted-foreground">{totalInis}</span>
                          {blockedInis > 0 && (
                            <span className="ml-2 inline-flex items-center gap-1 text-danger">
                              <AlertTriangle className="w-3 h-3" /> {blockedInis}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {last ? `${last.checkinDate} · ${last.authorName}` : "Sin check-in"}
                        </TableCell>
                        <TableCell className="text-right">
                          {last && (
                            <Button variant="ghost" size="icon" onClick={() => openEdit(last)}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {adminRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                        Sin OKRs que coincidan con el filtro
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <SchedulesPanel
            objectives={objectives}
            schedules={schedules}
            onUpsert={onScheduleUpsert}
          />

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Historial reciente</h3>
            {checkIns.slice(0, 10).map((ci) => (
              <CheckInCard
                key={ci.id} ci={ci} obj={objectiveById[ci.objectiveId]}
                onEdit={() => openEdit(ci)} onDelete={() => remove(ci.id)} canManage
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <CheckInEditor
        state={editor}
        objectives={objectives}
        initiativesByKR={initiativesByKR}
        team={team}
        isAdmin={isAdmin}
        onChange={(d) => setEditor((s) => ({ ...s, draft: d }))}
        onObjectiveChange={(objId) => {
          if (!editor.draft) return;
          const next = { ...editor.draft, objectiveId: objId };
          const obj = objectiveById[objId];
          if (obj) syncAuto(next, obj);
          setEditor({ open: true, draft: next });
        }}
        onClose={() => setEditor({ open: false, draft: null })}
        onSave={save}
      />
    </div>
  );
};

// ============= Subcomponents =============

const CheckInCard = ({
  ci, obj, onEdit, onDelete, canManage,
}: {
  ci: CheckInRecord;
  obj?: Objective;
  onEdit: () => void;
  onDelete: () => void;
  canManage: boolean;
}) => {
  const meta = confidenceMeta[ci.confidence];
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 space-y-2 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground truncate">{obj?.title ?? "OKR"}</h3>
                <p className="text-xs text-muted-foreground">{ci.checkinDate} · {ci.authorName}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`${meta.cls} text-xs`}>{meta.label}</Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendIcon t={ci.trend} /> {ci.progressManual}%
                </span>
                <span className="text-xs text-muted-foreground">
                  Score {ci.scoreAuto.toFixed(2)} / {ci.scoreManual !== null ? ci.scoreManual.toFixed(2) : "—"}
                </span>
                {canManage && (
                  <>
                    <Button variant="ghost" size="icon" onClick={onEdit}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" onClick={onDelete}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </>
                )}
              </div>
            </div>

            {ci.comment && <p className="text-sm text-muted-foreground">{ci.comment}</p>}

            {ci.initiativeSnapshots.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {ci.initiativeSnapshots.map((s) => (
                  <span
                    key={s.initiativeId}
                    className={`text-[11px] px-2 py-0.5 rounded ${initiativeStatusCls[s.status]}`}
                    title={s.title}
                  >
                    {s.title.length > 30 ? `${s.title.slice(0, 28)}…` : s.title} · {initiativeStatusLabel[s.status]}
                  </span>
                ))}
              </div>
            )}

            {ci.blockers.length > 0 && (
              <div className="space-y-1">
                {ci.blockers.map((b, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-danger bg-danger/10 px-3 py-1.5 rounded-md">
                    <AlertTriangle className="w-3 h-3" />
                    <span><strong>{blockerLabel[b.type]}:</strong> {b.description}</span>
                  </div>
                ))}
              </div>
            )}

            {ci.nextCommitments.length > 0 && (
              <div className="text-xs text-muted-foreground">
                <strong className="text-foreground">Próximos compromisos:</strong>{" "}
                {ci.nextCommitments.map((c) => c.text).join(" · ")}
              </div>
            )}

            {ci.insight && (
              <p className="text-xs italic text-muted-foreground">💡 {ci.insight}</p>
            )}

            {ci.leaderComment && (
              <div className="text-xs bg-primary/5 border border-primary/20 rounded-md px-3 py-2">
                <strong className="text-primary">Comentario del líder:</strong> {ci.leaderComment}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const CheckInEditor = ({
  state, objectives, initiativesByKR, isAdmin, team,
  onChange, onObjectiveChange, onClose, onSave,
}: {
  state: { open: boolean; draft: CheckInRecord | null };
  objectives: Objective[];
  initiativesByKR: Record<string, InitiativeWithContext[]>;
  team: TeamMember[];
  isAdmin: boolean;
  onChange: (d: CheckInRecord) => void;
  onObjectiveChange: (objId: string) => void;
  onClose: () => void;
  onSave: () => void;
}) => {
  const d = state.draft;
  if (!d) return null;
  const obj = objectives.find((o) => o.id === d.objectiveId);
  const inis = obj?.keyResults.flatMap((kr) => initiativesByKR[kr.id] ?? []) ?? [];
  void team;

  const update = (patch: Partial<CheckInRecord>) => onChange({ ...d, ...patch });

  return (
    <Dialog open={state.open} onOpenChange={(o) => (!o && onClose())}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Check-in</DialogTitle></DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">OKR</Label>
              <Select value={d.objectiveId} onValueChange={onObjectiveChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {objectives.map((o) => (<SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Fecha</Label>
              <Input type="date" value={d.checkinDate} onChange={(e) => update({ checkinDate: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Avance manual %</Label>
              <Input type="number" min={0} max={100} value={d.progressManual}
                onChange={(e) => update({ progressManual: Number(e.target.value) })} />
              <p className="text-[10px] text-muted-foreground mt-1">Auto: {d.progressAuto}%</p>
            </div>
            <div>
              <Label className="text-xs">Score manual (0–1)</Label>
              <Input type="number" min={0} max={1} step={0.05}
                value={d.scoreManual ?? ""}
                placeholder={d.scoreAuto.toFixed(2)}
                onChange={(e) => update({ scoreManual: e.target.value === "" ? null : Number(e.target.value) })} />
              <p className="text-[10px] text-muted-foreground mt-1">Auto: {d.scoreAuto.toFixed(2)}</p>
            </div>
            <div>
              <Label className="text-xs">Confianza</Label>
              <Select value={d.confidence} onValueChange={(v) => update({ confidence: v as Confidence })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="green">On track</SelectItem>
                  <SelectItem value="yellow">Riesgo</SelectItem>
                  <SelectItem value="red">Off track</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs">Tendencia</Label>
            <Select value={d.trend} onValueChange={(v) => update({ trend: v as Trend })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="up">↑ Mejorando</SelectItem>
                <SelectItem value="flat">→ Estable</SelectItem>
                <SelectItem value="down">↓ Empeorando</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Comentario</Label>
            <Textarea rows={2} value={d.comment} onChange={(e) => update({ comment: e.target.value })}
              placeholder="¿Qué pasó este periodo?" />
          </div>

          <div>
            <Label className="text-xs">Aprendizaje / insight</Label>
            <Textarea rows={2} value={d.insight} onChange={(e) => update({ insight: e.target.value })}
              placeholder="¿Qué aprendiste?" />
          </div>

          {/* Iniciativas */}
          <div className="space-y-2">
            <Label className="text-xs">Iniciativas vinculadas</Label>
            {inis.length === 0 && (
              <p className="text-xs text-muted-foreground">Sin iniciativas vinculadas a este OKR</p>
            )}
            {inis.map((i) => {
              const snap = d.initiativeSnapshots.find((s) => s.initiativeId === i.id) ?? {
                initiativeId: i.id, title: i.title, status: i.status, impact: "medium" as const,
              };
              return (
                <div key={i.id} className="flex items-center gap-2 text-xs">
                  <span className="flex-1 truncate">{i.title}</span>
                  <Select value={snap.status} onValueChange={(v) => {
                    const next = d.initiativeSnapshots.filter((s) => s.initiativeId !== i.id);
                    next.push({ ...snap, status: v as InitiativeSnapshot["status"] });
                    update({ initiativeSnapshots: next });
                  }}>
                    <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_started">No iniciada</SelectItem>
                      <SelectItem value="in_progress">En progreso</SelectItem>
                      <SelectItem value="blocked">Bloqueada</SelectItem>
                      <SelectItem value="completed">Completada</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={snap.impact} onValueChange={(v) => {
                    const next = d.initiativeSnapshots.filter((s) => s.initiativeId !== i.id);
                    next.push({ ...snap, impact: v as InitiativeSnapshot["impact"] });
                    update({ initiativeSnapshots: next });
                  }}>
                    <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Bajo</SelectItem>
                      <SelectItem value="medium">Medio</SelectItem>
                      <SelectItem value="high">Alto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>

          {/* Bloqueadores */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Bloqueadores</Label>
              <Button variant="ghost" size="sm" className="h-7 text-xs"
                onClick={() => update({ blockers: [...d.blockers, { type: "other", description: "" }] })}>
                <Plus className="w-3 h-3" /> Agregar
              </Button>
            </div>
            {d.blockers.map((b, i) => (
              <div key={i} className="flex items-center gap-2">
                <Select value={b.type} onValueChange={(v) => {
                  const next = [...d.blockers]; next[i] = { ...b, type: v as BlockerEntry["type"] };
                  update({ blockers: next });
                }}>
                  <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="resources">Recursos</SelectItem>
                    <SelectItem value="dependencies">Dependencias</SelectItem>
                    <SelectItem value="alignment">Alineamiento</SelectItem>
                    <SelectItem value="priorities">Prioridades</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
                <Input className="h-8 text-xs flex-1" value={b.description}
                  placeholder="Descripción"
                  onChange={(e) => {
                    const next = [...d.blockers]; next[i] = { ...b, description: e.target.value };
                    update({ blockers: next });
                  }} />
                <Button variant="ghost" size="icon" className="h-8 w-8"
                  onClick={() => update({ blockers: d.blockers.filter((_, j) => j !== i) })}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>

          {/* Próximos compromisos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Próximos compromisos</Label>
              <Button variant="ghost" size="sm" className="h-7 text-xs"
                onClick={() => update({ nextCommitments: [...d.nextCommitments, { text: "" }] })}>
                <Plus className="w-3 h-3" /> Agregar
              </Button>
            </div>
            {d.nextCommitments.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input className="h-8 text-xs flex-1" value={c.text}
                  onChange={(e) => {
                    const next = [...d.nextCommitments]; next[i] = { ...c, text: e.target.value };
                    update({ nextCommitments: next });
                  }} />
                <Button variant="ghost" size="icon" className="h-8 w-8"
                  onClick={() => update({ nextCommitments: d.nextCommitments.filter((_, j) => j !== i) })}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>

          {isAdmin && (
            <div>
              <Label className="text-xs">Comentario del líder</Label>
              <Textarea rows={2} value={d.leaderComment}
                onChange={(e) => update({ leaderComment: e.target.value })}
                placeholder="Feedback / ajuste de foco" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={onSave}>Guardar check-in</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


const SchedulesPanel = ({
  objectives, schedules, onUpsert,
}: {
  objectives: Objective[];
  schedules: CheckInSchedule[];
  onUpsert: (s: CheckInSchedule) => Promise<void>;
}) => {
  const byObj = useMemo(
    () => Object.fromEntries(schedules.map((s) => [s.objectiveId, s])),
    [schedules]
  );

  const update = async (objId: string, frequency: Frequency) => {
    const existing = byObj[objId];
    const days = frequency === "weekly" ? 7 : frequency === "monthly" ? 30 : 14;
    const next: CheckInSchedule = {
      id: existing?.id ?? `sch-${objId}`,
      objectiveId: objId,
      frequency,
      nextDueDate: existing?.nextDueDate ?? new Date(Date.now() + days * 86400000).toISOString().slice(0, 10),
      lastGeneratedAt: existing?.lastGeneratedAt ?? null,
    };
    try {
      await onUpsert(next);
      toast.success("Frecuencia actualizada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Frecuencia de check-ins por OKR</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>OKR</TableHead>
              <TableHead className="w-40">Frecuencia</TableHead>
              <TableHead className="text-right">Próximo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {objectives.map((o) => {
              const s = byObj[o.id];
              return (
                <TableRow key={o.id}>
                  <TableCell className="text-sm">
                    <div className="font-medium truncate max-w-[320px]">{o.title}</div>
                    <div className="text-xs text-muted-foreground">{o.area}</div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={s?.frequency ?? "biweekly"}
                      onValueChange={(v) => update(o.id, v as Frequency)}
                    >
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="biweekly">Quincenal</SelectItem>
                        <SelectItem value="monthly">Mensual</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {s?.nextDueDate ?? "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default CheckInsPage;
