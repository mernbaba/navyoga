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
  MapPin,
  Users,
  Clock,
  Star,
  CalendarDays,
  IndianRupee,
  Video,
  Sparkles,
  Trophy,
  Heart,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  enrollInFreeEvent,
  getMyEventEnrollment,
  listMyEventEnrollments,
  listUpcomingEvents,
} from "../../api/events";
import { initiatePayment, verifyPayment } from "../../api/payments";
import type { AppEvent } from "../../api/types";
import { useRazorpay } from "react-razorpay";
import { UserWorkshopsList } from "./UserWorkshopsList";
import { resolveMediaUrl } from "../../lib/media";
import { CouponInput, type CouponApplied } from "../../components/CouponInput";

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  duration: string;
  instructor?: string;
  location: string;
  type?: "Workshop" | "Retreat" | "Masterclass" | "Webinar" | "Special Event";
  category?: string;
  price: number;
  capacity: number;
  registered: number;
  image: string;
  status?: "Upcoming" | "Registering" | "Full" | "Completed";
  featured: boolean;
  benefits?: string[];
}

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1506126613408-eca07ce68773";

function mapAppEvent(e: AppEvent): Event {
  const priceNum = Number.parseFloat(e.price);
  const when = new Date(e.date);
  const time = Number.isNaN(when.getTime())
    ? undefined
    : when.toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    date: e.date,
    time,
    duration: e.duration,
    location: e.location,
    price: Number.isFinite(priceNum) ? priceNum : 0,
    capacity: e.capacity,
    registered: e.occupancy,
    image: resolveMediaUrl(e.thumbnail) ?? FALLBACK_IMG,
    featured: e.featured,
  };
}

