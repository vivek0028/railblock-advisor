export interface MaintenanceTask {
  task_id: string;
  department: string;
  asset_type: string;
  location: string;
  description: string;
  duration_hours: number;
  preferred_date: string;
  deadline: string;
  criticality: string;
  overdue: boolean;
  required_resources: string[];
  dependencies: string[];
  compatible_departments: string[];
  status: string;
  priority_score: number;
  priority_factors?: {
    criticality_points?: number;
    deadline_urgency_points?: number;
    urgency_reason?: string;
    overdue_points?: number;
    operational_impact_points?: number;
    impact_level?: string;
    age_factor_points?: number;
    total_score?: number;
    category?: string;
  };
  assigned_block_id?: string | null;
  data_source?: string;
  defect_code?: string;
  data_label?: string;
}

export interface BlockWindow {
  block_id: string;
  section: string;
  direction: "UP" | "DOWN" | "BOTH" | string;
  date: string;
  start_time: string;
  end_time: string;
  max_duration_hours: number;
  status: string;
  corridor_name?: string;
}

export interface TrainMovement {
  train_no: string;
  train_name: string;
  train_type: string;
  section: string;
  direction: "UP" | "DOWN" | string;
  scheduled_departure: string;
  scheduled_arrival: string;
  priority_rank: number;
  speed_kmph: number;
}

export interface Resource {
  resource_id: string;
  name: string;
  resource_type: string;
  department: string;
  home_depot: string;
  available: boolean;
}

export interface ConflictItem {
  conflict_id: string;
  conflict_type: string;
  severity: string;
  affected_tasks: string[];
  affected_trains: string[];
  explanation: string;
  suggested_resolution: string;
  status: string;
  resolution_strategy?: string | null;
  resolved_at?: string | null;
  resolution_notes?: string | null;
}

export interface PlanKPIs {
  total_tasks: number;
  scheduled_count: number;
  deferred_count: number;
  utilization_rate: number;
  used_block_hours?: number;
  total_available_hours?: number;
  critical_coverage: number;
  critical_tasks_scheduled?: number;
  total_critical_tasks?: number;
  bundled_blocks_count: number;
  active_blocks_count: number;
  total_available_blocks: number;
  asset_availability_pct?: number;
}

export interface ScheduleAssignment {
  assignment_id: string;
  task_id: string;
  task: MaintenanceTask;
  block_id: string;
  block: BlockWindow;
  bundled_with: string[];
  explanation: {
    summary: string;
    rule_based_reasons?: string[];
    reasons?: string[];
  };
}

export interface DeferredTaskItem {
  task_id: string;
  task: MaintenanceTask;
  explanation: {
    summary: string;
    rule_based_reasons?: string[];
    reasons?: string[];
  };
}

export interface GoodsRegulationItem {
  forecast_id: string;
  rake_id: string;
  section: string;
  traffic_type: string;
  loop_station: string;
  regulation_strategy: string;
  status: string;
}

export interface GoodsForecastItem {
  forecast_id: string;
  rake_id?: string;
  section: string;
  traffic_type: string;
  expected_density?: string;
  direction?: string;
  priority_window_gap?: string;
  loop_regulation_station?: string;
  regulation_strategy?: string;
  remarks?: string;
  data_label?: string;
}

export interface SchedulePlan {
  plan_id: string;
  plan_name: string;
  strategy_type: string;
  horizon?: "WEEKLY" | "MONTHLY";
  asset_availability_pct?: number;
  goods_train_regulations?: GoodsRegulationItem[];
  description?: string;
  status: string;
  kpis: PlanKPIs;
  total_tasks?: number;
  scheduled_count?: number;
  deferred_count?: number;
  conflict_count?: number;
  utilization_rate?: number;
  critical_coverage?: number;
  objective_score?: number;
  objective_value?: number;
  scheduled_assignments?: ScheduleAssignment[];
  deferred_tasks?: DeferredTaskItem[];
  created_at?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  notes?: string | null;
}

export interface DashboardSummary {
  kpis: {
    total_maintenance_requests: number;
    high_priority_tasks: number;
    conflicts_detected: number;
    scheduled_tasks: number;
    deferred_tasks: number;
    block_utilisation_rate: number;
    critical_task_coverage: number;
  };
  department_summary: {
    Engineering: number;
    "S&T": number;
    Traction: number;
  };
  priority_distribution: {
    Critical: number;
    High: number;
    Medium: number;
    Low: number;
  };
  conflict_summary: {
    total: number;
    critical: number;
    warning: number;
    timetable: number;
    resource: number;
    location: number;
    dependency: number;
    duration: number;
  };
  critical_tasks_requiring_attention: Array<{
    task_id: string;
    department: string;
    asset_type: string;
    location: string;
    description: string;
    priority_score: number;
    deadline: string;
    overdue: boolean;
    status: string;
  }>;
  recent_planner_activity: Array<{
    log_id: string;
    timestamp: string;
    user_role: string;
    action: string;
    target_id: string;
    details: string;
    status_change?: string | null;
  }>;
  disclaimer: string;
}

export interface DataSourceItem {
  source_id: string;
  name: string;
  full_name: string;
  system_type: string;
  status: string;
  last_sync: string;
  record_count: number;
  description: string;
}

export interface CompatibilityBundle {
  bundle_id: string;
  bundle_name: string;
  location: string;
  departments: string[];
  task_ids: string[];
  tasks: Array<{
    task_id: string;
    department: string;
    asset_type: string;
    description: string;
    duration_hours: number;
    criticality: string;
  }>;
  compatibility_score: number;
  parallel_duration_hours: number;
  recommended_block_id: string | null;
  reasons: string[];
  estimated_traffic_path_savings: string;
}
