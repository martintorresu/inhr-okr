import { Card, CardContent } from "@/components/ui/card";
import { users, roleLabels } from "@/data/mockData";
import { User } from "lucide-react";

const TeamPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Equipo</h2>
        <p className="text-muted-foreground text-sm mt-1">{users.length} miembros</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => (
          <Card key={user.id} className="glass-card">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-semibold text-primary">
                  {user.name.split(" ").map((n) => n[0]).join("")}
                </span>
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground">{user.name}</h3>
                <p className="text-xs text-muted-foreground">{roleLabels[user.role]} · {user.area}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TeamPage;
