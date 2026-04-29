import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Users, Plus, Search, Edit, Trash2, UserCog, Phone, Mail } from "lucide-react";
import { toast } from "sonner";

interface Employee {
  id: number;
  name: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  status: 'Active' | 'Inactive';
  joinDate: string;
  employeeId: string;
}

export function OperationsEmployees() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const [employees, setEmployees] = useState<Employee[]>([
    { id: 1, name: 'Amit Patel', email: 'amit.patel@navyoga.com', phone: '+91 98765 43210', department: 'Operations', role: 'Manager', status: 'Active', joinDate: '2023-01-15', employeeId: 'EMP001' },
    { id: 2, name: 'Priya Sharma', email: 'priya.sharma@navyoga.com', phone: '+91 98765 43211', department: 'HR', role: 'HR Executive', status: 'Active', joinDate: '2023-02-20', employeeId: 'EMP002' },
    { id: 3, name: 'Rahul Kumar', email: 'rahul.kumar@navyoga.com', phone: '+91 98765 43212', department: 'Finance', role: 'Accountant', status: 'Active', joinDate: '2023-03-10', employeeId: 'EMP003' },
    { id: 4, name: 'Sneha Reddy', email: 'sneha.reddy@navyoga.com', phone: '+91 98765 43213', department: 'Marketing', role: 'Marketing Executive', status: 'Active', joinDate: '2023-04-05', employeeId: 'EMP004' },
    { id: 5, name: 'Vikram Singh', email: 'vikram.singh@navyoga.com', phone: '+91 98765 43214', department: 'IT', role: 'Developer', status: 'Inactive', joinDate: '2023-05-12', employeeId: 'EMP005' },
  ]);

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const metrics = [
    { title: 'Total Employees', value: employees.length.toString(), icon: Users, color: '#ff691d' },
    { title: 'Active', value: employees.filter(e => e.status === 'Active').length.toString(), icon: UserCog, color: '#10b981' },
    { title: 'Inactive', value: employees.filter(e => e.status === 'Inactive').length.toString(), icon: UserCog, color: '#ef4444' },
    { title: 'Departments', value: '5', icon: Users, color: '#610981' },
  ];

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Employee added successfully');
    setIsAddModalOpen(false);
  };

  const handleEditEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Employee updated successfully');
    setIsEditModalOpen(false);
    setSelectedEmployee(null);
  };

  const handleDeleteEmployee = (id: number) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      setEmployees(employees.filter(e => e.id !== id));
      toast.success('Employee deleted successfully');
    }
  };

  const openEditModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEditModalOpen(true);
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="space-y-6">
 
        <div>
          <h1 className="text-3xl font-semibold" style={{ color: '#ff691d' }}>Employee Management</h1>
          <p className="text-muted-foreground mt-1">Manage all employees across departments</p>
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
              <CardTitle style={{ color: '#ff691d' }}>All Employees</CardTitle>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search employees..."
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
                  Add Employee
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: '#ffac96' }}>Employee ID</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: '#ffac96' }}>Name</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: '#ffac96' }}>Department</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: '#ffac96' }}>Role</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: '#ffac96' }}>Contact</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: '#ffac96' }}>Status</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: '#ffac96' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="font-medium text-sm">{employee.employeeId}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{employee.name}</p>
                          <p className="text-sm text-muted-foreground">{employee.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">{employee.department}</td>
                      <td className="py-3 px-4">{employee.role}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Mail className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs">{employee.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs">{employee.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={employee.status === 'Active' ? 'default' : 'secondary'}>
                          {employee.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(employee)}
                            className="hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteEmployee(employee.id)}
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
 
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ color: '#ff691d' }}>Add New Employee</DialogTitle>
            <DialogDescription>Fill in the details to add a new employee</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddEmployee} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" style={{ color: '#ffac96' }}>Full Name</Label>
                <Input id="name" placeholder="Enter full name" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="employeeId" style={{ color: '#ffac96' }}>Employee ID</Label>
                <Input id="employeeId" placeholder="EMP001" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="email" style={{ color: '#ffac96' }}>Email</Label>
                <Input id="email" type="email" placeholder="email@navyoga.com" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="phone" style={{ color: '#ffac96' }}>Phone</Label>
                <Input id="phone" placeholder="+91 98765 43210" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="department" style={{ color: '#ffac96' }}>Department</Label>
                <select id="department" className="w-full mt-1 px-3 py-2 border rounded-md">
                  <option>Operations</option>
                  <option>HR</option>
                  <option>Finance</option>
                  <option>Marketing</option>
                  <option>IT</option>
                </select>
              </div>
              <div>
                <Label htmlFor="role" style={{ color: '#ffac96' }}>Role</Label>
                <Input id="role" placeholder="Enter role" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="joinDate" style={{ color: '#ffac96' }}>Join Date</Label>
                <Input id="joinDate" type="date" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="status" style={{ color: '#ffac96' }}>Status</Label>
                <select id="status" className="w-full mt-1 px-3 py-2 border rounded-md">
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
              <div>
                <Label htmlFor="password" style={{ color: '#ffac96' }}>Password</Label>
                <Input id="password" type="password" placeholder="Enter password" className="mt-1" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" style={{ backgroundColor: '#610981' }}>
                Add Employee
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
 
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ color: '#ff691d' }}>Edit Employee</DialogTitle>
            <DialogDescription>Update employee details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditEmployee} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editName" style={{ color: '#ffac96' }}>Full Name</Label>
                <Input id="editName" defaultValue={selectedEmployee?.name} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="editEmployeeId" style={{ color: '#ffac96' }}>Employee ID</Label>
                <Input id="editEmployeeId" defaultValue={selectedEmployee?.employeeId} className="mt-1" disabled />
              </div>
              <div>
                <Label htmlFor="editEmail" style={{ color: '#ffac96' }}>Email</Label>
                <Input id="editEmail" type="email" defaultValue={selectedEmployee?.email} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="editPhone" style={{ color: '#ffac96' }}>Phone</Label>
                <Input id="editPhone" defaultValue={selectedEmployee?.phone} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="editDepartment" style={{ color: '#ffac96' }}>Department</Label>
                <select id="editDepartment" defaultValue={selectedEmployee?.department} className="w-full mt-1 px-3 py-2 border rounded-md">
                  <option>Operations</option>
                  <option>HR</option>
                  <option>Finance</option>
                  <option>Marketing</option>
                  <option>IT</option>
                </select>
              </div>
              <div>
                <Label htmlFor="editRole" style={{ color: '#ffac96' }}>Role</Label>
                <Input id="editRole" defaultValue={selectedEmployee?.role} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="editJoinDate" style={{ color: '#ffac96' }}>Join Date</Label>
                <Input id="editJoinDate" type="date" defaultValue={selectedEmployee?.joinDate} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="editStatus" style={{ color: '#ffac96' }}>Status</Label>
                <select id="editStatus" defaultValue={selectedEmployee?.status} className="w-full mt-1 px-3 py-2 border rounded-md">
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => {
                setIsEditModalOpen(false);
                setSelectedEmployee(null);
              }}>
                Cancel
              </Button>
              <Button type="submit" style={{ backgroundColor: '#610981' }}>
                Update Employee
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
