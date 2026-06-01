import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { objectives as defaultObjectives } from "@/data/mockData";
import type { Objective } from "@/data/mockData";
import { activeTenant } from "@/data/tenant";
import type { TeamMember } from "@/lib/teamPersistence";
import { withLiveProgress, withCheckInProgress } from "@/lib/okrProgress";
import type { CheckInRecord } from "@/lib/checkInsPersistence";
import { ChevronDown, ChevronRight, Target, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import CreateOKRDialog from "@/components/CreateOKRDialog";
import EditOKRDialog from "@/components/EditOKRDialog";
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

interface OKRsPageProps {
  objectives?: Objective[];
  setObjectives?: React.Dispatch<React.SetStateAction<Objective[]>>;
  team?: TeamMember[];
  checkIns?: CheckInRecord[];
  isAdmin?: boolean;
  onDeleteObjective?: (objectiveId: string) => Promise<void> | void;
}

const OKRsPage = ({ objectives, setObjectives, team, checkIns = [], isAdmin: isAdminProp, onDeleteObjective }: OKRsPageProps = {}) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ obj1: true });
  // Fallback to internal state if parent doesn't provide controlled state.
  const [internalObjectives, setInternalObjectives] = useState<Objective[]>(defaultObjectives);
  const sourceObjectives = objectives ?? internalObjectives;
  const allObjectives = withCheckInProgress(withLiveProgress(sourceObjectives), checkIns);
  const updateObjectives: React.Dispatch<React.SetStateAction<Objective[]>> =
    setObjectives ?? setInternalObjectives;
  const [editing, setEditing] = useState<Objective | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  // Current user is the tenant's admin (no auth layer in demo). Only admins can edit.
  const currentUser = activeTenant.users.find((u) => u.role === "admin") ?? activeTenant.users[0];
  const isAdmin = isAdminProp ?? currentUser?.role === "admin";
  const [deleting, setDeleting] = useState<Objective | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const confirmDelete = async () => {
    if (!deleting || !onDeleteObjective) return;
    setDeleteBusy(true);
    try {
      await onDeleteObjective(deleting.id);
      setDeleting(null);
    } finally {
      setDeleteBusy(false);
    }
  };

  const handleCreateOKR = (newObj: Objective) => {
    updateObjectives((prev) => [newObj, ...prev]);
  };

  const handleSaveEdit = (updated: Objective) => {
    updateObjectives((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    setEditing(null);
  };

  const openEdit = (obj: Objective) => {
    setEditing(obj);
    setEditOpen(true);
  };

  const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">OKRs</h2>
          <p className="text-muted-foreground text-sm mt-1">Q2 2026 · Objetivos y Key Results</p>
        </div>
        <CreateOKRDialog onCreateOKR={handleCreateOKR} team={team} />
      </div>

      <div className="space-y-4">
        {allObjectives.map((obj) => (
          <Card key={obj.id} className="glass-card overflow-hidden">
            <div className="w-full p-5 flex items-center gap-4 hover:bg-muted/30 transition-colors">
              <button
                onClick={() => toggle(obj.id)}
                className="flex items-center gap-4 flex-1 min-w-0 text-left"
                aria-label={expanded[obj.id] ? "Contraer" : "Expandir"}
              >
                {expanded[obj.id] ? (
                  <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                )}
                <Target className="w-5 h-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-foreground truncate">{obj.title}</h3>
                    <StatusBadge status={obj.status} />
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-muted-foreground">{obj.area}</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">{obj.owner}</span>
                  </div>
                </div>
              </button>
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-24">
                  <Progress value={obj.progress} className="h-2" />
                </div>
                <span className="text-sm font-bold text-foreground w-10 text-right">{obj.progress}%</span>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(obj);
                    }}
                    aria-label="Editar OKR"
                    title="Editar OKR"
                    className="h-8 w-8"
                  >
                    <Pencil className="w-4 h-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
            </div>

            {expanded[obj.id] && (
              <CardContent className="px-5 pb-5 pt-0 border-t border-border/50">
                <p className="text-sm text-muted-foreground mb-4">{obj.description}</p>
                <div className="space-y-3">
                  {obj.keyResults.map((kr) => (
                    <div key={kr.id} className="p-4 rounded-lg bg-muted/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-foreground">{kr.title}</h4>
                        <span className="text-xs font-semibold text-muted-foreground">
                          {kr.current} / {kr.target} {kr.unit}
                        </span>
                      </div>
                      <Progress value={kr.progress} className="h-1.5" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{kr.initiatives.length} iniciativa(s)</span>
                        <span>{kr.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
                {isAdmin && (
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(obj)}
                      className="gap-2"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Editar OKR y KRs
                    </Button>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <EditOKRDialog
        objective={editing}
        open={editOpen}
        onOpenChange={(v) => {
          setEditOpen(v);
          if (!v) setEditing(null);
        }}
        onSave={handleSaveEdit}
        team={team}
      />
    </div>
  );
};

export default OKRsPage;
