import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Train,
  ShieldAlert,
  Layers,
  Cpu,
  CheckCircle2,
  ArrowRight,
  Database,
  Sliders,
  CalendarCheck,
  Building2,
  FileSpreadsheet
} from "lucide-react";
import { api } from "../services/api";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [syncStatus, setSyncStatus] = React.useState<string | null>(null);

  const handleLoadDemoData = async () => {
    setLoading(true);
    try {
      await api.importDemoTasks();
      setSyncStatus("Demo dataset verified & loaded into SQLite engine!");
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (err: any) {
      setSyncStatus(`Sync error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12 py-4">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-railway-dark to-[#1E3E62] text-white rounded-2xl p-8 sm:p-12 shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="inline-flex items-center space-x-2 bg-blue-500/20 text-blue-200 border border-blue-400/30 px-3 py-1 rounded-full text-xs font-semibold tracking-wide">
            <Train className="w-3.5 h-3.5" />
            <span>Smart India Hackathon 2026 | Problem Statement 26027</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            RailBlock Advisor
          </h1>
          <p className="text-lg sm:text-xl text-blue-100 font-medium leading-relaxed">
            AI-Assisted Maintenance Block Planning for Indian Railways
          </p>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Coordinate maintenance requests, detect operational conflicts, and generate explainable block planning options
            across Engineering, Signal & Telecommunication (S&T), and Traction Distribution departments using deterministic Google OR-Tools CP-SAT integer programming.
          </p>

          <div className="pt-4 flex flex-wrap gap-3 items-center">
            <Link
              to="/dashboard"
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-lg bg-railway-blue hover:bg-blue-600 text-white font-bold text-sm shadow-md hover:shadow-lg transition"
            >
              <span>Open Planning Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={handleLoadDemoData}
              disabled={loading}
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-semibold text-sm transition"
            >
              <Database className="w-4 h-4 text-emerald-400" />
              <span>{loading ? "Loading Dataset..." : "Load Demo Dataset"}</span>
            </button>
          </div>

          {syncStatus && (
            <div className="mt-3 text-xs text-emerald-300 font-mono bg-emerald-950/60 px-3 py-1.5 rounded border border-emerald-500/30 inline-block">
              {syncStatus}
            </div>
          )}

          {/* Mandatory Demo Disclosure */}
          <div className="pt-6 border-t border-slate-700/80 flex items-center space-x-2 text-xs text-slate-400">
            <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              Demo Prototype | Uses Synthetic Railway Data | Not Connected to Live Railway Systems | Non-Autonomous Decision Support
            </span>
          </div>
        </div>
      </div>

      {/* Three Main Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-3">
          <div className="w-12 h-12 rounded-lg bg-blue-50 text-railway-blue flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">1. Unified Maintenance Requests</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Consolidate fragmented demands from BDMS, TMS (Civil Track), SMMS (Signals), and TDMS (OHE Traction) into a single canonical workspace with transparent rule-based priority scoring.
          </p>
          <div className="pt-2">
            <Link to="/requests" className="text-xs font-bold text-railway-blue hover:underline inline-flex items-center space-x-1">
              <span>Inspect Requisitions Table</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-3">
          <div className="w-12 h-12 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">2. Constraint-Based Scheduling</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Google OR-Tools CP-SAT mathematically verifies timetable paths (COA), track machine availability, gang double-booking, and multi-department joint maintenance bundling.
          </p>
          <div className="pt-2">
            <Link to="/optimizer" className="text-xs font-bold text-purple-700 hover:underline inline-flex items-center space-x-1">
              <span>View Optimization Engine</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-3">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">3. Explainable Human Approval</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Zero black-box AI. Every schedule, deferral, and bundle has transparent rule-based justifications, retaining full human-in-the-loop operational control for authorized railway officers.
          </p>
          <div className="pt-2">
            <Link to="/approval" className="text-xs font-bold text-emerald-700 hover:underline inline-flex items-center space-x-1">
              <span>Explore Approval Workflow</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Simulated Railway Corridor Specs */}
      <div className="bg-slate-100/80 rounded-xl p-6 border border-slate-200 text-xs space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-slate-800 uppercase tracking-wide flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-slate-600" />
            <span>Simulated Railway Operational Corridor Specifications</span>
          </h4>
          <span className="font-mono text-slate-500">Seed: Deterministic 2026 Demo</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 text-slate-700">
          <div>
            <span className="text-slate-400 block">Corridor Name:</span>
            <strong className="text-slate-900">Mainline Corridor Alpha</strong>
          </div>
          <div>
            <span className="text-slate-400 block">Sections:</span>
            <strong className="text-slate-900">Section A-B, B-C, C-D</strong>
          </div>
          <div>
            <span className="text-slate-400 block">Line Types:</span>
            <strong className="text-slate-900">Double Track (UP & DOWN)</strong>
          </div>
          <div>
            <span className="text-slate-400 block">Participating Depts:</span>
            <strong className="text-slate-900">Engineering, S&T, Traction</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
