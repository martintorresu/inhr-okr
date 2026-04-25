import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import ProgressRing from "@/components/ProgressRing";
import StatusBadge from "@/components/StatusBadge";
import {
  objectives as defaultObjectives,
  alerts,
  areas,
} from "@/data/mockData";
import type { Objective } from "@/data/mockData";
import { Target, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const getBarColor = (progress: number) => {
  if (progress >= 70) return "hsl(152, 60%, 42%)";
  if (progress >= 40) return "hsl(38, 92%, 50%)";
  return "hsl(0, 72%, 51%)";
};

interface DashboardPageProps {
  objectives?: Objective[];
}

const DashboardPage = ({ objectives = defaultObjectives }: DashboardPageProps = {}) => {
  const onTrack = objectives.filter((o) => o.status === "on_track").length;
  const atRisk = objectives.filter((o) => o.status === "at_risk" || o.status === "behind").length;
  const totalKRs = objectives.reduce((s, o) => s + o.keyResults.length, 0);

  // Derive per-area & global progress from the live objectives list so the
  // dashboard reflects OKRs created/edited at runtime.
  const areaProgress = areas.map((area) => {
    const areaObjs = objectives.filter((o) => o.area === area);
    const avg = areaObjs.length > 0
      ? Math.round(areaObjs.reduce((s, o) => s + o.progress, 0) / areaObjs.length)
      : 0;
    return { area, progress: avg, objectives: areaObjs.length };
  });
  const globalProgress = objectives.length
    ? Math.round(objectives.reduce((s, o) => s + o.progress, 0) / objectives.length)
    : 0;

  const kpiCards = [
    { title: "Cumplimiento Global", value: `${globalProgress}%`, icon: Target, color: "text-primary" },
    { title: "OKRs en Curso", value: `${onTrack}`, icon: TrendingUp, color: "text-success" },
    { title: "OKRs en Riesgo", value: `${atRisk}`, icon: AlertTriangle, color: "text-warning" },
    { title: "Key Results", value: `${totalKRs}`, icon: CheckCircle2, color: "text-info" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dashboard Ejecutivo</h2>
        <p className="text-muted-foreground text-sm mt-1">Q2 2026 · Vista general de la organización</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title} className="glass-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{kpi.title}</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{kpi.value}</p>
                </div>
                <kpi.icon className={`w-10 h-10 ${kpi.color} opacity-70`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Ring + Area chart */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Cumplimiento por Área</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={areaProgress} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} fontSize={12} />
                  <YAxis type="category" dataKey="area" width={130} fontSize={12} />
                  <Tooltip formatter={(value: number) => [`${value}%`, "Avance"]} />
                  <Bar dataKey="progress" radius={[0, 6, 6, 0]} barSize={24}>
                    {areaProgress.map((entry, index) => (
                      <Cell key={index} fill={getBarColor(entry.progress)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Global ring */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Progreso Global</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <ProgressRing value={globalProgress} size={140} strokeWidth={10} />
            <div className="w-full space-y-3">
              {objectives.slice(0, 3).map((obj) => (
                <div key={obj.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground truncate max-w-[140px]">{obj.area}</span>
                  <StatusBadge status={obj.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* OKR Heatmap + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Heatmap OKR</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {objectives.map((obj) => (
              <div key={obj.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{obj.title}</span>
                  <span className="text-xs text-muted-foreground">{obj.progress}%</span>
                </div>
                <Progress value={obj.progress} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              Alertas Activas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
              >
                <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${alert.severity === "high" ? "bg-danger" : "bg-warning"}`} />
                <div>
                  <p className="text-sm font-medium text-foreground">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{alert.date}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
