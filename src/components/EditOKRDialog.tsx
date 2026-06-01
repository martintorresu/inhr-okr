import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { activeTenantId } from "@/data/tenant";
import { areas, users as defaultUsers } from "@/data/mockData";
import type { TeamMember } from "@/lib/teamPersistence";
import type { Objective, KeyResult } from "@/data/mockData";
import { toast } from "sonner";
import KRReviewButton from "@/components/KRReviewButton";

interface KRDraft {
  id?: string;
  title: string;
  metricType: "percentage" | "numeric" | "ratio";
  target: string;
  initialValue: string;
  current: string;
  direction: "higher_is_better" | "lower_is_better";
  weight: string;
}

interface EditOKRDialogProps {
  objective: Objective | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (objective: Objective) => void;
  team?: TeamMember[];
}

const baseCycles = ["Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026"];

// Fallback list used when a tenant defines too few areas, so the user can
// always reassign the OKR to a different area.
const fallbackAreas = [
  "Dirección General",
  "Comercial",
  "Operaciones",
  "Personas",
  "Finanzas",
];

const uniq = (values: string[]) =>
  Array.from(new Set(values.filter((v) => v && v.trim())));

const emptyKR = (): KRDraft => ({
  title: "",
  metricType: "numeric",
  target: "",
  initialValue: "",
  current: "",
  direction: "higher_is_better",
  weight: "",
});

const krToDraft = (kr: KeyResult): KRDraft => ({
  id: kr.id,
  title: kr.title,
  metricType:
    kr.type === "percentage" ? "percentage" : kr.type === "ratio" ? "ratio" : "numeric",
  target: String(kr.target ?? ""),
  initialValue: String(kr.initialValue ?? 0),
  current: String(kr.current ?? 0),
  direction: kr.direction ?? "higher_is_better",
  weight: kr.weight !== undefined ? String(kr.weight) : "",
});

