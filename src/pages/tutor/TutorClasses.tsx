import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Search, Play, Clock, Calendar, RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { listTutorClasses, type TutorClassesStatusFilter } from "../../api/classes";
import type { TutorAssignedClass } from "../../api/types";
import { formatISTDateTime, isWithinJoinWindow, JOIN_WINDOW_MINUTES } from "../../lib/datetime";
import { Progress } from "../../components/ui/progress";
import { useRecordingUploads } from "../../context/RecordingUploadContext";

function formatBytes(bytes: number): string {
  if (!bytes) return "";
  const gb = bytes / 1024 ** 3;
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  const mb = bytes / 1024 ** 2;
  return `${mb.toFixed(0)} MB`;
}

type StatusTab = "upcoming" | "past";

const PAGE_SIZE = 10;

function isJoinable(cls: TutorAssignedClass): boolean {
  return isWithinJoinWindow({
    scheduledAt: cls.scheduledAt,
    durationMinutes: cls.duration,
    isLive: cls.state === "LIVE",
  });
}

// The API can return `state: "UPCOMING"` for a class whose scheduled window is
// actually in progress (it only flips to "LIVE" once the tutor starts it), so
// derive the live state from the clock too: ongoing = explicitly LIVE, or now
// sits between the scheduled start and start + duration.
function isOngoing(cls: TutorAssignedClass): boolean {
  if (cls.state === "LIVE") return true;
  if (cls.state === "PAST" || !cls.scheduledAt) return false;
  const start = new Date(cls.scheduledAt).getTime();
  if (Number.isNaN(start)) return false;
  const end = start + (cls.duration ?? 0) * 60_000;
  const now = Date.now();
  return now >= start && now <= end;
}

// Same reasoning as isOngoing: the backend only flips state to "PAST" on its
// own schedule, so a class whose scheduled window has already elapsed can
// still come back as "UPCOMING". Derive "ended" from the clock as well so the
// UI doesn't keep calling a finished class upcoming.
function hasEnded(cls: TutorAssignedClass): boolean {
  if (cls.state === "PAST") return true;
  if (cls.state === "LIVE" || !cls.scheduledAt) return false;
  const start = new Date(cls.scheduledAt).getTime();
  if (Number.isNaN(start)) return false;
  const end = start + (cls.duration ?? 0) * 60_000;
  return Date.now() > end;
}

function formatSchedule(value: string | null): string {
  return formatISTDateTime(value, "-");
}

function difficultyTone(difficulty: TutorAssignedClass["difficulty"]) {
  switch (difficulty) {
    case "EASY":
      return "bg-green-50 text-green-700 border-green-200";
    case "MEDIUM":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "HARD":
      return "bg-rose-50 text-rose-700 border-rose-200";
  }
}

