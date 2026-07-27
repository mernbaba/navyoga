import axios, { type AxiosResponse } from "axios";
import type { RenewalPrompt } from "./renewal";

export type ApiSuccess<T> = {
  success: true;
  message: string | null;
  data: T;
};

export type ApiFailure = {
  success: false;
  message: string;
  error?: unknown;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AuthSuccess<U> = {
  user: U;
  token: string;
};

export async function unwrap<T>(promise: Promise<AxiosResponse<ApiSuccess<T>>>): Promise<T> {
  try {
    const { data } = await promise;
    if (!data?.success) {
      throw new Error("Unexpected response shape.");
    }
    return data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const payload = error.response?.data as ApiFailure | undefined;
      const validationDetails = Array.isArray(payload?.error)
        ? ` (${(payload.error as Array<{ path?: string; message?: string }>)
            .map((issue) => `${issue.path ?? ""}: ${issue.message ?? ""}`)
            .join("; ")})`
        : "";
      throw new Error((payload?.message ?? "Request failed.") + validationDetails);
    }
    throw error;
  }
}

export type Role = "SUPERADMIN" | "TUTOR" | "OPERATIONS" | "FRONTLINE" | "STUDENT";

export type StaffStatus = "ACTIVE" | "ON_LEAVE" | "TERMINATED";
export type LeadStatus = "NEW" | "CONTACTED" | "INTERESTED" | "CONVERTED" | "NOT_INTERESTED";
export type LeadSource =
  | "WEBSITE"
  | "REFERRAL"
  | "WALK_IN"
  | "SOCIAL_MEDIA"
  | "FACEBOOK"
  | "INSTAGRAM"
  | "GOOGLE_ADS";

export type SuperAdminUser = {
  id: string;
  email: string;
  name: string;
  phone: string;
  avatar: string | null;
  isActive: boolean;
  createdAt: string;
};

export type TutorUser = {
  id: string;
  tutorId: string;
  email: string;
  name: string;
  phone: string;
  avatar: string | null;
  experience: number;
  specializations: string[];
  bio: string | null;
  status: StaffStatus;
  isActive?: boolean;
  batches?: { id: string; name: string }[];
  createdAt: string;
};

export type OperationsUser = {
  id: string;
  employeeId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatar: string | null;
  salary: number;
  joinDate: string;
  department: string;
  workingHours: string | null;
  timezone: string;
  status: StaffStatus;
  createdAt: string;
};

export type FrontlineUser = {
  id: string;
  employeeId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatar: string | null;
  salary: number;
  joinDate: string;
  designation: string;
  department: string;
  dailyTarget: number;
  status: StaffStatus;
  createdAt: string;
};

export type FrontlineAgentRow = FrontlineUser & {
  isActive: boolean;
  updatedAt: string;
  callsToday: number;
  leadsAssigned: number;
  conversions: number;
  performance: number;
};

export type OperationsStaffRow = OperationsUser & {
  isActive: boolean;
  updatedAt: string;
};

export type StudentUser = {
  id: string;
  email: string;
  name: string;
  phone: string;
  phoneVerified: boolean;
  avatar: string | null;
  referralCode: string;
  isActive: boolean;
  city?: string | null;
  country?: string | null;
  gender?: string | null;
  age?: number | null;
  bloodGroup?: string | null;
  emergencyContact?: string | null;
  medicalConditions?: string | null;
  yogaExperience?: string | null;
  currentLevel?: string | null;
  areasOfInterest?: string | null;
  termsAcceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Active Live-subscription batches (present on the list endpoint). Empty when
  // the student has no active Live enrollment; absent on single-student fetches.
  batches?: { id: string; name: string }[];
};

export type Tutor = TutorUser;
export type Student = StudentUser;

export type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: LeadSource;
  page: string | null;
  interest: string;
  location: string | null;
  status: LeadStatus;
  lastContactDate: string | null;
  notes: string | null;
  assignedToId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TaskCategory =
  | "FOLLOW_UP"
  | "CALLING"
  | "ADMIN"
  | "REPORTING"
  | "COORDINATION"
  | "TRAINING";
export type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export type DailyTask = {
  id: string;
  title: string;
  date: string;
  dueDate: string | null;
  category: TaskCategory;
  status: TaskStatus;
  priority: TaskPriority;
  assignedToId: string;
  createdAt: string;
  updatedAt: string;
};

