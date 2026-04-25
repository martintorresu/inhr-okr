import { useEffect, useRef, useState } from "react";
import AppSidebar from "@/components/AppSidebar";
import { supabase } from "@/integrations/supabase/client";
import { activeTenantId } from "@/data/tenant";
import DashboardPage from "@/components/DashboardPage";
import OKRsPage from "@/components/OKRsPage";
import InitiativesPage from "@/components/InitiativesPage";
import CheckInsPage from "@/components/CheckInsPage";
import TeamPage from "@/components/TeamPage";
import AlertsPage from "@/components/AlertsPage";
import LoginPage from "@/components/LoginPage";
import { objectives as defaultObjectives } from "@/data/mockData";
import type { Objective } from "@/data/mockData";
import { toast } from "sonner";
import { loadTenantObjectives, replaceTenantObjectives } from "@/lib/okrPersistence";

const DEMO_TENANTS = new Set<string>(["quimetal"]);

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [objectives, setObjectives] = useState<Objective[]>(defaultObjectives);
  const [loadedObjectives, setLoadedObjectives] = useState(false);
  const isDemoTenant = DEMO_TENANTS.has(activeTenantId);
  const skipNextPersist = useRef(false);

  // Hydrate session from Supabase for real-auth tenants.
  useEffect(() => {
    if (isDemoTenant) return;
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsLoggedIn(!!session);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setIsLoggedIn(true);
    });
    return () => sub.subscription.unsubscribe();
  }, [isDemoTenant]);

  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;

    const hydrateObjectives = async () => {
      setLoadedObjectives(false);
      try {
        const stored = await loadTenantObjectives(activeTenantId);
        if (cancelled) return;

        if (stored.length) {
          skipNextPersist.current = true;
          setObjectives(stored);
        } else if (defaultObjectives.length) {
          await replaceTenantObjectives(activeTenantId, defaultObjectives);
          if (!cancelled) setObjectives(defaultObjectives);
        } else {
          setObjectives([]);
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : "No se pudieron cargar los OKRs";
        toast.error(msg);
      } finally {
        if (!cancelled) setLoadedObjectives(true);
      }
    };

    hydrateObjectives();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn || !loadedObjectives) return;
    if (skipNextPersist.current) {
      skipNextPersist.current = false;
      return;
    }

    const timer = window.setTimeout(() => {
      replaceTenantObjectives(activeTenantId, objectives).catch((error) => {
        const msg = error instanceof Error ? error.message : "No se pudieron guardar los OKRs";
        toast.error(msg);
      });
    }, 400);

    return () => window.clearTimeout(timer);
  }, [objectives, isLoggedIn, loadedObjectives]);

  const renderPage = () => {
    if (!loadedObjectives) {
      return <div className="text-sm text-muted-foreground">Cargando OKRs...</div>;
    }

    switch (currentPage) {
      case "okrs":
        return <OKRsPage objectives={objectives} setObjectives={setObjectives} />;
      case "dashboard":
        return <DashboardPage objectives={objectives} />;
      case "initiatives":
        return <InitiativesPage />;
      case "checkins":
        return <CheckInsPage />;
      case "team":
        return <TeamPage />;
      case "alerts":
        return <AlertsPage />;
      default:
        return <DashboardPage objectives={objectives} />;
    }
  };

  const handleLoadDemo = () => {
    toast.success("Entorno demo cargado", { description: "Datos mock de empresa pequeña (10 usuarios, 5 OKRs)" });
  };

  const handleResetDemo = () => {
    setCurrentPage("dashboard");
    toast.info("Demo reiniciado", { description: "Todos los datos fueron restablecidos" });
  };

  const handleLogout = async () => {
    if (!isDemoTenant) {
      await supabase.auth.signOut();
    }
    setIsLoggedIn(false);
    setCurrentPage("dashboard");
    setLoadedObjectives(false);
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
        {renderPage()}
      </main>
    </div>
  );
};

export default Index;
