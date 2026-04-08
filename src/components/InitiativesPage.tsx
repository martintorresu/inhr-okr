import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import StatusBadge from "@/components/StatusBadge";
import { objectives } from "@/data/mockData";
import { Rocket, Calendar, User } from "lucide-react";

const InitiativesPage = () => {
  const allInitiatives = objectives.flatMap((obj) =>
    obj.keyResults.flatMap((kr) =>
      kr.initiatives.map((ini) => ({ ...ini, objectiveTitle: obj.title, krTitle: kr.title }))
    )
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Iniciativas</h2>
        <p className="text-muted-foreground text-sm mt-1">{allInitiatives.length} iniciativas activas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allInitiatives.map((ini) => (
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
                <StatusBadge status={ini.status} />
              </div>

              <Progress value={ini.progress} className="h-1.5" />

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {ini.responsible}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {ini.endDate}
                </div>
                <span className="font-semibold">{ini.progress}%</span>
              </div>

              {/* Tasks */}
              <div className="space-y-1">
                {ini.tasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-2 text-xs">
                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${task.completed ? "bg-success border-success" : "border-border"}`}>
                      {task.completed && <span className="text-success-foreground text-[8px]">✓</span>}
                    </div>
                    <span className={task.completed ? "text-muted-foreground line-through" : "text-foreground"}>{task.title}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default InitiativesPage;
