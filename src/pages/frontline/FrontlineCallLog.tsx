import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Search, Phone, Clock, Calendar, Plus, Filter, PhoneCall, PhoneIncoming, PhoneMissed } from "lucide-react";
import { toast } from "sonner";

const mockCallLog = [
  { id: 1, leadName: 'Amit Patel', phone: '+91 98765 43210', date: '2024-03-08', time: '10:30 AM', duration: '5m 23s', status: 'Connected', outcome: 'Interested', notes: 'Interested in morning batch' },
  { id: 2, leadName: 'Priya Singh', phone: '+91 98765 43211', date: '2024-03-08', time: '11:15 AM', duration: '-', status: 'No Answer', outcome: 'Follow-up', notes: 'Try again in evening' },
  { id: 3, leadName: 'Rahul Kumar', phone: '+91 98765 43212', date: '2024-03-08', time: '12:00 PM', duration: '8m 45s', status: 'Connected', outcome: 'Converted', notes: 'Enrolled in Power Yoga' },
  { id: 4, leadName: 'Neha Sharma', phone: '+91 98765 43213', date: '2024-03-08', time: '2:30 PM', duration: '3m 12s', status: 'Connected', outcome: 'Not Interested', notes: 'Not looking currently' },
  { id: 5, leadName: 'Vikram Reddy', phone: '+91 98765 43214', date: '2024-03-07', time: '9:00 AM', duration: '7m 30s', status: 'Connected', outcome: 'Interested', notes: 'Wants weekend classes' },
  { id: 6, leadName: 'Ananya Das', phone: '+91 98765 43215', date: '2024-03-07', time: '3:45 PM', duration: '-', status: 'Busy', outcome: 'Follow-up', notes: 'Call back tomorrow' },
  { id: 7, leadName: 'Karthik Iyer', phone: '+91 98765 43216', date: '2024-03-07', time: '5:00 PM', duration: '6m 15s', status: 'Connected', outcome: 'Interested', notes: 'Needs pricing details' },
  { id: 8, leadName: 'Meera Verma', phone: '+91 98765 43217', date: '2024-03-06', time: '11:30 AM', duration: '4m 50s', status: 'Connected', outcome: 'Converted', notes: 'Enrolled in Meditation' },
];

