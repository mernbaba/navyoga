import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Search, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { toast } from "sonner";
import { getTutorStudents } from "../../api/tutorStudents";
import { StudentAvatar } from "../../components/student/StudentAvatar";
import type { TutorStudentItem } from "../../api/types";

const PAGE_SIZE = 20;

export function TutorStudents() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<TutorStudentItem | null>(null);
  const [items, setItems] = useState<TutorStudentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    setIsLoading(true);
    getTutorStudents("TUTOR", { page, limit: PAGE_SIZE, search: debouncedSearch || undefined })
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Failed to load students.";
        toast.error(msg);
      })
      .finally(() => setIsLoading(false));
  }, [page, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold" style={{ color: "#ff691d" }}>My Sādhakas</h1>
            <p className="text-muted-foreground mt-1">Sādhakas enrolled in your classes</p>
          </div>
        </div>

        {/* <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{isLoading ? "-" : total}</div>
            </CardContent>
          </Card>
        </div> */}

        <Card>
          <CardHeader>
            <CardTitle style={{ color: "#ff691d" }}>All Sādhakas</CardTitle>
            <CardDescription>View sādhaka information and progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700 w-4 h-4 z-10 pointer-events-none" />
                <Input
                  placeholder="Search by name…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead>Membership</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Loading…
                      </TableCell>
                    </TableRow>
                  ) : items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No sādhakas found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <StudentAvatar avatar={student.avatar} name={student.name} className="size-8 shrink-0" />
                            <span>{student.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(student.joinDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {student.membershipType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={student.status === "active" ? "default" : "secondary"}>
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
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages} ({total} sādhakas)
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p - 1)}
                    disabled={page <= 1 || isLoading}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= totalPages || isLoading}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle style={{ color: "#ff691d" }}>Sādhaka Details</DialogTitle>
              <DialogDescription>Comprehensive sādhaka information</DialogDescription>
            </DialogHeader>
            {selectedStudent && (
              <div className="space-y-4 py-4">
                <div className="p-4 rounded-lg bg-linear-to-br from-[#610981]/10 to-[#ff691d]/5 border border-[#ffac96]/20">
                  <div className="flex items-center gap-4 mb-4">
                    <StudentAvatar
                      avatar={selectedStudent.avatar}
                      name={selectedStudent.name}
                      className="size-16 text-2xl"
                    />
                    <div>
                      <h3 className="text-lg font-semibold">{selectedStudent.name}</h3>
                      <Badge
                        variant={selectedStudent.status === "active" ? "default" : "secondary"}
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
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
