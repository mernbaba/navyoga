import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { CheckCircle, Circle, Plus, Calendar, Clock, AlertCircle, Target, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { listTasks, createTask, updateTask, deleteTask } from "../../api/tasks";
import type { DailyTask, TaskCategory, TaskPriority, TaskStatus } from "../../api/types";

const ROLE = "FRONTLINE" as const;

const CATEGORY_LABELS: Record<TaskCategory, string> = {
  FOLLOW_UP: "Follow-up",
  CALLING: "Calling",
  ADMIN: "Admin",
  REPORTING: "Reporting",
  COORDINATION: "Coordination",
  TRAINING: "Training",
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// `@db.Date` values arrive as ISO at UTC midnight; slice the date part for the
// <input type="date"> without a timezone shift.
const toDateInput = (iso: string | null) => (iso ? iso.slice(0, 10) : "");

const getPriorityColor = (priority: TaskPriority) => {
  switch (priority) {
    case "HIGH": return "text-red-600 bg-red-50 border-red-200";
    case "MEDIUM": return "text-yellow-600 bg-yellow-50 border-yellow-200";
    case "LOW": return "text-blue-600 bg-blue-50 border-blue-200";
    default: return "";
  }
};

const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case "COMPLETED": return "bg-green-100 text-green-800 border-green-200";
    case "IN_PROGRESS": return "bg-blue-100 text-blue-800 border-blue-200";
    case "PENDING": return "bg-gray-100 text-gray-800 border-gray-200";
    default: return "";
  }
};

type NewTaskForm = {
  title: string;
  priority: TaskPriority | "";
  category: TaskCategory | "";
  dueDate: string;
  status: TaskStatus;
};

const EMPTY_FORM: NewTaskForm = {
  title: "",
  priority: "",
  category: "",
  dueDate: "",
  status: "PENDING",
};

