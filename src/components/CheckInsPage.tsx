import { Card, CardContent } from "@/components/ui/card";
import { checkIns, objectives } from "@/data/mockData";
import { MessageSquare, AlertTriangle } from "lucide-react";

const CheckInsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Check-ins</h2>
        <p className="text-muted-foreground text-sm mt-1">Seguimiento quincenal de OKRs</p>
      </div>

      <div className="space-y-4">
        {checkIns.map((ci) => {
          const obj = objectives.find((o) => o.id === ci.objectiveId);
          return (
            <Card key={ci.id} className="glass-card">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">{obj?.title}</h3>
                      <span className="text-xs text-muted-foreground">{ci.date}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{ci.comment}</p>
                    {ci.blockers && (
                      <div className="flex items-center gap-2 text-xs text-danger bg-danger/10 px-3 py-1.5 rounded-md">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Bloqueante: {ci.blockers}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Avance: {ci.progress}%</span>
                      <span>•</span>
                      <span>{ci.author}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default CheckInsPage;
