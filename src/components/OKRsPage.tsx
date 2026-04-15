import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import StatusBadge from "@/components/StatusBadge";
import { objectives as defaultObjectives } from "@/data/mockData";
import type { Objective } from "@/data/mockData";
import { ChevronDown, ChevronRight, Target } from "lucide-react";
import { useState } from "react";
import CreateOKRDialog from "@/components/CreateOKRDialog";

const OKRsPage = () => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ obj1: true });
  const [allObjectives, setAllObjectives] = useState<Objective[]>(defaultObjectives);

  const handleCreateOKR = (newObj: Objective) => {
    setAllObjectives((prev) => [newObj, ...prev]);
  };

  const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">OKRs</h2>
          <p className="text-muted-foreground text-sm mt-1">Q2 2026 · Objetivos y Key Results</p>
        </div>
        <CreateOKRDialog onCreateOKR={handleCreateOKR} />
      </div>

      <div className="space-y-4">
        {allObjectives.map((obj) => (
          <Card key={obj.id} className="glass-card overflow-hidden">
            <button
              onClick={() => toggle(obj.id)}
              className="w-full p-5 flex items-center gap-4 text-left hover:bg-muted/30 transition-colors"
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
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-24">
                  <Progress value={obj.progress} className="h-2" />
                </div>
                <span className="text-sm font-bold text-foreground w-10 text-right">{obj.progress}%</span>
              </div>
            </button>

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
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default OKRsPage;