export function FrontlineTasks() {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addDialog, setAddDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "all">("all");
  const [filterPriority, setFilterPriority] = useState<TaskPriority | "all">("all");
  const [form, setForm] = useState<NewTaskForm>(EMPTY_FORM);

  const loadTasks = useCallback(() => {
    setIsLoading(true);
    listTasks(ROLE, { limit: 100 })
      .then((res) => setTasks(res.items))
      .catch((error) =>
        toast.error(error instanceof Error ? error.message : "Failed to load tasks."),
      )
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const filteredTasks = tasks.filter((task) => {
    const matchesStatus = filterStatus === "all" || task.status === filterStatus;
    const matchesPriority = filterPriority === "all" || task.priority === filterPriority;
    return matchesStatus && matchesPriority;
  });

  const handleToggleTask = async (task: DailyTask) => {
    if (togglingId) return;
    const nextStatus: TaskStatus = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";
    setTogglingId(task.id);
    try {
      const updated = await updateTask(ROLE, task.id, { status: nextStatus });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      toast.success("Task status updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update task.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteTask = async (task: DailyTask) => {
    try {
      await deleteTask(ROLE, task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      toast.success("Task deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete task.");
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (!form.title.trim()) {
      toast.error("Task title is required.");
      return;
    }
    if (!form.category) {
      toast.error("Please select a category.");
      return;
    }
    if (!form.priority) {
      toast.error("Please select a priority.");
      return;
    }
    setIsSaving(true);
    try {
      const created = await createTask(ROLE, {
        title: form.title.trim(),
        category: form.category,
        priority: form.priority,
        status: form.status,
        ...(form.dueDate ? { dueDate: form.dueDate } : {}),
      });
      setTasks((prev) => [created, ...prev]);
      toast.success("Task added successfully");
      setForm(EMPTY_FORM);
      setAddDialog(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add task.");
    } finally {
      setIsSaving(false);
    }
  };

  const pendingTasks = tasks.filter((t) => t.status === "PENDING").length;
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED").length;
  const highPriorityTasks = tasks.filter((t) => t.priority === "HIGH" && t.status !== "COMPLETED").length;

  return (
    <div className="p-6 lg:p-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold" style={{ color: '#ff691d' }}>Daily Tasks</h1>
            <p className="text-muted-foreground mt-1">Manage your daily work and priorities</p>
          </div>
          <Button
            onClick={() => setAddDialog(true)}
            className="bg-linear-to-r from-[#610981] to-[#8b0fa8] hover:from-[#7a0a9f] hover:to-[#a312ca]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Circle className="w-5 h-5 text-gray-600" />
                <div className="text-2xl font-bold">{pendingTasks}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <div className="text-2xl font-bold text-blue-600">{inProgressTasks}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">High Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div className="text-2xl font-bold text-red-600">{highPriorityTasks}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle style={{ color: '#ff691d' }}>Task List</CardTitle>
                <CardDescription>Your daily work items</CardDescription>
              </div>
              <div className="flex gap-2">
                <select
                  className="px-3 py-2 border rounded-md text-sm"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as TaskStatus | "all")}
                >
                  <option value="all">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
                <select
                  className="px-3 py-2 border rounded-md text-sm"
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value as TaskPriority | "all")}
                >
                  <option value="all">All Priority</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Loading tasks...
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border transition-all duration-200 ${
                      task.status === 'COMPLETED' ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50 hover:shadow-md'
                    }`}
                  >
                    <button
                      onClick={() => handleToggleTask(task)}
                      disabled={togglingId === task.id}
                      className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 disabled:opacity-50 ${
                        task.status === 'COMPLETED'
                          ? 'bg-green-500 border-green-500'
                          : 'border-gray-300 hover:border-[#610981]'
                      }`}
                    >
                      {togglingId === task.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                      ) : (
                        task.status === 'COMPLETED' && <CheckCircle className="w-4 h-4 text-white" />
                      )}
                    </button>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className={`font-medium ${task.status === 'COMPLETED' ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(task.priority)}>
                            {PRIORITY_LABELS[task.priority]}
                          </Badge>
                          <button
                            onClick={() => handleDeleteTask(task)}
                            className="text-muted-foreground hover:text-red-600 transition-colors"
                            aria-label="Delete task"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{fmtDate(task.dueDate ?? task.date)}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {CATEGORY_LABELS[task.category]}
                        </Badge>
                        <Badge className={getStatusColor(task.status)}>
                          {STATUS_LABELS[task.status]}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredTasks.length === 0 && (
                  <div className="text-center py-12">
                    <Target className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No tasks found with the selected filters</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#ff691d]/5 rounded-full blur-3xl" />
            <CardHeader>
              <CardTitle style={{ color: '#ff691d' }}>High Priority Tasks</CardTitle>
              <CardDescription>Focus on these first</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tasks.filter(t => t.priority === 'HIGH' && t.status !== 'COMPLETED').map((task) => (
                  <div key={task.id} className="p-3 rounded-lg border border-red-200 bg-red-50">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{task.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">Due: {fmtDate(task.dueDate ?? task.date)}</p>
                      </div>
                      <Button
                        onClick={() => handleToggleTask(task)}
                        disabled={togglingId === task.id}
                        size="sm"
                        variant="outline"
                        className="text-xs"
                      >
                        Mark Done
                      </Button>
                    </div>
                  </div>
                ))}
                {tasks.filter(t => t.priority === 'HIGH' && t.status !== 'COMPLETED').length === 0 && (
                  <p className="text-center text-muted-foreground py-4">All high priority tasks completed! 🎉</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute top-0 left-0 w-40 h-40 bg-[#610981]/5 rounded-full blur-3xl" />
            <CardHeader>
              <CardTitle style={{ color: '#ff691d' }}>Completed Today</CardTitle>
              <CardDescription>Your achievements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tasks.filter(t => t.status === 'COMPLETED').map((task) => (
                  <div key={task.id} className="p-3 rounded-lg border border-green-200 bg-green-50">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-sm line-through text-muted-foreground">{task.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{CATEGORY_LABELS[task.category]}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {tasks.filter(t => t.status === 'COMPLETED').length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No tasks completed yet. Keep going!</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Dialog open={addDialog} onOpenChange={setAddDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle style={{ color: '#ff691d' }}>Add New Task</DialogTitle>
              <DialogDescription>Create a new task for today's work</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddTask}>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium" style={{ color: '#ffac96' }}>Task Title</Label>
                  <Input
                    placeholder="Enter task description"
                    className="mt-1"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium" style={{ color: '#ffac96' }}>Priority</Label>
                    <select
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                      value={form.priority}
                      onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as TaskPriority | "" }))}
                    >
                      <option value="">Select priority</option>
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium" style={{ color: '#ffac96' }}>Category</Label>
                    <select
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as TaskCategory | "" }))}
                    >
                      <option value="">Select category</option>
                      <option value="CALLING">Calling</option>
                      <option value="FOLLOW_UP">Follow-up</option>
                      <option value="ADMIN">Admin</option>
                      <option value="REPORTING">Reporting</option>
                      <option value="COORDINATION">Coordination</option>
                      <option value="TRAINING">Training</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium" style={{ color: '#ffac96' }}>Due Date</Label>
                    <Input
                      type="date"
                      className="mt-1"
                      value={form.dueDate}
                      onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium" style={{ color: '#ffac96' }}>Status</Label>
                    <select
                      className="w-full mt-1 px-3 py-2 border rounded-md"
                      value={form.status}
                      onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as TaskStatus }))}
                    >
                      <option value="PENDING">Pending</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setAddDialog(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-linear-to-r from-[#610981] to-[#8b0fa8] hover:from-[#7a0a9f] hover:to-[#a312ca]"
                >
                  {isSaving ? "Adding..." : "Add Task"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
