import React, { useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  AlertTriangle,
  Cpu,
  HelpCircle,
  CheckSquare,
  History,
  Sliders,
  CalendarDays,
  Database,
  Settings,
  UserCheck,
  X,
  Train
} from "lucide-react";
import { usePlanning } from "../context/PlanningContext";

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  step?: number;
}

const PRIMARY_NAV_ITEMS: NavItem[] = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, step: 1 },
  { name: "Maintenance Requests", path: "/requests", icon: ClipboardList, badge: "BDMS", step: 2 },
  { name: "Conflict Detection", path: "/conflicts", icon: AlertTriangle, step: 3 },
  { name: "Optimized Block Plans", path: "/optimizer", icon: Cpu, badge: "CP-SAT", step: 4 },
  { name: "Explainability", path: "/explainability", icon: HelpCircle, step: 5 },
  { name: "Approval", path: "/approval", icon: CheckSquare, step: 6 },
  { name: "Audit History", path: "/audit", icon: History, step: 7 },
];

const SECONDARY_NAV_ITEMS: NavItem[] = [
  { name: "What-If Simulation", path: "/simulation", icon: Sliders },
  { name: "Block Workspace", path: "/workspace", icon: CalendarDays },
  { name: "Data Adapters (BDMS/TMS)", path: "/data-sources", icon: Database },
  { name: "Solver Settings", path: "/settings", icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { role, setRole, sidebarOpen, setSidebarOpen } = usePlanning();

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setSidebarOpen]);

  return (
    <>
      {/* Dimmed Backdrop Overlay */}
      <div
        onClick={() => setSidebarOpen(false)}
        className={`fixed inset-0 bg-slate-950/50 backdrop-blur-[2px] z-40 transition-opacity duration-300 ${
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-80 max-w-[88vw] bg-white z-50 shadow-2xl flex flex-col justify-between transform transition-transform duration-300 ease-out border-r border-slate-200 select-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Decision Pipeline Drawer"
      >
        {/* Drawer Top Header */}
        <div className="px-4 py-3.5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0056B3] to-[#0A3161] flex items-center justify-center text-white shadow-xs">
              <Train className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-xs font-black tracking-wider text-slate-900 uppercase">
                Decision Pipeline
              </div>
              <p className="text-[10px] text-slate-500 font-medium">RailOptiBlock Operations System</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition cursor-pointer"
            title="Close Menu (Esc)"
            aria-label="Close Menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Workflow Navigation Links */}
        <div className="py-3 px-3 space-y-1 overflow-y-auto flex-1">
          <div className="px-3 pb-2 pt-1 text-[10px] font-black tracking-wider text-slate-400 uppercase">
            Operational Steps
          </div>

          {PRIMARY_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 group ${
                    isActive
                      ? "bg-gradient-to-r from-[#0056B3] to-[#0A417C] text-white shadow-xs"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center space-x-2.5">
                      <span
                        className={`w-4.5 h-4.5 rounded-md text-[10px] font-mono flex items-center justify-center font-black ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                        }`}
                      >
                        {item.step}
                      </span>
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-white" : "text-slate-500 group-hover:text-slate-800"}`} />
                      <span className="truncate">{item.name}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md font-mono ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}

          {/* Secondary Operations Tools */}
          <div className="pt-4 px-3 pb-1.5 text-[10px] font-black tracking-wider text-slate-400 uppercase">
            Secondary Modules
          </div>
          {SECONDARY_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? "bg-slate-800 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                <span className="truncate">{item.name}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Bottom of Drawer: System Status & Role Selector */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/80 space-y-2.5 flex-shrink-0">
          {/* System Status */}
          <div className="flex items-center justify-between px-1 text-xs">
            <span className="text-[11px] font-bold text-slate-500">System Status</span>
            <div className="flex items-center space-x-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Operational</span>
            </div>
          </div>

          {/* Active Role Selector */}
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              <UserCheck className="w-3 h-3 text-railway-blue" />
              <span>Active Planner Role</span>
            </div>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full text-xs font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer border-none p-0"
            >
              <option value="Railway Planner (Division)">Railway Planner (Division)</option>
              <option value="Senior DOM (Sr. Divisional Operations Mgr)">Senior DOM (Sr. Divisional Operations Mgr)</option>
              <option value="Chief Section Controller">Chief Section Controller</option>
              <option value="HQ Block Reviewer">HQ Block Reviewer</option>
            </select>
          </div>

          <div className="text-[10px] text-slate-400 text-center font-mono">
            PROTOTYPE &bull; DEMO DATA
          </div>
        </div>
      </aside>
    </>
  );
};