export function UserEvents() {
  const [searchTerm] = useState("");
  const [selectedCategory] = useState("All");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"events" | "workshops">("events");
  const [events, setEvents] = useState<Event[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const { Razorpay } = useRazorpay();
  const [appliedCoupon, setAppliedCoupon] = useState<CouponApplied | null>(null);

  useEffect(() => {
    let cancelled = false;
    // TODO: paginate — currently capped at 20 events.
    listUpcomingEvents("STUDENT", { limit: 20 })
      .then(async (page) => {
        if (cancelled) return;
        setEvents(page.items.map(mapAppEvent));

        // Resolve enrollment IDs via fastest available source. We try a bulk
        // endpoint first; if it isn't deployed yet we fall back to per-event
        // checks (the endpoint that already powers the detail click).
        const ids = new Set<string>(
          page.items.filter((e) => e.isEnrolled).map((e) => e.id),
        );

        try {
          const { eventIds } = await listMyEventEnrollments("STUDENT");
          for (const id of eventIds) ids.add(id);
        } catch {
          const results = await Promise.all(
            page.items.map((e) =>
              getMyEventEnrollment("STUDENT", e.id)
                .then((r) => (r.enrolled ? e.id : null))
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
          toast.error(
            err instanceof Error ? err.message : "Failed to load events.",
          );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const tabFilteredEvents =
    activeTab === "workshops"
      ? events.filter((event) => event.type === "Workshop")
      : events.filter((event) => event.type !== "Workshop");

  const filteredEvents = tabFilteredEvents.filter((event) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      event.title.toLowerCase().includes(term) ||
      event.description.toLowerCase().includes(term) ||
      (event.instructor ?? "").toLowerCase().includes(term);
    const matchesCategory =
      selectedCategory === "All" || event.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredEvents = tabFilteredEvents.filter((event) => event.featured);
  const isWorkshopsTab = activeTab === "workshops";
  const tabNoun = isWorkshopsTab ? "Workshops" : "Events";
  const tabNounSingular = isWorkshopsTab ? "Workshop" : "Event";

  const markEnrolled = (eventId: string) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId ? { ...e, registered: e.registered + 1 } : e,
      ),
    );
    setSelectedEvent((prev) =>
      prev && prev.id === eventId
        ? { ...prev, registered: prev.registered + 1 }
        : prev,
    );
    setEnrolledIds((prev) => {
      const next = new Set(prev);
      next.add(eventId);
      return next;
    });
    setIsDetailsOpen(false);
  };

  const handleRegister = async (event: Event) => {
    if (isRegistering) return;

    if (event.price === 0) {
      setIsRegistering(true);
      try {
        await enrollInFreeEvent("STUDENT", event.id);
        toast.success(`Successfully registered for ${event.title}!`);
        markEnrolled(event.id);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to register for event.",
        );
      } finally {
        setIsRegistering(false);
      }
      return;
    }

    setIsRegistering(true);
    // Close the shadcn Dialog before Razorpay opens — its overlay blocks
    // pointer-events on the Razorpay iframe if left mounted.
    setIsDetailsOpen(false);
    try {
      const paymentData = await initiatePayment("STUDENT", {
        type: "EVENT",
        entityId: event.id,
        ...(appliedCoupon ? { couponCode: appliedCoupon.code } : {}),
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
            description: event.title,
            handler: async (response) => {
              try {
                await verifyPayment("STUDENT", {
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                });
                toast.success(
                  `Payment successful! Registered for ${event.title}.`,
                );
                markEnrolled(event.id);
                resolve();
              } catch (err) {
                reject(err);
              }
            },
            modal: {
              ondismiss: () => reject(new Error("__dismissed__")),
            },
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
        toast.error(
          err instanceof Error
            ? err.message
            : "Payment failed. Please try again.",
        );
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const openEventDetails = (event: Event) => {
    setSelectedEvent(event);
    setIsDetailsOpen(true);
    setAppliedCoupon(null);
    // Lazily check enrollment for just this event — only if we don't already know.
    if (enrolledIds.has(event.id)) return;
    getMyEventEnrollment("STUDENT", event.id)
      .then((res) => {
        if (!res.enrolled) return;
        setEnrolledIds((prev) => {
          const next = new Set(prev);
          next.add(event.id);
          return next;
        });
      })
      .catch(() => {
        // best-effort; swallow errors
      });
  };

  const getEventTypeColor = (type?: string) => {
    switch (type) {
      case "Workshop":
        return "#f59e0b";
      case "Retreat":
        return "#10b981";
      case "Masterclass":
        return "#610981";
      case "Webinar":
        return "#3b82f6";
      case "Special Event":
        return "#ff691d";
      default:
        return "#64748b";
    }
  };

  const registeredInTab = tabFilteredEvents.filter((e) =>
    enrolledIds.has(e.id),
  ).length;

  const stats = [
    {
      label: `Total ${tabNoun}`,
      value: tabFilteredEvents.length.toString(),
      icon: Calendar,
      color: "#ff691d",
      gradient: "from-orange-500 to-red-500",
    },
    {
      label: "Registered",
      value: registeredInTab.toString(),
      icon: Star,
      color: "#10b981",
      gradient: "from-green-500 to-teal-500",
    },
    {
      label: "Upcoming",
      value: tabFilteredEvents.length.toString(),
      icon: TrendingUp,
      color: "#610981",
      gradient: "from-purple-600 to-pink-600",
    },
    {
      label: "Featured",
      value: featuredEvents.length.toString(),
      icon: Trophy,
      color: "#f59e0b",
      gradient: "from-yellow-500 to-orange-500",
    },
  ];

  return (
    <div className="p-6 lg:p-8 min-h-screen bg-linear-to-br from-gray-50 via-white to-orange-50/30">
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#610981] via-[#8b0fa8] to-[#ff691d] p-8 text-white shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <CalendarDays className="w-8 h-8" />
              </motion.div>
              <h1 className="text-4xl font-bold">Events & Workshops</h1>
            </div>
            <p className="text-white/90 text-lg">
              Discover and join exclusive yoga events, workshops, and retreats
            </p>

            <div className="mt-6 inline-flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab("events")}
                className={`px-7 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                  activeTab === "events"
                    ? "bg-white text-[#610981] shadow-lg"
                    : "bg-[#4a0668] text-white hover:bg-[#3a0552] shadow-md"
                }`}
              >
                Events
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("workshops")}
                className={`px-7 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                  activeTab === "workshops"
                    ? "bg-white text-[#610981] shadow-lg"
                    : "bg-[#4a0668] text-white hover:bg-[#3a0552] shadow-md"
                }`}
              >
                Workshops
              </button>
            </div>
          </div>
        </motion.div>

        {isWorkshopsTab ? (
          <UserWorkshopsList />
        ) : (
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
                    <div
                      className={`p-3 rounded-xl bg-linear-to-br ${stat.gradient} shadow-lg`}
                    >
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
              Loading events…
            </CardContent>
          </Card>
        ) : (
          <>
            {featuredEvents.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="relative overflow-hidden border-0 shadow-xl">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-linear-to-bl from-[#ff691d]/10 to-transparent rounded-full blur-3xl" />
                  <CardHeader className="relative z-10">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-linear-to-br from-[#ff691d] to-[#ff8c4d] shadow-lg">
                        <Star className="w-5 h-5 text-white" />
                      </div>
                      <CardTitle
                        className="text-xl"
                        style={{ color: "#ff691d" }}
                      >
                        Featured {tabNoun}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {featuredEvents.map((event, idx) => (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.5 + idx * 0.1 }}
                          whileHover={{
                            scale: 1.02,
                            transition: { duration: 0.2 },
                          }}
                          className="group relative overflow-hidden rounded-2xl border-2 border-gray-100 hover:border-purple-200 transition-all duration-300 cursor-pointer bg-white hover:shadow-xl"
                          onClick={() => openEventDetails(event)}
                        >
                          <div className="relative h-48 overflow-hidden">
                            <img
                              src={event.image}
                              alt={event.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            <div className="absolute top-3 left-3 flex gap-2">
                              {event.type && (
                                <Badge
                                  className="text-xs font-semibold"
                                  style={{
                                    backgroundColor: getEventTypeColor(
                                      event.type,
                                    ),
                                    color: "white",
                                  }}
                                >
                                  {event.type}
                                </Badge>
                              )}
                              <Badge className="bg-white/90 text-gray-900 text-xs font-semibold">
                                <Sparkles className="w-3 h-3 mr-1" />
                                Featured
                              </Badge>
                            </div>
                            {event.price === 0 && (
                              <div className="absolute top-3 right-3">
                                <Badge className="bg-green-500 text-white text-xs font-semibold">
                                  FREE
                                </Badge>
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="font-bold text-lg mb-2 group-hover:text-purple-700 transition-colors">
                              {event.title}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                              {event.description}
                            </p>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar
                                  className="w-4 h-4"
                                  style={{ color: "#610981" }}
                                />
                                <span>
                                  {new Date(event.date).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    },
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin
                                  className="w-4 h-4"
                                  style={{ color: "#610981" }}
                                />
                                <span className="truncate">
                                  {event.location}
                                </span>
                              </div>
                              <div className="flex items-center justify-between pt-2">
                                <div className="flex items-center gap-1">
                                  <IndianRupee
                                    className="w-4 h-4"
                                    style={{ color: "#ff691d" }}
                                  />
                                  <span
                                    className="font-bold"
                                    style={{ color: "#ff691d" }}
                                  >
                                    {event.price === 0
                                      ? "Free"
                                      : `₹${event.price.toLocaleString()}`}
                                  </span>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  {event.registered}/{event.capacity} seats
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card className="relative overflow-hidden border-0 shadow-xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-linear-to-bl from-[#610981]/10 to-transparent rounded-full blur-3xl" />
                <CardHeader className="relative z-10">
                  <CardTitle className="text-xl" style={{ color: "#ff691d" }}>
                    All {tabNoun} ({filteredEvents.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="space-y-4">
                    {filteredEvents.map((event) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileHover={{
                          scale: 1.01,
                          transition: { duration: 0.2 },
                        }}
                        className="group flex flex-col md:flex-row gap-4 p-4 rounded-2xl border-2 border-gray-100 hover:border-purple-200 transition-all duration-300 cursor-pointer bg-white hover:shadow-lg"
                        onClick={() => openEventDetails(event)}
                      >
                        <div className="relative w-full md:w-48 h-40 rounded-xl overflow-hidden shrink-0">
                          <img
                            src={event.image}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          {event.type && (
                            <div className="absolute top-2 left-2">
                              <Badge
                                className="text-xs font-semibold"
                                style={{
                                  backgroundColor: getEventTypeColor(
                                    event.type,
                                  ),
                                  color: "white",
                                }}
                              >
                                {event.type}
                              </Badge>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex-1">
                              <h3 className="font-bold text-lg mb-1 group-hover:text-purple-700 transition-colors">
                                {event.title}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                with {event.instructor || "—"}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1 justify-end mb-1">
                                <IndianRupee
                                  className="w-5 h-5"
                                  style={{ color: "#ff691d" }}
                                />
                                <span
                                  className="font-bold text-xl"
                                  style={{ color: "#ff691d" }}
                                >
                                  {event.price === 0
                                    ? "Free"
                                    : event.price.toLocaleString()}
                                </span>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {event.registered}/{event.capacity} registered
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {event.description}
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar
                                className="w-4 h-4"
                                style={{ color: "#610981" }}
                              />
                              <span>
                                {new Date(event.date).toLocaleDateString(
                                  "en-IN",
                                  { day: "numeric", month: "short" },
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock
                                className="w-4 h-4"
                                style={{ color: "#610981" }}
                              />
                              <span>{event.time || "—"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <CalendarDays
                                className="w-4 h-4"
                                style={{ color: "#610981" }}
                              />
                              <span>{event.duration}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              {event.location.includes("Online") ? (
                                <Video
                                  className="w-4 h-4"
                                  style={{ color: "#610981" }}
                                />
                              ) : (
                                <MapPin
                                  className="w-4 h-4"
                                  style={{ color: "#610981" }}
                                />
                              )}
                              <span className="truncate">{event.location}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {filteredEvents.length === 0 && (
                      <div className="text-center py-12">
                        <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">
                          No {tabNounSingular.toLowerCase()}s found
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Try adjusting your search or filter criteria
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
        </>
        )}
      </div>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl" style={{ color: "#ff691d" }}>
              {selectedEvent?.title}
            </DialogTitle>
            <DialogDescription>
              Event details and registration information
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-6">
              <div className="relative h-64 rounded-2xl overflow-hidden">
                <img
                  src={selectedEvent.image}
                  alt={selectedEvent.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  {selectedEvent.type && (
                    <Badge
                      className="text-sm font-semibold"
                      style={{
                        backgroundColor: getEventTypeColor(selectedEvent.type),
                        color: "white",
                      }}
                    >
                      {selectedEvent.type}
                    </Badge>
                  )}
                  {selectedEvent.featured && (
                    <Badge className="bg-white/90 text-gray-900 text-sm font-semibold">
                      <Sparkles className="w-4 h-4 mr-1" />
                      Featured
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-linear-to-br from-purple-50 to-white border-2 border-purple-100">
                  <Calendar
                    className="w-6 h-6 mb-2"
                    style={{ color: "#610981" }}
                  />
                  <p className="text-xs text-muted-foreground mb-1">Date</p>
                  <p className="font-semibold">
                    {new Date(selectedEvent.date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-linear-to-br from-orange-50 to-white border-2 border-orange-100">
                  <Clock
                    className="w-6 h-6 mb-2"
                    style={{ color: "#ff691d" }}
                  />
                  <p className="text-xs text-muted-foreground mb-1">Time</p>
                  <p className="font-semibold">{selectedEvent.time || "—"}</p>
                </div>
                <div className="p-4 rounded-xl bg-linear-to-br from-green-50 to-white border-2 border-green-100">
                  <CalendarDays className="w-6 h-6 mb-2 text-green-600" />
                  <p className="text-xs text-muted-foreground mb-1">Duration</p>
                  <p className="font-semibold">{selectedEvent.duration}</p>
                </div>
                <div className="p-4 rounded-xl bg-linear-to-br from-yellow-50 to-white border-2 border-yellow-100">
                  <Users className="w-6 h-6 mb-2 text-yellow-600" />
                  <p className="text-xs text-muted-foreground mb-1">Capacity</p>
                  <p className="font-semibold">
                    {selectedEvent.registered}/{selectedEvent.capacity}
                  </p>
                </div>
              </div>

              <div>
                <h4
                  className="font-semibold text-lg mb-2"
                  style={{ color: "#ff691d" }}
                >
                  Description
                </h4>
                <p className="text-muted-foreground leading-relaxed">
                  {selectedEvent.description}
                </p>
              </div>

              <div>
                <h4
                  className="font-semibold text-lg mb-2"
                  style={{ color: "#ff691d" }}
                >
                  Location
                </h4>
                <div className="flex items-center gap-2 p-4 rounded-xl bg-gray-50">
                  {selectedEvent.location.includes("Online") ? (
                    <Video className="w-5 h-5" style={{ color: "#610981" }} />
                  ) : (
                    <MapPin className="w-5 h-5" style={{ color: "#610981" }} />
                  )}
                  <span className="font-medium">{selectedEvent.location}</span>
                </div>
              </div>

              {selectedEvent.benefits && selectedEvent.benefits.length > 0 && (
                <div>
                  <h4
                    className="font-semibold text-lg mb-3"
                    style={{ color: "#ff691d" }}
                  >
                    Benefits & Inclusions
                  </h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    {selectedEvent.benefits.map((benefit, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-100"
                      >
                        <div className="p-1 rounded-full bg-green-500">
                          <Heart className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-sm font-medium text-green-900">
                          {benefit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t space-y-3">
                {selectedEvent.price > 0 &&
                  !enrolledIds.has(selectedEvent.id) &&
                  selectedEvent.registered < selectedEvent.capacity && (
                    <CouponInput
                      context={{ type: "EVENT", entityId: selectedEvent.id }}
                      applied={appliedCoupon}
                      disabled={isRegistering}
                      onApplied={setAppliedCoupon}
                      onCleared={() => setAppliedCoupon(null)}
                    />
                  )}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {appliedCoupon ? "Total payable" : "Event Price"}
                    </p>
                    <div className="flex items-baseline gap-2">
                      {appliedCoupon && (
                        <span className="text-base text-muted-foreground line-through">
                          ₹{selectedEvent.price.toLocaleString()}
                        </span>
                      )}
                      <div className="flex items-center gap-2">
                        <IndianRupee className="w-6 h-6" style={{ color: "#ff691d" }} />
                        <span className="text-3xl font-bold" style={{ color: "#ff691d" }}>
                          {selectedEvent.price === 0
                            ? "Free"
                            : (appliedCoupon
                                ? appliedCoupon.finalAmount
                                : selectedEvent.price
                              ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="lg"
                    onClick={() => handleRegister(selectedEvent)}
                    className="bg-linear-to-r from-[#610981] to-[#8b0fa8] hover:from-[#7a0a9f] hover:to-[#a312ca] text-white shadow-lg gap-2"
                    disabled={
                      isRegistering ||
                      enrolledIds.has(selectedEvent.id) ||
                      selectedEvent.registered >= selectedEvent.capacity
                    }
                  >
                    {enrolledIds.has(selectedEvent.id) ? (
                      <>
                        <Star className="w-5 h-5" />
                        Already Registered
                      </>
                    ) : selectedEvent.registered >= selectedEvent.capacity ? (
                      "Event Full"
                    ) : isRegistering ? (
                      "Registering…"
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Register Now
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
