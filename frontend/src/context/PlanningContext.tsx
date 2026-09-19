import React, { createContext, useContext, useState } from "react";

interface PlanningContextType {
  role: string;
  setRole: (role: string) => void;
  period: string;
  setPeriod: (period: string) => void;
  corridor: string;
  setCorridor: (corridor: string) => void;
  syncNotice: string | null;
  setSyncNotice: (notice: string | null) => void;
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSidebar: () => void;
}

const PlanningContext = createContext<PlanningContextType | undefined>(undefined);

export const PlanningProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState("Railway Planner (Division)");
  const [period, setPeriod] = useState("Week 38 (18 - 24 Sep 2026)");
  const [corridor, setCorridor] = useState("Mainline Corridor Alpha (Sec A-D)");
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <PlanningContext.Provider
      value={{
        role,
        setRole,
        period,
        setPeriod,
        corridor,
        setCorridor,
        syncNotice,
        setSyncNotice,
        sidebarOpen,
        setSidebarOpen,
        toggleSidebar,
      }}
    >
      {children}
    </PlanningContext.Provider>
  );
};

export const usePlanning = () => {
  const context = useContext(PlanningContext);
  if (!context) {
    throw new Error("usePlanning must be used within a PlanningProvider");
  }
  return context;
};
