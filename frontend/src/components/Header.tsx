import React, { useState } from "react";
import { Train, ShieldAlert, Database, RefreshCw, UserCheck } from "lucide-react";
import { api } from "../services/api";

interface HeaderProps {
  onDataRefresh?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onDataRefresh }) => {
  const [role, setRole] = useState("Planner");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const handleSyncDemo = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      await api.importDemoTasks();
      setSyncMessage("Demo data synchronized successfully!");
      if (onDataRefresh) onDataRefresh();
      setTimeout(() => setSyncMessage(null), 3000);
    } catch (err: any) {
      setSyncMessage(`Sync failed: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <header className="bg-railway-dark text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      {/* Top GovTech Disclaimer Ribbon */}
      <div className="bg-amber-600 text-amber-50 px-4 py-1 text-xs font-semibold flex items-center justify-between tracking-wide">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            SIH 2026 PS 26027 PROTOTYPE | <strong>DEMO DATA ONLY</strong> | NOT CONNECTED TO LIVE INDIAN RAILWAYS INTERNAL SYSTEMS
          </span>
        </div>
        <span className="hidden sm:inline bg-amber-700 text-amber-100 px-2 py-0.5 rounded text-[11px]">
          Decision-Support Only (Non-Autonomous)
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Emblem */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-railway-blue flex items-center justify-center text-white shadow-inner">
              <Train className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-wider text-white">RAILBLOCK ADVISOR</span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  CP-SAT READY
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                AI-Assisted Maintenance Block Planning for Indian Railways
              </p>
            </div>
          </div>

          {/* Controls & Role Selector */}
          <div className="flex items-center space-x-4">
            {/* Quick Demo Sync Button */}
            <button
              onClick={handleSyncDemo}
              disabled={isSyncing}
              className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition"
              title="Reset and reload synthetic railway dataset"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-railway-blue" : ""}`} />
              <span>{isSyncing ? "Syncing..." : "Reload Demo Data"}</span>
            </button>

            {/* Corridor Selector */}
            <div className="hidden lg:flex items-center space-x-1.5 bg-slate-800/80 px-3 py-1.5 rounded-md border border-slate-700 text-xs">
              <Database className="w-3.5 h-3.5 text-railway-blue" />
              <span className="text-slate-400">Corridor:</span>
              <span className="font-semibold text-slate-200">Mainline Alpha (Sec A-D)</span>
            </div>

            {/* Role Switcher */}
            <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1.5 rounded-md border border-slate-700 text-xs">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">Role:</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
              >
                <option value="Planner" className="bg-slate-900 text-white">Planner (Division)</option>
                <option value="Reviewer" className="bg-slate-900 text-white">Reviewer (Sr. DOM)</option>
                <option value="Administrator" className="bg-slate-900 text-white">Administrator (HQ)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {syncMessage && (
        <div className="bg-emerald-700 text-white text-xs px-4 py-1 text-center font-medium animate-fadeIn">
          {syncMessage}
        </div>
      )}
    </header>
  );
};
