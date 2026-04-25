import { useEffect, useState } from "react";
import { Target } from "lucide-react";
import { activeTenant, activeTenantId } from "@/data/tenant";
import inhrLogo from "@/assets/inhr-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
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
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        toast.success("Cuenta creada", { description: "Revisa tu correo para confirmar el email." });
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

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(result.error.message ?? "No se pudo iniciar con Google");
        setLoading(false);
        return;
      }
      if (result.redirected) return; // browser navigates away
      onLogin();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error con Google";
      toast.error(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-[linear-gradient(135deg,hsl(25_15%_96%)_0%,hsl(25_20%_92%)_50%,hsl(220_8%_88%)_100%)]">
      {/* Decorative animated blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-[hsl(22_95%_58%/0.35)] blur-3xl animate-pulse"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-24 w-[32rem] h-[32rem] rounded-full bg-[hsl(220_10%_55%/0.30)] blur-3xl animate-pulse"
        style={{ animationDelay: "1.2s" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/3 right-1/4 w-72 h-72 rounded-full bg-[hsl(30_90%_65%/0.25)] blur-2xl animate-pulse"
        style={{ animationDelay: "2.4s" }}
      />
      {/* Geometric accent shapes */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-20 left-1/4 w-24 h-24 rotate-45 rounded-2xl bg-[hsl(22_95%_58%/0.18)] backdrop-blur-sm"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-24 left-16 w-16 h-16 rounded-full border-2 border-[hsl(22_95%_58%/0.35)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-10 w-20 h-20 rotate-12 rounded-xl border-2 border-[hsl(220_10%_50%/0.30)]"
      />

      <div className="absolute top-4 right-4 flex flex-col items-center gap-2 z-10">
        <img src={inhrLogo} alt="InHR" className="h-20 w-auto object-contain" />
        <span className="text-sm text-muted-foreground">Powered by InHR</span>
      </div>
      <div className="w-full max-w-sm space-y-6 relative z-10 bg-card/70 backdrop-blur-md p-8 rounded-2xl border border-border/50 shadow-xl">
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

        {!isDemoTenant && (
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white border border-border text-foreground text-sm font-medium hover:bg-muted/50 transition-colors disabled:opacity-60"
          >
            <svg className="w-4 h-4" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.2 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.7 6.4 29.1 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.4-.4-3.5z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.7 6.4 29.1 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 43.5c5 0 9.6-1.9 13.1-5l-6.1-5c-2 1.4-4.4 2.2-7 2.2-5.2 0-9.6-3.3-11.2-8l-6.5 5C9.6 39.1 16.3 43.5 24 43.5z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.5l6.1 5c-.4.4 6.4-4.7 6.4-14.5 0-1.2-.1-2.4-.4-3.5z"/>
            </svg>
            Continuar con Google
          </button>
        )}

        {!isDemoTenant && (
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">o</span>
            <div className="h-px flex-1 bg-border" />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
