import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Phone, Plus, Search, Edit, Trash2, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";
import { registerFrontline } from "../../api/auth";

interface FrontlineAgent {
  id: number | string;
  name: string;
  email: string;
  phone: string;
  employeeId: string;
  status: 'Active' | 'Inactive';
  callsToday: number;
  leadsAssigned: number;
  conversions: number;
  performance: number;
}

const EMPTY_ADD_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  salary: '',
  joinDate: new Date().toISOString().slice(0, 10),
};

export function OperationsFrontlineTeam() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<FrontlineAgent | null>(null);
  const [addForm, setAddForm] = useState(EMPTY_ADD_FORM);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  const [agents, setAgents] = useState<FrontlineAgent[]>([
    { id: 1, name: 'Sarah Johnson', email: 'sarah.j@navyoga.com', phone: '+91 98765 43230', employeeId: 'FL-001', status: 'Active', callsToday: 45, leadsAssigned: 120, conversions: 15, performance: 92 },
    { id: 2, name: 'Michael Chen', email: 'michael.c@navyoga.com', phone: '+91 98765 43231', employeeId: 'FL-002', status: 'Active', callsToday: 38, leadsAssigned: 95, conversions: 12, performance: 88 },
    { id: 3, name: 'Priya Gupta', email: 'priya.g@navyoga.com', phone: '+91 98765 43232', employeeId: 'FL-003', status: 'Active', callsToday: 42, leadsAssigned: 110, conversions: 18, performance: 95 },
    { id: 4, name: 'David Lee', email: 'david.l@navyoga.com', phone: '+91 98765 43233', employeeId: 'FL-004', status: 'Active', callsToday: 35, leadsAssigned: 88, conversions: 10, performance: 85 },
    { id: 5, name: 'Anita Desai', email: 'anita.d@navyoga.com', phone: '+91 98765 43234', employeeId: 'FL-005', status: 'Inactive', callsToday: 0, leadsAssigned: 0, conversions: 0, performance: 0 },
  ]);

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const metrics = [
    { title: 'Total Agents', value: agents.length.toString(), icon: Users, color: '#ff691d' },
    { title: 'Active Agents', value: agents.filter(a => a.status === 'Active').length.toString(), icon: Phone, color: '#10b981' },
    { title: 'Total Calls Today', value: agents.reduce((sum, a) => sum + a.callsToday, 0).toString(), icon: Phone, color: '#610981' },
    { title: 'Total Conversions', value: agents.reduce((sum, a) => sum + a.conversions, 0).toString(), icon: TrendingUp, color: '#f59e0b' },
  ];

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingAdd) return;

    const salaryNum = Number(addForm.salary);
    if (!Number.isFinite(salaryNum) || salaryNum < 0) {
      toast.error('Salary must be a non-negative number');
      return;
    }
    if (addForm.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsSubmittingAdd(true);
    try {
      const user = await registerFrontline({
        email: addForm.email.trim(),
        firstName: addForm.firstName.trim(),
        lastName: addForm.lastName.trim(),
        phone: addForm.phone.trim(),
        password: addForm.password,
        salary: salaryNum,
        joinDate: addForm.joinDate,
      });

      const newAgent: FrontlineAgent = {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        phone: user.phone,
        employeeId: user.employeeId,
        status: user.status === 'TERMINATED' ? 'Inactive' : 'Active',
        callsToday: 0,
        leadsAssigned: 0,
        conversions: 0,
        performance: 0,
      };
      setAgents((prev) => [newAgent, ...prev]);
      toast.success(`Agent ${user.employeeId} added successfully`);
      setAddForm(EMPTY_ADD_FORM);
      setIsAddModalOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add agent';
      toast.error(message);
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleEditAgent = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Agent updated successfully');
    setIsEditModalOpen(false);
    setSelectedAgent(null);
  };

  const handleDeleteAgent = (id: number | string) => {
    if (confirm('Are you sure you want to delete this agent?')) {
      setAgents(agents.filter(a => a.id !== id));
      toast.success('Agent deleted successfully');
    }
  };

  const openEditModal = (agent: FrontlineAgent) => {
    setSelectedAgent(agent);
    setIsEditModalOpen(true);
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold" style={{ color: '#ff691d' }}>Frontline Team Management</h1>
          <p className="text-muted-foreground mt-1">Manage lead generation team members and their performance</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <Card key={index} className="relative overflow-hidden">
                <div 
                  className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10"
                  style={{ backgroundColor: metric.color }}
                />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </CardTitle>
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${metric.color}20` }}>
                    <Icon className="w-4 h-4" style={{ color: metric.color }} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{metric.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle style={{ color: '#ff691d' }}>All Agents</CardTitle>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search agents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
                <Button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="gap-2"
                  style={{ backgroundColor: '#610981' }}
                >
                  <Plus className="w-4 h-4" />
                  Add Agent
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: '#ffac96' }}>Agent ID</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: '#ffac96' }}>Name</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: '#ffac96' }}>Contact</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: '#ffac96' }}>Calls Today</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: '#ffac96' }}>Leads</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: '#ffac96' }}>Conversions</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: '#ffac96' }}>Performance</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: '#ffac96' }}>Status</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: '#ffac96' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAgents.map((agent) => (
                    <tr key={agent.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="font-medium">{agent.employeeId}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{agent.name}</p>
                          <p className="text-sm text-muted-foreground">{agent.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">{agent.phone}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" style={{ borderColor: '#610981', color: '#610981' }}>
                          {agent.callsToday}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" style={{ borderColor: '#3b82f6', color: '#3b82f6' }}>
                          {agent.leadsAssigned}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" style={{ borderColor: '#10b981', color: '#10b981' }}>
                          {agent.conversions}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full"
                              style={{ 
                                width: `${agent.performance}%`,
                                backgroundColor: agent.performance >= 90 ? '#10b981' : agent.performance >= 70 ? '#f59e0b' : '#ef4444'
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium">{agent.performance}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={agent.status === 'Active' ? 'default' : 'secondary'}>
                          {agent.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(agent)}
                            className="hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAgent(agent.id)}
                            className="hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
 
      <Dialog open={isAddModalOpen} onOpenChange={(open) => {
        setIsAddModalOpen(open);
        if (!open) setAddForm(EMPTY_ADD_FORM);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ color: '#ff691d' }}>Add New Agent</DialogTitle>
            <DialogDescription>Employee ID is auto-assigned (FL-{new Date().getFullYear()}-NNN). Status defaults to Active.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddAgent} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" style={{ color: '#ffac96' }}>First Name</Label>
                <Input
                  id="firstName"
                  placeholder="Sarah"
                  className="mt-1"
                  required
                  maxLength={50}
                  value={addForm.firstName}
                  onChange={(e) => setAddForm({ ...addForm, firstName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="lastName" style={{ color: '#ffac96' }}>Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Johnson"
                  className="mt-1"
                  required
                  maxLength={50}
                  value={addForm.lastName}
                  onChange={(e) => setAddForm({ ...addForm, lastName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email" style={{ color: '#ffac96' }}>Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@navyoga.com"
                  className="mt-1"
                  required
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone" style={{ color: '#ffac96' }}>Phone</Label>
                <Input
                  id="phone"
                  placeholder="9876543210"
                  className="mt-1"
                  required
                  minLength={7}
                  maxLength={15}
                  value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="password" style={{ color: '#ffac96' }}>Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min 8 characters"
                  className="mt-1"
                  required
                  minLength={8}
                  maxLength={128}
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="salary" style={{ color: '#ffac96' }}>Salary (₹)</Label>
                <Input
                  id="salary"
                  type="number"
                  min={0}
                  placeholder="30000"
                  className="mt-1"
                  required
                  value={addForm.salary}
                  onChange={(e) => setAddForm({ ...addForm, salary: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="joinDate" style={{ color: '#ffac96' }}>Join Date</Label>
                <Input
                  id="joinDate"
                  type="date"
                  className="mt-1"
                  required
                  value={addForm.joinDate}
                  onChange={(e) => setAddForm({ ...addForm, joinDate: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setAddForm(EMPTY_ADD_FORM);
                }}
                disabled={isSubmittingAdd}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                style={{ backgroundColor: '#610981' }}
                disabled={isSubmittingAdd}
              >
                {isSubmittingAdd ? 'Adding…' : 'Add Agent'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
 
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ color: '#ff691d' }}>Edit Agent</DialogTitle>
            <DialogDescription>Update agent details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditAgent} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editName" style={{ color: '#ffac96' }}>Full Name</Label>
                <Input id="editName" defaultValue={selectedAgent?.name} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="editEmployeeId" style={{ color: '#ffac96' }}>Employee ID</Label>
                <Input id="editEmployeeId" defaultValue={selectedAgent?.employeeId} className="mt-1" disabled />
              </div>
              <div>
                <Label htmlFor="editEmail" style={{ color: '#ffac96' }}>Email</Label>
                <Input id="editEmail" type="email" defaultValue={selectedAgent?.email} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="editPhone" style={{ color: '#ffac96' }}>Phone</Label>
                <Input id="editPhone" defaultValue={selectedAgent?.phone} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="editStatus" style={{ color: '#ffac96' }}>Status</Label>
                <select id="editStatus" defaultValue={selectedAgent?.status} className="w-full mt-1 px-3 py-2 border rounded-md">
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => {
                setIsEditModalOpen(false);
                setSelectedAgent(null);
              }}>
                Cancel
              </Button>
              <Button type="submit" style={{ backgroundColor: '#610981' }}>
                Update Agent
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
