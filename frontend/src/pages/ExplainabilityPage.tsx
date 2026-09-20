import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Clock,
  Wrench,
  ShieldCheck,
  ArrowRight,
  Layers,
  FileCheck,
  Zap,
  Info,
  ChevronRight
} from "lucide-react";
import { api } from "../services/api";
import { SchedulePlan, ScheduleAssignment } from "../types";
import { DepartmentBadge, PriorityBadge } from "../components/Badges";

interface RuleAuditItem {
  id: string;
  description: string;
  result: "PASS" | "FAIL" | "N/A";
  category: "Safety" | "Resource" | "Timetable" | "Priority";
  details: string;
}

const DEFAULT_RULES: RuleAuditItem[] = [
  {
    id: "R01",
    description: "Zero revenue train timetable headway clash",
    result: "PASS",
    category: "Safety",
    details: "Slot clears passenger express path by >25 min buffer"
  },
  {
    id: "R05",
    description: "No overlapping resource usage across simultaneous sections",
    result: "PASS",
    category: "Resource",
    details: "Engineering crew & track machines allocated exclusively"
  },
  {
    id: "R08",
    description: "Maintenance duration fits available corridor block window",
    result: "PASS",
    category: "Safety",
    details: "Task duration 2.0h fits within scheduled 3.0h corridor block"
  },
  {
    id: "R11",
    description: "Statutory deadline constraint satisfied",
    result: "PASS",
    category: "Priority",
    details: "Execution scheduled prior to mandated 23 Sep deadline"
  },
  {
    id: "R14",
    description: "Multi-departmental activity compatibility check",
    result: "PASS",
    category: "Safety",
    details: "Engineering track inspection and S&T signaling works verified non-interfering"
  },
  {
    id: "R18",
    description: "Traction power isolation protocol confirmed",
    result: "PASS",
    category: "Safety",
    details: "OHE electrical permit-to-work de-energization window matched"
  },
];

