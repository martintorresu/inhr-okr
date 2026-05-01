import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Info, Eye, ArrowLeft, UserPlus, X, Mail, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { areas, users as defaultUsers } from "@/data/mockData";
import type { TeamMember } from "@/lib/teamPersistence";
import type { Objective } from "@/data/mockData";
import { toast } from "sonner";
import KRReviewButton from "@/components/KRReviewButton";

interface KRDraft {
  title: string;
  metricType: "percentage" | "numeric" | "ratio";
  target: string;
  initialValue: string;
  direction: "higher_is_better" | "lower_is_better";
  weight: string;
}

interface ExternalContributor {
  name: string;
  email: string;
  phone: string;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[+0-9\s()-]{6,20}$/;

interface CreateOKRDialogProps {
  onCreateOKR: (objective: Objective) => void;
  team?: TeamMember[];
}

const cycles = ["Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026"];

const metricTypeLabels: Record<string, string> = {
  percentage: "%",
  numeric: "Número",
  ratio: "Ratio",
};

const directionLabels: Record<string, string> = {
  higher_is_better: "Mayor es mejor",
  lower_is_better: "Menor es mejor",
};

const emptyKR = (): KRDraft => ({
  title: "",
  metricType: "numeric",
  target: "",
  initialValue: "",
  direction: "higher_is_better",
  weight: "",
});

const CreateOKRDialog = ({ onCreateOKR, team }: CreateOKRDialogProps) => {
  const users = team && team.length ? team : defaultUsers;
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"form" | "preview">("form");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [area, setArea] = useState("");
  const [owner, setOwner] = useState("");
  const [contributors, setContributors] = useState<string[]>([]);
  const [cycle, setCycle] = useState("");
  const [level, setLevel] = useState<"company" | "area" | "project">("area");
  const [keyResults, setKeyResults] = useState<KRDraft[]>([emptyKR()]);
  const [externalContributors, setExternalContributors] = useState<ExternalContributor[]>([]);
  const [extName, setExtName] = useState("");
  const [extEmail, setExtEmail] = useState("");
  const [extPhone, setExtPhone] = useState("");
  const [blockedKRs, setBlockedKRs] = useState<Record<number, boolean>>({});

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
    updated[idx] = { ...updated[idx], [field]: value };
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

  const addExternalContributor = () => {
    const name = extName.trim();
    const email = extEmail.trim();
    const phone = extPhone.trim();
    if (!name) {
      toast.error("El nombre del contribuidor externo es obligatorio");
      return;
    }
    if (name.length > 100) {
      toast.error("El nombre no debe superar 100 caracteres");
      return;
    }
    if (email && !emailRegex.test(email)) {
      toast.error("Email inválido");
      return;
    }
    if (phone && !phoneRegex.test(phone)) {
      toast.error("Teléfono inválido");
      return;
    }
    if (
      externalContributors.some((c) => c.name.toLowerCase() === name.toLowerCase()) ||
      contributors.some((c) => c.toLowerCase() === name.toLowerCase())
    ) {
      toast.error("Ese contribuidor ya fue agregado");
      return;
    }
    setExternalContributors([...externalContributors, { name, email, phone }]);
    setExtName("");
    setExtEmail("");
    setExtPhone("");
    toast.success("Contribuidor externo agregado");
  };

  const removeExternalContributor = (name: string) => {
    setExternalContributors(externalContributors.filter((c) => c.name !== name));
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setArea("");
    setOwner("");
    setContributors([]);
    setExternalContributors([]);
    setExtName("");
    setExtEmail("");
    setExtPhone("");
    setCycle("");
    setLevel("area");
    setKeyResults([emptyKR()]);
    setStep("form");
  };

  const validKRs = keyResults.filter((kr) => kr.title.trim());

  const totalWeight = validKRs.reduce((sum, kr) => sum + (parseFloat(kr.weight) || 0), 0);

  const validate = (): boolean => {
    if (!title.trim()) {
      toast.error("El título del objetivo es obligatorio");
      return false;
    }
    if (title.trim().length > 200) {
      toast.error("El título no debe superar 200 caracteres");
      return false;
    }
    if (!area || !owner || !cycle) {
      toast.error("Completa todos los campos obligatorios (área, responsable, ciclo)");
      return false;
    }
    if (validKRs.length === 0) {
      toast.error("Agrega al menos un Key Result con descripción");
      return false;
    }
    if (totalWeight > 0 && Math.abs(totalWeight - 100) > 0.01) {
      toast.error(`La suma de pesos debe ser 100%. Actual: ${totalWeight}%`);
      return false;
    }
    return true;
  };

  const handlePreview = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) setStep("preview");
  };

  const handleConfirm = () => {
    const newId = `obj_${Date.now()}`;
    const newObjective: Objective = {
      id: newId,
      title: title.trim(),
      description: description.trim(),
      area,
      owner,
      level,
      progress: 0,
      status: "draft",
      quarter: cycle,
      contributors: [...contributors, ...externalContributors.map((c) => c.name)],
      keyResults: validKRs.map((kr, i) => ({
        id: `kr_${Date.now()}_${i}`,
        title: kr.title.trim(),
        type: kr.metricType === "ratio" ? "ratio" as const : kr.metricType === "percentage" ? "percentage" as const : "numeric" as const,
        current: parseFloat(kr.initialValue) || 0,
        target: parseFloat(kr.target) || 100,
        unit: kr.metricType === "percentage" ? "%" : "",
        progress: 0,
        objectiveId: newId,
        initiatives: [],
        initialValue: parseFloat(kr.initialValue) || 0,
        direction: kr.direction,
        weight: parseFloat(kr.weight) || undefined,
      })),
    };

    onCreateOKR(newObjective);
    toast.success("OKR creado exitosamente");
    resetForm();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo OKR
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{step === "form" ? "Crear nuevo OKR" : "Vista previa del OKR"}</DialogTitle>
        </DialogHeader>

        {step === "form" ? (
          <form onSubmit={handlePreview} className="space-y-6 mt-2">
            {/* Sección 1: Objetivo */}
            <div className="space-y-3">
              <Label htmlFor="obj-title" className="text-base font-semibold">Sección 1: Objetivo</Label>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border/50">
                <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  El objetivo debe ser <strong>desafiante</strong> e <strong>inspiracional</strong>: una declaración cualitativa que motive al equipo y marque una dirección ambiciosa. Los <strong>Key Results</strong> son los que deben cumplir con la lógica <strong>SMART</strong> (Específicos, Medibles, Alcanzables, Relevantes y con Tiempo definido).
                </p>
              </div>
              <div className="space-y-1">
                <Input
                  id="obj-title"
                  placeholder="Ej: Incrementar ingresos recurrentes un 40%"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground text-right">{title.length}/200</p>
              </div>
              <Textarea
                placeholder="Descripción del objetivo (opcional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[60px]"
              />
            </div>

            {/* Sección 3 & 4: Ciclo y Responsables */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Área *</Label>
                <Select value={area} onValueChange={setArea}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar área" /></SelectTrigger>
                  <SelectContent>
                    {areas.map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Responsable (Owner) *</Label>
                <Select value={owner} onValueChange={setOwner}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar responsable" /></SelectTrigger>
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
                  <SelectTrigger><SelectValue placeholder="Seleccionar ciclo" /></SelectTrigger>
                  <SelectContent>
                    {cycles.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nivel</Label>
                <Select value={level} onValueChange={(v) => setLevel(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="company">Empresa</SelectItem>
                    <SelectItem value="area">Área</SelectItem>
                    <SelectItem value="project">Proyecto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Contributors */}
            <div className="space-y-3">
              <Label>Contribuidores (opcional)</Label>

              {/* Internos */}
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Internos del equipo</p>
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

              {/* Externos */}
              <div className="space-y-2 p-3 rounded-lg border border-border/50 bg-muted/30">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-primary" />
                  <p className="text-xs font-medium text-foreground">Agregar contribuidor externo (consultor, amigo, referido)</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Input
                    placeholder="Nombre *"
                    value={extName}
                    onChange={(e) => setExtName(e.target.value)}
                    maxLength={100}
                  />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={extEmail}
                    onChange={(e) => setExtEmail(e.target.value)}
                    maxLength={255}
                  />
                  <Input
                    type="tel"
                    placeholder="Teléfono"
                    value={extPhone}
                    onChange={(e) => setExtPhone(e.target.value)}
                    maxLength={20}
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={addExternalContributor} className="gap-1">
                    <Plus className="w-3 h-3" /> Agregar
                  </Button>
                </div>

                {externalContributors.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {externalContributors.map((c) => (
                      <Badge key={c.name} variant="default" className="gap-1.5 pr-1 py-1">
                        <span>{c.name}</span>
                        {c.email && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] opacity-80">
                            <Mail className="w-2.5 h-2.5" />{c.email}
                          </span>
                        )}
                        {c.phone && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] opacity-80">
                            <Phone className="w-2.5 h-2.5" />{c.phone}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeExternalContributor(c.name)}
                          className="ml-1 rounded-sm hover:bg-background/20 p-0.5"
                          aria-label={`Eliminar ${c.name}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sección 2: Key Results */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Sección 2: Key Results</Label>
                <Button type="button" variant="outline" size="sm" onClick={addKR} disabled={keyResults.length >= 8} className="gap-1">
                  <Plus className="w-3 h-3" /> Agregar KR
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Define resultados clave medibles (mín. 1, máx. 8). Los pesos deben sumar 100% si se asignan.</p>

              <div className="space-y-3">
                {keyResults.map((kr, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-3 rounded-lg border border-border/50 bg-card">
                    <span className="text-xs font-bold text-muted-foreground mt-2.5 w-6 shrink-0">KR{idx + 1}</span>
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Descripción del Key Result"
                        value={kr.title}
                        onChange={(e) => updateKR(idx, "title", e.target.value)}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Select value={kr.metricType} onValueChange={(v) => updateKR(idx, "metricType", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                            <SelectItem value="numeric">Número</SelectItem>
                            <SelectItem value="ratio">Ratio</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={kr.direction} onValueChange={(v) => updateKR(idx, "direction", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="higher_is_better">Mayor es mejor</SelectItem>
                            <SelectItem value="lower_is_better">Menor es mejor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          placeholder="Valor inicial"
                          type="number"
                          value={kr.initialValue}
                          onChange={(e) => updateKR(idx, "initialValue", e.target.value)}
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
                      <KRReviewButton
                        objective={title}
                        keyResult={kr.title}
                        cycle={cycle}
                        context={{
                          metricType: kr.metricType,
                          initialValue: kr.initialValue,
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
                  Hay KRs bloqueados por la revisión IA. Aplicá las sugerencias o ajustá los KRs antes de continuar.
                </p>
              )}
              {totalWeight > 0 && (
                <p className={`text-xs font-medium ${Math.abs(totalWeight - 100) < 0.01 ? "text-green-600" : "text-destructive"}`}>
                  Suma de pesos: {totalWeight}%
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" className="gap-2" disabled={Object.values(blockedKRs).some(Boolean)}>
                <Eye className="w-4 h-4" /> Vista previa
              </Button>
            </div>
          </form>
        ) : (
          /* Preview step */
          <div className="space-y-5 mt-2">
            <div className="p-4 rounded-lg border border-border/50 bg-muted/30 space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Borrador</Badge>
                <Badge variant="outline">{cycle}</Badge>
                <Badge variant="outline">{level === "company" ? "Empresa" : level === "area" ? "Área" : "Proyecto"}</Badge>
              </div>
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span><strong>Área:</strong> {area}</span>
                <span><strong>Owner:</strong> {owner}</span>
              </div>
              {(contributors.length > 0 || externalContributors.length > 0) && (
                <div className="space-y-1.5">
                  {contributors.length > 0 && (
                    <div className="flex flex-wrap gap-1 items-center">
                      <span className="text-xs text-muted-foreground mr-1">Contribuidores:</span>
                      {contributors.map((c) => (
                        <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                      ))}
                    </div>
                  )}
                  {externalContributors.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Externos:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {externalContributors.map((c) => (
                          <Badge key={c.name} variant="secondary" className="text-xs gap-1.5">
                            <span className="font-medium">{c.name}</span>
                            {c.email && <span className="opacity-80">· {c.email}</span>}
                            {c.phone && <span className="opacity-80">· {c.phone}</span>}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold">Key Results ({validKRs.length})</Label>
              {validKRs.map((kr, idx) => (
                <div key={idx} className="p-3 rounded-lg border border-border/50 bg-card space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-foreground">KR{idx + 1}: {kr.title}</h4>
                    {kr.weight && <Badge variant="secondary">{kr.weight}%</Badge>}
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>Tipo: {metricTypeLabels[kr.metricType]}</span>
                    <span>Meta: {kr.target || "—"}</span>
                    <span>Inicio: {kr.initialValue || "0"}</span>
                    <span>{directionLabels[kr.direction]}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-2">
              <Button type="button" variant="outline" onClick={() => setStep("form")} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Editar
              </Button>
              <Button onClick={handleConfirm}>Confirmar y crear OKR</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateOKRDialog;
