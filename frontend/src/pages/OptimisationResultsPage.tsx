import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Cpu,
  RefreshCw,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ArrowRight,
  Info,
  Calendar,
  X,
  Share2
} from "lucide-react";
import { api } from "../services/api";
import { SchedulePlan, ScheduleAssignment, DeferredTaskItem } from "../types";
import { DepartmentBadge, PriorityBadge, StatusBadge } from "../components/Badges";

export const OptimisationResultsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [plans, setPlans] = useState<SchedulePlan[]>([]);
  const [activePlanId, setActivePlanId] = useState<string>("PLAN-A-CRIT");
  const [planDetail, setPlanDetail] = useState<SchedulePlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<ScheduleAssignment | null>(null);
  const [selectedDeferred, setSelectedDeferred] = useState<DeferredTaskItem | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadPlans = async (targetId?: string) => {
    setLoading(true);
    try {
      const data = await api.getOptimizationPlans();
      setPlans(data);
      const chosenId = targetId || searchParams.get("plan") || (data.length > 0 ? data[0].plan_id : "PLAN-A-CRIT");
      setActivePlanId(chosenId);
      loadPlanDetail(chosenId);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadPlanDetail = async (planId: string) => {
    try {
      const detail = await api.getOptimizationPlanById(planId);
      setPlanDetail(detail);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleSelectPlan = (planId: string) => {
    setActivePlanId(planId);
    setSearchParams({ plan: planId });
    loadPlanDetail(planId);
  };

  const handleGeneratePlans = async () => {
    setIsGenerating(true);
    setActionNotice(null);
    try {
      const res = await api.generateOptimizationPlans({ strategy_type: "ALL" });
      setActionNotice("Google OR-Tools CP-SAT solver successfully converged! All 3 plans recalculated.");
      loadPlans("PLAN-A-CRIT");
      setTimeout(() => setActionNotice(null), 5000);
    } catch (err: any) {
      alert(`Optimization failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprovePlan = async (planId: string) => {
    try {
      await api.approvePlan(planId, {
        user_name: "Sr. DOM Rajesh Sharma",
        user_role: "Reviewer",
        comments: "Operational block approved after timetable validation."
      });
      setActionNotice(`Plan ${planId} submitted and approved by Reviewer.`);
      loadPlanDetail(planId);
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const activePlan = plans.find(p => p.plan_id === activePlanId) || planDetail;

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Optimised Block Planning Recommendations</h1>
            <span className="bg-railway-dark text-white text-xs font-bold px-2 py-0.5 rounded font-mono uppercase">
              OR-Tools CP-SAT
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Deterministic integer programming recommendations with transparent rule-based explainability
          </p>
        </div>

        <button
          onClick={handleGeneratePlans}
          disabled={isGenerating}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-railway-blue hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition"
        >
          <RefreshCw className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
          <span>{isGenerating ? "Solving Mathematical Model..." : "Regenerate All Plans"}</span>
        </button>
      </div>

      {actionNotice && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs px-4 py-2.5 rounded-md font-medium flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Plan Selection Tabs (Plan A, Plan B, Plan C) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((p) => {
          const isSelected = p.plan_id === activePlanId;
          return (
            <button
              key={p.plan_id}
              onClick={() => handleSelectPlan(p.plan_id)}
              className={`text-left p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? "bg-white border-railway-blue ring-2 ring-blue-500/20 shadow-md"
                  : "bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-500">{p.plan_id}</span>
                  <StatusBadge status={p.status} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-1">{p.plan_name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.notes}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/80 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Scheduled</span>
                  <strong className="text-slate-900 font-mono text-sm">{p.scheduled_count}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Utilisation</span>
                  <strong className="text-railway-blue font-mono text-sm">{p.utilization_rate}%</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Crit Coverage</span>
                  <strong className="text-emerald-700 font-mono text-sm">{p.critical_coverage}%</strong>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Plan Detail View */}
      {planDetail && (
        <div className="space-y-5">
          {/* Plan Header & KPIs */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-bold text-slate-900">{planDetail.plan_name}</h2>
                  <StatusBadge status={planDetail.status} />
                </div>
                <p className="text-xs text-slate-500 mt-1">{planDetail.notes}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to="/simulation"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
                >
                  Run What-If Simulation
                </Link>
                <button
                  onClick={() => handleApprovePlan(planDetail.plan_id)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
                >
                  Approve Plan
                </button>
                <Link
                  to="/approval"
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition"
                >
                  Review Workflow
                </Link>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-slate-500 block">Total Requests</span>
                <strong className="text-slate-900 font-mono text-base">{planDetail.kpis.total_tasks}</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-slate-500 block">Scheduled Tasks</span>
                <strong className="text-emerald-700 font-mono text-base">{planDetail.kpis.scheduled_count}</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-slate-500 block">Deferred Tasks</span>
                <strong className="text-amber-700 font-mono text-base">{planDetail.kpis.deferred_count}</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-slate-500 block">Block Utilisation</span>
                <strong className="text-railway-blue font-mono text-base">{planDetail.kpis.utilization_rate}%</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-slate-500 block">Critical Coverage</span>
                <strong className="text-emerald-700 font-mono text-base">{planDetail.kpis.critical_coverage}%</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-slate-500 block">Bundled Blocks</span>
                <strong className="text-purple-700 font-mono text-base">{planDetail.kpis.bundled_blocks_count || 0}</strong>
              </div>
            </div>
          </div>

          {/* Scheduled Assignments Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Scheduled Tasks & Corridor Block Allocations ({planDetail.scheduled_assignments?.length || 0})
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                Click "Why Included?" for deterministic rule-based explainability
              </span>
            </div>

            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>Task ID</th>
                    <th>Dept</th>
                    <th>Asset</th>
                    <th>Location</th>
                    <th>Duration</th>
                    <th>Assigned Block</th>
                    <th>Date & Time</th>
                    <th>Joint Bundling</th>
                    <th>Explainability</th>
                  </tr>
                </thead>
                <tbody>
                  {(planDetail.scheduled_assignments || []).map((asgn) => (
                    <tr key={asgn.assignment_id} className="hover:bg-slate-50 transition">
                      <td className="font-mono font-bold text-xs text-slate-900">{asgn.task.task_id}</td>
                      <td><DepartmentBadge department={asgn.task.department} /></td>
                      <td className="text-xs font-semibold text-slate-800">{asgn.task.asset_type}</td>
                      <td className="text-xs text-slate-600">{asgn.task.location}</td>
                      <td className="text-xs font-mono text-slate-800">{asgn.task.duration_hours}h</td>
                      <td>
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-xs font-mono font-bold">
                          {asgn.block.block_id}
                        </span>
                      </td>
                      <td className="text-xs font-mono text-slate-600 whitespace-nowrap">
                        {asgn.block.date} | {asgn.block.start_time.slice(0, 5)} - {asgn.block.end_time.slice(0, 5)}
                      </td>
                      <td>
                        {asgn.bundled_with && asgn.bundled_with.length > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold">
                            With {asgn.bundled_with.join(", ")}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Solo Block</span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => setSelectedAssignment(asgn)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition"
                        >
                          <Info className="w-3.5 h-3.5 text-railway-blue" />
                          <span>Why Included?</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Deferred Tasks Section */}
          {planDetail.deferred_tasks && planDetail.deferred_tasks.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-amber-50/60 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    Deferred Maintenance Tasks ({planDetail.deferred_tasks.length})
                  </h3>
                </div>
                <span className="text-xs text-slate-500 font-mono">
                  Deferred based on mathematical constraint boundaries
                </span>
              </div>

              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>Task ID</th>
                      <th>Dept</th>
                      <th>Asset</th>
                      <th>Location</th>
                      <th>Duration</th>
                      <th>Priority Score</th>
                      <th>Deadline</th>
                      <th>Explainability Rationale</th>
                    </tr>
                  </thead>
                  <tbody>
                    {planDetail.deferred_tasks.map((defItem) => (
                      <tr key={defItem.task_id} className="hover:bg-slate-50 transition">
                        <td className="font-mono font-bold text-xs text-slate-900">{defItem.task.task_id}</td>
                        <td><DepartmentBadge department={defItem.task.department} /></td>
                        <td className="text-xs text-slate-700">{defItem.task.asset_type}</td>
                        <td className="text-xs text-slate-600">{defItem.task.location}</td>
                        <td className="text-xs font-mono text-slate-700">{defItem.task.duration_hours}h</td>
                        <td>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-100 text-slate-800">
                            {defItem.task.priority_score.toFixed(0)} pts
                          </span>
                        </td>
                        <td className="text-xs font-mono text-slate-600">{defItem.task.deadline}</td>
                        <td>
                          <button
                            onClick={() => setSelectedDeferred(defItem)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold transition"
                          >
                            <Info className="w-3.5 h-3.5 text-amber-600" />
                            <span>View Reason</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Explainability Drawer / Modal for Scheduled Task */}
      {selectedAssignment && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase font-mono">DETERMINISTIC INCLUSION REASON</span>
                <h3 className="font-extrabold text-base text-slate-900">
                  {selectedAssignment.task.task_id} &rarr; {selectedAssignment.block.block_id}
                </h3>
              </div>
              <button onClick={() => setSelectedAssignment(null)} className="p-1 rounded-md hover:bg-slate-100 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-3 text-xs">
              <p className="font-semibold text-slate-800">
                {selectedAssignment.explanation.summary}
              </p>

              <div className="space-y-1.5 pt-2 border-t border-slate-200">
                <div className="font-bold text-slate-600 uppercase text-[11px]">Mathematical Factors:</div>
                <ul className="space-y-1 text-slate-700">
                  {(selectedAssignment.explanation.rule_based_reasons || selectedAssignment.explanation.reasons || []).map((r, i) => (
                    <li key={i} className="flex items-start space-x-2">
                      <span className="text-emerald-600 font-bold">&bull;</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 italic">
              * Verified via Google OR-Tools CP-SAT solver constraint bounds. Zero black-box AI.
            </div>

            <button
              onClick={() => setSelectedAssignment(null)}
              className="w-full py-2 bg-slate-900 text-white rounded-md text-xs font-semibold hover:bg-slate-800"
            >
              Close Explainability Window
            </button>
          </div>
        </div>
      )}

      {/* Explainability Drawer / Modal for Deferred Task */}
      {selectedDeferred && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-xs font-bold text-amber-600 uppercase font-mono">DETERMINISTIC DEFERRAL REASON</span>
                <h3 className="font-extrabold text-base text-slate-900">{selectedDeferred.task.task_id}</h3>
              </div>
              <button onClick={() => setSelectedDeferred(null)} className="p-1 rounded-md hover:bg-slate-100 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-3 text-xs">
              <p className="font-semibold text-slate-800">
                {selectedDeferred.explanation.summary}
              </p>

              <div className="space-y-1.5 pt-2 border-t border-slate-200">
                <div className="font-bold text-slate-600 uppercase text-[11px]">Constraint Preemption Factors:</div>
                <ul className="space-y-1 text-slate-700">
                  {(selectedDeferred.explanation.rule_based_reasons || selectedDeferred.explanation.reasons || []).map((r, i) => (
                    <li key={i} className="flex items-start space-x-2">
                      <span className="text-amber-600 font-bold">&bull;</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 italic">
              * The system defers tasks deterministically when safety capacity, resource availability, or train movements constrain the corridor.
            </div>

            <button
              onClick={() => setSelectedDeferred(null)}
              className="w-full py-2 bg-slate-900 text-white rounded-md text-xs font-semibold hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
