import { cn } from "@/lib/utils";
import { activeTenant, activeTenantId } from "@/data/tenant";
import {
  LayoutDashboard,
  Target,
  Rocket,
  ClipboardCheck,
  Users,
  AlertTriangle,
  Settings,
  Play,
  RotateCcw,
  LogOut,
} from "lucide-react";

interface AppSidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLoadDemo: () => void;
  onResetDemo: () => void;
  onLogout: () => void;
  alertsCount?: number;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "okrs", label: "OKRs", icon: Target },
  { id: "initiatives", label: "Iniciativas", icon: Rocket },
  { id: "checkins", label: "Check-ins", icon: ClipboardCheck },
  { id: "team", label: "Equipo", icon: Users },
  { id: "alerts", label: "Alertas", icon: AlertTriangle },
];

const AppSidebar = ({ currentPage, onNavigate, onLoadDemo, onResetDemo, onLogout }: AppSidebarProps) => {
  return (
    <aside className="w-64 min-h-screen bg-sidebar flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          {activeTenant.logo ? (
            <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center overflow-hidden shrink-0">
              <img src={activeTenant.logo} alt={activeTenant.company_name} className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <Target className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
          )}
          <div>
            <h1 className="text-base font-bold text-sidebar-primary-foreground tracking-tight">{activeTenant.company_name}</h1>
            <p className="text-[11px] text-sidebar-muted font-medium tracking-widest uppercase">Strategy</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
              currentPage === item.id
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
            )}
          >
            <item.icon className="w-4.5 h-4.5" />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Demo controls — hidden for InovaHR tenant */}
      {activeTenantId !== "inovahr" && (
        <div className="p-4 border-t border-sidebar-border space-y-2">
          <button
            onClick={onLoadDemo}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Play className="w-4 h-4" />
            Cargar Demo
          </button>
          <button
            onClick={onResetDemo}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-sidebar-border text-sidebar-muted text-sm font-medium hover:bg-sidebar-accent/30 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Demo
          </button>
        </div>
      )}

      {/* User + Logout */}
      <div className="p-4 border-t border-sidebar-border">
        {(() => {
          const adminUser = activeTenant.users.find((u) => u.role === "admin") ?? activeTenant.users[0];
          const initials = adminUser?.name.split(" ").map((n) => n[0]).slice(0, 2).join("") ?? "U";
          return (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-sidebar-primary/20 flex items-center justify-center text-xs font-semibold text-sidebar-primary shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-sidebar-accent-foreground truncate">{adminUser?.name ?? "Usuario"}</p>
                  <p className="text-xs text-sidebar-muted">Admin</p>
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Cerrar sesión"
                className="p-1.5 rounded-lg text-sidebar-muted hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50 transition-colors shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          );
        })()}
      </div>
    </aside>
  );
};

export default AppSidebar;
