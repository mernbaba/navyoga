import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { GraduationCap, Plus, Search, Edit, Trash2, Award, BookOpen } from "lucide-react";
import { toast } from "sonner";

interface Tutor {
  id: number;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  experience: string;
  status: 'Active' | 'Inactive';
  classes: number;
  students: number;
  rating: number;
}

export function OperationsTutors() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);

  const [tutors, setTutors] = useState<Tutor[]>([
    { id: 1, name: 'Swami Anand', email: 'swami.anand@navyoga.com', phone: '+91 98765 43220', specialization: 'Hatha Yoga', experience: '15 years', status: 'Active', classes: 8, students: 45, rating: 4.9 },
    { id: 2, name: 'Priya Devi', email: 'priya.devi@navyoga.com', phone: '+91 98765 43221', specialization: 'Vinyasa Flow', experience: '10 years', status: 'Active', classes: 6, students: 38, rating: 4.8 },
    { id: 3, name: 'Ravi Shankar', email: 'ravi.shankar@navyoga.com', phone: '+91 98765 43222', specialization: 'Ashtanga Yoga', experience: '12 years', status: 'Active', classes: 7, students: 42, rating: 4.7 },
    { id: 4, name: 'Anjali Mehta', email: 'anjali.mehta@navyoga.com', phone: '+91 98765 43223', specialization: 'Yin Yoga', experience: '8 years', status: 'Active', classes: 5, students: 30, rating: 4.9 },
    { id: 5, name: 'Kiran Kumar', email: 'kiran.kumar@navyoga.com', phone: '+91 98765 43224', specialization: 'Power Yoga', experience: '6 years', status: 'Inactive', classes: 0, students: 0, rating: 4.5 },
  ]);

  const filteredTutors = tutors.filter(tutor =>
    tutor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tutor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tutor.specialization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const metrics = [
    { title: 'Total Tutors', value: tutors.length.toString(), icon: GraduationCap, color: '#ff691d' },
    { title: 'Active Tutors', value: tutors.filter(t => t.status === 'Active').length.toString(), icon: GraduationCap, color: '#10b981' },
    { title: 'Total Classes', value: tutors.reduce((sum, t) => sum + t.classes, 0).toString(), icon: BookOpen, color: '#610981' },
    { title: 'Total Students', value: tutors.reduce((sum, t) => sum + t.students, 0).toString(), icon: Award, color: '#f59e0b' },
  ];

  const handleAddTutor = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Tutor added successfully');
    setIsAddModalOpen(false);
  };

  const handleEditTutor = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Tutor updated successfully');
    setIsEditModalOpen(false);
    setSelectedTutor(null);
  };

  const handleDeleteTutor = (id: number) => {
    if (confirm('Are you sure you want to delete this tutor?')) {
      setTutors(tutors.filter(t => t.id !== id));
      toast.success('Tutor deleted successfully');
    }
  };

  const openEditModal = (tutor: Tutor) => {
    setSelectedTutor(tutor);
    setIsEditModalOpen(true);
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold" style={{ color: '#ff691d' }}>Tutor Management</h1>
          <p className="text-muted-foreground mt-1">Manage yoga instructors and their assignments</p>
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
              <CardTitle style={{ color: '#ff691d' }}>All Tutors</CardTitle>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search tutors..."
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
                  Add Tutor
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: '#ffac96' }}>Tutor Name</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: '#ffac96' }}>Specialization</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: '#ffac96' }}>Experience</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: '#ffac96' }}>Classes</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: '#ffac96' }}>Students</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: '#ffac96' }}>Rating</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: '#ffac96' }}>Status</th>
                    <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: '#ffac96' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTutors.map((tutor) => (
                    <tr key={tutor.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{tutor.name}</p>
                          <p className="text-sm text-muted-foreground">{tutor.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">{tutor.specialization}</td>
                      <td className="py-3 px-4">{tutor.experience}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" style={{ borderColor: '#610981', color: '#610981' }}>
                          {tutor.classes} classes
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" style={{ borderColor: '#f59e0b', color: '#f59e0b' }}>
                          {tutor.students} students
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Award className="w-4 h-4 text-yellow-500" />
                          <span className="font-medium">{tutor.rating}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={tutor.status === 'Active' ? 'default' : 'secondary'}>
                          {tutor.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(tutor)}
                            className="hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTutor(tutor.id)}
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
            <DialogTitle style={{ color: '#ff691d' }}>Add New Tutor</DialogTitle>
            <DialogDescription>Fill in the details to add a new tutor</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddTutor} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" style={{ color: '#ffac96' }}>Full Name</Label>
                <Input id="name" placeholder="Enter full name" className="mt-1" />
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
                <Label htmlFor="specialization" style={{ color: '#ffac96' }}>Specialization</Label>
                <select id="specialization" className="w-full mt-1 px-3 py-2 border rounded-md">
                  <option>Hatha Yoga</option>
                  <option>Vinyasa Flow</option>
                  <option>Ashtanga Yoga</option>
                  <option>Yin Yoga</option>
                  <option>Power Yoga</option>
                  <option>Kundalini Yoga</option>
                </select>
              </div>
              <div>
                <Label htmlFor="experience" style={{ color: '#ffac96' }}>Experience</Label>
                <Input id="experience" placeholder="e.g., 10 years" className="mt-1" />
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
            <div>
              <Label htmlFor="bio" style={{ color: '#ffac96' }}>Bio</Label>
              <textarea 
                id="bio" 
                placeholder="Brief description about the tutor..." 
                className="w-full mt-1 px-3 py-2 border rounded-md min-h-[100px]"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" style={{ backgroundColor: '#610981' }}>
                Add Tutor
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
 
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ color: '#ff691d' }}>Edit Tutor</DialogTitle>
            <DialogDescription>Update tutor details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditTutor} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editName" style={{ color: '#ffac96' }}>Full Name</Label>
                <Input id="editName" defaultValue={selectedTutor?.name} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="editEmail" style={{ color: '#ffac96' }}>Email</Label>
                <Input id="editEmail" type="email" defaultValue={selectedTutor?.email} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="editPhone" style={{ color: '#ffac96' }}>Phone</Label>
                <Input id="editPhone" defaultValue={selectedTutor?.phone} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="editSpecialization" style={{ color: '#ffac96' }}>Specialization</Label>
                <select id="editSpecialization" defaultValue={selectedTutor?.specialization} className="w-full mt-1 px-3 py-2 border rounded-md">
                  <option>Hatha Yoga</option>
                  <option>Vinyasa Flow</option>
                  <option>Ashtanga Yoga</option>
                  <option>Yin Yoga</option>
                  <option>Power Yoga</option>
                  <option>Kundalini Yoga</option>
                </select>
              </div>
              <div>
                <Label htmlFor="editExperience" style={{ color: '#ffac96' }}>Experience</Label>
                <Input id="editExperience" defaultValue={selectedTutor?.experience} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="editStatus" style={{ color: '#ffac96' }}>Status</Label>
                <select id="editStatus" defaultValue={selectedTutor?.status} className="w-full mt-1 px-3 py-2 border rounded-md">
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => {
                setIsEditModalOpen(false);
                setSelectedTutor(null);
              }}>
                Cancel
              </Button>
              <Button type="submit" style={{ backgroundColor: '#610981' }}>
                Update Tutor
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
