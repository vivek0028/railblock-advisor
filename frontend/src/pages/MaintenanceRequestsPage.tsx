import React, { useEffect, useState } from "react";
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
  Zap,
  ArrowRight
} from "lucide-react";
import { api } from "../services/api";
import { MaintenanceTask } from "../types";
import { DepartmentBadge, PriorityBadge, StatusBadge } from "../components/Badges";

export const MaintenanceRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    task_id: "",
    department: "Engineering",
    asset_type: "Track",
    location: "Section A-B",
    description: "",
    duration_hours: 2.5,
    preferred_date: "2026-09-20",
    deadline: "2026-09-23",
    criticality: "High",
    overdue: false,
    required_resources: "Engineering Crew 1",
    dependencies: "",
    compatible_departments: "Engineering, S&T",
    status: "Pending"
  });

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await api.getTasks();
      setTasks(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculatePriorities = async () => {
    setRecalculating(true);
    try {
      const res = await api.recalculatePriorities();
      setActionSuccess(`Priority scores recalculated for ${res.tasks_recalculated} tasks using deterministic IR rules.`);
      await loadTasks();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert("Recalculation failed: " + err.message);
    } finally {
      setRecalculating(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleOpenAddModal = () => {
    setEditingTask(null);
    setFormData({
      task_id: `REQ-${Math.floor(100 + Math.random() * 900)}`,
      department: "Engineering",
      asset_type: "Track",
      location: "Section A-B",
      description: "",
      duration_hours: 2.0,
      preferred_date: "2026-09-20",
      deadline: "2026-09-23",
      criticality: "High",
      overdue: false,
      required_resources: "Engineering Crew 1",
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

    // Validation rules
    if (formData.duration_hours <= 0) {
      setModalError("Duration in hours must be greater than zero.");
      return;
    }
    if (new Date(formData.deadline) < new Date(formData.preferred_date)) {
      setModalError("Deadline cannot be before preferred start date.");
      return;
    }
    if (!formData.description.trim()) {
      setModalError("Work description cannot be empty.");
      return;
    }

    const payload = {
      ...formData,
      duration_hours: Number(formData.duration_hours),
      required_resources: formData.required_resources.split(",").map(s => s.trim()).filter(Boolean),
      dependencies: formData.dependencies.split(",").map(s => s.trim()).filter(Boolean),
      compatible_departments: formData.compatible_departments.split(",").map(s => s.trim()).filter(Boolean),
    };

    try {
      if (editingTask) {
        await api.updateTask(editingTask.task_id, payload);
        setActionSuccess(`Task ${editingTask.task_id} updated successfully.`);
      } else {
        await api.createTask(payload as any);
        setActionSuccess(`Task ${payload.task_id} created successfully.`);
      }
      setIsModalOpen(false);
      loadTasks();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setModalError(err.message || "Operation failed.");
    }
  };

  const handleDelete = async (taskId: string) => {
    if (window.confirm(`Are you sure you want to delete request ${taskId}?`)) {
      try {
        await api.deleteTask(taskId);
        setActionSuccess(`Task ${taskId} deleted.`);
        loadTasks();
        setTimeout(() => setActionSuccess(null), 3000);
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleExportCSV = () => {
    const headers = ["Task ID", "Department", "Asset Type", "Location", "Duration (h)", "Deadline", "Priority", "Overdue", "Status", "Score"];
    const rows = tasks.map(t => [
      t.task_id,
      t.department,
      t.asset_type,
      `"${t.location}"`,
      t.duration_hours,
      t.deadline,
      t.criticality,
      t.overdue ? "YES" : "NO",
      t.status,
      t.priority_score.toFixed(0)
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `railblock_maintenance_requests_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTasks = tasks.filter(t => {
    const matchesSearch =
      t.task_id.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.location.toLowerCase().includes(search.toLowerCase()) ||
      t.asset_type.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === "ALL" || t.department === deptFilter;
    const matchesPriority = priorityFilter === "ALL" || t.criticality === priorityFilter;
    return matchesSearch && matchesDept && matchesPriority;
  });

  return (
    <div className="space-y-5">
      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Maintenance Requests</h1>
            <span className="bg-slate-200 text-slate-700 text-xs font-bold px-2 py-0.5 rounded uppercase">
              BDMS Canonical
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Normalized maintenance disconnection demands across Engineering, S&T, and Traction departments
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleRecalculatePriorities}
            disabled={recalculating}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
            title="Recalculates deterministic scores: Criticality + Deadline Urgency + Overdue + Operational Impact"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? "animate-spin" : ""}`} />
            <span>{recalculating ? "Scoring..." : "Recalculate Priority"}</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-railway-blue hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Request</span>
          </button>
          <button
            onClick={() => navigate("/conflicts")}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shadow-sm transition"
          >
            <span>Detect Conflicts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs px-4 py-2 rounded-md font-medium">
          {actionSuccess}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Request ID, asset type, location, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-railway-blue"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-md px-2.5 py-2 bg-white focus:outline-none"
          >
            <option value="ALL">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="S&T">S&T</option>
            <option value="Traction">Traction</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-md px-2.5 py-2 bg-white focus:outline-none"
          >
            <option value="ALL">All Criticalities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <span className="text-xs text-slate-500 font-mono whitespace-nowrap px-2">
            Showing {filteredTasks.length} / {tasks.length}
          </span>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Dept</th>
                <th>Asset</th>
                <th>Location</th>
                <th>Work Description</th>
                <th>Duration</th>
                <th>Deadline</th>
                <th>Priority</th>
                <th>Resources</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-8 text-slate-500 text-xs">
                    No maintenance requests found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((t) => (
                  <tr key={t.task_id} className="hover:bg-slate-50/80 transition">
                    <td className="font-mono font-bold text-xs text-slate-900 whitespace-nowrap">
                      {t.task_id}
                    </td>
                    <td><DepartmentBadge department={t.department} /></td>
                    <td className="text-xs font-semibold text-slate-800">{t.asset_type}</td>
                    <td className="text-xs text-slate-600 whitespace-nowrap">{t.location}</td>
                    <td className="text-xs text-slate-800 max-w-xs truncate" title={t.description}>
                      {t.description}
                    </td>
                    <td className="text-xs font-mono text-slate-700 whitespace-nowrap">{t.duration_hours}h</td>
                    <td className="text-xs font-mono text-slate-600 whitespace-nowrap">{t.deadline}</td>
                    <td>
                      <button
                        onClick={() => setSelectedTask(t)}
                        title="Click to view transparent rule-based score factors"
                        className="cursor-pointer hover:opacity-80"
                      >
                        <PriorityBadge criticality={t.criticality} score={t.priority_score} />
                      </button>
                    </td>
                    <td className="text-xs text-slate-600 max-w-[150px] truncate" title={(t.required_resources || []).join(", ")}>
                      {(t.required_resources || []).join(", ") || "-"}
                    </td>
                    <td><StatusBadge status={t.status} /></td>
                    <td className="whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => setSelectedTask(t)}
                          className="p-1 rounded hover:bg-slate-200 text-slate-600"
                          title="View Score Breakdown"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(t)}
                          className="p-1 rounded hover:bg-slate-200 text-blue-600"
                          title="Edit Request"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(t.task_id)}
                          className="p-1 rounded hover:bg-slate-200 text-rose-600"
                          title="Delete Request"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Priority Score Breakdown Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-400 font-mono">TASK PRIORITY EXPLAINABILITY</span>
                <h3 className="font-extrabold text-base text-slate-900">{selectedTask.task_id}</h3>
              </div>
              <button onClick={() => setSelectedTask(null)} className="p-1 rounded-md hover:bg-slate-100 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="font-semibold text-slate-700">Total Priority Score:</span>
                <span className="text-lg font-bold font-mono text-rose-700">{selectedTask.priority_score.toFixed(1)} pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Asset Criticality ({selectedTask.criticality}):</span>
                <span className="font-bold font-mono text-slate-800">+{selectedTask.priority_factors?.criticality_points || 20} pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Deadline Urgency:</span>
                <span className="font-bold font-mono text-slate-800">+{selectedTask.priority_factors?.deadline_urgency_points || 15} pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Overdue Status:</span>
                <span className="font-bold font-mono text-slate-800">+{selectedTask.priority_factors?.overdue_points || 0} pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Operational Impact:</span>
                <span className="font-bold font-mono text-slate-800">+{selectedTask.priority_factors?.operational_impact_points || 12} pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Maintenance Age Factor:</span>
                <span className="font-bold font-mono text-slate-800">+{selectedTask.priority_factors?.age_factor_points || 5} pts</span>
              </div>
            </div>

            <div className="text-xs text-slate-500 italic">
              * Rule-based mathematical calculation. Does not hide scoring logic or use opaque models.
            </div>

            <button
              onClick={() => setSelectedTask(null)}
              className="w-full py-2 bg-slate-900 text-white rounded-md text-xs font-semibold hover:bg-slate-800"
            >
              Close Breakdown
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 my-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-extrabold text-base text-slate-900">
                {editingTask ? `Edit Requisition: ${editingTask.task_id}` : "Create Maintenance Block Request"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-md hover:bg-slate-100 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="bg-rose-50 border border-rose-300 text-rose-800 text-xs p-3 rounded-md flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Request ID *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingTask}
                    value={formData.task_id}
                    onChange={(e) => setFormData({ ...formData, task_id: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-railway-blue font-mono disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department *</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-railway-blue"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="S&T">S&T</option>
                    <option value="Traction">Traction</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Asset Type *</label>
                  <select
                    value={formData.asset_type}
                    onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-railway-blue"
                  >
                    <option value="Track">Track</option>
                    <option value="Signal">Signal</option>
                    <option value="OHE">OHE</option>
                    <option value="Bridge">Bridge</option>
                    <option value="Telecom">Telecom</option>
                    <option value="Point Machine">Point Machine</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Location / Section *</label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-railway-blue"
                  >
                    <option value="Section A-B">Section A-B</option>
                    <option value="Section B-C">Section B-C</option>
                    <option value="Section C-D">Section C-D</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duration (Hours) *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="8"
                    required
                    value={formData.duration_hours}
                    onChange={(e) => setFormData({ ...formData, duration_hours: parseFloat(e.target.value) })}
                    className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-railway-blue font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Criticality Level</label>
                  <select
                    value={formData.criticality}
                    onChange={(e) => setFormData({ ...formData, criticality: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-railway-blue"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
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
                    className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-railway-blue font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Deadline *</label>
                  <input
                    type="date"
                    required
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-railway-blue font-mono"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="overdue-check"
                    checked={formData.overdue}
                    onChange={(e) => setFormData({ ...formData, overdue: e.target.checked })}
                    className="rounded border-slate-300 text-railway-blue focus:ring-railway-blue"
                  />
                  <label htmlFor="overdue-check" className="font-semibold text-rose-700">
                    Mark as Overdue Task
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Work Description *</label>
                <textarea
                  rows={2}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed technical description of track, signal, or OHE maintenance..."
                  className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-railway-blue"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Required Resources (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.required_resources}
                    onChange={(e) => setFormData({ ...formData, required_resources: e.target.value })}
                    placeholder="Track Machine 1 (BCM), Engineering Crew 1"
                    className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-railway-blue"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Compatible Departments</label>
                  <input
                    type="text"
                    value={formData.compatible_departments}
                    onChange={(e) => setFormData({ ...formData, compatible_departments: e.target.value })}
                    placeholder="Engineering, S&T, Traction"
                    className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-railway-blue"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-railway-blue hover:bg-blue-700 text-white rounded font-bold shadow-sm"
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
