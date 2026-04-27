import { cn } from "@/lib/utils";
import { activeTenant, activeTenantId } from "@/data/tenant";

// Unified sidebar style across all tenants (blue/celeste gradient).
const isInhr = true;

const inhrSidebarStyle: React.CSSProperties = {
  background:
    "linear-gradient(180deg, #0B2A6B 0%, #1E4BFF 45%, #3D7BFF 80%, #5DB6FF 100%)",
};
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

const AppSidebar = ({ currentPage, onNavigate, onLoadDemo, onResetDemo, onLogout, alertsCount = 0 }: AppSidebarProps) => {
  return (
    <aside
      className={cn(
        "w-64 h-screen sticky top-0 flex flex-col relative overflow-hidden",
        isInhr ? "text-white" : "bg-sidebar"
      )}
      style={isInhr ? inhrSidebarStyle : undefined}
    >
      {isInhr && (
        <>
          {/* Soft celeste glow top */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -left-16 w-72 h-72 rounded-full blur-3xl opacity-50"
            style={{
              background:
                "radial-gradient(circle, #5DB6FF 0%, #3D7BFF 50%, transparent 100%)",
            }}
          />
          {/* Subtle deep-blue glow bottom */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -right-16 w-80 h-80 rounded-full blur-3xl opacity-40"
            style={{
              background:
                "radial-gradient(circle, #1E4BFF 0%, #0B2A6B 60%, transparent 100%)",
            }}
          />
        </>
      )}

      {/* Logo */}
      <div
        className={cn(
          "p-6 relative z-10",
          isInhr ? "border-b border-white/15" : "border-b border-sidebar-border"
        )}
      >
        <div className="flex items-center gap-3">
          {activeTenant.logo ? (
            <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center overflow-hidden shrink-0">
              <img src={activeTenant.logo} alt={activeTenant.company_name} className="w-full h-full object-contain" />
            </div>
          ) : (
            <div
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center",
                isInhr ? "bg-white/15 backdrop-blur-sm" : "bg-sidebar-primary"
              )}
            >
              <Target className={cn("w-5 h-5", isInhr ? "text-white" : "text-sidebar-primary-foreground")} />
            </div>
          )}
          <div>
            <h1
              className={cn(
                "text-base font-bold tracking-tight",
                isInhr ? "text-white" : "text-sidebar-primary-foreground"
              )}
            >
              {activeTenant.company_name}
            </h1>
            <p
              className={cn(
                "text-[11px] font-medium tracking-widest uppercase",
                isInhr ? "text-sky-200/90" : "text-sidebar-muted"
              )}
            >
              Strategy
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 min-h-0 overflow-y-auto p-3 space-y-1 relative z-10">
        {navItems.map((item) => {
          const showBadge = item.id === "alerts" && alertsCount > 0;
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isInhr
                  ? active
                    ? "bg-white/20 text-white backdrop-blur-sm shadow-sm ring-1 ring-white/25"
                    : "text-sky-100/90 hover:bg-white/10 hover:text-white"
                  : active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="w-4.5 h-4.5" />
              <span className="flex-1 text-left">{item.label}</span>
              {showBadge && (
                <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-danger text-danger-foreground text-[10px] font-semibold">
                  {alertsCount > 99 ? "99+" : alertsCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Demo controls — hidden for InovaHR tenant */}
      {activeTenantId !== "inovahr" && (
        <div
          className={cn(
            "shrink-0 p-4 space-y-2 relative z-10",
            isInhr ? "border-t border-white/15" : "border-t border-sidebar-border"
          )}
        >
          <button
            onClick={onLoadDemo}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-opacity",
              isInhr
                ? "bg-white text-[#1E4BFF] hover:opacity-90"
                : "bg-sidebar-primary text-sidebar-primary-foreground hover:opacity-90"
            )}
          >
            <Play className="w-4 h-4" />
            Cargar Demo
          </button>
          <button
            onClick={onResetDemo}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isInhr
                ? "border border-white/30 text-sky-100 hover:bg-white/10"
                : "border border-sidebar-border text-sidebar-muted hover:bg-sidebar-accent/30"
            )}
          >
            <RotateCcw className="w-4 h-4" />
            Reset Demo
          </button>
        </div>
      )}

      {/* User + Logout */}
      <div
        className={cn(
          "shrink-0 mt-auto p-4 relative z-10",
          isInhr ? "border-t border-white/15" : "border-t border-sidebar-border"
        )}
      >
        {(() => {
          const adminUser = activeTenant.users.find((u) => u.role === "admin") ?? activeTenant.users[0];
          const initials = adminUser?.name.split(" ").map((n) => n[0]).slice(0, 2).join("") ?? "U";
          return (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
                    isInhr
                      ? "bg-white/20 text-white ring-1 ring-white/30"
                      : "bg-sidebar-primary/20 text-sidebar-primary"
                  )}
                >
                  {initials}
                </div>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-sm font-medium truncate",
                      isInhr ? "text-white" : "text-sidebar-accent-foreground"
                    )}
                  >
                    {adminUser?.name ?? "Usuario"}
                  </p>
                  <p
                    className={cn(
                      "text-xs",
                      isInhr ? "text-sky-200/90" : "text-sidebar-muted"
                    )}
                  >
                    Admin
                  </p>
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Cerrar sesión"
                className={cn(
                  "p-1.5 rounded-lg transition-colors shrink-0",
                  isInhr
                    ? "text-sky-100 hover:text-white hover:bg-white/15"
                    : "text-sidebar-muted hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50"
                )}
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