export function TutorClasses() {
  const navigate = useNavigate();
  const { uploads } = useRecordingUploads();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusTab, setStatusTab] = useState<StatusTab>("upcoming");
  const [items, setItems] = useState<TutorAssignedClass[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<TutorAssignedClass | null>(null);
  const [sessionDialog, setSessionDialog] = useState(false);

  const fetchClasses = async (mode: "initial" | "refresh" = "initial") => {
    if (mode === "initial") setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const statusParam: TutorClassesStatusFilter =
        statusTab === "past" ? "past" : "upcoming";
      const response = await listTutorClasses("TUTOR", {
        page: 1,
        limit: PAGE_SIZE,
        status: statusParam,
      });
      setItems(response.items);
      setTotal(response.total);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load classes.";
      setError(message);
      if (mode === "refresh") toast.error(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchClasses("initial");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusTab]);

  const filteredClasses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter((cls) => {
      return (
        cls.title.toLowerCase().includes(q) ||
        cls.yogaType.toLowerCase().includes(q) ||
        (cls.batch?.name.toLowerCase().includes(q) ?? false)
      );
    });
  }, [items, searchQuery]);

  const upcomingCount = useMemo(() => items.filter((c) => c.state === "UPCOMING").length, [items]);
  const nextClass = useMemo(() => {
    const upcoming = items
      .filter((c) => !hasEnded(c) && c.scheduledAt && !isOngoing(c))
      .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime());
    return upcoming[0] ?? null;
  }, [items]);
  const lastClass = useMemo(() => items[0] ?? null, [items]);

  // Pin any ongoing class to the top, then order chronologically — soonest
  // first for upcoming, most recent first for past.
  const sortedClasses = useMemo(() => {
    return [...filteredClasses].sort((a, b) => {
      const aOngoing = isOngoing(a);
      const bOngoing = isOngoing(b);
      if (aOngoing !== bOngoing) return aOngoing ? -1 : 1;
      const at = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
      const bt = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
      return statusTab === "past" ? bt - at : at - bt;
    });
  }, [filteredClasses, statusTab]);

  // Legacy mesh path. The "Join (Old)" button that calls this is commented
  // out in the table below; keep this handler so re-enabling is a one-line
  // uncomment.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleStartClass = (classItem: TutorAssignedClass) => {
    toast.success("Starting live session...");
    navigate(`/tutor/video-session?classId=${classItem.id}`);
  };

  // SFU path — now the default for all Join buttons.
  const handleStartClassSfu = (classItem: TutorAssignedClass) => {
    toast.success("Starting live session...");
    navigate(`/tutor/video-session?classId=${classItem.id}&mode=sfu`);
  };

  const handleViewDetails = (classItem: TutorAssignedClass) => {
    setSelectedClass(classItem);
    setSessionDialog(true);
  };

  const confirmStartSession = () => {
    if (selectedClass) {
      setSessionDialog(false);
      handleStartClassSfu(selectedClass);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold" style={{ color: "#ff691d" }}>My Classes</h1>
            <p className="text-muted-foreground mt-1">Manage and conduct your assigned yoga classes</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchClasses("refresh")}
            disabled={isLoading || isRefreshing}
            className="h-9"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Stats cards (Assigned/Past, Upcoming, Next Up/Most Recent) — hidden for now.
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>{statusTab === "past" ? "Past" : "Assigned"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {statusTab === "past" ? "Recently ended" : "Live + upcoming"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Upcoming</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold" style={{ color: "#610981" }}>{upcomingCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Scheduled ahead</p>
            </CardContent>
          </Card>
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>{statusTab === "past" ? "Most Recent" : "Next Up"}</CardTitle>
            </CardHeader>
            <CardContent className="min-w-0">
              {statusTab === "past" ? (
                <>
                  <div className="text-base font-semibold truncate" style={{ color: "#ff691d" }}>
                    {lastClass?.title ?? "-"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {lastClass ? formatSchedule(lastClass.scheduledAt) : "No past class"}
                  </p>
                </>
              ) : (
                <>
                  <div className="text-base font-semibold truncate" style={{ color: "#ff691d" }}>
                    {nextClass?.title ?? "-"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {nextClass ? formatSchedule(nextClass.scheduledAt) : "No upcoming class"}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
        */}

        <Card>
          <CardContent className="pt-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700 w-4 h-4 z-10 pointer-events-none" />
                <Input
                  placeholder="Search by title, yoga type, or batch..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Tabs value={statusTab} onValueChange={(v) => setStatusTab(v as StatusTab)}>
                <TabsList>
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="past">Past</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {error ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-center">
                <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                <p className="text-sm text-rose-700 mb-3">{error}</p>
                <Button size="sm" variant="outline" onClick={() => fetchClasses("refresh")}>
                  Try again
                </Button>
              </div>
            ) : (
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Schedule</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 4 }).map((_, idx) => (
                        <TableRow key={`skeleton-${idx}`}>
                          {Array.from({ length: 7 }).map((__, ci) => (
                            <TableCell key={ci}>
                              <div className="h-4 w-full max-w-[140px] rounded bg-gray-100 animate-pulse" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : sortedClasses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10 text-sm text-muted-foreground">
                          {searchQuery
                            ? "No classes match your search."
                            : statusTab === "past"
                              ? "No past classes yet."
                              : "No upcoming classes scheduled."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedClasses.map((cls) => {
                        const isLive = cls.state === "LIVE";
                        const ongoing = isOngoing(cls);
                        const ended = hasEnded(cls);
                        const upload = uploads[cls.id];
                        return (
                          <TableRow key={cls.id}>
                            <TableCell className="font-medium">
                              <button
                                type="button"
                                onClick={() => handleViewDetails(cls)}
                                className="flex items-center gap-2 text-left hover:underline"
                              >
                                {ongoing && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
                                <span className="truncate max-w-[220px]">{cls.title}</span>
                              </button>
                              {upload && (
                                <div className="mt-2 w-full max-w-[220px]">
                                  {upload.status === "error" ? (
                                    <div className="space-y-1">
                                      <p className="text-xs text-rose-600">
                                        {upload.error ?? "Recording upload failed"}
                                      </p>
                                      {upload.retry && (
                                        <button
                                          type="button"
                                          onClick={upload.retry}
                                          className="text-xs font-medium text-primary hover:underline"
                                        >
                                          Retry upload
                                        </button>
                                      )}
                                    </div>
                                  ) : upload.status === "done" ? (
                                    <p className="text-xs text-green-600">
                                      Recording uploaded
                                    </p>
                                  ) : (
                                    <>
                                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>
                                          {upload.status === "saving"
                                            ? "Finalizing recording…"
                                            : upload.status === "retrying"
                                              ? "Connection issue - retrying…"
                                              : "Uploading recording…"}
                                        </span>
                                        <span className="tabular-nums font-medium">
                                          {upload.progress}%
                                        </span>
                                      </div>
                                      <Progress
                                        value={upload.progress}
                                        className="mt-1 h-1.5"
                                      />
                                      {upload.totalBytes > 0 && (
                                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                                          {formatBytes(
                                            (upload.totalBytes * upload.progress) / 100,
                                          )}{" "}
                                          / {formatBytes(upload.totalBytes)}
                                        </p>
                                      )}
                                    </>
                                  )}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{cls.yogaType}</Badge>
                                <Badge variant="outline" className={difficultyTone(cls.difficulty)}>
                                  {cls.difficulty.toLowerCase()}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {cls.batch?.name ?? "-"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="w-3 h-3 text-muted-foreground" />
                                {formatSchedule(cls.scheduledAt)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="w-3 h-3 text-muted-foreground" />
                                {cls.duration} mins
                              </div>
                            </TableCell>
                            <TableCell>
                              {ended ? (
                                <Badge variant="outline">Ended</Badge>
                              ) : ongoing ? (
                                <Badge className="bg-green-500 hover:bg-green-500/90">Live Now</Badge>
                              ) : (
                                <Badge variant="secondary">Upcoming</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {ended ? (
                                  <span className="text-sm text-muted-foreground">-</span>
                                ) : (
                                  <>
                                    {/* Join (Old) — legacy mesh session, superseded by the SFU session below */}
                                    {/* <Button
                                      onClick={() => handleStartClass(cls)}
                                      className="bg-linear-to-r from-[#610981] to-[#8b0fa8] hover:from-[#7a0a9f] hover:to-[#a312ca]"
                                      size="sm"
                                      disabled={!isJoinable(cls)}
                                      title={!isJoinable(cls) ? `Available ${JOIN_WINDOW_MINUTES} minutes before class` : undefined}
                                    >
                                      <Play className="w-4 h-4 mr-1" />
                                      {cls.kind === "YTT_LIVE" ? "Join (Old)" : isLive ? "Rejoin (Old)" : "Start (Old)"}
                                    </Button> */}
                                    <Button
                                      onClick={() => handleStartClassSfu(cls)}
                                      className="bg-linear-to-r from-[#610981] to-[#8b0fa8] hover:from-[#7a0a9f] hover:to-[#a312ca]"
                                      size="sm"
                                      disabled={!isJoinable(cls)}
                                      title={!isJoinable(cls) ? `Available ${JOIN_WINDOW_MINUTES} minutes before class` : undefined}
                                    >
                                      <Play className="w-4 h-4 mr-1" />
                                      {cls.kind === "YTT_LIVE" ? "Join" : isLive ? "Rejoin" : "Start"}
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={sessionDialog} onOpenChange={setSessionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle style={{ color: "#ff691d" }}>Class Details</DialogTitle>
              <DialogDescription>Review session info before joining</DialogDescription>
            </DialogHeader>
            {selectedClass && (
              <div className="space-y-4 py-4">
                <div className="p-4 rounded-lg bg-linear-to-br from-[#610981]/10 to-[#ff691d]/5 border border-[#ffac96]/20">
                  <h3 className="font-semibold text-lg mb-2">{selectedClass.title}</h3>
                  {selectedClass.description && (
                    <p className="text-sm text-muted-foreground mb-3">{selectedClass.description}</p>
                  )}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{formatSchedule(selectedClass.scheduledAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedClass.duration} minutes</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Badge variant="outline">{selectedClass.yogaType}</Badge>
                      <Badge variant="outline" className={difficultyTone(selectedClass.difficulty)}>
                        {selectedClass.difficulty.toLowerCase()}
                      </Badge>
                      {selectedClass.batch && (
                        <Badge variant="outline">Batch · {selectedClass.batch.name}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSessionDialog(false)}>
                Close
              </Button>
              <Button
                onClick={confirmStartSession}
                className="bg-linear-to-r from-[#610981] to-[#8b0fa8] hover:from-[#7a0a9f] hover:to-[#a312ca]"
                disabled={!selectedClass || !isJoinable(selectedClass)}
                title={selectedClass && !isJoinable(selectedClass) ? `Available ${JOIN_WINDOW_MINUTES} minutes before class` : undefined}
              >
                <Play className="w-4 h-4 mr-1" />
                {selectedClass?.kind === "YTT_LIVE"
                  ? "Join Session"
                  : selectedClass?.state === "LIVE"
                    ? "Rejoin Session"
                    : "Start Session"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