export type DiscountType = "PERCENTAGE" | "FLAT";
export type CouponStatus = "ACTIVE" | "EXPIRED" | "DISABLED";
export type CouponApplicableType = "LIVE" | "SELF_PACED" | "YTT_LIVE" | "YTT_RECORDED" | "EVENT" | "WORKSHOP";

export type Coupon = {
  id: string;
  code: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: string;
  maxDiscount: string | null;
  minPurchaseAmount: string;
  usageLimit: number;
  usageCount: number;
  validFrom: string;
  expiryDate: string;
  status: CouponStatus;
  // Empty array = applies to all plan types
  applicableTo: CouponApplicableType[];
  createdAt: string;
  updatedAt: string;
};

export type NotificationAudience = "ALL_USERS" | "ACTIVE_STUDENTS" | "PREMIUM_MEMBERS";

export type Notification = {
  id: string;
  title: string;
  message: string;
  targetAudience: NotificationAudience;
  recipientCount: number;
  scheduledDate: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE";

export type AttendanceSummary = {
  total: number;
  present: number;
  absent: number;
  late: number;
  attendanceRate: number;
};

export type PaginatedAttendance<T> = {
  summary: AttendanceSummary;
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type StudentAttendance = {
  id: string;
  date: string;
  status: AttendanceStatus;
  createdAt: string;
  updatedAt: string;
  student: { id: string; name: string };
  subscriptionClass: {
    id: string;
    classId: string;
    title: string;
    yogaType: string;
    scheduledAt: string;
  };
};

/** One live class the student joined. Presence only — no time-spent tracking. */
export type ClassAttendanceRecord = {
  id: string;
  joinedAt: string;
  liveClass: {
    id: string;
    title: string;
    yogaType: string;
    scheduledAt: string | null;
    duration: number;
    tutor: { name: string } | null;
    batch: { id: string; name: string } | null;
  };
};

export type MyClassAttendance = {
  summary: {
    totalAttended: number;
    attendedThisMonth: number;
    lastAttendedAt: string | null;
  };
  records: ClassAttendanceRecord[];
};

export type TutorAttendance = {
  id: string;
  date: string;
  classesConducted: number;
  teachingHours: number;
  status: AttendanceStatus;
  createdAt: string;
  updatedAt: string;
  tutor: { id: string; tutorId: string; name: string };
};

export type FrontlineAttendance = {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: AttendanceStatus;
  createdAt: string;
  updatedAt: string;
  staff: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    designation: string;
  };
};

export type OperationsAttendance = {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: AttendanceStatus;
  createdAt: string;
  updatedAt: string;
  staff: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    department: string;
  };
};

export type ReferralStatus = "PENDING" | "ACTIVE";

export type ReferralOverview = {
  total: number;
  active: number;
  pending: number;
  totalRewards: string;
};

export type ReferralReferrer = {
  id: string;
  name: string;
  email: string;
  type: "student" | "tutor";
};

export type StudentReferee = {
  id: string;
  name: string;
  email: string;
};

export type TutorReferee = {
  id: string;
  name: string;
  email: string;
  specializations: string[];
  classes: number;
};

export type ReferralSubscription = {
  period: string;
  name: string;
  status: string;
} | null;

export type StudentReferralRow = {
  id: string;
  referrer: ReferralReferrer;
  referee: StudentReferee;
  subscription: ReferralSubscription;
  status: ReferralStatus;
  reward: string;
  date: string;
};

export type TutorReferralRow = {
  id: string;
  referrer: ReferralReferrer;
  referee: TutorReferee;
  subscription: ReferralSubscription;
  status: ReferralStatus;
  reward: string;
  date: string;
};

export type MyReferralOverview = {
  totalReferred: number;
  active: number;
  pending: number;
  totalEarned: string;
};

export type MyStudentReferralOverview = {
  totalReferrals: number;
  active: number;
  pending: number;
  totalEarned: string;
};

export type MyReferralStudentItem = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  reward: string;
  status: ReferralStatus;
  date: string;
};

export type MyReferralTutorItem = MyReferralStudentItem & {
  specializations: string[];
  classes: number;
};