export function FrontlineCallLog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCall, setSelectedCall] = useState<any>(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [addDialog, setAddDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");

  const filteredCalls = mockCallLog.filter(
    (call) => {
      const matchesSearch = call.leadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        call.phone.includes(searchQuery);
      
      const matchesFilter = filterStatus === "All" || call.status === filterStatus;
      
      return matchesSearch && matchesFilter;
    }
  );

  const handleViewCall = (call: any) => {
    setSelectedCall(call);
    setViewDialog(true);
  };

  const handleAddCall = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Call log added successfully');
    setAddDialog(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Connected': return <PhoneCall className="w-4 h-4 text-green-600" />;
      case 'No Answer': return <PhoneMissed className="w-4 h-4 text-red-600" />;
      case 'Busy': return <PhoneIncoming className="w-4 h-4 text-yellow-600" />;
      default: return <Phone className="w-4 h-4" />;
    }
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'Converted': return 'bg-green-100 text-green-800 border-green-200';
      case 'Interested': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Not Interested': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Follow-up': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return '';
    }
  };

  const statusOptions = ["All", "Connected", "No Answer", "Busy"];
  const todayCalls = mockCallLog.filter(c => c.date === '2024-03-08').length;
  const connectedCalls = mockCallLog.filter(c => c.status === 'Connected').length;
  const totalDuration = mockCallLog
    .filter(c => c.duration !== '-')
    .reduce((acc, c) => {
      const [mins, secs] = c.duration.replace('m', '').replace('s', '').split(' ');
      return acc + parseInt(mins) * 60 + parseInt(secs);
    }, 0);

  const avgDuration = Math.floor(totalDuration / connectedCalls / 60);

  return (
    <div className="p-6 lg:p-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold" style={{ color: '#ff691d' }}>Call Log</h1>
            <p className="text-muted-foreground mt-1">Track all your call activities</p>
          </div>
          <Button 
            onClick={() => setAddDialog(true)}
            className="bg-gradient-to-r from-[#610981] to-[#8b0fa8] hover:from-[#7a0a9f] hover:to-[#a312ca]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Log Call
          </Button>
        </div>
 
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Today's Calls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5" style={{ color: '#ff691d' }} />
                <div className="text-2xl font-bold">{todayCalls}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Connected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-green-600" />
                <div className="text-2xl font-bold text-green-600">{connectedCalls}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Avg Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" style={{ color: '#610981' }} />
                <div className="text-2xl font-bold" style={{ color: '#610981' }}>{avgDuration}m</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-blue-600" />
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round((connectedCalls / mockCallLog.length) * 100)}%
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
 
        <Card>
          <CardHeader>
            <CardTitle style={{ color: '#ff691d' }}>All Calls</CardTitle>
            <CardDescription>Complete history of all call activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search and Filter */}
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search by name or phone..."
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
                      <TableHead>Lead Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Outcome</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCalls.map((call) => (
                      <TableRow key={call.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#610981] to-[#8b0fa8] flex items-center justify-center text-white text-sm font-semibold">
                              {call.leadName.charAt(0)}
                            </div>
                            {call.leadName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            {call.phone}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="w-3 h-3 text-muted-foreground" />
                              {call.date}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {call.time}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm font-medium">{call.duration}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(call.status)}
                            <span className="text-sm">{call.status}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getOutcomeColor(call.outcome)}>
                            {call.outcome}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <p className="text-sm text-muted-foreground truncate">{call.notes}</p>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            onClick={() => handleViewCall(call)}
                            variant="outline"
                            size="sm"
                          >
                            View Details
                          </Button>
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
              <DialogTitle style={{ color: '#ff691d' }}>Call Details</DialogTitle>
              <DialogDescription>Complete information about this call</DialogDescription>
            </DialogHeader>
            {selectedCall && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-gradient-to-br from-[#610981]/10 to-[#ff691d]/5 border border-[#ffac96]/20">
                  <h3 className="font-semibold text-lg mb-2">{selectedCall.leadName}</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedCall.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedCall.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedCall.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>Duration: {selectedCall.duration}</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium" style={{ color: '#ffac96' }}>Call Status</Label>
                    <div className="mt-2 flex items-center gap-2">
                      {getStatusIcon(selectedCall.status)}
                      <Badge variant="outline">{selectedCall.status}</Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium" style={{ color: '#ffac96' }}>Outcome</Label>
                    <div className="mt-2">
                      <Badge className={getOutcomeColor(selectedCall.outcome)}>
                        {selectedCall.outcome}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium" style={{ color: '#ffac96' }}>Call Notes</Label>
                  <div className="mt-2 p-3 rounded-lg bg-gray-50 border">
                    <p className="text-sm">{selectedCall.notes}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium" style={{ color: '#ffac96' }}>Follow-up Action</Label>
                  <textarea 
                    className="w-full mt-2 px-3 py-2 border rounded-md min-h-[80px]" 
                    placeholder="Add follow-up actions or notes..."
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewDialog(false)}>
                Close
              </Button>
              <Button 
                onClick={() => {
                  toast.success('Follow-up action saved');
                  setViewDialog(false);
                }}
                className="bg-gradient-to-r from-[#610981] to-[#8b0fa8] hover:from-[#7a0a9f] hover:to-[#a312ca]"
              >
                Save Follow-up
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
 
        <Dialog open={addDialog} onOpenChange={setAddDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle style={{ color: '#ff691d' }}>Log New Call</DialogTitle>
              <DialogDescription>Record details of a call</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddCall}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium" style={{ color: '#ffac96' }}>Lead Name</Label>
                    <Input placeholder="Enter lead name" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium" style={{ color: '#ffac96' }}>Phone</Label>
                    <Input placeholder="+91 XXXXX XXXXX" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium" style={{ color: '#ffac96' }}>Date</Label>
                    <Input type="date" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium" style={{ color: '#ffac96' }}>Time</Label>
                    <Input type="time" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium" style={{ color: '#ffac96' }}>Duration</Label>
                    <Input placeholder="e.g., 5m 30s" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium" style={{ color: '#ffac96' }}>Call Status</Label>
                    <select className="w-full mt-1 px-3 py-2 border rounded-md">
                      <option value="">Select status</option>
                      <option value="Connected">Connected</option>
                      <option value="No Answer">No Answer</option>
                      <option value="Busy">Busy</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm font-medium" style={{ color: '#ffac96' }}>Outcome</Label>
                    <select className="w-full mt-1 px-3 py-2 border rounded-md">
                      <option value="">Select outcome</option>
                      <option value="Interested">Interested</option>
                      <option value="Converted">Converted</option>
                      <option value="Not Interested">Not Interested</option>
                      <option value="Follow-up">Follow-up Required</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium" style={{ color: '#ffac96' }}>Call Notes</Label>
                  <textarea 
                    className="w-full mt-1 px-3 py-2 border rounded-md min-h-[100px]" 
                    placeholder="Add notes about this call..."
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
                  Log Call
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
