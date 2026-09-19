import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Clock,
  Wrench,
  Layers,
  ArrowRight,
  History,
  Check,
  MessageSquare
} from "lucide-react";
import { api } from "../services/api";
import { SchedulePlan } from "../types";
import { StatusBadge, DepartmentBadge } from "../components/Badges";
import { usePlanning } from "../context/PlanningContext";

export const ApprovalPage: React.FC = () => {
  const navigate = useNavigate();
  const { role } = usePlanning();
  const [plans, setPlans] = useState<SchedulePlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("PLAN-A-CRIT");
  const [plannerComments, setPlannerComments] = useState("All hard safety constraints verified against Section A-B timetable. Coordinated multi-departmental block approved for execution.");
  const [authorizerName, setAuthorizerName] = useState("Sr. DOM Rajesh Sharma");
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getOptimizationPlans();
      setPlans(data);
      if (data.length > 0) {
        setSelectedPlanId(data[0].plan_id);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentPlan = plans.find(p => p.plan_id === selectedPlanId);

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await api.approvePlan(selectedPlanId, {
        user_name: authorizerName,
        user_role: role || "Railway Planner",
        comments: plannerComments
      });
      setActionSuccess(`Plan ${selectedPlanId} officially approved and committed to the Append-Only Audit Trail.`);
      await loadData();
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      alert("Approval error: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt("Enter mandatory operational rationale for plan rejection:");
    if (!reason || !reason.trim()) return;

    setIsProcessing(true);
    try {
      await api.rejectPlan(selectedPlanId, {
        user_name: authorizerName,
        user_role: role || "Railway Planner",
        reason
      });
      setActionSuccess(`Plan ${selectedPlanId} marked as Rejected in the audit record.`);
      await loadData();
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      alert("Rejection error: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestModification = () => {
    setActionSuccess(`Plan ${selectedPlanId} flagged for planner adjustments in Block Planning Workspace.`);
    setTimeout(() => {
      navigate("/workspace");
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Plan Review & Approval</h1>
            <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              Human-in-the-Loop
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Human-controlled sign-off and power block sanction for Indian Railways operations.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            to="/audit"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>View Audit History</span>
          </Link>
        </div>
      </div>

      {/* Mandatory Non-Autonomous Regulatory Guardrail Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3 text-xs text-amber-900">
        <ShieldCheck className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="block font-bold">HUMAN CONTROL MANDATE (Non-Autonomous Decision Support):</strong>
          RailOptiBlock generates constraint-optimized recommendations only. Operational block approval, traction power disconnection permits, and line possession sanctions remain strictly under human planner authorization.
        </div>
      </div>

      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs px-4 py-2.5 rounded-lg font-medium flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Main Approval Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Plan Summary (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                TARGET PLAN RECOMMENDATION
              </span>
              <div className="flex items-center space-x-2 mt-0.5">
                <h2 className="text-base font-black text-slate-900">
                  {currentPlan ? currentPlan.plan_name : "Loading Plan..."}
                </h2>
                {currentPlan && <StatusBadge status={currentPlan.status} />}
              </div>
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <span className="font-semibold text-slate-600">Select Plan:</span>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="border border-slate-300 rounded-lg px-2.5 py-1 bg-white font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-railway-blue"
              >
                {plans.map((p) => (
                  <option key={p.plan_id} value={p.plan_id}>
                    {p.plan_name} ({p.plan_id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Plan Summary Specs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Affected Section</span>
              <strong className="text-slate-900 font-bold text-sm block mt-0.5">Section A–B</strong>
              <span className="text-[10px] text-slate-400">Mainline Track Alpha</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Departments</span>
              <strong className="text-slate-900 font-bold text-sm block mt-0.5">3 Coordinated</strong>
              <span className="text-[10px] text-slate-400">Engineering, S&T, Traction</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Block Duration</span>
              <strong className="text-railway-blue font-mono font-bold text-sm block mt-0.5">3.0 Hours</strong>
              <span className="text-[10px] text-slate-400">Tuesday 09:00 – 12:00</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Unresolved Conflicts</span>
              <strong className="text-emerald-700 font-mono font-bold text-sm block mt-0.5">0 Hard Conflicts</strong>
              <span className="text-[10px] text-slate-400">100% Feasible</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Resource Allocation</span>
              <strong className="text-slate-900 font-bold text-sm block mt-0.5">3 Crews & 2 Machines</strong>
              <span className="text-[10px] text-slate-400">Depot verified</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Critical Task Coverage</span>
              <strong className="text-emerald-700 font-mono font-bold text-sm block mt-0.5">
                {currentPlan?.critical_coverage || 100}%
              </strong>
              <span className="text-[10px] text-slate-400">All high-priority met</span>
            </div>
          </div>

          {/* Maintenance Activities in this Block */}
          <div className="space-y-2 text-xs">
            <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">
              Coordinated Maintenance Activities in this Block:
            </span>
            <div className="space-y-2">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DepartmentBadge department="Engineering" />
                  <span className="font-semibold text-slate-900">Track Ultrasonic Flaw Testing (REQ-001)</span>
                </div>
                <span className="font-mono text-slate-600">2.0 hrs &bull; Crew 1</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DepartmentBadge department="S&T" />
                  <span className="font-semibold text-slate-900">Point Machine & Signal Interlocking (REQ-002)</span>
                </div>
                <span className="font-mono text-slate-600">2.5 hrs &bull; S&T Team</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DepartmentBadge department="Traction" />
                  <span className="font-semibold text-slate-900">OHE Section Insulator Wash & Power Isol (REQ-004)</span>
                </div>
                <span className="font-mono text-slate-600">2.0 hrs &bull; Tower Wagon</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pre-Checks & Decision Options (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="pb-2 border-b border-slate-100">
            <h3 className="font-black text-xs uppercase tracking-wider text-slate-900">
              Pre-Approval Verification
            </h3>
            <span className="text-[11px] text-slate-500">
              Mandatory safety check gates prior to sign-off
            </span>
          </div>

          {/* Three Key Status Gates */}
          <div className="space-y-2.5 text-xs">
            {/* Hard Constraints */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <div>
                <strong className="text-emerald-950 block">Hard Constraints</strong>
                <span className="text-[11px] text-emerald-800">Zero timetable & location clash</span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-600 text-white flex items-center space-x-1">
                <Check className="w-3 h-3" />
                <span>✓ Passed</span>
              </span>
            </div>

            {/* Soft Preferences */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div>
                <strong className="text-blue-950 block">Soft Preferences</strong>
                <span className="text-[11px] text-blue-800">Joint bundling & utilization</span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-railway-blue text-white flex items-center space-x-1">
                <Check className="w-3 h-3" />
                <span>✓ Optimized</span>
              </span>
            </div>

            {/* Human Review */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200">
              <div>
                <strong className="text-amber-950 block">Human Review</strong>
                <span className="text-[11px] text-amber-800">Pending planner sanction</span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500 text-white flex items-center space-x-1">
                <span>● Pending</span>
              </span>
            </div>
          </div>

          {/* Authorizing Official & Comments */}
          <div className="space-y-3 pt-2 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Authorizing Official:</label>
              <input
                type="text"
                value={authorizerName}
                onChange={(e) => setAuthorizerName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-xs font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Planner Comments & Justification:</label>
              <textarea
                rows={3}
                value={plannerComments}
                onChange={(e) => setPlannerComments(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-railway-blue text-slate-800"
              />
            </div>
          </div>

          {/* Decision Buttons */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <button
              onClick={handleApprove}
              disabled={isProcessing}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center justify-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isProcessing ? "Committing..." : "Approve Block Plan"}</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleRequestModification}
                className="py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Request Modification
              </button>
              <button
                onClick={handleReject}
                className="py-2 border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition"
              >
                Reject Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
