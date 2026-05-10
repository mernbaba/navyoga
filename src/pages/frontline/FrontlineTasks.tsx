import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { CheckCircle, Circle, Plus, Calendar, Clock, AlertCircle, Target } from "lucide-react";
import { toast } from "sonner";

const mockTasks = [
  { id: 1, title: 'Follow up with interested leads from yesterday', priority: 'high', status: 'pending', dueDate: '2024-03-08', category: 'Follow-up', assignedBy: 'Manager' },
  { id: 2, title: 'Call back missed connections (15 leads)', priority: 'high', status: 'in-progress', dueDate: '2024-03-08', category: 'Calling', assignedBy: 'System' },
  { id: 3, title: 'Update lead statuses in CRM', priority: 'medium', status: 'completed', dueDate: '2024-03-08', category: 'Admin', assignedBy: 'Manager' },
  { id: 4, title: 'Prepare daily call report', priority: 'medium', status: 'pending', dueDate: '2024-03-08', category: 'Reporting', assignedBy: 'Manager' },
  { id: 5, title: 'Send pricing information to 5 interested leads', priority: 'high', status: 'in-progress', dueDate: '2024-03-08', category: 'Follow-up', assignedBy: 'System' },
  { id: 6, title: 'Schedule demo classes for converted leads', priority: 'medium', status: 'pending', dueDate: '2024-03-09', category: 'Coordination', assignedBy: 'Manager' },
  { id: 7, title: 'Review and update call scripts', priority: 'low', status: 'pending', dueDate: '2024-03-09', category: 'Training', assignedBy: 'Manager' },
  { id: 8, title: 'Contact leads from website form submissions', priority: 'high', status: 'pending', dueDate: '2024-03-08', category: 'Calling', assignedBy: 'System' },
];

export function FrontlineTasks() {
  const [tasks, setTasks] = useState(mockTasks);
  const [addDialog, setAddDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = filterStatus === "all" || task.status === filterStatus;
    const matchesPriority = filterPriority === "all" || task.priority === filterPriority;
    return matchesStatus && matchesPriority;
  });

  const handleToggleTask = (taskId: number) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, status: task.status === 'completed' ? 'pending' : 'completed' }
        : task
    ));
    toast.success('Task status updated');
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Task added successfully');
    setAddDialog(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return '';
    }
  };

  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const highPriorityTasks = tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length;

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
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                <select 
                  className="px-3 py-2 border rounded-md text-sm"
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                >
                  <option value="all">All Priority</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <div 
                  key={task.id} 
                  className={`flex items-start gap-4 p-4 rounded-lg border transition-all duration-200 ${
                    task.status === 'completed' ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50 hover:shadow-md'
                  }`}
                >
                  <button
                    onClick={() => handleToggleTask(task.id)}
                    className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                      task.status === 'completed' 
                        ? 'bg-green-500 border-green-500' 
                        : 'border-gray-300 hover:border-[#610981]'
                    }`}
                  >
                    {task.status === 'completed' && <CheckCircle className="w-4 h-4 text-white" />}
                  </button>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className={`font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </h3>
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{task.dueDate}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {task.category}
                      </Badge>
                      <span className="text-xs">Assigned by: {task.assignedBy}</span>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status}
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
                {tasks.filter(t => t.priority === 'high' && t.status !== 'completed').map((task) => (
                  <div key={task.id} className="p-3 rounded-lg border border-red-200 bg-red-50">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{task.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">Due: {task.dueDate}</p>
                      </div>
                      <Button
                        onClick={() => handleToggleTask(task.id)}
                        size="sm"
                        variant="outline"
                        className="text-xs"
                      >
                        Mark Done
                      </Button>
                    </div>
                  </div>
                ))}
                {tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length === 0 && (
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
                {tasks.filter(t => t.status === 'completed').map((task) => (
                  <div key={task.id} className="p-3 rounded-lg border border-green-200 bg-green-50">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-sm line-through text-muted-foreground">{task.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{task.category}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {tasks.filter(t => t.status === 'completed').length === 0 && (
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
                  <Input placeholder="Enter task description" className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium" style={{ color: '#ffac96' }}>Priority</Label>
                    <select className="w-full mt-1 px-3 py-2 border rounded-md">
                      <option value="">Select priority</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium" style={{ color: '#ffac96' }}>Category</Label>
                    <select className="w-full mt-1 px-3 py-2 border rounded-md">
                      <option value="">Select category</option>
                      <option value="Calling">Calling</option>
                      <option value="Follow-up">Follow-up</option>
                      <option value="Admin">Admin</option>
                      <option value="Reporting">Reporting</option>
                      <option value="Coordination">Coordination</option>
                      <option value="Training">Training</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium" style={{ color: '#ffac96' }}>Due Date</Label>
                    <Input type="date" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium" style={{ color: '#ffac96' }}>Status</Label>
                    <select className="w-full mt-1 px-3 py-2 border rounded-md">
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium" style={{ color: '#ffac96' }}>Notes</Label>
                  <textarea 
                    className="w-full mt-1 px-3 py-2 border rounded-md min-h-[100px]" 
                    placeholder="Add any additional notes..."
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setAddDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-linear-to-r from-[#610981] to-[#8b0fa8] hover:from-[#7a0a9f] hover:to-[#a312ca]"
                >
                  Add Task
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
