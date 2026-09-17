import {
  MaintenanceTask,
  BlockWindow,
  TrainMovement,
  Resource,
  ConflictItem,
  SchedulePlan,
  DashboardSummary,
  DataSourceItem,
  CompatibilityBundle
} from "../types";

// Safe development fallback: use VITE_API_BASE_URL or fallback to http://localhost:8000
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// Ensure trailing slash is removed and strip trailing /api to prevent /api/api/ duplicated paths
export const API_BASE_URL = rawBaseUrl.trim().replace(/\/+$/, "").replace(/\/api$/, "");

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  // Ensure endpoint starts with a single slash
  let path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  // Prevent duplicate /api/api path segments if both base and endpoint have /api
  if (path.startsWith("/api/api/")) {
    path = path.replace(/^\/api\/api\//, "/api/");
  }

  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {})
    }
  });

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    try {
      const err = await response.json();
      errorDetail = err.detail || err.message || errorDetail;
    } catch {
      // Fallback to text
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Health
  getHealth: () => fetchJson<{ status: string; mode?: string }>("/api/health"),

  // Dashboard
  getDashboardSummary: () => fetchJson<DashboardSummary>("/api/dashboard/summary"),

  // Maintenance Tasks
  getTasks: (params?: { department?: string; status?: string; location?: string; criticality?: string }) => {
    const query = new URLSearchParams();
    if (params?.department) query.append("department", params.department);
    if (params?.status) query.append("status", params.status);
    if (params?.location) query.append("location", params.location);
    if (params?.criticality) query.append("criticality", params.criticality);
    const qs = query.toString();
    return fetchJson<MaintenanceTask[]>(`/api/tasks${qs ? `?${qs}` : ""}`);
  },

  getTaskById: (taskId: string) => fetchJson<MaintenanceTask>(`/api/tasks/${taskId}`),

  createTask: (data: Partial<MaintenanceTask>) =>
    fetchJson<MaintenanceTask>("/api/tasks", {
      method: "POST",
      body: JSON.stringify(data)
    }),

  updateTask: (taskId: string, data: Partial<MaintenanceTask>) =>
    fetchJson<MaintenanceTask>(`/api/tasks/${taskId}`, {
      method: "PUT",
      body: JSON.stringify(data)
    }),

  deleteTask: (taskId: string) =>
    fetchJson<{ message: string }>(`/api/tasks/${taskId}`, {
      method: "DELETE"
    }),

  importDemoTasks: () =>
    fetchJson<{ status: string; records_imported: number; total_active: number }>("/api/tasks/import-demo", {
      method: "POST"
    }),

  recalculatePriorities: () =>
    fetchJson<{
      status: string;
      tasks_recalculated: number;
      category_distribution: Record<string, number>;
      formula: string;
    }>("/api/priority/recalculate", {
      method: "POST"
    }),

  // Conflicts
  getConflicts: (params?: { severity?: string; conflict_type?: string }) => {
    const query = new URLSearchParams();
    if (params?.severity) query.append("severity", params.severity);
    if (params?.conflict_type) query.append("conflict_type", params.conflict_type);
    const qs = query.toString();
    return fetchJson<ConflictItem[]>(`/api/conflicts${qs ? `?${qs}` : ""}`);
  },

  detectConflicts: () =>
    fetchJson<{
      status: string;
      total_conflicts_detected: number;
      conflicts: ConflictItem[];
      summary: any;
    }>("/api/conflicts/detect", {
      method: "POST"
    }),

  // Optimisation Plans
  getOptimizationPlans: () => fetchJson<SchedulePlan[]>("/api/optimization/plans"),

  getOptimizationPlanById: (planId: string) =>
    fetchJson<SchedulePlan>(`/api/optimization/plans/${planId}`),

  generateOptimizationPlans: (params?: {
    strategy_type?: string;
    block_duration_bonus_hours?: number;
    additional_crew_count?: number;
    allow_bundling?: boolean;
  }) =>
    fetchJson<{
      status: string;
      solver: string;
      plans_generated_count: number;
      plans: SchedulePlan[];
    }>("/api/optimization/generate", {
      method: "POST",
      body: JSON.stringify(params || { strategy_type: "ALL" })
    }),

  approvePlan: (planId: string, data: { user_name: string; user_role: string; comments?: string }) =>
    fetchJson<{ status: string; new_status: string; approved_by: string }>(`/api/plans/${planId}/approve`, {
      method: "POST",
      body: JSON.stringify(data)
    }),

  rejectPlan: (planId: string, data: { user_name: string; user_role: string; reason: string }) =>
    fetchJson<{ status: string; new_status: string; reason: string }>(`/api/plans/${planId}/reject`, {
      method: "POST",
      body: JSON.stringify(data)
    }),

  // What-If Simulation
  runSimulation: (params: {
    block_duration_bonus_hours: number;
    additional_crew_count: number;
    allow_bundling: boolean;
    strategy_type: string;
  }) =>
    fetchJson<{
      status: string;
      baseline_kpis: any;
      simulated_kpis: any;
      delta: any;
      impact_summary: string;
      simulated_scheduled_assignments: any[];
      simulated_deferred_tasks: any[];
    }>("/api/simulation/run", {
      method: "POST",
      body: JSON.stringify(params)
    }),

  // Compatibility
  getCompatibilityBundles: () =>
    fetchJson<{
      status: string;
      bundles_identified_count: number;
      bundles: CompatibilityBundle[];
    }>("/api/compatibility/analyse"),

  // Data Sources & Resources
  getDataSources: () => fetchJson<DataSourceItem[]>("/api/data-sources"),
  getBlockWindows: () => fetchJson<BlockWindow[]>("/api/block-windows"),
  getTrainMovements: () => fetchJson<TrainMovement[]>("/api/train-movements"),
  getResources: () => fetchJson<Resource[]>("/api/resources"),
  getAuditLogs: (limit = 50) => fetchJson<any[]>(`/api/audit-logs?limit=${limit}`)
};
