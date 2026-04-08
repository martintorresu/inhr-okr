import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; className: string }> = {
  on_track: { label: "En curso", className: "bg-success/15 text-success" },
  at_risk: { label: "En riesgo", className: "bg-warning/15 text-warning" },
  behind: { label: "Retrasado", className: "bg-danger/15 text-danger" },
  completed: { label: "Completado", className: "bg-success/15 text-success" },
  not_started: { label: "Sin iniciar", className: "bg-muted text-muted-foreground" },
  in_progress: { label: "En progreso", className: "bg-info/15 text-info" },
  blocked: { label: "Bloqueado", className: "bg-danger/15 text-danger" },
};

const StatusBadge = ({ status }: { status: string }) => {
  const config = statusConfig[status] || { label: status, className: "bg-muted text-muted-foreground" };
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold", config.className)}>
      {config.label}
    </span>
  );
};

export default StatusBadge;
