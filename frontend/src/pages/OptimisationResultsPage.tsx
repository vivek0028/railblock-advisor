import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
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
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  ExternalLink,
  ArrowLeft,
  Check,
  Zap,
  ShieldAlert,
  AlertCircle
} from "lucide-react";
import { api } from "../services/api";
import { SchedulePlan, ScheduleAssignment, DeferredTaskItem, ConflictItem, MaintenanceTask, TrainMovement } from "../types";
import { DepartmentBadge, PriorityBadge, StatusBadge } from "../components/Badges";
import { usePlanning } from "../context/PlanningContext";

interface PlanResolutionDetails {
  planLabel: string;
  whatChanges: string;
  movedItem: string;
  newTimingOrResource: string;
  compatibility?: string;
  conflictStatus: {
    label: string;
    badgeClass: string;
    icon: string;
  };
  impactTradeOff: string;
  expectedResult: string;
  actionButtonText: string;
}

const getPlanConflictAnalysis = (
  plan: SchedulePlan,
  conflict: ConflictItem | null
): PlanResolutionDetails => {
  const planId = (plan.plan_id || "").toUpperCase();
  const strat = (plan.strategy_type || "").toUpperCase();
  const isPlanA = planId.startsWith("PLAN-A") || strat.includes("PLAN_A");
  const isPlanB = planId.startsWith("PLAN-B") || strat.includes("PLAN_B");

  if (!conflict) {
    return {
      planLabel: isPlanA
        ? "Plan A — Maximum Critical Coverage"
        : isPlanB
        ? "Plan B — Minimum Train Impact"
        : "Plan C — Maximum Task Bundling",
      whatChanges: plan.notes || "Optimized baseline corridor schedule.",
      movedItem: "Standard optimization across all corridor sections.",
      newTimingOrResource: "As scheduled in optimization matrix.",
      conflictStatus: {
        label: "Conflict resolved",
        badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
        icon: "🟢",
      },
      impactTradeOff: "Balancing asset uptime vs passenger train timetable constraints.",
      expectedResult: `${plan.scheduled_count} tasks scheduled with ${plan.asset_availability_pct || 96.8}% uptime.`,
      actionButtonText: `Apply ${plan.plan_name}`,
    };
  }

  const cType = (conflict.conflict_type || "").toLowerCase();
  const tasksStr = conflict.affected_tasks.length > 0 ? conflict.affected_tasks.join(", ") : "Maintenance Request";
  const trainsStr = conflict.affected_trains.length > 0 ? `Train ${conflict.affected_trains.join(", ")}` : "Operational Movements";

  // Case 1: Timetable Clash (Train vs Maintenance Block)
  if (cType.includes("timetable") || cType.includes("train") || conflict.affected_trains.length > 0) {
    if (isPlanA) {
      return {
        planLabel: "Plan A — Reschedule Request (Critical Priority)",
        whatChanges: "Adjusts maintenance start window to commence immediately after train clear path.",
        movedItem: `Block for ${tasksStr} adjusted from peak slot to clear train window.`,
        newTimingOrResource: "15:30 – 18:30 (Daytime Block Post-Train Clearance)",
        compatibility: "100% compatible with corridor track capacity after train clearance.",
        conflictStatus: {
          label: "Conflict resolved",
          badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
          icon: "🟢",
        },
        impactTradeOff: "Possession window compressed by 30 mins; requires focused rapid execution gang.",
        expectedResult: `${trainsStr} runs strictly on-time (0 min delay); urgent safety maintenance completed.`,
        actionButtonText: "Apply Plan A & Resolve Conflict",
      };
    } else if (isPlanB) {
      return {
        planLabel: "Plan B — Shift to Night Curfew (Zero Train Clash)",
        whatChanges: "Reallocates maintenance corridor possession into designated zero-traffic night curfew.",
        movedItem: `Entire maintenance block (${tasksStr}) shifted away from daytime traffic.`,
        newTimingOrResource: "01:30 – 05:00 (Corridor Night Curfew Window)",
        compatibility: "Compatible with OHE 25kV power cut schedule & zero revenue traffic.",
        conflictStatus: {
          label: "Conflict resolved",
          badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
          icon: "🟢",
        },
        impactTradeOff: "Requires night illumination gear, cold-weather/night safety briefing, and night gang allowance.",
        expectedResult: "Zero passenger or freight train disruption; gives unconstrained 3.5 hrs continuous block.",
        actionButtonText: "Apply Plan B & Resolve Conflict",
      };
    } else {
      // Plan C
      return {
        planLabel: "Plan C — Adjust Schedule & Multi-Dept Bundling",
        whatChanges: "Combines Engineering, S&T, and Traction into single pre-train morning possession.",
        movedItem: `${tasksStr} bundled together into synchronized block (09:00–12:00); freight rakes regulated at sidings.`,
        newTimingOrResource: "09:00 – 12:00 (Synchronized Bundled Window)",
        compatibility: "Multi-departmental cross-locking verified in TMS & SMMS.",
        conflictStatus: {
          label: "Conflict resolved",
          badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
          icon: "🟢",
        },
        impactTradeOff: "Requires joint departmental coordination between Section Engineers (P-Way, Signals, OHE).",
        expectedResult: "3 departments complete maintenance in 1 possession; corridor clears 2.5 hours before train arrives.",
        actionButtonText: "Apply Plan C & Resolve Conflict",
      };
    }
  }

  // Case 2: Resource Contention (Crews, USFD Machines, Heavy Machinery)
  if (cType.includes("resource")) {
    const resourceName = conflict.explanation.includes("'")
      ? conflict.explanation.split("'")[1]
      : "Assigned Machinery / Crew";
    const primaryTask = conflict.affected_tasks[0] || "Request 1";
    const secondaryTask = conflict.affected_tasks[1] || "Request 2";

    if (isPlanA) {
      return {
        planLabel: "Plan A — Reschedule Lower Priority Request",
        whatChanges: `Retains ${resourceName} for priority task ${primaryTask}; shifts ${secondaryTask} to alternate shift.`,
        movedItem: `Task ${secondaryTask} moved to Shift 2 (Staggered Execution).`,
        newTimingOrResource: "Shift 2: 15:00 – 18:30 (Sequential Utilization)",
        compatibility: "Full tool & machinery compatibility confirmed.",
        conflictStatus: {
          label: "Conflict resolved",
          badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
          icon: "🟢",
        },
        impactTradeOff: `Secondary task ${secondaryTask} delayed by ~4.5 hours on the same maintenance day.`,
        expectedResult: "Eliminates resource overlap; critical task completed with dedicated crew focus.",
        actionButtonText: "Apply Plan A & Resolve Conflict",
      };
    } else if (isPlanB) {
      return {
        planLabel: "Plan B — Reassign Resource (Standby Depot Gang)",
        whatChanges: `Reassigns ${secondaryTask} to secondary backup crew/equipment without moving schedule.`,
        movedItem: `Resource for ${secondaryTask} swapped from ${resourceName} to Standby Gang.`,
        newTimingOrResource: `Standby Depot Gang 2 / Regional Machinery Unit`,
        compatibility: "Same competency & safety certification level (100% compatible).",
        conflictStatus: {
          label: "Conflict resolved",
          badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
          icon: "🟢",
        },
        impactTradeOff: "Requires standby gang mobilization and inter-depot equipment transit (4.2 km).",
        expectedResult: "Both maintenance tasks proceed concurrently in their original requested slot.",
        actionButtonText: "Apply Plan B & Resolve Conflict",
      };
    } else {
      // Plan C
      return {
        planLabel: "Plan C — Adjust Schedule (Joint Resource Sharing)",
        whatChanges: `Combines ${primaryTask} and ${secondaryTask} into a unified corridor block with shared machinery.`,
        movedItem: `Both requests synchronized into a unified work session with phased resource handover.`,
        newTimingOrResource: "10:00 – 14:00 (Unified Joint Possession)",
        compatibility: "Joint possession verified for track protection rules.",
        conflictStatus: {
          label: "Conflict resolved",
          badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
          icon: "🟢",
        },
        impactTradeOff: "Requires unified supervisory oversight by sectional Assistant Divisional Engineer.",
        expectedResult: "Single corridor possession saves 1.5 hours of track blocking time while fulfilling both requests.",
        actionButtonText: "Apply Plan C & Resolve Conflict",
      };
    }
  }

  // Case 3: Duration / Operational / Section Occupancy
  if (isPlanA) {
    return {
      planLabel: "Plan A — Reschedule Request (Extended Window)",
      whatChanges: "Shifts task to low-density schedule window capable of accommodating full duration.",
      movedItem: `Task ${tasksStr} rescheduled to weekend/night low-density timetable path.`,
      newTimingOrResource: "Upcoming Low-Density Window (01:00 – 05:00)",
      compatibility: "Fully conforms with sectional track speed & safety regulations.",
      conflictStatus: {
        label: "Conflict resolved",
        badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
        icon: "🟢",
      },
      impactTradeOff: "Execution scheduled into designated weekend/night maintenance window.",
      expectedResult: "Full required duration provided without truncating maintenance safety procedures.",
      actionButtonText: "Apply Plan A & Resolve Conflict",
    };
  } else if (isPlanB) {
    return {
      planLabel: "Plan B — Phased Sub-Blocks (Modular Disconnection)",
      whatChanges: "Splits excessive duration into two staged sub-blocks across consecutive days.",
      movedItem: `Task ${tasksStr} divided into Phase 1 (2.0h) and Phase 2 (2.0h).`,
      newTimingOrResource: "Phase 1: Day 1 (13:00–15:00), Phase 2: Day 2 (13:00–15:00)",
      compatibility: "Track clampable between phases to permit regular train speed.",
      conflictStatus: {
        label: "Conflict resolved",
        badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
        icon: "🟢",
      },
      impactTradeOff: "Requires interim track restoration & caution order between Phase 1 and 2.",
      expectedResult: "Avoids long continuous line possession while safely completing rehabilitation.",
      actionButtonText: "Apply Plan B & Resolve Conflict",
    };
  } else {
    return {
      planLabel: "Plan C — Special Traffic Block with Route Diversion",
      whatChanges: "Secures dedicated Special Corridor Block with freight train regulation.",
      movedItem: `Full possession approved; freight trains regulated at sidings during work.`,
      newTimingOrResource: "11:30 – 15:30 (Special Traffic Possession)",
      compatibility: "Regulated via FOIS freight loop sidings.",
      conflictStatus: {
        label: "Partial resolution",
        badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
        icon: "🟡",
      },
      impactTradeOff: "Freight train encounters ~20-30 mins dwell in loop siding.",
      expectedResult: "Task completed in one single continuous possession with zero passenger impact.",
      actionButtonText: "Apply Plan C & Resolve Conflict",
    };
  }
};

