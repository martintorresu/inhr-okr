import { useState } from "react";
import AppSidebar from "@/components/AppSidebar";
import DashboardPage from "@/components/DashboardPage";
import OKRsPage from "@/components/OKRsPage";
import InitiativesPage from "@/components/InitiativesPage";
import CheckInsPage from "@/components/CheckInsPage";
import TeamPage from "@/components/TeamPage";
import AlertsPage from "@/components/AlertsPage";
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
  const [currentPage, setCurrentPage] = useState("dashboard");

  const PageComponent = pages[currentPage] || DashboardPage;

  const handleLoadDemo = () => {
    toast.success("Entorno demo cargado", { description: "Datos mock de empresa pequeña (10 usuarios, 5 OKRs)" });
  };

  const handleResetDemo = () => {
    setCurrentPage("dashboard");
    toast.info("Demo reiniciado", { description: "Todos los datos fueron restablecidos" });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onLoadDemo={handleLoadDemo}
        onResetDemo={handleResetDemo}
      />
      <main className="flex-1 p-8 overflow-auto">
        <PageComponent />
      </main>
    </div>
  );
};

export default Index;
