import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardList,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  Cpu,
  Layers,
  ArrowUpRight,
  AlertCircle,
  Activity,
  Calendar
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

import { api } from "../services/api";
import { DashboardSummary, SchedulePlan } from "../types";
import { KPICard } from "../components/KPICard";
import { DepartmentBadge, PriorityBadge, StatusBadge } from "../components/Badges";

const PRIORITY_COLORS = {
  Critical: "#E11D48",
  High: "#F97316",
  Medium: "#EAB308",
  Low: "#64748B"
};

const DEPT_COLORS = {
  Engineering: "#2563EB",
  "S&T": "#9333EA",
  Traction: "#D97706"
};

export const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [plans, setPlans] = useState<SchedulePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumData, plansData] = await Promise.all([
        api.getDashboardSummary(),
        api.getOptimizationPlans()
      ]);
      setSummary(sumData);
      setPlans(plansData);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data from backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <div className="w-10 h-10 border-4 border-railway-blue border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Connecting to RailBlock Advisor Backend...</p>
        <span className="text-xs text-slate-400">Loading synthetic railway operations dataset</span>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-lg p-6 text-rose-800 space-y-3">
        <div className="flex items-center space-x-2 font-bold text-lg">
          <AlertCircle className="w-5 h-5 text-rose-600" />
          <span>Backend Connection Error</span>
        </div>
        <p className="text-sm">{error || "Unable to reach FastAPI backend service."}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-rose-600 text-white rounded text-xs font-semibold hover:bg-rose-700 transition"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { kpis } = summary;

  // Prepare chart datasets
  const deptData = [
    { name: "Engineering", count: summary.department_summary.Engineering, fill: DEPT_COLORS.Engineering },
    { name: "S&T", count: summary.department_summary["S&T"], fill: DEPT_COLORS["S&T"] },
    { name: "Traction", count: summary.department_summary.Traction, fill: DEPT_COLORS.Traction }
  ];

  const priorityData = [
    { name: "Critical", value: summary.priority_distribution.Critical, color: PRIORITY_COLORS.Critical },
    { name: "High", value: summary.priority_distribution.High, color: PRIORITY_COLORS.High },
    { name: "Medium", value: summary.priority_distribution.Medium, color: PRIORITY_COLORS.Medium },
    { name: "Low", value: summary.priority_distribution.Low, color: PRIORITY_COLORS.Low }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Corridor Operations Overview</h1>
            <span className="bg-slate-200 text-slate-700 text-xs font-bold px-2 py-0.5 rounded uppercase">
              DEMO DATA
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Section A-B to C-D Mainline Corridor Alpha | Automated Constraint Verification & Decision Support
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            to="/conflicts"
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold transition"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Detect Conflicts ({kpis.conflicts_detected})</span>
          </Link>
          <Link
            to="/optimizer"
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-railway-blue text-white hover:bg-blue-700 text-xs font-bold shadow-sm transition"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Generate Optimised Plan</span>
          </Link>
        </div>
      </div>

      {/* Top KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard
          title="Total Requests"
          value={kpis.total_maintenance_requests}
          subtitle="All departments"
          icon={ClipboardList}
          accentColor="blue"
          badge="BDMS"
        />
        <KPICard
          title="High Priority"
          value={kpis.high_priority_tasks}
          subtitle="Score >= 60 or Overdue"
          icon={TrendingUp}
          accentColor="red"
          badge="Urgent"
        />
        <KPICard
          title="Active Conflicts"
          value={kpis.conflicts_detected}
          subtitle="Timetable & Resource"
          icon={AlertTriangle}
          accentColor="amber"
          badge="Resolvable"
        />
        <KPICard
          title="Scheduled Tasks"
          value={kpis.scheduled_tasks}
          subtitle="Allocated to blocks"
          icon={CheckCircle2}
          accentColor="emerald"
          badge="Feasible"
        />
        <KPICard
          title="Deferred Tasks"
          value={kpis.deferred_tasks}
          subtitle="Secondary window"
          icon={Clock}
          accentColor="purple"
          badge="Deferred"
        />
        <KPICard
          title="Block Utilisation"
          value={`${kpis.block_utilisation_rate}%`}
          subtitle="Used / Available Hours"
          icon={Layers}
          accentColor="blue"
          badge="Audited"
        />
      </div>

      {/* Plan Alternatives Comparison Section */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-railway-blue" />
              <span>OR-Tools CP-SAT Scheduling Options</span>
            </h2>
            <p className="text-xs text-slate-500">
              Deterministic constraint optimization results across three distinct railway operational strategies
            </p>
          </div>
          <Link to="/optimizer" className="text-xs font-semibold text-railway-blue hover:underline flex items-center space-x-1">
            <span>View Full Schedule Matrices</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((p) => {
            const isPlanA = p.strategy_type === "PLAN_A_CRITICAL";
            const isPlanB = p.strategy_type === "PLAN_B_TRAIN_IMPACT";
            const isPlanC = p.strategy_type === "PLAN_C_BUNDLING";

            return (
              <div
                key={p.plan_id}
                className={`rounded-lg border p-4 flex flex-col justify-between transition ${
                  p.status === "Approved"
                    ? "border-emerald-500 bg-emerald-50/20"
                    : "border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 font-mono">{p.plan_id}</span>
                    <StatusBadge status={p.status} />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mt-1">{p.plan_name}</h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{p.notes}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/80 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Scheduled Tasks:</span>
                    <span className="font-bold text-slate-900">{p.scheduled_count} / {p.total_tasks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Block Utilisation:</span>
                    <span className="font-bold text-railway-blue font-mono">{p.utilization_rate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Critical Coverage:</span>
                    <span className="font-bold text-emerald-700 font-mono">{p.critical_coverage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Focus:</span>
                    <span className="font-semibold text-slate-700">
                      {isPlanA && "Urgent track/OHE safety"}
                      {isPlanB && "Zero timetable clash"}
                      {isPlanC && "Joint multi-dept bundles"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-2">
                  <Link
                    to={`/optimizer?plan=${p.plan_id}`}
                    className="w-full block text-center py-1.5 px-3 rounded bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 transition"
                  >
                    Inspect Plan Details
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts Section: Department Distribution & Priority Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Requests Breakdown */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Requests by Department
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Engineering, S&T, and Traction distribution</p>
          </div>
          <div className="h-56 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fontWeight: 500 }} width={85} />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {deptData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-around pt-2 border-t border-slate-100 text-xs">
            {deptData.map((d) => (
              <div key={d.name} className="text-center">
                <span className="text-slate-500">{d.name}:</span>{" "}
                <strong className="text-slate-900 font-mono">{d.count}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Distribution Donut */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Priority Tier Distribution
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Deterministic rule-based scoring tiers</p>
          </div>
          <div className="h-56 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[11px] text-slate-500 text-center border-t border-slate-100 pt-2 font-mono">
            80+ Critical | 60-79 High | 35-59 Med | &lt;35 Low
          </div>
        </div>

        {/* Conflict Summary Breakdown */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Detected Conflicts
              </h3>
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                {summary.conflict_summary.total} Detected
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Categorized across 5 operational dimensions</p>
          </div>

          <div className="space-y-2 mt-4">
            <div className="flex items-center justify-between p-2 rounded bg-slate-50 text-xs">
              <span className="text-slate-600">Timetable Overlaps (Trains):</span>
              <strong className="text-slate-900 font-mono">{summary.conflict_summary.timetable}</strong>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-50 text-xs">
              <span className="text-slate-600">Resource Contention:</span>
              <strong className="text-slate-900 font-mono">{summary.conflict_summary.resource}</strong>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-50 text-xs">
              <span className="text-slate-600">Location / Incompatible Tasks:</span>
              <strong className="text-slate-900 font-mono">{summary.conflict_summary.location}</strong>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-50 text-xs">
              <span className="text-slate-600">Predecessor Dependencies:</span>
              <strong className="text-slate-900 font-mono">{summary.conflict_summary.dependency}</strong>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-50 text-xs">
              <span className="text-slate-600">Duration Limit Exceeded:</span>
              <strong className="text-slate-900 font-mono">{summary.conflict_summary.duration}</strong>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <Link
              to="/conflicts"
              className="w-full text-center block text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 py-1.5 rounded transition"
            >
              Resolve Conflicts in Matrix
            </Link>
          </div>
        </div>
      </div>

      {/* Critical Tasks Requiring Planner Attention Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <h3 className="font-bold text-slate-900 text-sm">Critical Tasks Requiring Planner Attention</h3>
          </div>
          <Link to="/requests" className="text-xs font-semibold text-railway-blue hover:underline flex items-center space-x-1">
            <span>View All Maintenance Tasks</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Task ID</th>
                <th>Dept</th>
                <th>Asset Type</th>
                <th>Location</th>
                <th>Description</th>
                <th>Deadline</th>
                <th>Priority Score</th>
                <th>Overdue</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {summary.critical_tasks_requiring_attention.map((t) => (
                <tr key={t.task_id} className="hover:bg-slate-50 transition">
                  <td className="font-mono font-bold text-xs text-slate-900">{t.task_id}</td>
                  <td><DepartmentBadge department={t.department} /></td>
                  <td className="text-xs text-slate-700 font-medium">{t.asset_type}</td>
                  <td className="text-xs text-slate-600">{t.location}</td>
                  <td className="text-xs text-slate-800 max-w-xs truncate" title={t.description}>
                    {t.description}
                  </td>
                  <td className="text-xs font-mono text-slate-600">{t.deadline}</td>
                  <td>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 font-mono">
                      {t.priority_score.toFixed(0)} pts
                    </span>
                  </td>
                  <td>
                    {t.overdue ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-red-600 text-white">
                        OVERDUE
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Current</span>
                    )}
                  </td>
                  <td><StatusBadge status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Planner Decisions & Audit Activity */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-railway-blue" />
            <h3 className="font-bold text-slate-900 text-sm">Recent Operations & Planner Append-Only Audit Trail</h3>
          </div>
          <span className="text-xs text-slate-500 font-normal">
            The audit trail records approval and workflow events for the prototype.
          </span>
        </div>

        <div className="space-y-2">
          {summary.recent_planner_activity.map((act) => (
            <div
              key={act.log_id}
              className="flex items-start justify-between p-2.5 rounded-md bg-slate-50 border border-slate-100 text-xs"
            >
              <div className="flex items-start space-x-2.5">
                <div className="w-2 h-2 rounded-full bg-railway-blue mt-1.5 flex-shrink-0" />
                <div>
                  <span className="font-bold text-slate-900">{act.action}</span>
                  <span className="text-slate-400 mx-1.5">|</span>
                  <span className="text-slate-500 font-medium">{act.user_role}</span>
                  <p className="text-slate-700 mt-0.5">{act.details}</p>
                </div>
              </div>
              <span className="text-slate-400 font-mono text-[11px] whitespace-nowrap ml-4">
                {act.timestamp}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
