import { useMemo } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import type { CheckInRecord } from "@/lib/checkInsPersistence";

interface Props {
  checkIns: CheckInRecord[];
  objectiveId: string;
}

const confidenceToNumber = (c: string) => (c === "green" ? 1 : c === "yellow" ? 0.5 : 0);

const CheckInTimeline = ({ checkIns, objectiveId }: Props) => {
  const data = useMemo(() => {
    return checkIns
      .filter((c) => c.objectiveId === objectiveId)
      .slice()
      .sort((a, b) => a.checkinDate.localeCompare(b.checkinDate))
      .map((c) => ({
        date: c.checkinDate,
        progreso: c.progressManual ?? c.progressAuto ?? 0,
        score: Number(((c.scoreManual ?? c.scoreAuto ?? 0) * 100).toFixed(0)),
        confianza: confidenceToNumber(c.confidence) * 100,
      }));
  }, [checkIns, objectiveId]);

  if (!data.length) {
    return (
      <div className="text-sm text-muted-foreground py-8 text-center">
        Sin check-ins registrados para este OKR todavía.
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="progreso" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="score" stroke="hsl(var(--success))" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="confianza" stroke="hsl(var(--warning))" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CheckInTimeline;