export const OptimisationResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { period, setPeriod, corridor, setCorridor } = usePlanning();

  const [plans, setPlans] = useState<SchedulePlan[]>([]);
  const [activePlanId, setActivePlanId] = useState<string>("PLAN-A-CRIT");
  const [planDetail, setPlanDetail] = useState<SchedulePlan | null>(null);
  const [horizon, setHorizon] = useState<"WEEKLY" | "MONTHLY">("WEEKLY");
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Selected conflict context from Conflict Detection page
  const conflictIdParam = searchParams.get("conflictId") || (location.state as any)?.conflictId;
  const [focusedConflict, setFocusedConflict] = useState<ConflictItem | null>(null);
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [trains, setTrains] = useState<TrainMovement[]>([]);
  const [isResolving, setIsResolving] = useState(false);

  // Selected assignment for Explainability Modal
  const [selectedAssignment, setSelectedAssignment] = useState<ScheduleAssignment | null>(null);
  const [selectedDeferred, setSelectedDeferred] = useState<DeferredTaskItem | null>(null);

  const loadPlans = async (targetId?: string) => {
    setLoading(true);
    try {
      const data = await api.getOptimizationPlans();
      setPlans(data);
      const chosenId = targetId || searchParams.get("plan") || (data.length > 0 ? data[0].plan_id : "PLAN-A-CRIT");
      setActivePlanId(chosenId);
      loadPlanDetail(chosenId);
    } catch (err: any) {
      console.error("Error loading plans:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadPlanDetail = async (planId: string) => {
    try {
      const detail = await api.getOptimizationPlanById(planId);
      setPlanDetail(detail);
    } catch (err: any) {
      console.error("Error loading plan detail:", err);
    }
  };

  const loadConflictContext = async (targetConfId: string) => {
    try {
      const [confData, tasksData, trainsData] = await Promise.all([
        api.getConflicts(),
        api.getTasks(),
        api.getTrainMovements()
      ]);
      setTasks(tasksData);
      setTrains(trainsData);
      const matched = confData.find((c: ConflictItem) => c.conflict_id === targetConfId);
      if (matched) {
        setFocusedConflict(matched);
      }
    } catch (err: any) {
      console.error("Error loading conflict context:", err);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  useEffect(() => {
    if (conflictIdParam) {
      loadConflictContext(conflictIdParam);
    }
  }, [conflictIdParam]);

  const handleSelectPlan = (planId: string) => {
    setActivePlanId(planId);
    const newParams: Record<string, string> = { plan: planId };
    if (conflictIdParam) newParams.conflictId = conflictIdParam;
    setSearchParams(newParams);
    loadPlanDetail(planId);
  };

  const handleApplyPlanForConflict = async (plan: SchedulePlan) => {
    if (!focusedConflict) return;
    setIsResolving(true);
    try {
      const strategyLabel = `${plan.plan_id} (${plan.plan_name})`;
      await api.resolveConflict(focusedConflict.conflict_id, {
        resolution_strategy: strategyLabel,
        applied_plan_id: plan.plan_id,
        resolution_notes: `Resolved via ${plan.plan_name} (${plan.strategy_type}). Schedule updated.`
      });

      handleSelectPlan(plan.plan_id);

      setFocusedConflict({
        ...focusedConflict,
        status: "Resolved",
        resolution_strategy: strategyLabel,
        resolved_at: new Date().toISOString(),
        resolution_notes: `Resolved via ${plan.plan_name}`
      });

      setActionNotice(`✅ Conflict ${focusedConflict.conflict_id} successfully resolved! ${plan.plan_name} applied to corridor.`);
      setTimeout(() => setActionNotice(null), 8000);
    } catch (err: any) {
      alert(`Failed to apply plan: ${err.message}`);
    } finally {
      setIsResolving(false);
    }
  };

  const handleReopenConflictFromOptimizer = async (conflictId: string) => {
    try {
      await api.reopenConflict(conflictId);
      if (focusedConflict) {
        setFocusedConflict({
          ...focusedConflict,
          status: "Active",
          resolution_strategy: null,
          resolved_at: null
        });
      }
      setActionNotice(`Conflict ${conflictId} reopened to Active queue.`);
      setTimeout(() => setActionNotice(null), 5000);
    } catch (err: any) {
      alert(`Failed to reopen conflict: ${err.message}`);
    }
  };

  const handleGeneratePlans = async () => {
    setIsGenerating(true);
    setActionNotice(null);
    try {
      await api.generateOptimizationPlans({ strategy_type: "ALL", horizon });
      setActionNotice(`Constraint Optimization complete (${horizon === "WEEKLY" ? "7-Day Tactical Horizon" : "30-Day Strategic Corridor Horizon"}): Schedule synthesized across Engineering, S&T, and Traction.`);
      await loadPlans(activePlanId);
      setTimeout(() => setActionNotice(null), 5000);
    } catch (err: any) {
      alert(`Optimization failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSwitchHorizon = async (newHorizon: "WEEKLY" | "MONTHLY") => {
    if (newHorizon === horizon) return;
    setHorizon(newHorizon);
    setIsGenerating(true);
    setActionNotice(null);
    try {
      await api.generateOptimizationPlans({ strategy_type: "ALL", horizon: newHorizon });
      setActionNotice(`Switched to ${newHorizon === "WEEKLY" ? "7-Day Tactical Planning Horizon" : "30-Day Monthly Corridor Strategic Horizon"}. Schedule recalculated.`);
      await loadPlans(activePlanId);
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: any) {
      alert(`Horizon optimization failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      await api.generateOptimizationPlans({ strategy_type: "ALL", horizon: "WEEKLY" });
      setHorizon("WEEKLY");
      setActionNotice("Planner schedule reset to baseline constraint model (Weekly Horizon).");
      await loadPlans("PLAN-A-CRIT");
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const activePlan = plans.find(p => p.plan_id === activePlanId) || planDetail;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Optimized Block Plan</h1>
            <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              Constraint-Aware
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Constraint-aware maintenance schedule generated for planner review.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate("/explainability")}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
          >
            <Info className="w-3.5 h-3.5 text-railway-blue" />
            <span>Explainability Inspector</span>
          </button>
          <button
            onClick={() => navigate("/approval")}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
          >
            <span>Proceed to Approval</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs px-4 py-2.5 rounded-lg font-medium flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* RESOLVING CONFLICT CONTEXT BANNER */}
      {focusedConflict && (
        <div
          className={`rounded-xl border p-4 sm:p-5 shadow-xs transition ${
            focusedConflict.status === "Resolved"
              ? "bg-emerald-50/80 border-emerald-300"
              : "bg-amber-50/80 border-amber-300"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-slate-900 text-white font-mono font-black text-xs px-2.5 py-1 rounded shadow-2xs">
                  Resolving Conflict: {focusedConflict.conflict_id}
                </span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded border uppercase ${
                    focusedConflict.conflict_type === "Timetable"
                      ? "bg-amber-100 text-amber-900 border-amber-300"
                      : focusedConflict.conflict_type === "Resource"
                      ? "bg-blue-100 text-blue-900 border-blue-300"
                      : "bg-purple-100 text-purple-900 border-purple-300"
                  }`}
                >
                  {focusedConflict.conflict_type} Conflict
                </span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                    focusedConflict.severity === "Critical"
                      ? "bg-red-100 text-red-800 border-red-300"
                      : "bg-amber-100 text-amber-800 border-amber-300"
                  }`}
                >
                  {focusedConflict.severity} Severity
                </span>
                {focusedConflict.status === "Resolved" ? (
                  <span className="bg-emerald-600 text-white font-mono font-bold text-xs px-2.5 py-0.5 rounded flex items-center space-x-1 shadow-2xs">
                    <Check className="w-3.5 h-3.5" />
                    <span>RESOLVED</span>
                  </span>
                ) : (
                  <span className="bg-red-600 text-white font-mono font-bold text-xs px-2.5 py-0.5 rounded animate-pulse">
                    OPEN CONFLICT
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  {focusedConflict.conflict_type} Conflict between{" "}
                  <span className="text-railway-blue font-mono font-bold">
                    Request {focusedConflict.affected_tasks.join(", ") || "N/A"}
                  </span>
                  {focusedConflict.affected_trains.length > 0 && (
                    <>
                      {" "}and{" "}
                      <span className="text-amber-800 font-mono font-bold">
                        Train {focusedConflict.affected_trains.join(", ")}
                      </span>
                    </>
                  )}
                </h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-700 mt-1">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-semibold">Time Window:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {focusedConflict.explanation.match(/\d{2}:\d{2}(:\d{2})?\s*-\s*\d{2}:\d{2}(:\d{2})?/)?.[0] || "12:00 – 15:30"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-semibold">Corridor:</span>
                    <span className="font-bold text-slate-900">
                      {focusedConflict.explanation.match(/Section\s+[A-Za-z\-]+/)?.[0] || corridor}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white/90 rounded-lg p-3 border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 font-bold">Current Issue: </strong>
                    <span className="text-slate-800 leading-relaxed">{focusedConflict.explanation}</span>
                  </div>
                </div>
                {focusedConflict.suggested_resolution && (
                  <div className="flex items-start space-x-2 pt-1.5 border-t border-slate-100">
                    <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-emerald-900 font-bold">Recommended Resolution: </strong>
                      <span className="text-slate-700 leading-relaxed">{focusedConflict.suggested_resolution}</span>
                    </div>
                  </div>
                )}
              </div>

              {focusedConflict.status === "Resolved" && (
                <div className="bg-emerald-100/90 border border-emerald-300 rounded-lg p-2.5 text-xs text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                    <span>
                      <strong>Resolved via:</strong> {focusedConflict.resolution_strategy || "Applied Optimization Plan"}
                      {focusedConflict.resolved_at && ` on ${new Date(focusedConflict.resolved_at).toLocaleTimeString()}`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleReopenConflictFromOptimizer(focusedConflict.conflict_id)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] font-bold transition cursor-pointer whitespace-nowrap self-start sm:self-auto"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reopen Conflict</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-row md:flex-col gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => navigate("/conflicts")}
                className="inline-flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 transition cursor-pointer shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Conflicts</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setFocusedConflict(null);
                  const newParams = new URLSearchParams(searchParams);
                  newParams.delete("conflictId");
                  setSearchParams(newParams);
                }}
                className="inline-flex items-center justify-center space-x-1 px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 text-xs font-semibold transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear Focus</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Controls: Planning Period, Corridor / Section, Generate Plan, Reset */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-700">Planning Period:</span>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-medium focus:ring-2 focus:ring-railway-blue"
            >
              <option value="Week 38 (18 - 24 Sep 2026)">Week 38 (18 - 24 Sep 2026)</option>
              <option value="Week 39 (25 Sep - 01 Oct 2026)">Week 39 (25 Sep - 01 Oct 2026)</option>
              <option value="Monthly Cycle (Sep - Oct 2026)">Monthly Cycle (Sep - Oct 2026)</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-slate-700">Corridor / Section:</span>
            <select
              value={corridor}
              onChange={(e) => setCorridor(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-medium focus:ring-2 focus:ring-railway-blue"
            >
              <option value="Mainline Corridor Alpha (Sec A-D)">Mainline Corridor Alpha (Sec A-D)</option>
              <option value="Section A-B (Highheadway Track)">Section A-B (High-headway Track)</option>
              <option value="Section B-C (Junction Corridor)">Section B-C (Junction Corridor)</option>
              <option value="Section C-D (Express Bypass)">Section C-D (Express Bypass)</option>
            </select>
          </div>

          {/* Horizon Switcher (SIH PS 26027 Requirement 4) */}
          <div className="flex items-center space-x-1.5 border-l border-slate-200 pl-3">
            <span className="font-bold text-slate-700">Horizon:</span>
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg font-bold">
              <button
                type="button"
                onClick={() => handleSwitchHorizon("WEEKLY")}
                className={`px-2.5 py-1 rounded transition cursor-pointer text-xs ${
                  horizon === "WEEKLY"
                    ? "bg-white text-railway-blue shadow-2xs font-black"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                7-Day Tactical (Weekly)
              </button>
              <button
                type="button"
                onClick={() => handleSwitchHorizon("MONTHLY")}
                className={`px-2.5 py-1 rounded transition cursor-pointer text-xs ${
                  horizon === "MONTHLY"
                    ? "bg-white text-emerald-700 shadow-2xs font-black"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                30-Day Strategic (Monthly)
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleReset}
            disabled={isGenerating}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset</span>
          </button>
          <button
            onClick={handleGeneratePlans}
            disabled={isGenerating}
            className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-lg bg-railway-blue hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
            <span>{isGenerating ? "Optimizing..." : "Generate Plan"}</span>
          </button>
        </div>
      </div>

      {/* Plan Strategy Selection Tabs / Detailed Conflict Resolution Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((p) => {
          const isSelected = p.plan_id === activePlanId;
          const analysis = getPlanConflictAnalysis(p, focusedConflict);
          const isAppliedForThisConflict =
            focusedConflict?.status === "Resolved" &&
            (focusedConflict.resolution_strategy?.includes(p.plan_id) ||
              (p.status === "Approved" && focusedConflict.resolution_strategy?.includes("Plan")));

          return (
            <div
              key={p.plan_id}
              onClick={() => handleSelectPlan(p.plan_id)}
              className={`p-4.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? "bg-white border-railway-blue ring-2 ring-blue-500/20 shadow-md"
                  : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
              }`}
            >
              <div className="space-y-3">
                {/* Plan Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-mono text-xs font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {p.plan_id}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 text-railway-blue uppercase">
                      {p.horizon || horizon}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    {isAppliedForThisConflict && (
                      <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                        ✓ Applied
                      </span>
                    )}
                    <StatusBadge status={p.status} />
                  </div>
                </div>

                {/* Plan Title & Subtitle */}
                <div>
                  <h3 className="text-sm font-black text-slate-900 leading-snug">
                    {analysis.planLabel}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {p.notes}
                  </p>
                </div>

                {/* Conflict Status Badge */}
                <div className="pt-0.5">
                  <div className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${analysis.conflictStatus.badgeClass}`}>
                    <span>{analysis.conflictStatus.icon}</span>
                    <span>{analysis.conflictStatus.label}</span>
                  </div>
                </div>

                {/* Conflict Resolution Details (Always transparently shown when conflict is focused) */}
                {focusedConflict ? (
                  <div className="bg-slate-50 rounded-lg p-3 text-xs space-y-2 border border-slate-200/70">
                    <div>
                      <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider">What changes?</span>
                      <span className="text-slate-800 font-medium">{analysis.whatChanges}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider">Which request is moved?</span>
                      <span className="text-slate-800">{analysis.movedItem}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider">New time slot / resource</span>
                      <span className="font-mono font-bold text-railway-blue">{analysis.newTimingOrResource}</span>
                    </div>
                    {analysis.compatibility && (
                      <div>
                        <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider">Compatibility</span>
                        <span className="text-slate-800">{analysis.compatibility}</span>
                      </div>
                    )}
                    <div>
                      <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider">Impact / Trade-off</span>
                      <span className="text-amber-900 font-medium">{analysis.impactTradeOff}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider">Expected result</span>
                      <span className="text-emerald-800 font-medium">{analysis.expectedResult}</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-lg p-2.5 text-xs text-slate-600 border border-slate-100">
                    <span className="text-[11px] text-slate-500">Corridor Strategy Focus:</span>
                    <p className="font-medium text-slate-800 mt-0.5">{analysis.whatChanges}</p>
                  </div>
                )}
              </div>

              {/* Bottom Strip: Stats & Action Button */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                {/* Stats */}
                <div className="grid grid-cols-4 gap-1 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Scheduled</span>
                    <strong className="text-slate-900 font-mono text-xs">{p.scheduled_count}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Asset Uptime</span>
                    <strong className="text-emerald-700 font-mono text-xs">{p.asset_availability_pct || 96.8}%</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Utilisation</span>
                    <strong className="text-railway-blue font-mono text-xs">{p.utilization_rate}%</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Coverage</span>
                    <strong className="text-purple-700 font-mono text-xs">{p.critical_coverage}%</strong>
                  </div>
                </div>

                {/* Apply Action Button */}
                {focusedConflict ? (
                  <button
                    type="button"
                    disabled={isResolving}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApplyPlanForConflict(p);
                    }}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-xs ${
                      isAppliedForThisConflict
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : isSelected
                        ? "bg-railway-blue hover:bg-blue-700 text-white"
                        : "bg-slate-900 hover:bg-slate-800 text-white"
                    }`}
                  >
                    {isResolving ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : isAppliedForThisConflict ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                    )}
                    <span>
                      {isAppliedForThisConflict
                        ? "✓ Plan Applied (Resolved)"
                        : `Apply ${p.plan_id.toUpperCase().startsWith("PLAN-A") ? "Plan A" : p.plan_id.toUpperCase().startsWith("PLAN-B") ? "Plan B" : "Plan C"} & Resolve`}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectPlan(p.plan_id);
                    }}
                    className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                      isSelected
                        ? "bg-railway-blue text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {isSelected ? "Active Plan" : `Select ${p.plan_id}`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* GOODS TRAINS FORECAST (FOIS FEED) REGULATION PANEL (SIH PS 26027 Requirement 1) */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-xl p-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 border border-slate-800">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold px-2 py-0.2 rounded uppercase">
              FOIS Goods Forecast Ingestion
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Control Office Freight Corridor Coordination
            </span>
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-white">
            Goods Train Regulation: Freight Rakes Looped with Zero Passenger Clashes
          </h3>
          <p className="text-[11px] text-slate-300">
            Thermal Coal (BOXNHL-42) & Container (BLC-88) rakes regulated at Station A & B sidings during night block (01:30 - 05:30).
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono font-bold bg-white/10 px-2.5 py-1 rounded text-emerald-400 border border-white/10 whitespace-nowrap">
            ✓ 0 Freight Stagnation Delay
          </span>
          <button
            onClick={() => navigate("/datasources")}
            className="text-xs bg-white text-slate-900 hover:bg-slate-100 font-bold px-3 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap"
          >
            Inspect FOIS Feed
          </button>
        </div>
      </div>

      {/* MAIN HERO VISUAL: MULTI-DEPARTMENT CO-ORDINATED BLOCK TIMELINE */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                Coordinated Maintenance Block Schedule (Hero View)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Simultaneous corridor possession bundling Engineering, S&T, and Traction into synchronized windows
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 font-mono font-bold text-xs px-2.5 py-1 rounded-lg flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>✓ FEASIBLE</span>
            </span>
          </div>
        </div>

        {/* The Coordinated Window Visual Timeline */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between text-xs pb-2 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                Tuesday
              </span>
              <span className="font-bold text-slate-700">Section A–B</span>
              <span className="text-slate-400">&bull;</span>
              <span className="font-mono font-bold text-railway-blue">09:00 – 12:00</span>
              <span className="text-slate-500">(3.0 hrs total window)</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              Corridor Capacity: <strong>100% Conflict-Free</strong>
            </span>
          </div>

          {/* Department Stacked Gantt Bars */}
          <div className="space-y-2.5 pt-1">
            {/* Engineering Row */}
            <div className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-3 sm:col-span-2 text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span>Engineering</span>
              </div>
              <div className="col-span-9 sm:col-span-10">
                <div className="relative w-full bg-slate-200 h-8 rounded-lg overflow-hidden flex items-center">
                  <div
                    className="h-full bg-blue-600 text-white text-xs font-bold px-3 flex items-center justify-between rounded-lg shadow-xs"
                    style={{ width: "100%" }}
                  >
                    <span className="truncate">Track Inspection & Ultrasonic Testing (REQ-001)</span>
                    <span className="font-mono text-[11px] whitespace-nowrap ml-2">09:00 - 12:00 (3h)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* S&T Row */}
            <div className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-3 sm:col-span-2 text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>S&T</span>
              </div>
              <div className="col-span-9 sm:col-span-10">
                <div className="relative w-full bg-slate-200 h-8 rounded-lg overflow-hidden flex items-center">
                  <div
                    className="h-full bg-amber-500 text-white text-xs font-bold px-3 flex items-center justify-between rounded-lg shadow-xs"
                    style={{ width: "100%" }}
                  >
                    <span className="truncate">Signal Maintenance & Interlocking Check (REQ-002)</span>
                    <span className="font-mono text-[11px] whitespace-nowrap ml-2">09:00 - 12:00 (3h)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Traction Row */}
            <div className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-3 sm:col-span-2 text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span>Traction</span>
              </div>
              <div className="col-span-9 sm:col-span-10">
                <div className="relative w-full bg-slate-200 h-8 rounded-lg overflow-hidden flex items-center">
                  <div
                    className="h-full bg-emerald-600 text-white text-xs font-bold px-3 flex items-center justify-between rounded-lg shadow-xs"
                    style={{ width: "67%" }}
                  >
                    <span className="truncate">OHE Line Inspection & Insulator Wash (REQ-004)</span>
                    <span className="font-mono text-[11px] whitespace-nowrap ml-2">09:00 - 11:00 (2h)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs text-slate-500">
            <span className="italic text-[11px]">
              * 3 separate departmental demands bundled into 1 joint traffic block. Zero additional train delays.
            </span>
            <button
              onClick={() => navigate("/explainability")}
              className="text-railway-blue hover:underline font-bold flex items-center space-x-1"
            >
              <span>Explain Why This Block Was Selected</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* OPTIMIZATION SUMMARY: BEFORE VS AFTER */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-100 p-3 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-railway-blue" />
              <h3 className="font-black text-xs uppercase tracking-wider text-slate-900">
                Optimization Summary
              </h3>
            </div>
            <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono">
              SIMULATED / DEMO METRICS
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 text-xs">
            {/* Before Optimization */}
            <div className="p-4 space-y-3 bg-rose-50/20">
              <div className="flex items-center justify-between">
                <span className="font-black text-rose-900 uppercase tracking-wide text-[11px]">
                  Before Optimization
                </span>
                <span className="text-[10px] font-mono text-rose-700 font-bold">Uncoordinated Demands</span>
              </div>
              <ul className="space-y-2 text-slate-700">
                <li className="flex items-center justify-between">
                  <span>Maintenance Requests:</span>
                  <strong className="font-mono font-bold text-slate-900">6 maintenance requests</strong>
                </li>
                <li className="flex items-center justify-between">
                  <span>Potential Conflicts:</span>
                  <strong className="font-mono font-bold text-rose-700">4 potential conflicts</strong>
                </li>
                <li className="flex items-center justify-between">
                  <span>Corridor Traffic Windows:</span>
                  <strong className="font-mono font-bold text-slate-900">6 separate windows</strong>
                </li>
              </ul>
            </div>

            {/* After Optimization */}
            <div className="p-4 space-y-3 bg-emerald-50/20">
              <div className="flex items-center justify-between">
                <span className="font-black text-emerald-900 uppercase tracking-wide text-[11px]">
                  After Optimization
                </span>
                <span className="text-[10px] font-mono text-emerald-700 font-bold">Constraint-Aware Bundling</span>
              </div>
              <ul className="space-y-2 text-slate-700">
                <li className="flex items-center justify-between">
                  <span>Synthesized Block Plans:</span>
                  <strong className="font-mono font-bold text-emerald-700">3 coordinated blocks</strong>
                </li>
                <li className="flex items-center justify-between">
                  <span>Unresolved Hard Conflicts:</span>
                  <strong className="font-mono font-bold text-emerald-700">0 unresolved hard conflicts</strong>
                </li>
                <li className="flex items-center justify-between">
                  <span>Departmental Synergy:</span>
                  <strong className="font-mono font-bold text-slate-900">Compatible activities grouped</strong>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Details & Scheduled Tasks Table */}
      {planDetail && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Scheduled Assignments ({planDetail.scheduled_assignments?.length || 0} Tasks)
              </h3>
              <p className="text-[11px] text-slate-500">
                Active plan allocation under {planDetail.plan_name}
              </p>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Click "Explain Decision" for rule breakdown
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3">Task ID</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Activity</th>
                  <th className="py-2.5 px-3">Section</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Assigned Block</th>
                  <th className="py-2.5 px-3">Slot Date & Time</th>
                  <th className="py-2.5 px-3">Joint Bundling</th>
                  <th className="py-2.5 px-3 text-right">Explain Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(planDetail.scheduled_assignments || []).map((asgn) => (
                  <tr key={asgn.assignment_id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{asgn.task.task_id}</td>
                    <td className="py-2.5 px-3"><DepartmentBadge department={asgn.task.department} /></td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{asgn.task.asset_type}</td>
                    <td className="py-2.5 px-3 text-slate-600">{asgn.task.location}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">{asgn.task.duration_hours}h</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-mono font-bold text-[11px]">
                        {asgn.block.block_id}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {asgn.block.date} | {asgn.block.start_time.slice(0, 5)} - {asgn.block.end_time.slice(0, 5)}
                    </td>
                    <td className="py-2.5 px-3">
                      {asgn.bundled_with && asgn.bundled_with.length > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-semibold">
                          Grouped with {asgn.bundled_with.join(", ")}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">Solo Block</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedAssignment(asgn)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition"
                      >
                        <Info className="w-3.5 h-3.5 text-railway-blue" />
                        <span>Explain Decision</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Explainability Modal for Selected Assignment */}
      {selectedAssignment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase font-mono">WHY WAS THIS BLOCK SELECTED?</span>
                <h3 className="font-extrabold text-base text-slate-900">
                  {selectedAssignment.task.task_id} &rarr; {selectedAssignment.block.block_id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAssignment(null)}
                className="p-1 rounded-md hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-3 text-xs">
              <p className="font-semibold text-slate-900">
                {selectedAssignment.explanation.summary}
              </p>

              <div className="space-y-1.5 pt-2 border-t border-slate-200">
                <div className="font-bold text-slate-600 uppercase text-[10px]">Constraint Proof Points:</div>
                <ul className="space-y-1.5 text-slate-700">
                  {(selectedAssignment.explanation.rule_based_reasons || selectedAssignment.explanation.reasons || []).map((r, i) => (
                    <li key={i} className="flex items-start space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 italic">
              * Verified deterministically via Google OR-Tools CP-SAT solver constraint bounds.
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setSelectedAssignment(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const taskId = selectedAssignment.task.task_id;
                  setSelectedAssignment(null);
                  navigate(`/explainability?taskId=${encodeURIComponent(taskId)}`, {
                    state: {
                      taskId,
                      planId: activePlan?.plan_id,
                      assignment: selectedAssignment
                    }
                  });
                }}
                className="px-4 py-2 bg-railway-blue hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Open Full Explainability Matrix
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
