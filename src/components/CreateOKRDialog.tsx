import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Info } from "lucide-react";
import { areas, users } from "@/data/mockData";
import type { Objective, KeyResult } from "@/data/mockData";
import { toast } from "sonner";

interface KRDraft {
  title: string;
  target: string;
  unit: string;
}

interface CreateOKRDialogProps {
  onCreateOKR: (objective: Objective) => void;
}

const cycles = ["Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026"];

const CreateOKRDialog = ({ onCreateOKR }: CreateOKRDialogProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [area, setArea] = useState("");
  const [owner, setOwner] = useState("");
  const [cycle, setCycle] = useState("");
  const [level, setLevel] = useState<"company" | "area" | "project">("area");
  const [keyResults, setKeyResults] = useState<KRDraft[]>([{ title: "", target: "", unit: "" }]);

  const addKR = () => {
    if (keyResults.length >= 5) return;
    setKeyResults([...keyResults, { title: "", target: "", unit: "" }]);
  };

  const removeKR = (idx: number) => {
    if (keyResults.length <= 1) return;
    setKeyResults(keyResults.filter((_, i) => i !== idx));
  };

  const updateKR = (idx: number, field: keyof KRDraft, value: string) => {
    const updated = [...keyResults];
    updated[idx] = { ...updated[idx], [field]: value };
    setKeyResults(updated);
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setArea("");
    setOwner("");
    setCycle("");
    setLevel("area");
    setKeyResults([{ title: "", target: "", unit: "" }]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !area || !owner || !cycle) {
      toast.error("Completa todos los campos obligatorios");
      return;
    }

    const validKRs = keyResults.filter((kr) => kr.title.trim());
    if (validKRs.length === 0) {
      toast.error("Agrega al menos un Key Result");
      return;
    }

    const newId = `obj_${Date.now()}`;
    const newObjective: Objective = {
      id: newId,
      title: title.trim(),
      description: description.trim(),
      area,
      owner,
      level,
      progress: 0,
      status: "on_track",
      quarter: cycle,
      keyResults: validKRs.map((kr, i) => ({
        id: `kr_${Date.now()}_${i}`,
        title: kr.title.trim(),
        type: "numeric" as const,
        current: 0,
        target: parseFloat(kr.target) || 100,
        unit: kr.unit || "%",
        progress: 0,
        objectiveId: newId,
        initiatives: [],
      })),
    };

    onCreateOKR(newObjective);
    toast.success("OKR creado exitosamente");
    resetForm();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo OKR
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear nuevo OKR</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-2">
          {/* Objetivo */}
          <div className="space-y-3">
            <Label htmlFor="obj-title" className="text-base font-semibold">Objetivo</Label>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border/50">
              <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Un buen objetivo debe ser <strong>SMART</strong>:
                <strong> Específico</strong> (claro y concreto),
                <strong> Medible</strong> (cuantificable),
                <strong> Alcanzable</strong> (realista),
                <strong> Relevante</strong> (alineado a la estrategia) y
                <strong> Time-bound</strong> (con plazo definido).
              </p>
            </div>
            <Input
              id="obj-title"
              placeholder="Ej: Incrementar ingresos recurrentes un 40%"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
              placeholder="Descripción del objetivo (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[60px]"
            />
          </div>

          {/* Configuración */}
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
              <Label>Responsable *</Label>
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

          {/* Key Results */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Key Results</Label>
              <Button type="button" variant="outline" size="sm" onClick={addKR} disabled={keyResults.length >= 5} className="gap-1">
                <Plus className="w-3 h-3" /> Agregar KR
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Define resultados clave medibles que indiquen el progreso hacia el objetivo (máx. 5).</p>

            <div className="space-y-3">
              {keyResults.map((kr, idx) => (
                <div key={idx} className="flex items-start gap-2 p-3 rounded-lg border border-border/50 bg-card">
                  <span className="text-xs font-bold text-muted-foreground mt-2.5 w-6 shrink-0">KR{idx + 1}</span>
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Ej: Alcanzar $2.4M ARR"
                      value={kr.title}
                      onChange={(e) => updateKR(idx, "title", e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="Meta (ej: 100)"
                        type="number"
                        value={kr.target}
                        onChange={(e) => updateKR(idx, "target", e.target.value)}
                        className="w-28"
                      />
                      <Input
                        placeholder="Unidad (ej: %, USD, pts)"
                        value={kr.unit}
                        onChange={(e) => updateKR(idx, "unit", e.target.value)}
                        className="w-36"
                      />
                    </div>
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
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit">Crear OKR</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateOKRDialog;
