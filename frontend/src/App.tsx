import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./layouts/Layout";
import { LandingPage } from "./pages/LandingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { MaintenanceRequestsPage } from "./pages/MaintenanceRequestsPage";
import { ConflictDetectionPage } from "./pages/ConflictDetectionPage";
import { OptimisationResultsPage } from "./pages/OptimisationResultsPage";
import { BlockPlanningWorkspacePage } from "./pages/BlockPlanningWorkspacePage";
import { WhatIfSimulationPage } from "./pages/WhatIfSimulationPage";
import { ApprovalAuditPage } from "./pages/ApprovalAuditPage";
import { DataSourcesPage } from "./pages/DataSourcesPage";
import { SettingsPage } from "./pages/SettingsPage";

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<LandingPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="requests" element={<MaintenanceRequestsPage />} />
          <Route path="workspace" element={<BlockPlanningWorkspacePage />} />
          <Route path="conflicts" element={<ConflictDetectionPage />} />
          <Route path="optimizer" element={<OptimisationResultsPage />} />
          <Route path="simulation" element={<WhatIfSimulationPage />} />
          <Route path="approval" element={<ApprovalAuditPage />} />
          <Route path="data-sources" element={<DataSourcesPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