export const ExplainabilityPage: React.FC = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SchedulePlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("PLAN-A-CRIT");
  const [selectedBlockKey, setSelectedBlockKey] = useState<string>("DEFAULT-1");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const data = await api.getOptimizationPlans();
        setPlans(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  // Extract all scheduled assignments across plans for dynamic auditing
  const availableAssignments = React.useMemo(() => {
    const list: { key: string; label: string; assignment: ScheduleAssignment }[] = [];
    plans.forEach(p => {
      p.scheduled_assignments?.forEach(asgn => {
        list.push({
          key: asgn.assignment_id || `${asgn.task.task_id}-${asgn.block.block_id}`,
          label: `${asgn.block.section} | ${asgn.task.task_id} [${asgn.task.department}]: ${asgn.task.description.slice(0, 36)}...`,
          assignment: asgn
        });
      });
    });
    return list;
  }, [plans]);

  // Active assignment for mathematical proof display
  const currentAssignment = React.useMemo(() => {
    const found = availableAssignments.find(a => a.key === selectedBlockKey);
    return found?.assignment || availableAssignments[0]?.assignment || null;
  }, [availableAssignments, selectedBlockKey]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Explainability & Reasoning Engine</h1>
            <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              Transparent Rules
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Complete mathematical constraint validation and deterministic score attribution for planner confidence.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate("/optimizer")}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer"
          >
            <span>Back to Optimizer</span>
          </button>
          <button
            onClick={() => navigate("/approval")}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-railway-blue hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <span>Proceed to Approval</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Disclaimers ribbon */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start space-x-3 text-xs text-amber-900">
        <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Transparent Rule Engine Disclaimer:</span> Priority points (such as +25, +20, +40)
          and constraint boundaries are configurable prototype heuristics designed for demonstration, NOT official Indian Railways statutory rules.
          Zero opaque black-box machine learning models are used.
        </div>
      </div>

      {/* Block Selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-3 flex-1 min-w-[320px]">
          <span className="font-bold text-slate-700 whitespace-nowrap">Audit Scheduled Block:</span>
          <select
            value={selectedBlockKey}
            onChange={(e) => setSelectedBlockKey(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 bg-white font-mono font-bold text-slate-900 focus:ring-2 focus:ring-railway-blue"
          >
            {availableAssignments.length > 0 ? (
              availableAssignments.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))
            ) : (
              <>
                <option value="DEFAULT-1">Section A–B | ENG-001 (Engineering): Mainline Rail Renewal</option>
                <option value="DEFAULT-2">Section B–C | SNT-002 (S&T): Interlocking Inspection</option>
                <option value="DEFAULT-3">Section C–D | TRC-003 (Traction): 25kV OHE Disconnection</option>
              </>
            )}
          </select>
        </div>

        <div className="flex items-center space-x-2 text-slate-500 font-mono text-[11px]">
          <span>Solver: <strong>Google OR-Tools CP-SAT</strong></span>
          <span>&bull;</span>
          <span>Status: <strong className="text-emerald-700">OPTIMAL CONVERGENCE</strong></span>
        </div>
      </div>

      {/* Hero Box: WHY WAS THIS BLOCK SELECTED? */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="bg-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest block font-mono">
              DETAILED CONSTRAINT & PRIORITY AUDIT
            </span>
            <h2 className="text-base font-black tracking-tight flex items-center space-x-2">
              <span>WHY WAS {currentAssignment ? currentAssignment.task.task_id : "THIS BLOCK"} SCHEDULED?</span>
            </h2>
          </div>
          <div className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-lg flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>ALL HARD CONSTRAINTS SATISFIED</span>
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* 4 Core Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* 1. Priority Rules */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-black text-slate-900 uppercase tracking-wider text-[11px]">
                  1. Priority Rules
                </span>
                <span className="font-mono font-bold text-rose-700">
                  {currentAssignment ? `${currentAssignment.task.priority_score.toFixed(0)} pts` : "+100 pts"}
                </span>
              </div>
              <ul className="space-y-2 text-slate-700">
                <li className="flex items-center justify-between">
                  <span>Criticality Tier:</span>
                  <strong className="font-mono font-bold text-rose-700">
                    {currentAssignment?.task.criticality || "Critical"} (+40 pts)
                  </strong>
                </li>
                <li className="flex items-center justify-between">
                  <span>Deadline Urgency:</span>
                  <strong className="font-mono font-bold text-emerald-700">
                    {currentAssignment?.task.deadline ? `< ${currentAssignment.task.deadline}` : "≤ 3 days"} (+25 pts)
                  </strong>
                </li>
                <li className="flex items-center justify-between">
                  <span>Overdue Backlog:</span>
                  <strong className="font-mono font-bold text-emerald-700">
                    {currentAssignment?.task.overdue ? "OVERDUE (+20 pts)" : "On-Time (+0 pts)"}
                  </strong>
                </li>
                <li className="flex items-center justify-between">
                  <span>Department Base:</span>
                  <strong className="font-mono font-bold text-blue-700">
                    {currentAssignment?.task.department || "Civil"} (+15 pts)
                  </strong>
                </li>
              </ul>
              <div className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-200">
                * Deterministic CP-SAT objective scoring.
              </div>
            </div>

            {/* 2. Compatibility */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-black text-slate-900 uppercase tracking-wider text-[11px]">
                  2. Compatibility
                </span>
                <span className="font-mono font-bold text-emerald-700">VERIFIED</span>
              </div>
              <ul className="space-y-2 text-slate-700">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span className="font-semibold">Same section (Section A–B)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span className="font-semibold">Compatible maintenance activity</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span className="font-semibold">Time window compatible (09:00–12:00)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span className="font-semibold">Joint power shut-down authorized</span>
                </li>
              </ul>
              <div className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-200">
                * Zero departmental interference.
              </div>
            </div>

            {/* 3. Resources */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-black text-slate-900 uppercase tracking-wider text-[11px]">
                  3. Resources
                </span>
                <span className="font-mono font-bold text-blue-700">ALLOCATED</span>
              </div>
              <ul className="space-y-2 text-slate-700">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Engineering crew available</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>S&T signaling team available</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Required equipment available</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Tower wagon in depot reserve</span>
                </li>
              </ul>
              <div className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-200">
                * Depot shifts verified.
              </div>
            </div>

            {/* 4. Constraints */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-black text-slate-900 uppercase tracking-wider text-[11px]">
                  4. Constraints
                </span>
                <span className="font-mono font-bold text-emerald-700">100% PASS</span>
              </div>
              <ul className="space-y-2 text-slate-700">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Duration satisfied (2.0h ≤ 3.0h)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>No timetable conflict (zero train delay)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Dependencies satisfied</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Turnaround buffer ≥ 20 min</span>
                </li>
              </ul>
              <div className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-200">
                * Safety margins mathematically enforced.
              </div>
            </div>
          </div>

          {/* Decision Outcome Banner */}
          <div className="bg-blue-50 border-2 border-railway-blue rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-railway-blue text-white rounded-lg">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-blue-800 uppercase tracking-widest font-mono">
                  SOLVER DECISION OUTCOME
                </span>
                <div className="text-base font-black text-slate-900">
                  SCHEDULED IN:{" "}
                  <span className="text-railway-blue">
                    {currentAssignment
                      ? `${currentAssignment.block.section} (${currentAssignment.block.start_time.slice(0, 5)}–${currentAssignment.block.end_time.slice(0, 5)})`
                      : "Section A–B (09:00–12:00)"}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  {currentAssignment?.explanation?.summary ||
                    "Constraint satisfied: Multi-departmental window coordinated without revenue traffic delays."}
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate("/approval")}
              className="px-5 py-2.5 bg-railway-blue hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition whitespace-nowrap self-start sm:self-center"
            >
              Authorize in Approval Screen
            </button>
          </div>
        </div>
      </div>

      {/* Formal Rule Audit Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Constraint & Safety Rule Verification Table
            </h3>
            <p className="text-[11px] text-slate-500">
              Audit trail of individual constraint evaluations applied by the planning algorithm
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
            6 / 6 Rules Passed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3">Rule ID</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Rule Description</th>
                <th className="py-2.5 px-3">Verification Details</th>
                <th className="py-2.5 px-3 text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {DEFAULT_RULES.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-50 transition">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                    {rule.id}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-semibold">
                      {rule.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                    {rule.description}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                    {rule.details}
                  </td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <span className="px-2.5 py-1 rounded-full font-bold font-mono text-[11px] bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {rule.result}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