export type MyTutorReferralsResponse<T> = {
  overview: MyReferralOverview;
  referralCode: string;
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type MyStudentReferralsResponse = {
  overview: MyStudentReferralOverview;
  referralCode: string;
  items: MyReferralStudentItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type Batch = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

// ─── LIVE CLASSES ─────────────────────────────────────────────────────────────

export type LiveClassStatus = "DRAFT" | "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED";
export type ClassDifficulty = "EASY" | "MEDIUM" | "HARD";

export type LiveClassTutor = {
  id: string;
  tutorId: string;
  name: string;
  avatar: string | null;
  specializations: string[];
};

export type LiveClass = {
  id: string;
  title: string;
  description: string | null;
  yogaType: string;
  difficulty: ClassDifficulty;
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  duration: number;
  recording: string | null;
  tutor: LiveClassTutor | null;
  batch: { id: string; name: string } | null;
  recurringId: string | null;
  dayOfWeek: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DayOfWeek = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

export type RecurringLiveClass = {
  id: string;
  title: string;
  description: string | null;
  yogaType: string;
  difficulty: ClassDifficulty;
  duration: number;
  daysOfWeek: DayOfWeek[];
  timeOfDay: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  tutor: LiveClassTutor | null;
  batch: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
};

export type TutorClassState = "LIVE" | "UPCOMING" | "PAST";

export type TutorAssignedClass = {
  id: string;
  title: string;
  description: string | null;
  yogaType: string;
  difficulty: ClassDifficulty;
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  duration: number;
  recording: string | null;
  batch: { id: string; name: string } | null;
  state: TutorClassState;
  // Distinguishes shared Live Classes from YTT Live course classes so the
  // tutor panel can route actions correctly (YTT classes join via link only).
  kind?: "LIVE_CLASS" | "YTT_LIVE";
  courseId?: string | null;
  createdAt: string;
  updatedAt: string;
};

// ─── SELF-PACED ───────────────────────────────────────────────────────────────

export type SelfPacedClass = {
  id: string;
  moduleId: string;
  title: string;
  description: string | null;
  video: string;
  thumbnail: string | null;
  duration: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SelfPacedModule = {
  id: string;
  title: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  classes?: SelfPacedClass[];
};

export type SelfPacedPlan = {
  id: string;
  name: string;
  description: string | null;
  validity: number;
  price: number;
  originalPrice: number | null;
  features: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type YTTPlan = {
  id: string;
  courseId: string;
  name: string;
  description: string | null;
  validity: number;
  price: string;
  originalPrice: string | null;
  features: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type YTTCourse = {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  yogaType: string;
  level: ClassLevel;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type YTTClass = {
  id: string;
  moduleId: string;
  title: string;
  description: string | null;
  video: string;
  thumbnail: string | null;
  duration: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type YTTModule = {
  id: string;
  courseId: string;
  title: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  classes: YTTClass[];
};

export type YTTCourseDetail = YTTCourse & {
  modules: YTTModule[];
  plans: YTTPlan[];
};

export type ClassLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS";

export type YTTCourseBody = {
  title: string;
  yogaType: string;
  description?: string;
  thumbnail?: string;
  level?: ClassLevel;
  isActive?: boolean;
};

export type YTTLiveClass = {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  yogaType: string;
  difficulty: ClassDifficulty;
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  duration: number;
  recording: string | null;
  tutorId: string | null;
  tutor: LiveClassTutor | null;
  createdAt: string;
  updatedAt: string;
};

export type YTTLiveClassBody = {
  title: string;
  yogaType: string;
  difficulty: ClassDifficulty;
  duration: number;
  description?: string | null;
  scheduledAt?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  recording?: string | null;
  tutorId?: string | null;
};

export type YTTLiveCourseDetail = YTTCourse & {
  plans: YTTPlan[];
  classes: YTTLiveClass[];
};

export type LivePlan = {
  id: string;
  name: string;
  description: string | null;
  validity: number;
  price: string;
  originalPrice: string | null;
  features: string[];
  recordingAccess: number;
  isActive: boolean;
  batchRestricted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LiveEnrollmentStatus = "ACTIVE" | "EXPIRED" | "CANCELLED";

export type MyLiveEnrollment = {
  id: string;
  planId: string;
  batchId: string;
  startDate: string;
  endDate: string;
  status: LiveEnrollmentStatus;
  plan: LivePlan;
  batch: { id: string; name: string };
};

export type MyLiveEnrollmentResponse = {
  enrolled: boolean;
  enrollment: MyLiveEnrollment | null;
  // Present (non-null) when the student has no active enrollment but their last
  // one expired within the renewal window — drives the "renew?" modal.
  recentlyExpired?: RenewalPrompt | null;
};

export type MyLiveClassesResponse = {
  enrolled: boolean;
  recordingDays: number;
  classes: LiveClass[];
};

export type MembershipPeriod = "MONTHLY" | "QUARTERLY" | "HALF_YEARLY" | "YEARLY";

export type SubscriptionPlan = {
  id: string;
  name: string;
  description: string | null;
  period: MembershipPeriod;
  price: string;
  originalPrice: string | null;
  features: string[];
  canAccessLiveClasses: boolean;
  canAccessRecordings: boolean;
  isPopular: boolean;
  isBestValue: boolean;
  isInaugural: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type EventEnrollmentStudent = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

export type EventEnrollmentRow = {
  id: string;
  enrolledAt: string;
  student: EventEnrollmentStudent;
};

export type AppEvent = {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  featured: boolean;
  date: string;
  duration: string;
  location: string;
  capacity: number;
  occupancy: number;
  price: string;
  createdAt: string;
  updatedAt: string;
  /** Set on the student-facing list endpoint; absent for admin payloads. */
  isEnrolled?: boolean;
};

// ─── Workshops ───────────────────────────────────────────────────────────────

export type WorkshopMode = "LIVE" | "RECORDED" | "HYBRID";

export type WorkshopTutorRef = {
  id: string;
  tutorId: string | null;
  name: string;
  avatar: string | null;
  specializations: string[] | null;
};

export type WorkshopSession = {
  id: string;
  workshopId: string;
  title: string;
  sortOrder: number;
  mode: WorkshopMode;
  scheduledAt: string | null;
  duration: number | null;
  link?: string | null;
  video?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Workshop = {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  yogaType: string;
  level: ClassLevel;
  mode: WorkshopMode;
  tutorId: string | null;
  tutor: WorkshopTutorRef | null;
  instructorName: string | null;
  price: string;
  startDate: string | null;
  endDate: string | null;
  totalDuration: number | null;
  capacity: number | null;
  enrollmentCount: number;
  sessionCount: number;
  createdAt: string;
  updatedAt: string;
  /** Set on the student-facing /upcoming endpoint; absent for admin payloads. */
  isEnrolled?: boolean;
};

export type WorkshopWithSessions = Workshop & { sessions: WorkshopSession[] };

export type WorkshopEnrollmentStudentRef = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
};

export type WorkshopEnrollmentRow = {
  id: string;
  enrolledAt: string;
  completedAt: string | null;
  student: WorkshopEnrollmentStudentRef;
};

export type MyWorkshopEnrollmentResponse = {
  enrolled: boolean;
  enrollment: { id: string; enrolledAt: string; completedAt: string | null } | null;
};

export type BusinessSettings = {
  id: string;
  centerName: string;
  email: string;
  phone: string;
  address: string;
  // GST rate (percent) applied to all purchases. Decimal serialized as a string.
  gstPercentage: string;
  timezone: string;
  currency: string;
  language: string;
  createdAt: string;
  updatedAt: string;
};

// ─── TUTOR PANEL ──────────────────────────────────────────────────────────────

export type TutorDashboardStats = {
  upcomingClasses: number;
  completedClasses: number;
  classesThisMonth: number;
  totalStudents: number;
  teachingHoursThisMonth: number;
  avgAttendanceRate: number;
  upcomingToday: { id: string; title: string; scheduledAt: string | null; duration: number }[];
  classBreakdown: { name: string; count: number }[];
};

export type TutorStudentItem = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string | null;
  joinDate: string;
  membershipType: string;
  status: string;
};

export type MyOperationsAttendance = {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: "PRESENT" | "ABSENT";
} | null;

export type MyFrontlineAttendance = {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: "PRESENT" | "ABSENT";
} | null;

export type MyTutorAttendanceToday = {
  id: string;
  date: string;
  classesConducted: number;
  teachingHours: number;
  status: AttendanceStatus;
} | null;

export type MyTutorAttendanceRecord = {
  id: string;
  date: string;
  classesConducted: number;
  teachingHours: number;
  status: AttendanceStatus;
  createdAt: string;
};
