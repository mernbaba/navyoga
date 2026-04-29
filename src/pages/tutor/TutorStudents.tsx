import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Search, Mail, Phone, Info } from "lucide-react";
import { classes, students } from "../../data/mockData";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";

export function TutorStudents() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
 
  const tutorName = "Priya Sharma";
  const myClasses = classes.filter(c => c.tutor === tutorName);
  const myStudentIds = myClasses.flatMap(c => c.enrolledStudents);
  const myStudents = students.filter(s => myStudentIds.includes(s.id));

  const filteredStudents = myStudents.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.phone.includes(searchQuery)
  );

  const getStudentClasses = (studentId: string) => {
    return myClasses.filter(c => c.enrolledStudents.includes(studentId));
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold" style={{ color: '#ff691d' }}>My Students</h1>
            <p className="text-muted-foreground mt-1">Students enrolled in your classes</p>
          </div>
        </div>
 
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{myStudents.length}</div>
            </CardContent>
          </Card>
        </div>
 
        <Card>
          <CardHeader>
            <CardTitle style={{ color: '#ff691d' }}>All Students</CardTitle>
            <CardDescription>View student information and progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by name, email, or ID..."
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
                    <TableHead>Join Date</TableHead>
                    <TableHead>Membership</TableHead>
                    <TableHead>Classes Enrolled</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => {
                    const studentClasses = getStudentClasses(student.id);
                    
                    return (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#610981] to-[#ff691d] flex items-center justify-center text-white text-sm font-semibold">
                              {student.name.charAt(0)}
                            </div>
                            {student.name}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(student.joinDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {student.membershipType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {studentClasses.slice(0, 2).map((cls, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {cls.type}
                              </Badge>
                            ))}
                            {studentClasses.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{studentClasses.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                            {student.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedStudent(student)}
                          >
                            <Info className="w-4 h-4 mr-1" />
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
 
        <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle style={{ color: '#ff691d' }}>Student Details</DialogTitle>
              <DialogDescription>
                Comprehensive student information
              </DialogDescription>
            </DialogHeader>
            {selectedStudent && (
              <div className="space-y-4 py-4">
 
                <div className="p-4 rounded-lg bg-gradient-to-br from-[#610981]/10 to-[#ff691d]/5 border border-[#ffac96]/20">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#610981] to-[#ff691d] flex items-center justify-center text-white text-2xl font-semibold">
                      {selectedStudent.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{selectedStudent.name}</h3>
                      <p className="text-sm text-muted-foreground">ID: {selectedStudent.id}</p>
                      <Badge 
                        variant={selectedStudent.status === 'active' ? 'default' : 'secondary'}
                        className="mt-1"
                      >
                        {selectedStudent.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Join Date</p>
                      <p className="font-medium">{new Date(selectedStudent.joinDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Membership</p>
                      <p className="font-medium capitalize">{selectedStudent.membershipType}</p>
                    </div>
                  </div>
                </div>
 
                <div className="p-4 rounded-lg border">
                  <h4 className="font-semibold mb-3" style={{ color: '#ff691d' }}>
                    Enrolled Classes ({getStudentClasses(selectedStudent.id).length})
                  </h4>
                  <div className="space-y-2">
                    {getStudentClasses(selectedStudent.id).map((cls) => (
                      <div 
                        key={cls.id}
                        className="p-3 rounded-lg bg-[#ffac96]/10 border border-[#ffac96]/20 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium">{cls.name}</p>
                          <p className="text-sm text-muted-foreground">{cls.schedule}</p>
                        </div>
                        <Badge variant="outline">{cls.type}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}