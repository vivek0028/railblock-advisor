import React from "react";

export const DepartmentBadge: React.FC<{ department: string }> = ({ department }) => {
  const styles: Record<string, string> = {
    Engineering: "bg-blue-100 text-blue-800 border-blue-200",
    "S&T": "bg-purple-100 text-purple-800 border-purple-200",
    Traction: "bg-amber-100 text-amber-800 border-amber-200",
  };
  const cls = styles[department] || "bg-slate-100 text-slate-700 border-slate-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${cls}`}>
      {department}
    </span>
  );
};

export const PriorityBadge: React.FC<{ criticality: string; score?: number }> = ({ criticality, score }) => {
  const styles: Record<string, string> = {
    Critical: "bg-rose-100 text-rose-800 border-rose-200",
    High: "bg-orange-100 text-orange-800 border-orange-200",
    Medium: "bg-amber-100 text-amber-800 border-amber-200",
    Low: "bg-slate-100 text-slate-700 border-slate-200",
  };
  const cls = styles[criticality] || "bg-slate-100 text-slate-700 border-slate-200";
  return (
    <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-bold border ${cls}`}>
      <span>{criticality}</span>
      {score !== undefined && <span className="text-[11px] font-mono opacity-80">({score.toFixed(0)})</span>}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    Scheduled: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Pending: "bg-slate-100 text-slate-700 border-slate-200",
    Deferred: "bg-amber-100 text-amber-800 border-amber-200",
    In_Progress: "bg-sky-100 text-sky-800 border-sky-200",
    Rejected: "bg-red-100 text-red-800 border-red-200",
    Completed: "bg-teal-100 text-teal-800 border-teal-200",
  };
  const cls = styles[status] || "bg-slate-100 text-slate-700 border-slate-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${cls}`}>
      {status}
    </span>
  );
};
