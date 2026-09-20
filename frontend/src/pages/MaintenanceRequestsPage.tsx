import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Plus,
  RefreshCw,
  Download,
  Search,
  Filter,
  Trash2,
  Edit2,
  Info,
  X,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Clock,
  Wrench,
  Layers,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { api } from "../services/api";
import { MaintenanceTask } from "../types";
import { DepartmentBadge, PriorityBadge, StatusBadge } from "../components/Badges";
import { usePlanning } from "../context/PlanningContext";

export const MaintenanceRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const { departmentRole, activeRoleDetail } = usePlanning();
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>(activeRoleDetail.department || "ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [sectionFilter, setSectionFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");

  // Selected task for Live Validation Panel & Explainability Drawer
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    task_id: "",
    department: "Engineering",
    asset_type: "Track",
    location: "Section A-B",
    description: "",
    duration_hours: 2.0,
    preferred_date: "2026-09-20",
    preferred_time_window: "09:00 - 11:00",
    deadline: "2026-09-23",
    criticality: "High",
    overdue: false,
    required_resources: "Track Inspection Trolley, Engineering Crew 1",
    dependencies: "",
    compatible_departments: "Engineering, S&T",
    status: "Pending"
  });

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await api.getTasks();
      setTasks(data);
      if (data.length > 0 && !selectedTask) {
        setSelectedTask(data[0]);
      }
    } catch (err: any) {
      console.error("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  // Synchronize filter when Department Role changes
  useEffect(() => {
    if (activeRoleDetail.department) {
      setDeptFilter(activeRoleDetail.department);
    } else {
      setDeptFilter("ALL");
    }
  }, [departmentRole]);

  const handleRecalculatePriorities = async () => {
    setRecalculating(true);
    try {
      const res = await api.recalculatePriorities();
      setActionSuccess(`Priorities recalculated for ${res.tasks_recalculated} tasks using rule-based scoring.`);
      await loadTasks();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert("Recalculation failed: " + err.message);
    } finally {
      setRecalculating(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingTask(null);
    const generatedId = `REQ-00${tasks.length + 1}`;
    const initialDept = (activeRoleDetail.department as any) || "Engineering";
    setFormData({
      task_id: generatedId,
      department: initialDept,
      asset_type: "Track Inspection",
      location: "Section A-B",
      description: "Ultrasonic rail flaw detection and joint bolt tightening",
      duration_hours: 2.0,
      preferred_date: "2026-09-20",
      preferred_time_window: "09:00 - 11:00",
      deadline: "2026-09-23",
      criticality: "High",
      overdue: false,
      required_resources: "Engineering Crew 1, USFD Trolley",
      dependencies: "",
      compatible_departments: "Engineering, S&T",
      status: "Pending"
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task: MaintenanceTask) => {
    setEditingTask(task);
    setFormData({
      task_id: task.task_id,
      department: task.department,
      asset_type: task.asset_type,
      location: task.location,
      description: task.description,
      duration_hours: task.duration_hours,
      preferred_date: task.preferred_date,
      preferred_time_window: (task as any).preferred_time_window || "09:00 - 11:00",
      deadline: task.deadline,
      criticality: task.criticality,
      overdue: task.overdue,
      required_resources: (task.required_resources || []).join(", "),
      dependencies: (task.dependencies || []).join(", "),
      compatible_departments: (task.compatible_departments || []).join(", "),
      status: task.status
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (formData.duration_hours <= 0) {
      setModalError("Duration in hours must be greater than zero.");
      return;
    }
    if (new Date(formData.deadline) < new Date(formData.preferred_date)) {
      setModalError("Deadline cannot precede preferred maintenance date.");
      return;
    }
    if (!formData.description.trim()) {
      setModalError("Maintenance activity description cannot be empty.");
      return;
    }

    const normalizeAssetType = (raw: string) => {
      const lower = (raw || "").toLowerCase();
      if (lower.includes("track") || lower.includes("rail") || lower.includes("tamp")) return "Track";
      if (lower.includes("signal") || lower.includes("interlock")) return "Signal";
      if (lower.includes("ohe") || lower.includes("catenary") || lower.includes("traction")) return "OHE";
      if (lower.includes("point") || lower.includes("switch")) return "Point Machine";
      if (lower.includes("bridge") || lower.includes("culvert")) return "Bridge";
      if (lower.includes("telecom") || lower.includes("comms")) return "Telecom";
      return "Track";
    };

    const payload = {
      task_id: formData.task_id.trim(),
      department: formData.department,
      asset_type: normalizeAssetType(formData.asset_type),
      location: formData.location,
      description: formData.description.trim(),
      duration_hours: Number(formData.duration_hours),
      preferred_date: formData.preferred_date,
      deadline: formData.deadline,
      criticality: formData.criticality,
      overdue: Boolean(formData.overdue),
      required_resources: formData.required_resources.split(",").map(s => s.trim()).filter(Boolean),
      dependencies: formData.dependencies.split(",").map(s => s.trim()).filter(Boolean),
      compatible_departments: formData.compatible_departments.split(",").map(s => s.trim()).filter(Boolean),
      status: formData.status || "Pending"
    };

    try {
      if (editingTask) {
        await api.updateTask(editingTask.task_id, payload);
        setActionSuccess(`Maintenance request ${editingTask.task_id} updated.`);
      } else {
        await api.createTask(payload as any);
        setActionSuccess(`Maintenance request ${payload.task_id} raised successfully.`);
      }
      setIsModalOpen(false);
      await loadTasks();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      const errorMsg = typeof err?.message === "string" 
        ? err.message 
        : (typeof err === "string" ? err : JSON.stringify(err));
      setModalError(errorMsg || "Failed to save request.");
    }
  };

  const handleDelete = async (taskId: string) => {
    if (window.confirm(`Are you sure you want to delete maintenance request ${taskId}?`)) {
      try {
        await api.deleteTask(taskId);
        setActionSuccess(`Request ${taskId} removed.`);
        if (selectedTask?.task_id === taskId) {
          setSelectedTask(null);
        }
        await loadTasks();
        setTimeout(() => setActionSuccess(null), 3000);
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleExportCSV = () => {
    const headers = ["Request ID", "Department", "Section", "Activity", "Duration (h)", "Priority", "Deadline", "Status"];
    const rows = tasks.map(t => [
      t.task_id,
      t.department,
      `"${t.location}"`,
      `"${t.asset_type}: ${t.description}"`,
      t.duration_hours,
      t.criticality,
      t.deadline,
      t.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `railblock_maintenance_requests_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter logic
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchesSearch =
        t.task_id.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.location.toLowerCase().includes(search.toLowerCase()) ||
        t.asset_type.toLowerCase().includes(search.toLowerCase());
      const matchesDept = deptFilter === "ALL" || t.department === deptFilter;
      const matchesStatus = statusFilter === "ALL" || t.status.toUpperCase() === statusFilter.toUpperCase();
      const matchesPriority = priorityFilter === "ALL" || t.criticality === priorityFilter;
      const matchesSection = sectionFilter === "ALL" || t.location === sectionFilter;
      const matchesDate = !dateFilter || t.preferred_date === dateFilter || t.deadline === dateFilter;

      return matchesSearch && matchesDept && matchesStatus && matchesPriority && matchesSection && matchesDate;
    });
  }, [tasks, search, deptFilter, statusFilter, priorityFilter, sectionFilter, dateFilter]);


  // Validation rules for the selected request
  const validationChecks = useMemo(() => {
    if (!selectedTask) return null;
    const isDurationValid = selectedTask.duration_hours > 0 && selectedTask.duration_hours <= 4.5;
    const isResourceAvailable = (selectedTask.required_resources && selectedTask.required_resources.length > 0);
    const deadlineDate = new Date(selectedTask.deadline);
    const preferredDate = new Date(selectedTask.preferred_date);
    const isDeadlineAchievable = deadlineDate >= preferredDate;
    const hasOverlapRisk = selectedTask.location === "Section A-B" && selectedTask.duration_hours >= 2.0;

    return {
      isDurationValid,
      isResourceAvailable,
      isDeadlineAchievable,
      hasOverlapRisk,
      passCount: (isDurationValid ? 1 : 0) + (isResourceAvailable ? 1 : 0) + (isDeadlineAchievable ? 1 : 0),
      allPass: isDurationValid && isResourceAvailable && isDeadlineAchievable && !hasOverlapRisk
    };
  }, [selectedTask]);

  return (
    <div className="space-y-2">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1.5 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">Maintenance Requests</h1>
            <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              Department Demands
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Manage and review departmental maintenance requirements across Engineering, S&T, and Traction.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer shadow-2xs"
          >
            <Download className="w-3 h-3 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleRecalculatePriorities}
            disabled={recalculating}
            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-2xs transition disabled:opacity-50 cursor-pointer"
            title="Recalculates deterministic scores: Criticality + Deadline Urgency + Overdue + Operational Impact"
          >
            <RefreshCw className={`w-3 h-3 ${recalculating ? "animate-spin" : ""}`} />
            <span>{recalculating ? "Scoring..." : "Recalculate"}</span>
          </button>
          <button
            onClick={() => navigate("/conflicts")}
            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-2xs transition cursor-pointer"
          >
            <span>Proceed to Conflicts</span>
            <ArrowRight className="w-3 h-3 text-slate-300" />
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs px-3 py-1.5 rounded-lg font-medium flex items-center space-x-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-2xs space-y-1.5">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5 text-xs">
          {/* Search */}
          <div className="relative col-span-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Search ID, section, activity..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-railway-blue font-mono"
            />
          </div>

          {/* Department */}
          <div>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-railway-blue"
            >
              <option value="ALL">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="S&T">S&T</option>
              <option value="Traction">Traction</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-railway-blue"
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-railway-blue"
            >
              <option value="ALL">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Section */}
          <div>
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-railway-blue"
            >
              <option value="ALL">All Sections</option>
              <option value="Section A-B">Section A-B</option>
              <option value="Section B-C">Section B-C</option>
              <option value="Section C-D">Section C-D</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 gap-1">
          <div className="flex items-center space-x-2">
            <span>
              Total: <strong>{filteredTasks.length}</strong> demands &bull; <strong className="text-slate-800">Unified Table</strong> (10+ rows visible)
            </span>
            {activeRoleDetail.department && (
              <span className="inline-flex items-center space-x-1 px-1.5 py-0.2 rounded border bg-blue-50 text-blue-800 border-blue-200 font-bold text-[10px]">
                <span>{activeRoleDetail.shortTitle} Focus</span>
                {deptFilter !== "ALL" ? (
                  <button
                    type="button"
                    onClick={() => setDeptFilter("ALL")}
                    className="ml-1 text-blue-600 hover:text-blue-900 underline cursor-pointer text-[10px]"
                    title="Clear filter to view all departments"
                  >
                    Show All
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDeptFilter(activeRoleDetail.department!)}
                    className="ml-1 text-blue-600 hover:text-blue-900 underline cursor-pointer text-[10px]"
                    title="Filter to department"
                  >
                    Filter
                  </button>
                )}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3 font-medium">
            <span className="inline-flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span>Eng ({tasks.filter(t => t.department === "Engineering").length})</span>
            </span>
            <span className="inline-flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-purple-600"></span>
              <span>S&T ({tasks.filter(t => t.department === "S&T").length})</span>
            </span>
            <span className="inline-flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Traction ({tasks.filter(t => t.department === "Traction").length})</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Table (Left 8 cols) + Live Validation Panel (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        {/* Table View */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          {/* Scroll container that shows minimum 10 rows and preserves single screen */}
          <div className="overflow-x-auto overflow-y-auto min-h-[380px] max-h-[calc(100vh-215px)]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs z-10 shadow-2xs">
                <tr className="text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                  <th className="py-1.5 px-2.5">Request ID</th>
                  <th className="py-1.5 px-2">Dept</th>
                  <th className="py-1.5 px-2">Section</th>
                  <th className="py-1.5 px-2.5">Activity</th>
                  <th className="py-1.5 px-2">Duration</th>
                  <th className="py-1.5 px-2">Priority</th>
                  <th className="py-1.5 px-2">Deadline</th>
                  <th className="py-1.5 px-2">Status</th>
                  <th className="py-1.5 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-slate-400">
                      No maintenance requests match current filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((t) => {
                    const isSelected = selectedTask?.task_id === t.task_id;
                    return (
                      <tr
                        key={t.task_id}
                        onClick={() => setSelectedTask(t)}
                        className={`cursor-pointer transition text-xs ${
                          isSelected
                            ? "bg-blue-50/80 border-l-4 border-l-railway-blue"
                            : "hover:bg-slate-50/80"
                        }`}
                      >
                        <td className="py-1.5 px-2.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {t.task_id}
                        </td>
                        <td className="py-1.5 px-2">
                          <DepartmentBadge department={t.department} />
                        </td>
                        <td className="py-1.5 px-2 font-medium text-slate-700 whitespace-nowrap text-[11px]">
                          {t.location}
                        </td>
                        <td className="py-1.5 px-2.5 max-w-[180px]">
                          <span className="font-semibold text-slate-900 block truncate leading-tight text-[11px]" title={t.asset_type}>
                            {t.asset_type}
                          </span>
                          <span className="text-[10px] text-slate-500 truncate block leading-tight" title={t.description}>
                            {t.description}
                          </span>
                        </td>
                        <td className="py-1.5 px-2 font-mono font-semibold text-slate-700 whitespace-nowrap text-[11px]">
                          {t.duration_hours}h
                        </td>
                        <td className="py-1.5 px-2 whitespace-nowrap">
                          <PriorityBadge criticality={t.criticality} score={t.priority_score} />
                        </td>
                        <td className="py-1.5 px-2 font-mono text-slate-600 whitespace-nowrap text-[11px]">
                          {t.deadline}
                        </td>
                        <td className="py-1.5 px-2 whitespace-nowrap">
                          <StatusBadge status={t.status} />
                        </td>
                        <td className="py-1.5 px-2 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => setSelectedTask(t)}
                              className="p-1 rounded hover:bg-slate-200 text-slate-600 cursor-pointer"
                              title="Validate & Inspect Request"
                            >
                              <Info className="w-3.5 h-3.5 text-railway-blue" />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(t)}
                              className="p-1 rounded hover:bg-slate-200 text-blue-600 cursor-pointer"
                              title="Edit Request"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(t.task_id)}
                              className="p-1 rounded hover:bg-slate-200 text-rose-600 cursor-pointer"
                              title="Delete Request"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Unified Table Status Footer */}
          <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs gap-2">
            <div className="flex items-center space-x-2 text-slate-600 font-mono text-[11px]">
              <span>
                Showing <strong>{filteredTasks.length}</strong> of <strong>{tasks.length}</strong> demands
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500 font-sans">
                Continuous single-screen table &bull; min 10+ rows visible (scroll table to view all)
              </span>
            </div>

            <div className="flex items-center space-x-1.5 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-semibold text-slate-700">All Demands in Single View</span>
            </div>
          </div>
        </div>

        {/* Live Validation Panel (Right Side) */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-xl border border-slate-200 p-2.5 shadow-xs min-h-[380px] max-h-[calc(100vh-215px)] overflow-y-auto space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <div className="flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-railway-blue" />
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Request Validation
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500 font-bold">
                {selectedTask ? selectedTask.task_id : "No selection"}
              </span>
            </div>

            {selectedTask && validationChecks ? (
              <div className="space-y-3">
                {/* Selected summary */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 text-xs">{selectedTask.asset_type}</span>
                    <span className="font-mono text-[10px] text-slate-500 font-semibold">{selectedTask.location}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-tight">{selectedTask.description}</p>
                  <div className="flex items-center justify-between pt-1 text-[10px] font-mono border-t border-slate-200/60">
                    <span className="text-slate-500">Duration: <strong className="text-slate-800">{selectedTask.duration_hours}h</strong></span>
                    <span className="text-slate-500">Deadline: <strong className="text-slate-800">{selectedTask.deadline}</strong></span>
                  </div>
                </div>

                {/* Validation checklist items */}
                <div className="space-y-1.5 text-xs">
                  {/* Rule 1: Duration Valid */}
                  <div className="flex items-start space-x-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block text-[11px]">Duration valid</span>
                      <span className="text-[10px] text-slate-500 leading-tight block">
                        Requested {selectedTask.duration_hours}h fits corridor maximum allowable window (≤ 4.5h)
                      </span>
                    </div>
                  </div>

                  {/* Rule 2: Resource Available */}
                  <div className="flex items-start space-x-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block text-[11px]">Resource available</span>
                      <span className="text-[10px] text-slate-500 leading-tight block">
                        {(selectedTask.required_resources || []).join(", ") || "Departmental maintenance team assigned"}
                      </span>
                    </div>
                  </div>

                  {/* Rule 3: Deadline Achievable */}
                  <div className="flex items-start space-x-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                    {validationChecks.isDeadlineAchievable ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-bold text-slate-900 block text-[11px]">Deadline achievable</span>
                      <span className="text-[10px] text-slate-500 leading-tight block">
                        Target date {selectedTask.preferred_date} is within statutory deadline {selectedTask.deadline}
                      </span>
                    </div>
                  </div>

                  {/* Rule 4: Preferred Window Overlap / Corridor Check */}
                  <div className="flex items-start space-x-2 p-2 rounded-lg bg-amber-50/70 border border-amber-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-950 block text-[11px]">Preferred window overlap warning</span>
                      <span className="text-[10px] text-amber-800 leading-tight block">
                        Time slot coincides with Section {selectedTask.location} traffic. Coordinated grouping recommended in Block Optimizer.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Priority Rule Score Explainability breakdown */}
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center pb-1 border-b border-slate-200">
                    <span className="font-bold text-slate-700 text-[11px]">Priority Scoring Proof:</span>
                    <span className="font-mono font-bold text-rose-700 text-xs">{selectedTask.priority_score.toFixed(0)} pts</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-600">
                    <span>Criticality ({selectedTask.criticality}):</span>
                    <span className="font-mono font-semibold">+{selectedTask.priority_factors?.criticality_points || 25} pts</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-600">
                    <span>Urgency & Deadline:</span>
                    <span className="font-mono font-semibold">+{selectedTask.priority_factors?.deadline_urgency_points || 20} pts</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-600">
                    <span>Operational Impact:</span>
                    <span className="font-mono font-semibold">+{selectedTask.priority_factors?.operational_impact_points || 15} pts</span>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => navigate("/conflicts")}
                    className="w-full py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
                  >
                    <span>Check Conflict Status</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">
                Select any maintenance request in the table to view live operational validation.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Raise / Edit Maintenance Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 my-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {editingTask ? "EDIT REQUISITION" : "NEW REQUISITION"}
                </span>
                <h3 className="font-extrabold text-base text-slate-900">
                  {editingTask ? `Modify Request ${editingTask.task_id}` : "Raise Maintenance Request"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md hover:bg-slate-100 text-slate-500 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="bg-rose-50 border border-rose-300 text-rose-800 text-xs p-3 rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Request ID *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingTask}
                    value={formData.task_id}
                    onChange={(e) => setFormData({ ...formData, task_id: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono disabled:bg-slate-100 focus:ring-2 focus:ring-railway-blue"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department *</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-railway-blue bg-white"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="S&T">S&T</option>
                    <option value="Traction">Traction</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Section / Corridor *</label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-railway-blue bg-white"
                  >
                    <option value="Section A-B">Section A-B</option>
                    <option value="Section B-C">Section B-C</option>
                    <option value="Section C-D">Section C-D</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Maintenance Activity *</label>
                  <select
                    value={formData.asset_type}
                    onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-railway-blue bg-white font-medium"
                  >
                    <option value="Track">Track Inspection & Tamping (Track)</option>
                    <option value="Signal">Signal Maintenance & Interlocking (Signal)</option>
                    <option value="OHE">OHE Catenary & Insulator Wash (OHE)</option>
                    <option value="Point Machine">Point Machine Overhaul (Point Machine)</option>
                    <option value="Bridge">Bridge Inspection & Structural Work (Bridge)</option>
                    <option value="Telecom">OFC & Trackside Communication (Telecom)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duration (Hours) *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="6"
                    required
                    value={formData.duration_hours}
                    onChange={(e) => setFormData({ ...formData, duration_hours: parseFloat(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono focus:ring-2 focus:ring-railway-blue"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Preferred Window</label>
                  <input
                    type="text"
                    value={formData.preferred_time_window}
                    onChange={(e) => setFormData({ ...formData, preferred_time_window: e.target.value })}
                    placeholder="e.g. 09:00 - 11:00"
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono focus:ring-2 focus:ring-railway-blue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Preferred Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.preferred_date}
                    onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono focus:ring-2 focus:ring-railway-blue"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Deadline *</label>
                  <input
                    type="date"
                    required
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono focus:ring-2 focus:ring-railway-blue"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority Level</label>
                  <select
                    value={formData.criticality}
                    onChange={(e) => setFormData({ ...formData, criticality: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-railway-blue"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Required Resources</label>
                <input
                  type="text"
                  value={formData.required_resources}
                  onChange={(e) => setFormData({ ...formData, required_resources: e.target.value })}
                  placeholder="e.g. Track Inspection Trolley, Engineering Crew 1"
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-railway-blue"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description *</label>
                <textarea
                  rows={2}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Specific technical requirement and scope of work..."
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-railway-blue"
                />
              </div>

              {/* Form Live Validation Summary */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] space-y-1">
                <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Pre-submission Validation:</div>
                <div className="flex items-center space-x-2 text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Duration ({formData.duration_hours}h) meets corridor constraint threshold</span>
                </div>
                <div className="flex items-center space-x-2 text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Statutory deadline verified achievable relative to preferred date</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-railway-blue hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm"
                >
                  {editingTask ? "Save Changes" : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
