import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PlanningProvider } from "./context/PlanningContext";
import { Layout } from "./layouts/Layout";
import { LandingPage } from "./pages/LandingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { MaintenanceRequestsPage } from "./pages/MaintenanceRequestsPage";
import { ConflictDetectionPage } from "./pages/ConflictDetectionPage";
import { OptimisationResultsPage } from "./pages/OptimisationResultsPage";
import { ExplainabilityPage } from "./pages/ExplainabilityPage";
import { ApprovalPage } from "./pages/ApprovalPage";
import { AuditHistoryPage } from "./pages/AuditHistoryPage";
import { BlockPlanningWorkspacePage } from "./pages/BlockPlanningWorkspacePage";
import { WhatIfSimulationPage } from "./pages/WhatIfSimulationPage";
import { DataSourcesPage } from "./pages/DataSourcesPage";
import { SettingsPage } from "./pages/SettingsPage";

export const App: React.FC = () => {
  return (
    <PlanningProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<LandingPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="requests" element={<MaintenanceRequestsPage />} />
            <Route path="maintenance" element={<MaintenanceRequestsPage />} />
            <Route path="conflicts" element={<ConflictDetectionPage />} />
            <Route path="optimizer" element={<OptimisationResultsPage />} />
            <Route path="optimisation" element={<OptimisationResultsPage />} />
            <Route path="optimization" element={<OptimisationResultsPage />} />
            <Route path="plans" element={<OptimisationResultsPage />} />
            <Route path="explainability" element={<ExplainabilityPage />} />
            <Route path="approval" element={<ApprovalPage />} />
            <Route path="audit" element={<AuditHistoryPage />} />
            <Route path="audit-history" element={<AuditHistoryPage />} />
            <Route path="workspace" element={<BlockPlanningWorkspacePage />} />
            <Route path="simulation" element={<WhatIfSimulationPage />} />
            <Route path="data-sources" element={<DataSourcesPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </PlanningProvider>
  );
};

export default App;
