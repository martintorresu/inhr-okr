import { useEffect, useState } from "react";
import { Target } from "lucide-react";
import { activeTenant, activeTenantId } from "@/data/tenant";
import inhrLogo from "@/assets/inhr-logo-inovahr.png";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LoginPageProps {
  onLogin: () => void;
}

// Tenants that keep the visual demo login (no real auth).
const DEMO_TENANTS = new Set<string>(["quimetal"]);

const LoginPage = ({ onLogin }: LoginPageProps) => {
  const isDemoTenant = DEMO_TENANTS.has(activeTenantId);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);

  // If user already has a session, skip login (only for real-auth tenants).
  useEffect(() => {
    if (isDemoTenant) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) onLogin();
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) onLogin();
    });
    return () => sub.subscription.unsubscribe();
  }, [isDemoTenant, onLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemoTenant) {
      onLogin();
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: fullName, tenant_id: activeTenantId },
          },
        });
        if (error) throw error;
        toast.success("Cuenta creada", { description: "Revisa tu correo para confirmar el email antes de iniciar sesión." });
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // onAuthStateChange triggers onLogin
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error de autenticación";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #1E4BFF 0%, #5DB6FF 28%, #C47CFF 55%, #FF5FA3 80%, #FF8A7A 100%)",
      }}
    >
      {/* Large blue sphere — top left */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-[25%] -left-[15%] w-[85vw] h-[85vw] max-w-[1000px] max-h-[1000px] rounded-full blur-2xl opacity-95"
        style={{
          background:
            "radial-gradient(circle at 38% 38%, #1E4BFF 0%, #2E5FFF 40%, #5DB6FF 70%, transparent 100%)",
        }}
      />
      {/* Large pink/peach sphere — bottom right */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-[28%] -right-[18%] w-[90vw] h-[90vw] max-w-[1050px] max-h-[1050px] rounded-full blur-2xl opacity-95"
        style={{
          background:
            "radial-gradient(circle at 40% 40%, #FF5FA3 0%, #FF6E8E 45%, #FF8A7A 75%, transparent 100%)",
        }}
      />
      {/* Soft lila glow to bridge the two spheres */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] max-w-[700px] max-h-[700px] rounded-full blur-3xl opacity-60"
        style={{
          background:
            "radial-gradient(circle, #C47CFF 0%, #C47CFF55 50%, transparent 100%)",
        }}
      />
      {/* Soft white veil to lift card readability */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(0_0%_100%/0.45)_0%,hsl(0_0%_100%/0.15)_45%,transparent_75%)]"
      />
      {/* Subtle dark vignette for edge contrast on small screens */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,hsl(0_0%_0%/0.15)_100%)]"
      />

      <a
        href="https://www.inovahr.com"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-4 right-4 z-10 flex items-center justify-center px-3 py-2 rounded-xl bg-white/60 backdrop-blur-sm border border-white/40 shadow-md hover:bg-white/80 transition-colors"
      >
        <img src={inhrLogo} alt="InHR — Powered by InovaHR" className="w-auto object-contain" style={{ height: "6.5rem" }} />
      </a>
      <div className="w-full max-w-sm space-y-6 relative z-10 bg-card/90 backdrop-blur-xl p-8 rounded-2xl border border-white/40 shadow-2xl">
        <div className="flex flex-col items-center gap-3">
          {activeTenant.logo ? (
            <div className="w-32 h-32 rounded-2xl bg-white border border-border flex items-center justify-center overflow-hidden">
              <img src={activeTenant.logo} alt={activeTenant.company_name} className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center">
              <Target className="w-8 h-8 text-primary-foreground" />
            </div>
          )}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">{activeTenant.app_name}</h1>
            <p className="text-sm text-muted-foreground mt-1">Gestión estratégica de OKRs</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isDemoTenant && mode === "signup" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="fullName">Nombre completo</label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej: Ana Pérez"
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={activeTenant.users[0]?.email ?? "demo@demo.com"}
              required={!isDemoTenant}
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required={!isDemoTenant}
              minLength={isDemoTenant ? 0 : 6}
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {loading ? "Procesando..." : isDemoTenant ? "Iniciar Sesión" : mode === "signup" ? "Crear cuenta" : "Iniciar Sesión"}
          </button>
        </form>

        {!isDemoTenant ? (
          <p className="text-xs text-center text-muted-foreground">
            {mode === "signin" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-primary font-medium hover:underline"
            >
              {mode === "signin" ? "Crear una" : "Iniciar sesión"}
            </button>
          </p>
        ) : (
          <p className="text-xs text-center text-muted-foreground">Demo: ingresa cualquier dato para acceder</p>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
