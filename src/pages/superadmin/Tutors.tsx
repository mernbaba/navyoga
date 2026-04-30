import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { Plus, Search, Edit, Trash2, Mail, Phone, Star, Award } from "lucide-react";
import { tutors as initialTutors, type Tutor } from "../../data/mockData";
import { toast } from "sonner";

export function Tutors() {
  const [tutors, setTutors] = useState(initialTutors);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTutor, setEditingTutor] = useState<Tutor | null>(null);

  const filteredTutors = tutors.filter(tutor => 
    tutor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tutor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tutor.specialization.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAddTutor = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newTutor: Tutor = {
      id: `T${String(tutors.length + 1).padStart(3, '0')}`,
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      specialization: (formData.get('specialization') as string).split(',').map(s => s.trim()),
      experience: parseInt(formData.get('experience') as string),
      rating: 4.5,
      status: 'active',
      assignedClasses: [],
    };
    setTutors([...tutors, newTutor]);
    setIsAddOpen(false);
    toast.success('Tutor added successfully');
  };

  const handleEditTutor = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTutor) return;
    
    const formData = new FormData(e.currentTarget);
    const updatedTutor: Tutor = {
      ...editingTutor,
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      specialization: (formData.get('specialization') as string).split(',').map(s => s.trim()),
      experience: parseInt(formData.get('experience') as string),
      status: formData.get('status') as 'active' | 'on-leave' | 'inactive',
    };
    
    setTutors(tutors.map(t => t.id === editingTutor.id ? updatedTutor : t));
    setEditingTutor(null);
    toast.success('Tutor updated successfully');
  };

  const handleDeleteTutor = (id: string) => {
    setTutors(tutors.filter(t => t.id !== id));
    toast.success('Tutor removed successfully');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'on-leave': return 'secondary';
      case 'inactive': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Yoga Shikshaks</h1>
          <p className="text-muted-foreground mt-1">Manage your Yoga Shikshaks</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Yoga Shikshak
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAddTutor}>
              <DialogHeader>
                <DialogTitle>Add New Yoga Shikshak</DialogTitle>
                <DialogDescription>
                  Enter the details of the new yoga shikshak
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" placeholder="Enter yoga shikshak name" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="tutor@yogacenter.com" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" placeholder="+91 98765 43210" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input id="specialization" name="specialization" placeholder="Hatha, Vinyasa, Yin (comma separated)" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="experience">Years of Experience</Label>
                  <Input id="experience" name="experience" type="number" min="0" placeholder="5" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Yoga Shikshak</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
 
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Yoga Shikshaks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{tutors.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Yoga Shikshaks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-green-500">
              {tutors.filter(t => t.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>On Leave</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-yellow-500">
              {tutors.filter(t => t.status === 'on-leave').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Avg Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold flex items-center gap-2">
              {(tutors.reduce((sum, t) => sum + t.rating, 0) / tutors.length).toFixed(1)}
              <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>
 
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>All Yoga Shikshaks</CardTitle>
            <CardDescription>View and manage yoga shikshak information</CardDescription>
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
                placeholder="Search by name, email, or specialization..."
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
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Specialization</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Classes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTutors.map((tutor) => (
                  <TableRow key={tutor.id}>
                    <TableCell className="font-medium">{tutor.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold">
                          {tutor.name.charAt(0)}
                        </div>
                        {tutor.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          {tutor.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          {tutor.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {tutor.specialization.map((spec, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Award className="w-4 h-4 text-muted-foreground" />
                        {tutor.experience} years
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                        {tutor.rating}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(tutor.status)}>
                        {tutor.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{tutor.assignedClasses.length}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingTutor(tutor)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTutor(tutor.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
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
 
      <Dialog open={!!editingTutor} onOpenChange={() => setEditingTutor(null)}>
        <DialogContent>
          <form onSubmit={handleEditTutor}>
            <DialogHeader>
              <DialogTitle>Edit Yoga Shikshak</DialogTitle>
              <DialogDescription>
                Update yoga shikshak information
              </DialogDescription>
            </DialogHeader>
            {editingTutor && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    defaultValue={editingTutor.name}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    name="email"
                    type="email"
                    defaultValue={editingTutor.email}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    name="phone"
                    defaultValue={editingTutor.phone}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-specialization">Specialization</Label>
                  <Input
                    id="edit-specialization"
                    name="specialization"
                    defaultValue={editingTutor.specialization.join(', ')}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-experience">Years of Experience</Label>
                  <Input
                    id="edit-experience"
                    name="experience"
                    type="number"
                    defaultValue={editingTutor.experience}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select name="status" defaultValue={editingTutor.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on-leave">On Leave</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingTutor(null)}>
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