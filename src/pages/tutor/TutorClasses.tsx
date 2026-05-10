import { useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Search, Play, Users, Clock, Calendar, CheckCircle, XCircle } from "lucide-react";
import { classes, students } from "../../data/mockData";
import { toast } from "sonner";

export function TutorClasses() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [sessionDialog, setSessionDialog] = useState(false);
  const [activeSession, setActiveSession] = useState<string | null>(null);

  // Mock tutor data
  const tutorClasses = classes.slice(0, 6);

  const filteredClasses = tutorClasses.filter(
    (cls) =>
      cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.instructor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartClass = (classItem: any) => {
    toast.success('Starting live session...');
    navigate(`/tutor/video-session?classId=${classItem.id}`);
  };

  const handleViewDetails = (classItem: any) => {
    setSelectedClass(classItem);
    setSessionDialog(true);
  };
 
  const getStudentsInClass = (classId: string) => {
    const classData = tutorClasses.find(c => c.id === classId);
    if (!classData) return [];
    return students.filter(s => classData.enrolledStudents.includes(s.id));
  };

  const handleEndSession = (classId: string) => {
    setActiveSession(null);
    toast.success('Class session ended successfully');
  };

  const confirmStartSession = () => {
    if (selectedClass) {
      setSessionDialog(false);
      handleStartClass(selectedClass);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold" style={{ color: '#ff691d' }}>My Classes</h1>
            <p className="text-muted-foreground mt-1">Manage and conduct your yoga classes</p>
          </div>
        </div>
 
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{tutorClasses.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Active Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-green-500">
                {tutorClasses.filter(c => c.status === 'active').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold" style={{ color: '#610981' }}>
                {tutorClasses.reduce((sum, c) => sum + c.enrolledStudents.length, 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Live Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold" style={{ color: '#ff691d' }}>
                {activeSession ? 1 : 0}
              </div>
            </CardContent>
          </Card>
        </div>
 
        <Card>
          <CardHeader>
            <CardTitle style={{ color: '#ff691d' }}>All Classes</CardTitle>
            <CardDescription>View and manage your assigned classes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by name, type, or instructor..."
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
                    <TableHead>Class Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClasses.map((cls) => {
                    const isLive = activeSession === cls.id;
                    const classStudents = getStudentsInClass(cls.id);
                    
                    return (
                      <TableRow key={cls.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {isLive && (
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            )}
                            {cls.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{cls.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            {cls.schedule}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            {cls.duration} mins
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            {cls.enrolledStudents.length}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-gray-200 rounded-full h-2 max-w-[80px]">
                              <div 
                                className="h-2 rounded-full"
                                style={{ 
                                  width: `${(cls.enrolledStudents.length / cls.capacity) * 100}%`,
                                  backgroundColor: '#610981'
                                }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {cls.capacity}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {isLive ? (
                            <Badge className="bg-green-500">Live Now</Badge>
                          ) : (
                            <Badge variant={cls.status === 'active' ? 'default' : 'secondary'}>
                              {cls.status}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {isLive ? (
                              <Button
                                onClick={() => handleEndSession(cls.id)}
                                variant="destructive"
                                size="sm"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                End Class
                              </Button>
                            ) : (
                              <Button
                                onClick={() => handleStartClass(cls)}
                                className="bg-linear-to-r from-[#610981] to-[#8b0fa8] hover:from-[#7a0a9f] hover:to-[#a312ca]"
                                size="sm"
                                disabled={!!activeSession}
                              >
                                <Play className="w-4 h-4 mr-1" />
                                Start Class
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
 
        <Dialog open={sessionDialog} onOpenChange={setSessionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle style={{ color: '#ff691d' }}>Start Class Session</DialogTitle>
              <DialogDescription>
                Confirm to begin the class session
              </DialogDescription>
            </DialogHeader>
            {selectedClass && (
              <div className="space-y-4 py-4">
                <div className="p-4 rounded-lg bg-linear-to-br from-[#610981]/10 to-[#ff691d]/5 border border-[#ffac96]/20">
                  <h3 className="font-semibold text-lg mb-2">{selectedClass.name}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedClass.schedule}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedClass.duration} minutes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedClass.enrolledStudents.length} students enrolled</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-[#ffac96]/10 border border-[#ffac96]/30">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Ready to start?</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Make sure you're prepared and all students are notified.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSessionDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={confirmStartSession}
                className="bg-linear-to-r from-[#610981] to-[#8b0fa8] hover:from-[#7a0a9f] hover:to-[#a312ca]"
              >
                <Play className="w-4 h-4 mr-1" />
                Start Session
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}