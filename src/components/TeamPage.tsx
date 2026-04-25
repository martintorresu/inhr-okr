import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { roleLabels } from "@/data/mockData";
import { areas as tenantAreas } from "@/data/mockData";
import { Plus, Pencil, Trash2, Mail, Phone } from "lucide-react";
import type { TeamMember } from "@/lib/teamPersistence";
import type { User } from "@/data/types";
import { toast } from "sonner";

interface Props {
  team: TeamMember[];
  onUpsert: (m: TeamMember) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
}

interface FormState {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: User["role"];
  area: string;
}

const emptyForm = (): FormState => ({
  id: "",
  name: "",
  email: "",
  phone: "",
  role: "viewer",
  area: tenantAreas[0] ?? "",
});

const TeamPage = ({ team, onUpsert, onDelete }: Props) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());

  const isEdit = form.id && team.some((m) => m.id === form.id);

  const openCreate = () => {
    setForm({ ...emptyForm(), id: `tm_${Date.now()}` });
    setOpen(true);
  };

  const openEdit = (m: TeamMember) => {
    setForm({
      id: m.id,
      name: m.name,
      email: m.email ?? "",
      phone: m.phone ?? "",
      role: m.role,
      area: m.area ?? "",
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Email inválido");
      return;
    }
    try {
      await onUpsert({
        id: form.id,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        role: form.role,
        area: form.area,
      });
      toast.success(isEdit ? "Miembro actualizado" : "Miembro agregado");
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    }
  };

  const handleDelete = async (m: TeamMember) => {
    if (!confirm(`¿Eliminar a "${m.name}" del equipo?`)) return;
    try {
      await onDelete(m.id);
      toast.success("Miembro eliminado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al eliminar");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Equipo</h2>
          <p className="text-muted-foreground text-sm mt-1">{team.length} miembros</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-1" /> Nuevo miembro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{isEdit ? "Editar miembro" : "Nuevo miembro"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nombre *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre completo" />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="persona@empresa.com" />
              </div>
              <div className="space-y-1.5">
                <Label>Teléfono</Label>
                <Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+56 9 1234 5678" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Rol</Label>
                  <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as User["role"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="okr_leader">Líder OKR</SelectItem>
                      <SelectItem value="initiative_leader">Líder de Iniciativa</SelectItem>
                      <SelectItem value="viewer">Visor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Área</Label>
                  <Select value={form.area} onValueChange={(v) => setForm({ ...form, area: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                    <SelectContent>
                      {tenantAreas.map((a) => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {team.map((m) => (
          <Card key={m.id} className="glass-card">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-primary">
                    {m.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-foreground truncate">{m.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {roleLabels[m.role] ?? m.role}{m.area ? ` · ${m.area}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(m)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDelete(m)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              {(m.email || m.phone) && (
                <div className="space-y-1 pt-2 border-t border-border/50">
                  {m.email && (
                    <a
                      href={`mailto:${m.email}?subject=${encodeURIComponent("Recordatorio: avance de iniciativa")}`}
                      className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary"
                    >
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{m.email}</span>
                    </a>
                  )}
                  {m.phone && (
                    <a
                      href={`tel:${m.phone}`}
                      className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary"
                    >
                      <Phone className="w-3 h-3" />
                      <span className="truncate">{m.phone}</span>
                    </a>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {!team.length && (
          <Card className="glass-card sm:col-span-2 lg:col-span-3">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Aún no hay miembros. Agrega el primero con el botón superior.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TeamPage;
