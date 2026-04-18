import { useState } from "react";
import { Target } from "lucide-react";
import { activeTenant } from "@/data/tenant";
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
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative">
      <div className="absolute top-4 left-4 flex flex-col items-center gap-1">
        <img src={inhrLogo} alt="InHR" className="h-10 w-auto object-contain" />
        <span className="text-xs text-muted-foreground">Powered by InHR</span>
      </div>
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          {activeTenant.logo ? (
            <div className="w-16 h-16 rounded-2xl bg-white border border-border flex items-center justify-center overflow-hidden">
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
