import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import StatusBadge from "@/components/StatusBadge";
import { Rocket, Calendar, User, Plus, Pencil, Trash2, AlertCircle } from "lucide-react";
import type { Objective, Task } from "@/data/mockData";
import type { InitiativeWithContext } from "@/lib/initiativesPersistence";
import type { TeamMember } from "@/lib/teamPersistence";
import { toast } from "sonner";

interface Props {
  objectives: Objective[];
  initiatives: InitiativeWithContext[];
  team: TeamMember[];
  onUpsert: (ini: InitiativeWithContext) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
}

interface FormState {
  id: string;
  title: string;
  krId: string;
  responsible: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: InitiativeWithContext["status"];
  tasks: Task[];
}

const emptyForm = (): FormState => ({
  id: "",
  title: "",
  krId: "",
  responsible: "",
  startDate: "",
  endDate: "",
  progress: 0,
  status: "in_progress",
  tasks: [],
});

const todayISO = () => new Date().toISOString().slice(0, 10);

const InitiativesPage = ({ objectives, initiatives, team, onUpsert, onDelete }: Props) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [newTask, setNewTask] = useState("");

  // Flatten KR options with their objective context.
  const krOptions = useMemo(() => {
    const opts: { krId: string; objectiveId: string; label: string }[] = [];
    objectives.forEach((obj) => {
      obj.keyResults.forEach((kr) => {
        opts.push({ krId: kr.id, objectiveId: obj.id, label: `${obj.title} → ${kr.title}` });
      });
    });
    return opts;
  }, [objectives]);

  const krLookup = useMemo(() => {
    const map = new Map<string, { krTitle: string; objectiveTitle: string; objectiveId: string }>();
    objectives.forEach((obj) => {
      obj.keyResults.forEach((kr) => {
        map.set(kr.id, { krTitle: kr.title, objectiveTitle: obj.title, objectiveId: obj.id });
      });
    });
    return map;
  }, [objectives]);

  const enriched = useMemo(
    () =>
      initiatives.map((ini) => {
        const ctx = krLookup.get(ini.krId);
        return {
          ...ini,
          krTitle: ctx?.krTitle ?? "(KR no encontrado)",
          objectiveTitle: ctx?.objectiveTitle ?? "",
        };
      }),
    [initiatives, krLookup]
  );

  const today = todayISO();

  const openCreate = () => {
    setForm({ ...emptyForm(), id: `ini_${Date.now()}` });
    setOpen(true);
  };

  const openEdit = (ini: InitiativeWithContext) => {
    setForm({
      id: ini.id,
      title: ini.title,
      krId: ini.krId,
      responsible: ini.responsible,
      startDate: ini.startDate || "",
      endDate: ini.endDate || "",
      progress: ini.progress,
      status: ini.status,
      tasks: ini.tasks ?? [],
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.krId || !form.responsible.trim()) {
      toast.error("Completa título, KR vinculado y responsable");
      return;
    }
    const ctx = krLookup.get(form.krId);
    try {
      await onUpsert({
        id: form.id,
        title: form.title.trim(),
        krId: form.krId,
        objectiveId: ctx?.objectiveId,
        responsible: form.responsible.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        progress: Math.max(0, Math.min(100, form.progress)),
        status: form.status,
        tasks: form.tasks,
      });
      toast.success("Iniciativa guardada");
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    }
  };

  const handleDelete = async (ini: InitiativeWithContext) => {
    if (!confirm(`¿Eliminar la iniciativa "${ini.title}"?`)) return;
    try {
      await onDelete(ini.id);
      toast.success("Iniciativa eliminada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al eliminar");
    }
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    setForm((f) => ({
      ...f,
      tasks: [...f.tasks, { id: `t_${Date.now()}`, title: newTask.trim(), completed: false }],
    }));
    setNewTask("");
  };

  const toggleTask = (id: string) => {
    setForm((f) => ({
      ...f,
      tasks: f.tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    }));
  };

  const removeTask = (id: string) => {
    setForm((f) => ({ ...f, tasks: f.tasks.filter((t) => t.id !== id) }));
  };

  const setTaskResponsible = (id: string, responsible: string) => {
    setForm((f) => ({
      ...f,
      tasks: f.tasks.map((t) => (t.id === id ? { ...t, responsible } : t)),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Iniciativas</h2>
          <p className="text-muted-foreground text-sm mt-1">{enriched.length} iniciativas</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-1" /> Nueva iniciativa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{form.id && initiatives.some((i) => i.id === form.id) ? "Editar iniciativa" : "Nueva iniciativa"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Título</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ej. Plan de cobranza proactiva" />
              </div>

              <div className="space-y-1.5">
                <Label>Key Result vinculado</Label>
                <Select value={form.krId} onValueChange={(v) => setForm({ ...form, krId: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecciona un KR" /></SelectTrigger>
                  <SelectContent>
                    {krOptions.map((opt) => (
                      <SelectItem key={opt.krId} value={opt.krId}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Responsable</Label>
                  <Select value={form.responsible} onValueChange={(v) => setForm({ ...form, responsible: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder={team.length ? "Selecciona del equipo" : "Agrega miembros en Equipo"} />
                    </SelectTrigger>
                    <SelectContent>
                      {team.map((m) => (
                        <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                      ))}
                      {form.responsible && !team.some((m) => m.name === form.responsible) && (
                        <SelectItem value={form.responsible}>{form.responsible} (externo)</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Estado</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as FormState["status"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_started">No iniciada</SelectItem>
                      <SelectItem value="in_progress">En progreso</SelectItem>
                      <SelectItem value="blocked">Bloqueada</SelectItem>
                      <SelectItem value="completed">Completada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Inicio</Label>
                  <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Vencimiento</Label>
                  <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Avance: {form.progress}%</Label>
                <Input type="range" min={0} max={100} value={form.progress} onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })} />
              </div>

              <div className="space-y-2">
                <Label>Tareas</Label>
                <div className="flex gap-2">
                  <Input
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTask(); } }}
                    placeholder="Añadir tarea..."
                  />
                  <Button type="button" variant="outline" onClick={addTask}>Añadir</Button>
                </div>
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {form.tasks.map((t) => (
                    <div key={t.id} className="flex items-center gap-2 text-sm group">
                      <Checkbox checked={t.completed} onCheckedChange={() => toggleTask(t.id)} />
                      <span className={`flex-1 min-w-0 truncate ${t.completed ? "text-muted-foreground line-through" : ""}`}>{t.title}</span>
                      <Select
                        value={t.responsible || ""}
                        onValueChange={(v) => setTaskResponsible(t.id, v)}
                      >
                        <SelectTrigger className="h-7 w-36 text-xs shrink-0">
                          <SelectValue placeholder="Responsable" />
                        </SelectTrigger>
                        <SelectContent>
                          {team.map((m) => (
                            <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                          ))}
                          {t.responsible && !team.some((m) => m.name === t.responsible) && (
                            <SelectItem value={t.responsible}>{t.responsible} (externo)</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <button onClick={() => removeTask(t.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-danger shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {!form.tasks.length && <p className="text-xs text-muted-foreground">Sin tareas todavía.</p>}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {enriched.map((ini) => {
          const overdue = ini.endDate && ini.endDate < today && ini.status !== "completed";
          return (
            <Card key={ini.id} className="glass-card">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 min-w-0">
                    <Rocket className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-foreground">{ini.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">KR: {ini.krTitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <StatusBadge status={ini.status} />
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(ini)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDelete(ini)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <Progress value={ini.progress} className="h-1.5" />

                <div className="flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-2">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {ini.responsible}
                  </div>
                  <div className={`flex items-center gap-1 ${overdue ? "text-danger font-medium" : ""}`}>
                    {overdue ? <AlertCircle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                    {ini.endDate || "—"}
                  </div>
                  <span className="font-semibold">{ini.progress}%</span>
                </div>

                {ini.tasks.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-border/50">
                    {ini.tasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-2 text-xs">
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${task.completed ? "bg-success border-success" : "border-border"}`}>
                          {task.completed && <span className="text-success-foreground text-[8px]">✓</span>}
                        </div>
                        <span className={`flex-1 truncate ${task.completed ? "text-muted-foreground line-through" : "text-foreground"}`}>{task.title}</span>
                        {task.responsible && (
                          <span className="flex items-center gap-1 text-muted-foreground shrink-0">
                            <User className="w-3 h-3" />
                            {task.responsible}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {!enriched.length && (
          <Card className="glass-card md:col-span-2">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No hay iniciativas todavía. Crea la primera con el botón superior.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default InitiativesPage;
