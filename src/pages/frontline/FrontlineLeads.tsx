import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Search, Phone, Mail, Plus, User, Calendar, Clock, MapPin, Edit } from "lucide-react";
import { toast } from "sonner";

const mockLeads = [
  { id: 1, name: 'Amit Patel', phone: '+91 98765 43210', email: 'amit.p@email.com', source: 'Website', status: 'New', interest: 'Hatha Yoga', lastContact: '2024-03-08', location: 'Mumbai' },
  { id: 2, name: 'Priya Singh', phone: '+91 98765 43211', email: 'priya.s@email.com', source: 'Facebook', status: 'Contacted', interest: 'Power Yoga', lastContact: '2024-03-07', location: 'Delhi' },
  { id: 3, name: 'Rahul Kumar', phone: '+91 98765 43212', email: 'rahul.k@email.com', source: 'Instagram', status: 'Interested', interest: 'Meditation', lastContact: '2024-03-08', location: 'Bangalore' },
  { id: 4, name: 'Neha Sharma', phone: '+91 98765 43213', email: 'neha.s@email.com', source: 'Referral', status: 'Not Interested', interest: 'Vinyasa', lastContact: '2024-03-06', location: 'Pune' },
  { id: 5, name: 'Vikram Reddy', phone: '+91 98765 43214', email: 'vikram.r@email.com', source: 'Website', status: 'Converted', interest: 'Ashtanga', lastContact: '2024-03-05', location: 'Hyderabad' },
  { id: 6, name: 'Ananya Das', phone: '+91 98765 43215', email: 'ananya.d@email.com', source: 'Google Ads', status: 'New', interest: 'Hatha Yoga', lastContact: '2024-03-08', location: 'Kolkata' },
  { id: 7, name: 'Karthik Iyer', phone: '+91 98765 43216', email: 'karthik.i@email.com', source: 'Website', status: 'Contacted', interest: 'Power Yoga', lastContact: '2024-03-07', location: 'Chennai' },
  { id: 8, name: 'Meera Verma', phone: '+91 98765 43217', email: 'meera.v@email.com', source: 'Instagram', status: 'Interested', interest: 'Meditation', lastContact: '2024-03-08', location: 'Jaipur' },
];

