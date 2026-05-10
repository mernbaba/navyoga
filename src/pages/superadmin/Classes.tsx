import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { Plus, Search, Edit, Trash2, Clock, Users as UsersIcon, IndianRupee, Download } from "lucide-react";
import { classes as initialClasses, tutors, type Class } from "../../data/mockData";
import { toast } from "sonner";
import { Progress } from "../../components/ui/progress";

export function Classes() {
  const [classes, setClasses] = useState(initialClasses);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);

  const filteredClasses = classes.filter(cls => 
    cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.schedule.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddClass = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newClass: Class = {
      id: `C${String(classes.length + 1).padStart(3, '0')}`,
      name: formData.get('name') as string,
      type: formData.get('type') as string,
      tutorId: formData.get('tutorId') as string,
      schedule: formData.get('schedule') as string,
      duration: parseInt(formData.get('duration') as string),
      capacity: parseInt(formData.get('capacity') as string),
      enrolled: 0,
      status: 'active',
      price: 0,
    };
    setClasses([...classes, newClass]);
    setIsAddOpen(false);
    toast.success('Class created successfully');
  };

  const handleEditClass = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingClass) return;
    
    const formData = new FormData(e.currentTarget);
    const updatedClass: Class = {
      ...editingClass,
      name: formData.get('name') as string,
      type: formData.get('type') as string,
      tutorId: formData.get('tutorId') as string,
      schedule: formData.get('schedule') as string,
      duration: parseInt(formData.get('duration') as string),
      capacity: parseInt(formData.get('capacity') as string),
      status: formData.get('status') as 'active' | 'cancelled' | 'completed',
    };
    
    setClasses(classes.map(c => c.id === editingClass.id ? updatedClass : c));
    setEditingClass(null);
    toast.success('Class updated successfully');
  };

  const handleDeleteClass = (id: string) => {
    setClasses(classes.filter(c => c.id !== id));
    toast.success('Class deleted successfully');
  };

  const handleDownloadClass = (cls: Class) => {
    // Create class data for download
    const classData = {
      ...cls,
      tutorName: getTutorName(cls.tutorId),
    };
    const dataStr = JSON.stringify(classData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `class_${cls.id}_${cls.name.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Class data downloaded successfully');
  };

  const getTutorName = (tutorId: string) => {
    const tutor = tutors.find(t => t.id === tutorId);
    return tutor ? tutor.name : 'Unknown';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'cancelled': return 'destructive';
      case 'completed': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Classes</h1>
          <p className="text-muted-foreground mt-1">Manage yoga class schedules and enrollment</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Class
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleAddClass}>
              <DialogHeader>
                <DialogTitle>Create New Class</DialogTitle>
                <DialogDescription>
                  Set up a new yoga class with schedule and details
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Class Name</Label>
                    <Input id="name" name="name" placeholder="Morning Hatha Flow" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="type">Class Type</Label>
                    <Input id="type" name="type" placeholder="Hatha Yoga" />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="tutorId">Assign Tutor</Label>
                    <Select name="tutorId">
                      <SelectTrigger>
                        <SelectValue placeholder="Select tutor" />
                      </SelectTrigger>
                      <SelectContent>
                        {tutors.filter(t => t.status === 'active').map(tutor => (
                          <SelectItem key={tutor.id} value={tutor.id}>
                            {tutor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="schedule">Schedule</Label>
                    <Input id="schedule" name="schedule" placeholder="Mon, Wed, Fri - 6:00 AM" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="duration">Duration (mins)</Label>
                    <Input id="duration" name="duration" type="number" min="15" placeholder="60" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input id="capacity" name="capacity" type="number" min="1" placeholder="20" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Class</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
 
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{classes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-green-500">
              {classes.filter(c => c.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Enrollment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {classes.reduce((sum, c) => sum + c.enrolled, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Avg Capacity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {Math.round((classes.reduce((sum, c) => sum + (c.enrolled / c.capacity * 100), 0) / classes.length))}%
            </div>
          </CardContent>
        </Card>
      </div>
 
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>All Classes</CardTitle>
            <CardDescription>View and manage class schedules</CardDescription>
          </div>

          <Button className="bg-[#610981] hover:bg-[#7a0a9f] text-white">
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by name, type, or schedule..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">ID</TableHead>
                  <TableHead>Class Name</TableHead>
                  <TableHead className="whitespace-nowrap">Type</TableHead>
                  <TableHead className="whitespace-nowrap">Tutor</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead className="whitespace-nowrap">Duration</TableHead>
                  <TableHead className="whitespace-nowrap">Enrollment</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClasses.map((cls) => (
                  <TableRow key={cls.id}>
                    <TableCell className="font-medium whitespace-nowrap">{cls.id}</TableCell>
                    <TableCell>{cls.name}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="outline">{cls.type}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{getTutorName(cls.tutorId)}</TableCell>
                    <TableCell className="text-sm">{cls.schedule}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        {cls.duration}m
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="space-y-1 min-w-[120px]">
                        <div className="flex items-center gap-2 text-sm">
                          <UsersIcon className="w-4 h-4 text-muted-foreground" />
                          {cls.enrolled}/{cls.capacity}
                        </div>
                        <Progress value={(cls.enrolled / cls.capacity) * 100} className="h-1.5" />
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant={getStatusColor(cls.status)}>
                        {cls.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingClass(cls)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClass(cls.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownloadClass(cls)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
 
      <Dialog open={!!editingClass} onOpenChange={() => setEditingClass(null)}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleEditClass}>
            <DialogHeader>
              <DialogTitle>Edit Class</DialogTitle>
              <DialogDescription>
                Update class information
              </DialogDescription>
            </DialogHeader>
            {editingClass && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-name">Class Name</Label>
                    <Input
                      id="edit-name"
                      name="name"
                      defaultValue={editingClass.name}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-type">Class Type</Label>
                    <Input
                      id="edit-type"
                      name="type"
                      defaultValue={editingClass.type}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-tutorId">Assign Tutor</Label>
                    <Select name="tutorId" defaultValue={editingClass.tutorId}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {tutors.filter(t => t.status === 'active').map(tutor => (
                          <SelectItem key={tutor.id} value={tutor.id}>
                            {tutor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-schedule">Schedule</Label>
                    <Input
                      id="edit-schedule"
                      name="schedule"
                      defaultValue={editingClass.schedule}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-duration">Duration (mins)</Label>
                    <Input
                      id="edit-duration"
                      name="duration"
                      type="number"
                      min="1"
                      defaultValue={editingClass.duration}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-capacity">Capacity</Label>
                    <Input
                      id="edit-capacity"
                      name="capacity"
                      type="number"
                      min="1"
                      defaultValue={editingClass.capacity}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select name="status" defaultValue={editingClass.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingClass(null)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}