const EditOKRDialog = ({ objective, open, onOpenChange, onSave, team }: EditOKRDialogProps) => {
  const users = team && team.length ? team : defaultUsers;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [area, setArea] = useState("");
  const [owner, setOwner] = useState("");
  const [contributors, setContributors] = useState<string[]>([]);
  const [cycle, setCycle] = useState("");
  const [level, setLevel] = useState<"company" | "area" | "project">("area");
  const [status, setStatus] = useState<Objective["status"]>("draft");
  const [keyResults, setKeyResults] = useState<KRDraft[]>([emptyKR()]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingObjective, setPendingObjective] = useState<Objective | null>(null);
  const [changeSummary, setChangeSummary] = useState<string[]>([]);
  const [blockedKRs, setBlockedKRs] = useState<Record<number, boolean>>({});
  const aiKrReviewEnabled = activeTenantId !== "grupoactitud";

  // Always offer multiple areas (some tenants only define one) and keep the
  // OKR's current area selectable even if it's not in the tenant list.
  const areaOptions = uniq([
    ...(areas.length > 1 ? areas : [...areas, ...fallbackAreas]),
    area,
  ]);
  // Always show the standard quarters plus the current value if it differs.
  const cycleOptions = uniq([...baseCycles, cycle]);

  useEffect(() => {
    if (objective && open) {
      setTitle(objective.title);
      setDescription(objective.description ?? "");
      setArea(objective.area);
      setOwner(objective.owner);
      setContributors(objective.contributors ?? []);
      setCycle(objective.quarter);
      setLevel(objective.level);
      setStatus(objective.status);
      setKeyResults(
        objective.keyResults.length ? objective.keyResults.map(krToDraft) : [emptyKR()]
      );
      setBlockedKRs({});
    }
  }, [objective, open]);

  const addKR = () => {
    if (keyResults.length >= 8) return;
    setKeyResults([...keyResults, emptyKR()]);
  };

  const removeKR = (idx: number) => {
    if (keyResults.length <= 1) return;
    setKeyResults(keyResults.filter((_, i) => i !== idx));
    setBlockedKRs((prev) => {
      const next: Record<number, boolean> = {};
      Object.entries(prev).forEach(([k, v]) => {
        const i = Number(k);
        if (i < idx) next[i] = v;
        else if (i > idx) next[i - 1] = v;
      });
      return next;
    });
  };

  const updateKR = (idx: number, field: keyof KRDraft, value: string) => {
    const updated = [...keyResults];
    updated[idx] = { ...updated[idx], [field]: value } as KRDraft;
    setKeyResults(updated);
    if (field === "title") {
      setBlockedKRs((prev) => {
        if (!(idx in prev)) return prev;
        const { [idx]: _omit, ...rest } = prev;
        return rest;
      });
    }
  };

  const toggleContributor = (name: string) => {
    setContributors((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  const validKRs = keyResults.filter((kr) => kr.title.trim());
  const totalWeight = validKRs.reduce((sum, kr) => sum + (parseFloat(kr.weight) || 0), 0);

  const computeProgress = (kr: KRDraft): number => {
    const init = parseFloat(kr.initialValue) || 0;
    const target = parseFloat(kr.target) || 0;
    const current = parseFloat(kr.current) || 0;
    if (target === init) return 0;
    const raw =
      kr.direction === "lower_is_better"
        ? ((init - current) / (init - target)) * 100
        : ((current - init) / (target - init)) * 100;
    return Math.max(0, Math.min(100, Math.round(raw)));
  };

  const buildSummary = (updated: Objective): string[] => {
    if (!objective) return [];
    const diffs: string[] = [];
    if (objective.title !== updated.title) diffs.push("Título");
    if ((objective.description ?? "") !== updated.description) diffs.push("Descripción");
    if (objective.area !== updated.area) diffs.push(`Área: ${objective.area} → ${updated.area}`);
    if (objective.owner !== updated.owner) diffs.push(`Responsable: ${objective.owner} → ${updated.owner}`);
    if (objective.quarter !== updated.quarter) diffs.push(`Ciclo: ${objective.quarter} → ${updated.quarter}`);
    if (objective.level !== updated.level) diffs.push(`Nivel: ${objective.level} → ${updated.level}`);
    if (objective.status !== updated.status) diffs.push(`Estado: ${objective.status} → ${updated.status}`);

    const oldContrib = (objective.contributors ?? []).join(",");
    const newContrib = (updated.contributors ?? []).join(",");
    if (oldContrib !== newContrib) diffs.push("Contribuidores");

    const oldIds = new Set(objective.keyResults.map((k) => k.id));
    const newIds = new Set(updated.keyResults.map((k) => k.id));
    const added = updated.keyResults.filter((k) => !oldIds.has(k.id)).length;
    const removed = objective.keyResults.filter((k) => !newIds.has(k.id)).length;
    const modified = updated.keyResults.filter((k) => {
      const orig = objective.keyResults.find((o) => o.id === k.id);
      if (!orig) return false;
      return (
        orig.title !== k.title ||
        orig.target !== k.target ||
        orig.current !== k.current ||
        orig.initialValue !== k.initialValue ||
        orig.direction !== k.direction ||
        orig.weight !== k.weight ||
        orig.type !== k.type
      );
    }).length;
    if (added) diffs.push(`${added} KR agregado(s)`);
    if (removed) diffs.push(`${removed} KR eliminado(s)`);
    if (modified) diffs.push(`${modified} KR modificado(s)`);

    if (objective.progress !== updated.progress) {
      diffs.push(`Progreso: ${objective.progress}% → ${updated.progress}%`);
    }
    return diffs;
  };

  const handleSave = () => {
    if (!objective) return;
    if (!title.trim()) {
      toast.error("El título del objetivo es obligatorio");
      return;
    }
    if (title.trim().length > 200) {
      toast.error("El título no debe superar 200 caracteres");
      return;
    }
    if (!area || !owner || !cycle) {
      toast.error("Completa área, responsable y ciclo");
      return;
    }
    if (validKRs.length === 0) {
      toast.error("Agrega al menos un Key Result con descripción");
      return;
    }
    if (totalWeight > 0 && Math.abs(totalWeight - 100) > 0.01) {
      toast.error(`La suma de pesos debe ser 100%. Actual: ${totalWeight}%`);
      return;
    }

    const updatedKRs: KeyResult[] = validKRs.map((kr, i) => {
      const progress = computeProgress(kr);
      return {
        id: kr.id ?? `kr_${Date.now()}_${i}`,
        title: kr.title.trim(),
        type:
          kr.metricType === "ratio"
            ? "ratio"
            : kr.metricType === "percentage"
              ? "percentage"
              : "numeric",
        current: parseFloat(kr.current) || 0,
        target: parseFloat(kr.target) || 0,
        unit: kr.metricType === "percentage" ? "%" : "",
        progress,
        objectiveId: objective.id,
        initiatives:
          objective.keyResults.find((o) => o.id === kr.id)?.initiatives ?? [],
        initialValue: parseFloat(kr.initialValue) || 0,
        direction: kr.direction,
        weight: parseFloat(kr.weight) || undefined,
      };
    });

    const objectiveProgress =
      updatedKRs.length === 0
        ? 0
        : Math.round(
            updatedKRs.reduce((sum, k) => sum + k.progress, 0) / updatedKRs.length
          );

    const updated: Objective = {
      ...objective,
      title: title.trim(),
      description: description.trim(),
      area,
      owner,
      level,
      status,
      quarter: cycle,
      contributors,
      keyResults: updatedKRs,
      progress: objectiveProgress,
    };

    const summary = buildSummary(updated);
    if (summary.length === 0) {
      toast.info("No se detectaron cambios");
      return;
    }

    setPendingObjective(updated);
    setChangeSummary(summary);
    setConfirmOpen(true);
  };

  const confirmSave = () => {
    if (!pendingObjective) return;
    onSave(pendingObjective);
    toast.success("OKR actualizado exitosamente");
    setConfirmOpen(false);
    setPendingObjective(null);
    setChangeSummary([]);
    onOpenChange(false);
  };

  if (!objective) return null;

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar OKR</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* Objetivo */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Objetivo</Label>
            <div className="space-y-1">
              <Input
                placeholder="Título del objetivo"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground text-right">{title.length}/200</p>
            </div>
            <Textarea
              placeholder="Descripción"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[60px]"
            />
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Área *</Label>
              <Select value={area} onValueChange={setArea}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {areaOptions.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Responsable *</Label>
              <Select value={owner} onValueChange={setOwner}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ciclo *</Label>
              <Select value={cycle} onValueChange={setCycle}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {cycleOptions.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nivel</Label>
              <Select value={level} onValueChange={(v) => setLevel(v as typeof level)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">Empresa</SelectItem>
                  <SelectItem value="area">Área</SelectItem>
                  <SelectItem value="project">Proyecto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Estado</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Objective["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="on_track">En curso</SelectItem>
                  <SelectItem value="at_risk">En riesgo</SelectItem>
                  <SelectItem value="behind">Atrasado</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contributors */}
          <div className="space-y-2">
            <Label>Contribuidores</Label>
            <div className="flex flex-wrap gap-2">
              {users.filter((u) => u.name !== owner).map((u) => (
                <Badge
                  key={u.id}
                  variant={contributors.includes(u.name) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleContributor(u.name)}
                >
                  {u.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* KRs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Key Results</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addKR}
                disabled={keyResults.length >= 8}
                className="gap-1"
              >
                <Plus className="w-3 h-3" /> Agregar KR
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Editá descripción, valores y pesos. Los pesos (si se asignan) deben sumar 100%.
            </p>

            <div className="space-y-3">
              {keyResults.map((kr, idx) => (
                <div key={idx} className="flex items-start gap-2 p-3 rounded-lg border border-border/50 bg-card">
                  <span className="text-xs font-bold text-muted-foreground mt-2.5 w-6 shrink-0">
                    KR{idx + 1}
                  </span>
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Descripción del Key Result"
                      value={kr.title}
                      onChange={(e) => updateKR(idx, "title", e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Select
                        value={kr.metricType}
                        onValueChange={(v) => updateKR(idx, "metricType", v)}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                          <SelectItem value="numeric">Número</SelectItem>
                          <SelectItem value="ratio">Ratio</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={kr.direction}
                        onValueChange={(v) => updateKR(idx, "direction", v)}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="higher_is_better">Mayor es mejor</SelectItem>
                          <SelectItem value="lower_is_better">Menor es mejor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <Input
                        placeholder="Inicial"
                        type="number"
                        value={kr.initialValue}
                        onChange={(e) => updateKR(idx, "initialValue", e.target.value)}
                      />
                      <Input
                        placeholder="Actual"
                        type="number"
                        value={kr.current}
                        onChange={(e) => updateKR(idx, "current", e.target.value)}
                      />
                      <Input
                        placeholder="Meta"
                        type="number"
                        value={kr.target}
                        onChange={(e) => updateKR(idx, "target", e.target.value)}
                      />
                      <Input
                        placeholder="Peso (%)"
                        type="number"
                        value={kr.weight}
                        onChange={(e) => updateKR(idx, "weight", e.target.value)}
                      />
                    </div>
                    {aiKrReviewEnabled && (
                    <KRReviewButton
                      kr_id={kr.id}
                      objective={title}
                      keyResult={kr.title}
                      cycle={cycle}
                      context={{
                        metricType: kr.metricType,
                        initialValue: kr.initialValue,
                        current: kr.current,
                        target: kr.target,
                        direction: kr.direction,
                        weight: kr.weight,
                      }}
                      onApplySuggestion={(improved) => updateKR(idx, "title", improved)}
                      onResultChange={(r) =>
                        setBlockedKRs((prev) => {
                          if (!r) {
                            const { [idx]: _omit, ...rest } = prev;
                            return rest;
                          }
                          return { ...prev, [idx]: r.blocked };
                        })
                      }
                    />
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeKR(idx)}
                    disabled={keyResults.length <= 1}
                    className="shrink-0 mt-1"
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
            {Object.values(blockedKRs).some(Boolean) && (
              <p className="text-xs font-medium text-destructive">
                Hay KRs bloqueados por la revisión IA. Aplicá las sugerencias o ajustá los KRs antes de guardar.
              </p>
            )}
            {totalWeight > 0 && (
              <p
                className={`text-xs font-medium ${
                  Math.abs(totalWeight - 100) < 0.01 ? "text-green-600" : "text-destructive"
                }`}
              >
                Suma de pesos: {totalWeight}%
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="gap-2" disabled={Object.values(blockedKRs).some(Boolean)}>
              <Save className="w-4 h-4" /> Guardar cambios
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Confirmar cambios al OKR?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                Vas a guardar las siguientes modificaciones en{" "}
                <strong className="text-foreground">{objective?.title}</strong>:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-foreground">
                {changeSummary.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground pt-2">
                Esta acción actualizará el OKR para todos los usuarios. Podés cancelar para revisar los datos.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={confirmSave}>Confirmar y guardar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default EditOKRDialog;
