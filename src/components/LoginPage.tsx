import { useState } from "react";
import { Target } from "lucide-react";
import { activeTenant, activeTenantId } from "@/data/tenant";
import inhrLogo from "@/assets/inhr-logo.png";

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage = ({ onLogin }: LoginPageProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
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
      <div className="w-full max-w-sm space-y-8 relative z-10 bg-card/70 backdrop-blur-md p-8 rounded-2xl border border-border/50 shadow-xl">
        <div className="flex flex-col items-center gap-3">
          {activeTenant.logo ? (
            <div
              className={`${
                activeTenantId === "inovahr" ? "w-32 h-32" : "w-16 h-16"
              } rounded-2xl bg-white border border-border flex items-center justify-center overflow-hidden`}
            >
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
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={activeTenant.users[0]?.email ?? "demo@demo.com"}
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
              className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Iniciar Sesión
          </button>
        </form>

        <p className="text-xs text-center text-muted-foreground">Demo: ingresa cualquier dato para acceder</p>
      </div>
    </div>
  );
};

export default LoginPage;
