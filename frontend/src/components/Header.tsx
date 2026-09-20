import React from "react";
import { Link } from "react-router-dom";
import { Train, Menu } from "lucide-react";
import { usePlanning } from "../context/PlanningContext";

export const Header: React.FC = () => {
  const { syncNotice, sidebarOpen, toggleSidebar } = usePlanning();

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
                  <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold px-1.5 py-0.2 rounded font-mono">
                    OR-TOOLS CP-SAT
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-300 font-medium tracking-normal -mt-0.5 leading-tight">
                  AI-Assisted Maintenance Block Planning &bull; Indian Railways
                </p>
              </div>
            </Link>
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
