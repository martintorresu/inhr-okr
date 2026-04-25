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
import { objectives as defaultObjectives, users as defaultUsers, checkIns as defaultCheckIns } from "@/data/mockData";
import type { Objective } from "@/data/mockData";
import { toast } from "sonner";
import { loadTenantObjectives, replaceTenantObjectives } from "@/lib/okrPersistence";
import {
  loadTenantInitiatives,
  upsertInitiative,
  deleteInitiative,
  seedInitiativesFromObjectives,
  type InitiativeWithContext,
} from "@/lib/initiativesPersistence";
import {
  loadTenantTeam,
  upsertTeamMember,
  deleteTeamMember,
  seedTeamFromMocks,
  type TeamMember,
} from "@/lib/teamPersistence";
import {
  loadTenantCheckIns,
  upsertCheckIn,
  deleteCheckIn,
  seedCheckInsFromMocks,
  type CheckInRecord,
} from "@/lib/checkInsPersistence";

const DEMO_TENANTS = new Set<string>(["quimetal"]);

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [objectives, setObjectives] = useState<Objective[]>(defaultObjectives);
  const [loadedObjectives, setLoadedObjectives] = useState(false);
  const [initiatives, setInitiatives] = useState<InitiativeWithContext[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
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

    const hydrate = async () => {
      setLoadedObjectives(false);
      try {
        const stored = await loadTenantObjectives(activeTenantId);
        if (cancelled) return;

        let activeObjectives = stored;
        if (stored.length) {
          skipNextPersist.current = true;
          setObjectives(stored);
        } else if (defaultObjectives.length) {
          await replaceTenantObjectives(activeTenantId, defaultObjectives);
          if (!cancelled) setObjectives(defaultObjectives);
          activeObjectives = defaultObjectives;
        } else {
          setObjectives([]);
          activeObjectives = [];
        }

        // Initiatives: load from table, seed from mocks on first run.
        const storedInis = await loadTenantInitiatives(activeTenantId);
        if (cancelled) return;
        if (storedInis.length) {
          setInitiatives(storedInis);
        } else {
          const seeded = await seedInitiativesFromObjectives(activeTenantId, activeObjectives);
          if (!cancelled) setInitiatives(seeded);
        }

        // Team: load from table, seed from mocks on first run.
        const storedTeam = await loadTenantTeam(activeTenantId);
        if (cancelled) return;
        if (storedTeam.length) {
          setTeam(storedTeam);
        } else if (defaultUsers.length) {
          const seededTeam = await seedTeamFromMocks(activeTenantId, defaultUsers);
          if (!cancelled) setTeam(seededTeam);
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : "No se pudieron cargar los datos";
        toast.error(msg);
      } finally {
        if (!cancelled) setLoadedObjectives(true);
      }
    };

    hydrate();
    return () => { cancelled = true; };
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

  const handleInitiativeUpsert = async (ini: InitiativeWithContext) => {
    await upsertInitiative(activeTenantId, ini);
    setInitiatives((prev) => {
      const idx = prev.findIndex((i) => i.id === ini.id);
      if (idx === -1) return [...prev, ini];
      const next = [...prev];
      next[idx] = ini;
      return next;
    });
  };

  const handleInitiativeDelete = async (id: string) => {
    await deleteInitiative(activeTenantId, id);
    setInitiatives((prev) => prev.filter((i) => i.id !== id));
  };

  const handleTeamUpsert = async (m: TeamMember) => {
    await upsertTeamMember(activeTenantId, m);
    setTeam((prev) => {
      const idx = prev.findIndex((p) => p.id === m.id);
      if (idx === -1) return [...prev, m].sort((a, b) => a.name.localeCompare(b.name));
      const next = [...prev];
      next[idx] = m;
      return next;
    });
  };

  const handleTeamDelete = async (id: string) => {
    await deleteTeamMember(activeTenantId, id);
    setTeam((prev) => prev.filter((m) => m.id !== id));
  };

  const renderPage = () => {
    if (!loadedObjectives) {
      return <div className="text-sm text-muted-foreground">Cargando datos...</div>;
    }

    switch (currentPage) {
      case "okrs":
        return <OKRsPage objectives={objectives} setObjectives={setObjectives} />;
      case "dashboard":
        return <DashboardPage objectives={objectives} initiatives={initiatives} />;
      case "initiatives":
        return (
          <InitiativesPage
            objectives={objectives}
            initiatives={initiatives}
            team={team}
            onUpsert={handleInitiativeUpsert}
            onDelete={handleInitiativeDelete}
          />
        );
      case "checkins":
        return <CheckInsPage />;
      case "team":
        return <TeamPage team={team} onUpsert={handleTeamUpsert} onDelete={handleTeamDelete} />;
      case "alerts":
        return <AlertsPage />;
      default:
        return <DashboardPage objectives={objectives} initiatives={initiatives} />;
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
