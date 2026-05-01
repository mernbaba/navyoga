import axios, { type AxiosResponse } from "axios";

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
export type StudentStatus = "ACTIVE" | "INACTIVE";
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

export type StudentUser = {
  id: string;
  studentId: string;
  email: string;
  name: string;
  phone: string;
  avatar: string | null;
  referralCode: string;
  status: StudentStatus;
  joinDate: string;
  address?: string | null;
  age?: number | null;
  bloodGroup?: string | null;
  emergencyContact?: string | null;
  medicalConditions?: string | null;
  yogaExperience?: string | null;
  currentLevel?: string | null;
  areasOfInterest?: string | null;
  fitnessGoals?: string | null;
  createdAt: string;
};

export type Employee = {
  id: string;
  employeeId: string;
  email: string;
  name: string;
  phone: string;
  avatar: string | null;
  role: string;
  department: string;
  salary: number;
  joinDate: string;
  status: StaffStatus;
  createdAt: string;
  updatedAt: string;
};

export type Tutor = TutorUser;
export type Student = StudentUser;

export type Lead = {
  id: string;
  leadId: string;
  name: string;
  email: string;
  phone: string;
  source: LeadSource;
  interest: string;
  location: string | null;
  status: LeadStatus;
  lastContactDate: string | null;
  notes: string | null;
  assignedToId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DiscountType = "PERCENTAGE" | "FLAT";
export type CouponStatus = "ACTIVE" | "EXPIRED" | "DISABLED";

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
  createdAt: string;
  updatedAt: string;
};

export type NotificationAudience = "ALL_USERS" | "ACTIVE_STUDENTS" | "PREMIUM_MEMBERS";
export type NotificationStatus = "DRAFT" | "SCHEDULED" | "SENT";

export type Notification = {
  id: string;
  title: string;
  message: string;
  targetAudience: NotificationAudience;
  recipientCount: number;
  openRate: string | null;
  status: NotificationStatus;
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
  student: { id: string; studentId: string; name: string };
  subscriptionClass: {
    id: string;
    classId: string;
    title: string;
    yogaType: string;
    scheduledAt: string;
  };
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

export type BusinessSettings = {
  id: string;
  centerName: string;
  email: string;
  phone: string;
  address: string;
  timezone: string;
  currency: string;
  language: string;
  createdAt: string;
  updatedAt: string;
};
