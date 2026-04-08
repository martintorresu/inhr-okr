import { Card, CardContent } from "@/components/ui/card";
import { alerts } from "@/data/mockData";
import { AlertTriangle, Clock, Ban, Bell } from "lucide-react";

const iconMap: Record<string, typeof AlertTriangle> = {
  risk: AlertTriangle,
  overdue: Clock,
  blocked: Ban,
  checkin: Bell,
};

const AlertsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Alertas</h2>
        <p className="text-muted-foreground text-sm mt-1">{alerts.length} alertas activas</p>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => {
          const Icon = iconMap[alert.type] || AlertTriangle;
          return (
            <Card key={alert.id} className="glass-card">
              <CardContent className="p-5 flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${alert.severity === "high" ? "bg-danger/10" : "bg-warning/10"}`}>
                  <Icon className={`w-5 h-5 ${alert.severity === "high" ? "text-danger" : "text-warning"}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{alert.date}</p>
                </div>
                <span className={`text-xs font-semibold uppercase ${alert.severity === "high" ? "text-danger" : "text-warning"}`}>
                  {alert.severity === "high" ? "Alta" : "Media"}
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AlertsPage;