export function FrontlineLeads() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [addDialog, setAddDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");

  const filteredLeads = mockLeads.filter(
    (lead) => {
      const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone.includes(searchQuery) ||
        lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.location.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = filterStatus === "All" || lead.status === filterStatus;
      
      return matchesSearch && matchesFilter;
    }
  );

  const handleViewLead = (lead: any) => {
    setSelectedLead(lead);
    setViewDialog(true);
  };

  const handleCall = (lead: any) => {
    toast.success(`Calling ${lead.name}...`);
  };

  const handleEmail = (lead: any) => {
    toast.success(`Opening email to ${lead.name}...`);
  };

  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Lead added successfully');
    setAddDialog(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Contacted': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Interested': return 'bg-green-100 text-green-800 border-green-200';
      case 'Converted': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Not Interested': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return '';
    }
  };

  const statusOptions = ["All", "New", "Contacted", "Interested", "Converted", "Not Interested"];

  return (
    <div className="p-6 lg:p-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold" style={{ color: '#ff691d' }}>Lead Management</h1>
            <p className="text-muted-foreground mt-1">Track and manage your leads effectively</p>
          </div>
          <Button 
            onClick={() => setAddDialog(true)}
            className="bg-gradient-to-r from-[#610981] to-[#8b0fa8] hover:from-[#7a0a9f] hover:to-[#a312ca]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Lead
          </Button>
        </div>
 
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockLeads.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">New</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {mockLeads.filter(l => l.status === 'New').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Contacted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {mockLeads.filter(l => l.status === 'Contacted').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Interested</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {mockLeads.filter(l => l.status === 'Interested').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Converted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: '#610981' }}>
                {mockLeads.filter(l => l.status === 'Converted').length}
              </div>
            </CardContent>
          </Card>
        </div>
 
        <Card>
          <CardHeader>
            <CardTitle style={{ color: '#ff691d' }}>All Leads</CardTitle>
            <CardDescription>View and manage all your leads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search and Filter */}
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search by name, phone, email, or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  {statusOptions.map((status) => (
                    <Button
                      key={status}
                      variant={filterStatus === status ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterStatus(status)}
                      className={filterStatus === status ? "bg-[#610981]" : ""}
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>
 
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Interest</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Contact</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#610981] to-[#8b0fa8] flex items-center justify-center text-white text-sm font-semibold">
                              {lead.name.charAt(0)}
                            </div>
                            {lead.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-3 h-3 text-muted-foreground" />
                              {lead.phone}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Mail className="w-3 h-3" />
                              {lead.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{lead.source}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{lead.interest}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            {lead.location}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(lead.status)}>
                            {lead.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {lead.lastContact}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              onClick={() => handleCall(lead)}
                              size="sm"
                              className="bg-gradient-to-r from-[#610981] to-[#8b0fa8] hover:from-[#7a0a9f] hover:to-[#a312ca]"
                            >
                              <Phone className="w-3 h-3 mr-1" />
                              Call
                            </Button>
                            <Button
                              onClick={() => handleViewLead(lead)}
                              variant="outline"
                              size="sm"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              View
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
 
        <Dialog open={viewDialog} onOpenChange={setViewDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle style={{ color: '#ff691d' }}>Lead Details</DialogTitle>
              <DialogDescription>View and update lead information</DialogDescription>
            </DialogHeader>
            {selectedLead && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium" style={{ color: '#ffac96' }}>Full Name</Label>
                    <Input defaultValue={selectedLead.name} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium" style={{ color: '#ffac96' }}>Phone</Label>
                    <Input defaultValue={selectedLead.phone} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium" style={{ color: '#ffac96' }}>Email</Label>
                    <Input defaultValue={selectedLead.email} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium" style={{ color: '#ffac96' }}>Location</Label>
                    <Input defaultValue={selectedLead.location} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium" style={{ color: '#ffac96' }}>Source</Label>
                    <Input defaultValue={selectedLead.source} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium" style={{ color: '#ffac96' }}>Interest</Label>
                    <Input defaultValue={selectedLead.interest} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium" style={{ color: '#ffac96' }}>Status</Label>
                    <select className="w-full mt-1 px-3 py-2 border rounded-md">
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Interested">Interested</option>
                      <option value="Converted">Converted</option>
                      <option value="Not Interested">Not Interested</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium" style={{ color: '#ffac96' }}>Last Contact</Label>
                    <Input defaultValue={selectedLead.lastContact} type="date" className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium" style={{ color: '#ffac96' }}>Notes</Label>
                  <textarea 
                    className="w-full mt-1 px-3 py-2 border rounded-md min-h-[100px]" 
                    placeholder="Add notes about this lead..."
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  toast.success('Lead updated successfully');
                  setViewDialog(false);
                }}
                className="bg-gradient-to-r from-[#610981] to-[#8b0fa8] hover:from-[#7a0a9f] hover:to-[#a312ca]"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
 
        <Dialog open={addDialog} onOpenChange={setAddDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle style={{ color: '#ff691d' }}>Add New Lead</DialogTitle>
              <DialogDescription>Enter the details of the new lead</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddLead}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium" style={{ color: '#ffac96' }}>Full Name</Label>
                    <Input placeholder="Enter full name" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium" style={{ color: '#ffac96' }}>Phone</Label>
                    <Input placeholder="+91 XXXXX XXXXX" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium" style={{ color: '#ffac96' }}>Email</Label>
                    <Input type="email" placeholder="email@example.com" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium" style={{ color: '#ffac96' }}>Location</Label>
                    <Input placeholder="City name" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium" style={{ color: '#ffac96' }}>Source</Label>
                    <select className="w-full mt-1 px-3 py-2 border rounded-md">
                      <option value="">Select source</option>
                      <option value="Website">Website</option>
                      <option value="Facebook">Facebook</option>
                      <option value="Instagram">Instagram</option>
                      <option value="Google Ads">Google Ads</option>
                      <option value="Referral">Referral</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium" style={{ color: '#ffac96' }}>Interest</Label>
                    <Input placeholder="e.g., Hatha Yoga" className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium" style={{ color: '#ffac96' }}>Initial Notes</Label>
                  <textarea 
                    className="w-full mt-1 px-3 py-2 border rounded-md min-h-[100px]" 
                    placeholder="Add any initial notes..."
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setAddDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-gradient-to-r from-[#610981] to-[#8b0fa8] hover:from-[#7a0a9f] hover:to-[#a312ca]"
                >
                  Add Lead
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
