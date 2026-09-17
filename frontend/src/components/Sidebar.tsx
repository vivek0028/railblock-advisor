import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  CalendarDays,
  AlertTriangle,
  Cpu,
  Sliders,
  CheckSquare,
  Server,
  Settings,
  Home,
  ShieldCheck
} from "lucide-react";

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { name: "Overview Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Maintenance Requests", path: "/requests", icon: ClipboardList, badge: "BDMS" },
  { name: "Block Planning Workspace", path: "/workspace", icon: CalendarDays },
  { name: "Conflict Detection", path: "/conflicts", icon: AlertTriangle },
  { name: "Optimisation Results", path: "/optimizer", icon: Cpu, badge: "CP-SAT" },
  { name: "What-If Simulation", path: "/simulation", icon: Sliders },
  { name: "Approval & Audit", path: "/approval", icon: CheckSquare },
  { name: "Data Sources / BDMS", path: "/data-sources", icon: Server },
  { name: "Settings & Weights", path: "/settings", icon: Settings },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between h-[calc(100vh-6rem)] sticky top-24 shadow-sm">
      {/* Navigation Links */}
      <div className="py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          Planning Modules
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-railway-blue text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
            >
              <div className="flex items-center space-x-2.5">
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-200/60 text-slate-700 group-hover:bg-white">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}

        <div className="pt-4 px-3 pb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          Portal
        </div>
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
              isActive
                ? "bg-slate-800 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`
          }
        >
          <Home className="w-4 h-4" />
          <span>Landing / Portal Home</span>
        </NavLink>
      </div>

      {/* System Status Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50">
        <div className="flex items-center space-x-2 text-xs">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
          <div>
            <div className="font-semibold text-slate-800">Backend Connected</div>
            <div className="text-[11px] text-slate-500 flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600 inline" />
              <span>OR-Tools Engine Active</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
