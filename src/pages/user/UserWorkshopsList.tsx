import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  Calendar,
  Users,
  Clock,
  Star,
  IndianRupee,
  Sparkles,
  Trophy,
  TrendingUp,
  ListVideo,
  PlayCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useRazorpay } from "react-razorpay";
import {
  enrollInFreeWorkshop,
  getMyWorkshopEnrollment,
  getWorkshop,
  listMyWorkshopEnrolledIds,
  listUpcomingWorkshops,
} from "../../api/workshops";
import { initiatePayment, verifyPayment } from "../../api/payments";
import type {
  Workshop,
  WorkshopMode,
  WorkshopSession,
  WorkshopWithSessions,
} from "../../api/types";
import { resolveMediaUrl } from "../../lib/media";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1506126613408-eca07ce68773";

function modeColor(mode: WorkshopMode) {
  switch (mode) {
    case "LIVE": return "#ef4444";
    case "RECORDED": return "#3b82f6";
    case "HYBRID": return "#8b5cf6";
  }
}

function levelLabel(level: string) {
  return level === "ALL_LEVELS" ? "All Levels" : level.charAt(0) + level.slice(1).toLowerCase();
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function UserWorkshopsList() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [isRegistering, setIsRegistering] = useState(false);
  const { Razorpay } = useRazorpay();

  // Detail dialog
  const [detail, setDetail] = useState<WorkshopWithSessions | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listUpcomingWorkshops("STUDENT", { limit: 20 })
      .then(async (page) => {
        if (cancelled) return;
        setWorkshops(page.items);

        // Resolve enrollment IDs via fastest available source. Try the bulk
        // endpoint first; if it isn't reachable we fall back to per-workshop
        // checks (the endpoint that already powers the detail click).
        const ids = new Set<string>(
          page.items.filter((w) => w.isEnrolled).map((w) => w.id),
        );

        try {
          const { workshopIds } = await listMyWorkshopEnrolledIds("STUDENT");
          for (const id of workshopIds) ids.add(id);
        } catch {
          const results = await Promise.all(
            page.items.map((w) =>
              getMyWorkshopEnrollment("STUDENT", w.id)
                .then((r) => (r.enrolled ? w.id : null))
                .catch(() => null),
            ),
          );
          for (const id of results) if (id) ids.add(id);
        }

        if (cancelled) return;
        if (ids.size) {
          setEnrolledIds((prev) => {
            const next = new Set(prev);
            for (const id of ids) next.add(id);
            return next;
          });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled)
          toast.error(err instanceof Error ? err.message : "Failed to load workshops.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const totalCapacity = workshops.reduce((sum, w) => sum + (w.capacity ?? 0), 0);
  const upcomingCount = workshops.filter((w) => {
    if (!w.startDate) return true;
    return new Date(w.startDate).getTime() > Date.now();
  }).length;

  const stats = [
    {
      label: "Total Workshops",
      value: workshops.length.toString(),
      icon: Calendar,
      color: "#ff691d",
      gradient: "from-orange-500 to-red-500",
    },
    {
      label: "Registered",
      value: enrolledIds.size.toString(),
      icon: Star,
      color: "#10b981",
      gradient: "from-green-500 to-teal-500",
    },
    {
      label: "Upcoming",
      value: upcomingCount.toString(),
      icon: TrendingUp,
      color: "#610981",
      gradient: "from-purple-600 to-pink-600",
    },
    {
      label: "Total Capacity",
      value: totalCapacity.toString(),
      icon: Trophy,
      color: "#f59e0b",
      gradient: "from-yellow-500 to-orange-500",
    },
  ];

  function markEnrolled(id: string) {
    setEnrolledIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setWorkshops((prev) =>
      prev.map((w) => (w.id === id ? { ...w, enrollmentCount: w.enrollmentCount + 1 } : w)),
    );
    setDetail((prev) =>
      prev && prev.id === id ? { ...prev, enrollmentCount: prev.enrollmentCount + 1 } : prev,
    );
  }

  async function openDetail(w: Workshop) {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetail(null);
    try {
      const [full, enrollment] = await Promise.all([
        getWorkshop("STUDENT", w.id),
        getMyWorkshopEnrollment("STUDENT", w.id).catch(() => ({ enrolled: false, enrollment: null })),
      ]);
      setDetail(full);
      if (enrollment.enrolled) {
        setEnrolledIds((prev) => {
          const next = new Set(prev);
          next.add(w.id);
          return next;
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load workshop.");
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleRegister(workshop: WorkshopWithSessions) {
    if (isRegistering) return;
    const priceNum = Number(workshop.price);

    if (priceNum === 0) {
      setIsRegistering(true);
      try {
        await enrollInFreeWorkshop("STUDENT", workshop.id);
        toast.success(`Enrolled in ${workshop.title}!`);
        markEnrolled(workshop.id);
        setDetailOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to enroll.");
      } finally {
        setIsRegistering(false);
      }
      return;
    }

    setIsRegistering(true);
    setDetailOpen(false);
    try {
      const paymentData = await initiatePayment("STUDENT", {
        type: "WORKSHOP",
        entityId: workshop.id,
      });

      document.body.style.overflow = "hidden";
      try {
        await new Promise<void>((resolve, reject) => {
          const rzp = new Razorpay({
            key: paymentData.key,
            amount: paymentData.amount,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            currency: paymentData.currency as any,
            order_id: paymentData.orderId,
            name: "NavYoga",
            description: workshop.title,
            handler: async (response) => {
              try {
                await verifyPayment("STUDENT", {
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                });
                toast.success(`Payment successful! Enrolled in ${workshop.title}.`);
                markEnrolled(workshop.id);
                resolve();
              } catch (err) {
                reject(err);
              }
            },
            modal: { ondismiss: () => reject(new Error("__dismissed__")) },
          });
          rzp.open();
        });
      } finally {
        document.body.style.overflow = "";
      }
    } catch (err) {
      if (err instanceof Error && err.message === "__dismissed__") {
        toast.info("Payment cancelled.");
      } else {
        toast.error(err instanceof Error ? err.message : "Payment failed. Please try again.");
      }
    } finally {
      setIsRegistering(false);
    }
  }

  const isFull = (w: Pick<Workshop, "capacity" | "enrollmentCount">) =>
    w.capacity != null && w.enrollmentCount >= w.capacity;

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300">
                <div
                  className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20"
                  style={{ backgroundColor: stat.color }}
                />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <div className={`p-3 rounded-xl bg-linear-to-br ${stat.gradient} shadow-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {isLoading ? (
        <Card className="border-0 shadow-xl">
          <CardContent className="py-16 text-center text-muted-foreground">
            Loading workshops…
          </CardContent>
        </Card>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="relative overflow-hidden border-0 shadow-xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-linear-to-bl from-[#610981]/10 to-transparent rounded-full blur-3xl" />
            <CardHeader className="relative z-10">
              <CardTitle className="text-xl" style={{ color: "#ff691d" }}>
                All Workshops ({workshops.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              {workshops.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No workshops yet</h3>
                  <p className="text-sm text-muted-foreground">Check back soon for upcoming workshops.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {workshops.map((w, idx) => {
                    const priceNum = Number(w.price);
                    return (
                      <motion.div
                        key={w.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + idx * 0.05 }}
                        whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                        className="group relative overflow-hidden rounded-2xl border-2 border-gray-100 hover:border-purple-200 transition-all duration-300 cursor-pointer bg-white hover:shadow-xl"
                        onClick={() => openDetail(w)}
                      >
                        <div className="relative h-40 overflow-hidden">
                          <img
                            src={resolveMediaUrl(w.thumbnail) ?? FALLBACK_IMG}
                            alt={w.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG; }}
                          />
                          <div className="absolute top-3 left-3 flex gap-2">
                            <Badge
                              className="text-xs font-semibold"
                              style={{ backgroundColor: modeColor(w.mode), color: "white" }}
                            >
                              {w.mode}
                            </Badge>
                            <Badge className="bg-white/90 text-gray-900 text-xs font-semibold">
                              {levelLabel(w.level)}
                            </Badge>
                          </div>
                          {priceNum === 0 && (
                            <div className="absolute top-3 right-3">
                              <Badge className="bg-green-500 text-white text-xs font-semibold">FREE</Badge>
                            </div>
                          )}
                          {enrolledIds.has(w.id) && (
                            <div className="absolute bottom-3 left-3">
                              <Badge className="bg-emerald-600 text-white text-xs font-semibold">
                                <Star className="w-3 h-3 mr-1" /> Enrolled
                              </Badge>
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-base mb-1 line-clamp-1 group-hover:text-purple-700 transition-colors">
                            {w.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                            {w.yogaType}
                            {w.instructorName && ` · with ${w.instructorName}`}
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{w.description}</p>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="w-4 h-4" style={{ color: "#610981" }} />
                              <span className="text-xs">{formatDate(w.startDate)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <IndianRupee className="w-4 h-4" style={{ color: "#ff691d" }} />
                              <span className="font-bold" style={{ color: "#ff691d" }}>
                                {priceNum === 0 ? "Free" : priceNum.toLocaleString("en-IN")}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                            <Users className="w-3 h-3" />
                            <span>
                              {w.enrollmentCount}
                              {w.capacity != null ? `/${w.capacity}` : ""} registered
                            </span>
                            <span className="mx-1">·</span>
                            <ListVideo className="w-3 h-3" />
                            <span>{w.sessionCount} sessions</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Dialog open={detailOpen} onOpenChange={(v) => { if (!isRegistering) setDetailOpen(v); }}>
        <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] p-0 overflow-hidden flex flex-col gap-0 sm:max-w-6xl!">
          <DialogHeader className="px-6 pt-6 pb-3 shrink-0 border-b">
            <DialogTitle className="text-2xl" style={{ color: "#ff691d" }}>
              {detail?.title ?? "Workshop"}
            </DialogTitle>
            <DialogDescription>
              {detail?.yogaType}
              {detail?.instructorName && ` · with ${detail.instructorName}`}
            </DialogDescription>
          </DialogHeader>

          {detailLoading || !detail ? (
            <div className="py-12 text-center text-muted-foreground">Loading…</div>
          ) : (
            <>
              {/* Single scroll region — two columns side-by-side, content flows naturally */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-6 p-6">
                  {/* LEFT — image + key facts */}
                  <div className="space-y-4">
                    <div className="relative aspect-video rounded-2xl overflow-hidden">
                      <img
                        src={resolveMediaUrl(detail.thumbnail) ?? FALLBACK_IMG}
                        alt={detail.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG; }}
                      />
                      <div className="absolute top-4 left-4 flex gap-2">
                        <Badge style={{ backgroundColor: modeColor(detail.mode), color: "white" }}>
                          {detail.mode}
                        </Badge>
                        <Badge className="bg-white/90 text-gray-900">{levelLabel(detail.level)}</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <InfoTile icon={Calendar} label="Starts" value={formatDate(detail.startDate)} />
                      <InfoTile icon={Calendar} label="Ends" value={formatDate(detail.endDate)} />
                      <InfoTile
                        icon={Clock}
                        label="Duration"
                        value={detail.totalDuration != null ? `${detail.totalDuration} min` : "—"}
                      />
                      <InfoTile
                        icon={Users}
                        label="Capacity"
                        value={detail.capacity != null ? `${detail.enrollmentCount}/${detail.capacity}` : `${detail.enrollmentCount}`}
                      />
                    </div>
                  </div>

                  {/* RIGHT — about + sessions */}
                  <div className="space-y-5 md:border-l md:pl-6">
                    <div>
                      <h4 className="font-semibold mb-2" style={{ color: "#ff691d" }}>About</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                        {detail.description}
                      </p>
                    </div>

                    {detail.sessions.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: "#ff691d" }}>
                          <ListVideo className="w-4 h-4" /> Sessions ({detail.sessions.length})
                        </h4>
                        <div className="space-y-2">
                          {detail.sessions.map((s) => (
                            <SessionRow key={s.id} session={s} enrolled={enrolledIds.has(detail.id)} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sticky footer — Price + CTA always visible, single scrollbar above */}
              <div className="shrink-0 border-t px-6 py-4 bg-background flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Price</p>
                  <div className="flex items-center gap-1">
                    <IndianRupee className="w-5 h-5" style={{ color: "#ff691d" }} />
                    <span className="text-2xl font-bold" style={{ color: "#ff691d" }}>
                      {Number(detail.price) === 0 ? "Free" : Number(detail.price).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
                <Button
                  size="lg"
                  onClick={() => handleRegister(detail)}
                  className="bg-linear-to-r from-[#610981] to-[#8b0fa8] hover:from-[#7a0a9f] hover:to-[#a312ca] text-white shadow-lg gap-2"
                  disabled={isRegistering || enrolledIds.has(detail.id) || isFull(detail)}
                >
                  {enrolledIds.has(detail.id) ? (
                    <><Star className="w-5 h-5" /> Already Enrolled</>
                  ) : isFull(detail) ? (
                    "Workshop Full"
                  ) : isRegistering ? (
                    "Processing…"
                  ) : (
                    <><Sparkles className="w-5 h-5" /> Enroll Now</>
                  )}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function InfoTile({ icon: Icon, label, value }: { icon: typeof Calendar; label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-linear-to-br from-purple-50 to-white border-2 border-purple-100">
      <Icon className="w-5 h-5 mb-1" style={{ color: "#610981" }} />
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

type SessionState = "upcoming" | "live" | "ended";

function getSessionState(session: WorkshopSession): SessionState {
  if (!session.scheduledAt) return "upcoming";
  const start = new Date(session.scheduledAt).getTime();
  if (Number.isNaN(start)) return "upcoming";
  const durationMs = (session.duration ?? 0) * 60 * 1000;
  const now = Date.now();
  if (now > start + durationMs) return "ended";
  if (now >= start) return "live";
  return "upcoming";
}

function SessionStateBadge({ state, mode }: { state: SessionState; mode: WorkshopMode }) {
  if (state === "live") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white bg-emerald-500">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        LIVE
      </span>
    );
  }
  if (state === "ended") {
    return (
      <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-600 hover:bg-gray-200">
        Ended
      </Badge>
    );
  }
  // upcoming
  if (mode === "LIVE" || mode === "HYBRID") {
    return (
      <Badge variant="outline" className="text-xs border-amber-400 text-amber-700 bg-amber-50">
        Upcoming
      </Badge>
    );
  }
  return <Badge variant="outline" className="text-xs">{mode}</Badge>;
}

function SessionRow({ session, enrolled }: { session: WorkshopSession; enrolled: boolean }) {
  const state = getSessionState(session);
  const ended = state === "ended";
  // After end, the live join link expires; only the recording (if any) is usable.
  const mediaHref = !ended && session.link ? session.link : session.video || null;
  const canSeeMedia = enrolled && mediaHref;
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-white">
      <div className="w-8 h-8 rounded-full bg-purple-100 text-[#610981] font-semibold flex items-center justify-center text-xs">
        {session.sortOrder}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{session.title}</p>
        <p className="text-xs text-muted-foreground">
          {formatDateTime(session.scheduledAt)}
          {session.duration != null && ` · ${session.duration} min`}
        </p>
      </div>
      <SessionStateBadge state={state} mode={session.mode} />
      {canSeeMedia ? (
        <a
          href={mediaHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-[#610981] hover:underline"
        >
          <PlayCircle className="w-4 h-4" /> {ended ? "Recording" : state === "live" ? "Join" : "Open"}
        </a>
      ) : ended ? (
        <span className="text-xs text-muted-foreground">No recording</span>
      ) : null}
    </div>
  );
}
