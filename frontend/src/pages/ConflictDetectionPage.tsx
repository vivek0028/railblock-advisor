import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  RefreshCw,
  Clock,
  Wrench,
  MapPin,
  GitBranch,
  Timer,
  CheckCircle2,
  Train,
  ArrowRight
} from "lucide-react";
import { api } from "../services/api";
import { ConflictItem } from "../types";

export const ConflictDetectionPage: React.FC = () => {
  const navigate = useNavigate();
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [notification, setNotification] = useState<string | null>(null);

  const loadConflicts = async () => {
    setLoading(true);
    try {
      const data = await api.getConflicts();
      setConflicts(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConflicts();
  }, []);

  const handleRunDetection = async () => {
    setIsDetecting(true);
    try {
      const res = await api.detectConflicts();
      setConflicts(res.conflicts);
      setNotification(`Conflict detection completed: ${res.total_conflicts_detected} conflicts verified across corridor.`);
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      alert(`Detection failed: ${err.message}`);
    } finally {
      setIsDetecting(false);
    }
  };

  const getConflictIcon = (type: string) => {
    switch (type) {
      case "Timetable":
        return <Train className="w-5 h-5 text-rose-600" />;
      case "Resource":
        return <Wrench className="w-5 h-5 text-amber-600" />;
      case "Location":
        return <MapPin className="w-5 h-5 text-purple-600" />;
      case "Dependency":
        return <GitBranch className="w-5 h-5 text-blue-600" />;
      case "Duration":
        return <Timer className="w-5 h-5 text-rose-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-slate-600" />;
    }
  };

  const getSeverityBadge = (sev: string) => {
    const styles: Record<string, string> = {
      Critical: "bg-rose-100 text-rose-800 border-rose-300",
      Warning: "bg-amber-100 text-amber-800 border-amber-300",
      Attention: "bg-yellow-100 text-yellow-800 border-yellow-300",
      Resolved: "bg-emerald-100 text-emerald-800 border-emerald-300",
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[sev] || "bg-slate-100 text-slate-700"}`}>
        {sev}
      </span>
    );
  };

  const filteredConflicts = conflicts.filter((c) => {
    const matchesSev = severityFilter === "ALL" || c.severity === severityFilter;
    const matchesType = typeFilter === "ALL" || c.conflict_type === typeFilter;
    return matchesSev && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header and Trigger Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Conflict Detection Engine</h1>
            <span className="bg-slate-200 text-slate-700 text-xs font-bold px-2 py-0.5 rounded uppercase">
              5 Dimensions
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automated verification across Train Timetables, Resources, Locations, Dependencies, and Block Durations
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleRunDetection}
            disabled={isDetecting}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isDetecting ? "animate-spin" : ""}`} />
            <span>{isDetecting ? "Scanning Corridors..." : "Re-Detect Conflicts"}</span>
          </button>
          <button
            onClick={() => navigate("/optimization")}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-railway-blue hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition"
          >
            <span>Optimise (Plan A/B/C)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {notification && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs px-4 py-2.5 rounded-md font-medium flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          <span className="font-semibold text-slate-700">Filter Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="border border-slate-200 rounded p-1.5 bg-white font-medium"
          >
            <option value="ALL">All Severities</option>
            <option value="Critical">Critical (Red)</option>
            <option value="Warning">Warning (Orange)</option>
            <option value="Attention">Attention (Yellow)</option>
          </select>

          <span className="font-semibold text-slate-700 ml-4">Filter Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-slate-200 rounded p-1.5 bg-white font-medium"
          >
            <option value="ALL">All Types</option>
            <option value="Timetable">Timetable (Train Paths)</option>
            <option value="Resource">Resource (Machine/Crew)</option>
            <option value="Location">Location (Section Occupancy)</option>
            <option value="Dependency">Dependency (Ordering)</option>
            <option value="Duration">Duration (Capacity)</option>
          </select>
        </div>

        <span className="font-mono text-slate-500 font-semibold">
          Showing {filteredConflicts.length} / {conflicts.length} Conflicts
        </span>
      </div>

      {/* Conflict Cards List */}
      <div className="space-y-4">
        {filteredConflicts.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center text-slate-500 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">No Active Operational Conflicts</h3>
            <p className="text-xs">No clashes found matching your active filter criteria.</p>
          </div>
        ) : (
          filteredConflicts.map((c) => (
            <div
              key={c.conflict_id}
              className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 hover:shadow-md transition space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    {getConflictIcon(c.conflict_type)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-xs text-slate-900">{c.conflict_id}</span>
                      <span className="text-slate-300">|</span>
                      <span className="font-bold text-slate-800 text-sm">{c.conflict_type} Conflict</span>
                    </div>
                    <span className="text-xs text-slate-500">Affecting Corridor Operations</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {getSeverityBadge(c.severity)}
                  <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded font-mono font-medium">
                    Status: {c.status}
                  </span>
                </div>
              </div>

              {/* Technical Explanation */}
              <div className="text-xs text-slate-800 space-y-1">
                <div className="font-semibold text-slate-500 uppercase text-[11px] tracking-wider">Operational Clash Rationale:</div>
                <p className="bg-slate-50 p-3 rounded-md border border-slate-100 leading-relaxed font-sans">
                  {c.explanation}
                </p>
              </div>

              {/* Affected Tasks and Trains */}
              <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                {c.affected_tasks && c.affected_tasks.length > 0 && (
                  <div className="flex items-center space-x-1.5">
                    <span className="text-slate-500 font-semibold">Affected Tasks:</span>
                    <div className="flex flex-wrap gap-1">
                      {c.affected_tasks.map((tid) => (
                        <span key={tid} className="px-2 py-0.5 bg-blue-50 text-blue-700 font-mono font-bold rounded border border-blue-200">
                          {tid}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {c.affected_trains && c.affected_trains.length > 0 && (
                  <div className="flex items-center space-x-1.5">
                    <span className="text-slate-500 font-semibold">Affected Trains:</span>
                    <div className="flex flex-wrap gap-1">
                      {c.affected_trains.map((trNo) => (
                        <span key={trNo} className="px-2 py-0.5 bg-rose-50 text-rose-700 font-mono font-bold rounded border border-rose-200">
                          Train #{trNo}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actionable Suggested Resolution */}
              <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-md text-xs space-y-1">
                <div className="font-bold text-amber-900 flex items-center space-x-1.5">
                  <Wrench className="w-3.5 h-3.5 text-amber-700" />
                  <span>Suggested Operational Resolution:</span>
                </div>
                <p className="text-amber-950 leading-relaxed">
                  {c.suggested_resolution}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
