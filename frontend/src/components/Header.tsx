import React from "react";
import { Link } from "react-router-dom";
import { Train, Menu } from "lucide-react";
import { usePlanning } from "../context/PlanningContext";

export const Header: React.FC = () => {
  const { syncNotice, sidebarOpen, toggleSidebar } = usePlanning();

  return (
    <header className="bg-[#0B192C] text-white border-b border-slate-800/80 sticky top-0 z-30 shadow-md select-none">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 sm:h-20">
          <div className="flex items-center space-x-3.5 sm:space-x-4">
            {/* Slide-over Navigation Drawer Button */}
            <button
              onClick={toggleSidebar}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer shadow-xs active:scale-95 group ${
                sidebarOpen
                  ? "bg-blue-600 text-white border border-blue-400/60 shadow-blue-900/40 ring-2 ring-blue-500/30"
                  : "bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/80 hover:text-white"
              }`}
              title={sidebarOpen ? "Close Decision Pipeline Drawer (Esc)" : "Open Decision Pipeline Drawer"}
              aria-label="Toggle Navigation Pipeline Drawer"
            >
              <Menu className="w-4.5 h-4.5 text-blue-400 group-hover:text-white transition" />
              <span className="font-semibold tracking-wide">Menu</span>
            </button>

            {/* Brand & Indian Railways Emblem */}
            <Link to="/" className="flex items-center space-x-3 sm:space-x-3.5 group transition">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0056B3] to-[#0A3161] flex items-center justify-center text-white shadow-sm font-black border border-blue-400/30 group-hover:border-blue-400/60 transition">
                <Train className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2.5">
                  <span className="font-black text-lg sm:text-xl tracking-wider text-white">RAILOPTIBLOCK</span>
                  <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-md font-mono">
                    OR-TOOLS CP-SAT
                  </span>
                </div>
                <p className="text-xs sm:text-[13px] text-slate-300 font-medium tracking-normal mt-0.5">
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
