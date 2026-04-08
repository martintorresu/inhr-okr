import { useState } from "react";
import AppSidebar from "@/components/AppSidebar";
import DashboardPage from "@/components/DashboardPage";
import OKRsPage from "@/components/OKRsPage";
import InitiativesPage from "@/components/InitiativesPage";
import CheckInsPage from "@/components/CheckInsPage";
import TeamPage from "@/components/TeamPage";
import AlertsPage from "@/components/AlertsPage";
import LoginPage from "@/components/LoginPage";
import { toast } from "sonner";

const pages: Record<string, React.FC> = {
  dashboard: DashboardPage,
  okrs: OKRsPage,
  initiatives: InitiativesPage,
  checkins: CheckInsPage,
  team: TeamPage,
  alerts: AlertsPage,
};

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");

  const PageComponent = pages[currentPage] || DashboardPage;

  const handleLoadDemo = () => {
    toast.success("Entorno demo cargado", { description: "Datos mock de empresa pequeña (10 usuarios, 5 OKRs)" });
  };

  const handleResetDemo = () => {
    setCurrentPage("dashboard");
    toast.info("Demo reiniciado", { description: "Todos los datos fueron restablecidos" });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentPage("dashboard");
    toast.info("Sesión cerrada");
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onLoadDemo={handleLoadDemo}
        onResetDemo={handleResetDemo}
        onLogout={handleLogout}
      />
      <main className="flex-1 p-8 overflow-auto">
        <PageComponent />
      </main>
    </div>
  );
};

export default Index;
