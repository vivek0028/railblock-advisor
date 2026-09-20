import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Train, Menu, Shield, Wrench, Radio, Zap, Eye, ChevronDown, Check } from "lucide-react";
import { usePlanning, DepartmentRole, ROLE_CONFIGS } from "../context/PlanningContext";

export const Header: React.FC = () => {
  const { syncNotice, sidebarOpen, toggleSidebar, departmentRole, setDepartmentRole, activeRoleDetail } = usePlanning();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setRoleDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getRoleIcon = (id: DepartmentRole) => {
    switch (id) {
      case "UNIFIED":
        return <Eye className="w-3.5 h-3.5 text-blue-400" />;
      case "OPERATING":
        return <Shield className="w-3.5 h-3.5 text-rose-400" />;
      case "ENGINEERING":
        return <Wrench className="w-3.5 h-3.5 text-sky-400" />;
      case "ST":
        return <Radio className="w-3.5 h-3.5 text-purple-400" />;
      case "TRACTION":
        return <Zap className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  return (
    <header className="bg-[#0B192C] text-white border-b border-slate-800/80 sticky top-0 z-30 shadow-md select-none">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-5">
        <div className="flex items-center justify-between h-13 sm:h-14">
          <div className="flex items-center space-x-3">
            {/* Slide-over Navigation Drawer Button */}
            <button
              onClick={toggleSidebar}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer shadow-xs active:scale-95 group ${
                sidebarOpen
                  ? "bg-blue-600 text-white border border-blue-400/60 shadow-blue-900/40 ring-2 ring-blue-500/30"
                  : "bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/80 hover:text-white"
              }`}
              title={sidebarOpen ? "Close Decision Pipeline Drawer (Esc)" : "Open Decision Pipeline Drawer"}
              aria-label="Toggle Navigation Pipeline Drawer"
            >
              <Menu className="w-4 h-4 text-blue-400 group-hover:text-white transition" />
              <span className="font-semibold tracking-wide text-xs">Menu</span>
            </button>

            {/* Brand & Indian Railways Emblem */}
            <Link to="/" className="flex items-center space-x-2.5 group transition">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0056B3] to-[#0A3161] flex items-center justify-center text-white shadow-xs font-black border border-blue-400/30 group-hover:border-blue-400/60 transition">
                <Train className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-black text-base sm:text-lg tracking-wider text-white">RAILOPTIBLOCK</span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-300 font-medium tracking-normal -mt-0.5 leading-tight">
                  AI-Assisted Maintenance Block Planning
                </p>
              </div>
            </Link>
          </div>

          {/* Right Side: Role / Department Perspective Selector */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setRoleDropdownOpen((prev) => !prev)}
              className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 transition cursor-pointer text-xs shadow-xs"
              title="Click to switch Departmental Role Perspective"
            >
              <div className="flex items-center space-x-1.5">
                {getRoleIcon(departmentRole)}
                <div className="text-left hidden sm:block">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-slate-100 text-xs leading-none">
                      {activeRoleDetail.shortTitle}
                    </span>
                    <span className={`text-[9px] font-mono px-1 py-0.2 rounded border font-semibold ${activeRoleDetail.badgeBg} ${activeRoleDetail.badgeText} ${activeRoleDetail.badgeBorder}`}>
                      {departmentRole}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block leading-tight mt-0.5">
                    {activeRoleDetail.designation}
                  </span>
                </div>
                {/* Mobile title */}
                <span className="font-bold text-slate-100 text-xs sm:hidden">
                  {activeRoleDetail.shortTitle}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${roleDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu */}
            {roleDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-76 sm:w-84 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 animate-fadeIn">
                <div className="px-2.5 py-1.5 pb-2 border-b border-slate-800">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                    Departmental Perspective
                  </span>
                  <p className="text-[11px] text-slate-300 leading-tight mt-0.5">
                    Switch operational view to tailor priorities, requisitions, and safety constraints.
                  </p>
                </div>

                <div className="py-1 space-y-1">
                  {(Object.keys(ROLE_CONFIGS) as DepartmentRole[]).map((key) => {
                    const cfg = ROLE_CONFIGS[key];
                    const isCurrent = departmentRole === key;
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          setDepartmentRole(key);
                          setRoleDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-lg transition flex items-start justify-between cursor-pointer ${
                          isCurrent
                            ? "bg-slate-800 border border-slate-700 text-white"
                            : "hover:bg-slate-800/60 text-slate-300 hover:text-white"
                        }`}
                      >
                        <div className="flex items-start space-x-2.5">
                          <div className="mt-0.5">{getRoleIcon(key)}</div>
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="text-xs font-bold">{cfg.title}</span>
                              <span className={`text-[9px] font-mono px-1 py-0.2 rounded border font-semibold ${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeBorder}`}>
                                {cfg.designation}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                              {cfg.focusMetrics}
                            </p>
                          </div>
                        </div>
                        {isCurrent && (
                          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5 ml-2" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {syncNotice && (
        <div className="bg-emerald-700 text-white text-xs py-1 px-4 text-center font-semibold tracking-wide border-t border-emerald-600 animate-fadeIn">
          {syncNotice}
        </div>
      )}
    </header>
  );
};
