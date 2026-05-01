export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  status: 'active' | 'inactive';
  membershipType: 'monthly' | 'quarterly' | 'yearly';
  enrolledClasses: string[];
  referralBadge?: string; 
}

export interface Tutor {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string[];
  experience: number;
  rating: number;
  status: 'active' | 'on-leave' | 'inactive';
  assignedClasses: string[];
}

export interface Class {
  id: string;
  name: string;
  type: string;
  tutor: string; // Tutor name for easy filtering
  tutorId: string;
  schedule: string;
  duration: number;
  capacity: number;
  enrolled: number;
  enrolledStudents: string[]; // Array of student IDs
  status: 'active' | 'cancelled' | 'completed';
  price: number;
}

export type AttendanceCategory = 'users' | 'tutors' | 'frontline' | 'operations';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  time?: string;
  category?: AttendanceCategory;
  personName?: string;
  context?: string;
  classesConducted?: number;
  teachingHours?: string;
  checkIn?: string;
  checkOut?: string;
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  date: string;
  type: 'membership' | 'class';
  status: 'paid' | 'pending' | 'overdue';
  method: 'card' | 'cash' | 'upi';
}

export const students: Student[] = [
  {
    id: 'S001',
    name: 'Amit Kumar',
    email: 'amit.kumar@email.com',
    phone: '+91 98765 43210',
    joinDate: '2024-01-15',
    status: 'active',
    membershipType: 'yearly',
    enrolledClasses: ['C001', 'C003', 'C006'],
    referralBadge: 'Top Referrer'
  },
  {
    id: 'S002',
    name: 'Rahul Patel',
    email: 'rahul.patel@email.com',
    phone: '+91 98765 43211',
    joinDate: '2024-02-20',
    status: 'active',
    membershipType: 'monthly',
    enrolledClasses: ['C001', 'C005'],
    referralBadge: 'First Steps',
  },
  {
    id: 'S003',
    name: 'Anjali Reddy',
    email: 'anjali.reddy@email.com',
    phone: '+91 98765 43212',
    joinDate: '2023-12-10',
    status: 'active',
    membershipType: 'quarterly',
    enrolledClasses: ['C002', 'C004'],
    referralBadge: 'Social Butterfly',
  },
  {
    id: 'S004',
    name: 'Vikram Singh',
    email: 'vikram.singh@email.com',
    phone: '+91 98765 43213',
    joinDate: '2024-01-05',
    status: 'active',
    membershipType: 'monthly',
    enrolledClasses: ['C003', 'C006'],
  },
  {
    id: 'S005',
    name: 'Meera Iyer',
    email: 'meera.iyer@email.com',
    phone: '+91 98765 43214',
    joinDate: '2023-11-20',
    status: 'inactive',
    membershipType: 'yearly',
    enrolledClasses: [],
  },
  {
    id: 'S006',
    name: 'Neha Gupta',
    email: 'neha.gupta@email.com',
    phone: '+91 98765 43215',
    joinDate: '2024-02-10',
    status: 'active',
    membershipType: 'quarterly',
    enrolledClasses: ['C001', 'C003'],
  },
  {
    id: 'S007',
    name: 'Suresh Nair',
    email: 'suresh.nair@email.com',
    phone: '+91 98765 43216',
    joinDate: '2024-01-28',
    status: 'active',
    membershipType: 'monthly',
    enrolledClasses: ['C005', 'C006'],
  },
  {
    id: 'S008',
    name: 'Kavita Desai',
    email: 'kavita.desai@email.com',
    phone: '+91 98765 43217',
    joinDate: '2024-02-15',
    status: 'active',
    membershipType: 'yearly',
    enrolledClasses: ['C001', 'C005'],
  },
  {
    id: 'S009',
    name: 'Arjun Menon',
    email: 'arjun.menon@email.com',
    phone: '+91 98765 43218',
    joinDate: '2024-03-01',
    status: 'active',
    membershipType: 'monthly',
    enrolledClasses: ['C003', 'C006'],
  },
  {
    id: 'S010',
    name: 'Divya Krishnan',
    email: 'divya.krishnan@email.com',
    phone: '+91 98765 43219',
    joinDate: '2024-02-25',
    status: 'active',
    membershipType: 'quarterly',
    enrolledClasses: ['C001', 'C003', 'C005'],
  },
  {
    id: 'S011',
    name: 'Rohan Joshi',
    email: 'rohan.joshi@email.com',
    phone: '+91 98765 43220',
    joinDate: '2024-01-18',
    status: 'active',
    membershipType: 'yearly',
    enrolledClasses: ['C005', 'C006'],
  },
  {
    id: 'S012',
    name: 'Sneha Bose',
    email: 'sneha.bose@email.com',
    phone: '+91 98765 43221',
    joinDate: '2024-02-05',
    status: 'active',
    membershipType: 'monthly',
    enrolledClasses: ['C001', 'C006'],
  },
  {
    id: 'S013',
    name: 'Aditya Verma',
    email: 'aditya.verma@email.com',
    phone: '+91 98765 43222',
    joinDate: '2024-01-22',
    status: 'active',
    membershipType: 'quarterly',
    enrolledClasses: ['C003', 'C005'],
  },
  {
    id: 'S014',
    name: 'Pooja Malhotra',
    email: 'pooja.malhotra@email.com',
    phone: '+91 98765 43223',
    joinDate: '2024-02-12',
    status: 'active',
    membershipType: 'monthly',
    enrolledClasses: ['C001', 'C003'],
  },
  {
    id: 'S015',
    name: 'Karan Sethi',
    email: 'karan.sethi@email.com',
    phone: '+91 98765 43224',
    joinDate: '2024-03-03',
    status: 'active',
    membershipType: 'yearly',
    enrolledClasses: ['C005', 'C006'],
  },
];

export const tutors: Tutor[] = [
  {
    id: 'T001',
    name: 'Priya Sharma',
    email: 'priya.sharma@yogacenter.com',
    phone: '+91 98765 54321',
    specialization: ['Hatha Yoga', 'Vinyasa Flow', 'Power Yoga'],
    experience: 8,
    rating: 4.9,
    status: 'active',
    assignedClasses: ['C001', 'C003', 'C005', 'C006'],
  },
  {
    id: 'T002',
    name: 'Swami Ananda',
    email: 'swami.ananda@yogacenter.com',
    phone: '+91 98765 54322',
    specialization: ['Meditation', 'Pranayama'],
    experience: 12,
    rating: 4.95,
    status: 'active',
    assignedClasses: ['C007'],
  },
  {
    id: 'T003',
    name: 'Master Ravi',
    email: 'master.ravi@yogacenter.com',
    phone: '+91 98765 54323',
    specialization: ['Ashtanga', 'Pranayama'],
    experience: 15,
    rating: 4.95,
    status: 'active',
    assignedClasses: ['C004'],
  },
  {
    id: 'T004',
    name: 'Yoga Guru Maya',
    email: 'guru.maya@yogacenter.com',
    phone: '+91 98765 54324',
    specialization: ['Yin Yoga', 'Restorative'],
    experience: 6,
    rating: 4.7,
    status: 'active',
    assignedClasses: ['C002'],
  },
  {
    id: 'T005',
    name: 'Yogi Deepa',
    email: 'yogi.deepa@yogacenter.com',
    phone: '+91 98765 54325',
    specialization: ['Yin Yoga', 'Restorative'],
    experience: 6,
    rating: 4.7,
    status: 'on-leave',
    assignedClasses: [],
  },
];

export const classes: Class[] = [
  {
    id: 'C001',
    name: 'Morning Hatha Flow',
    type: 'Hatha Yoga',
    tutor: 'Priya Sharma',
    tutorId: 'T001',
    schedule: 'Mon, Wed, Fri - 6:00 AM',
    duration: 60,
    capacity: 20,
    enrolled: 15,
    enrolledStudents: ['S001', 'S002', 'S006', 'S008', 'S010', 'S012', 'S014'],
    status: 'active',
    price: 500,
  },
  {
    id: 'C002',
    name: 'Yin Yoga Restorative',
    type: 'Yin Yoga',
    tutor: 'Yoga Guru Maya',
    tutorId: 'T004',
    schedule: 'Tue, Thu, Sat - 7:00 AM',
    duration: 75,
    capacity: 15,
    enrolled: 12,
    enrolledStudents: ['S003'],
    status: 'active',
    price: 600,
  },
  {
    id: 'C003',
    name: 'Evening Vinyasa Flow',
    type: 'Vinyasa Flow',
    tutor: 'Priya Sharma',
    tutorId: 'T001',
    schedule: 'Mon to Fri - 6:30 PM',
    duration: 60,
    capacity: 25,
    enrolled: 20,
    enrolledStudents: ['S001', 'S004', 'S006', 'S009', 'S010', 'S013', 'S014'],
    status: 'active',
    price: 550,
  },
  {
    id: 'C004',
    name: 'Ashtanga Advanced',
    type: 'Ashtanga',
    tutor: 'Master Ravi',
    tutorId: 'T003',
    schedule: 'Sat, Sun - 8:00 AM',
    duration: 90,
    capacity: 10,
    enrolled: 8,
    enrolledStudents: ['S003'],
    status: 'active',
    price: 800,
  },
  {
    id: 'C005',
    name: 'Power Yoga Intensive',
    type: 'Power Yoga',
    tutor: 'Priya Sharma',
    tutorId: 'T001',
    schedule: 'Tue, Thu, Sat - 7:30 AM',
    duration: 75,
    capacity: 18,
    enrolled: 14,
    enrolledStudents: ['S002', 'S007', 'S008', 'S010', 'S011', 'S013', 'S015'],
    status: 'active',
    price: 650,
  },
  {
    id: 'C006',
    name: 'Sunset Hatha Practice',
    type: 'Hatha Yoga',
    tutor: 'Priya Sharma',
    tutorId: 'T001',
    schedule: 'Mon, Wed, Fri - 5:00 PM',
    duration: 60,
    capacity: 22,
    enrolled: 18,
    enrolledStudents: ['S001', 'S004', 'S007', 'S009', 'S011', 'S012'],
    status: 'active',
    price: 500,
  },
  {
    id: 'C007',
    name: 'Deep Meditation & Pranayama',
    type: 'Meditation',
    tutor: 'Swami Ananda',
    tutorId: 'T002',
    schedule: 'Daily - 7:00 PM',
    duration: 45,
    capacity: 30,
    enrolled: 25,
    enrolledStudents: [],
    status: 'active',
    price: 400,
  },
];

export const attendanceRecords: AttendanceRecord[] = [
  { id: 'UA001', studentId: 'S001', classId: 'C001', date: '2026-04-28', time: '6:00 PM', status: 'present', category: 'users' },
  { id: 'UA002', studentId: 'S002', classId: 'C005', date: '2026-04-28', time: '10:00 AM', status: 'present', category: 'users' },
  { id: 'UA003', studentId: 'S003', classId: 'C007', date: '2026-04-28', time: '8:00 AM', status: 'absent', category: 'users' },
  { id: 'UA004', studentId: 'S004', classId: 'C002', date: '2026-04-27', time: '7:00 AM', status: 'present', category: 'users' },
  { id: 'UA005', studentId: 'S001', classId: 'C006', date: '2026-04-27', time: '6:00 PM', status: 'late', category: 'users' },

  { id: 'TA001', studentId: '', classId: '', date: '2026-04-28', status: 'present', category: 'tutors', personName: 'Priya Sharma', classesConducted: 3, teachingHours: '4.5h' },
  { id: 'TA002', studentId: '', classId: '', date: '2026-04-28', status: 'present', category: 'tutors', personName: 'Rahul Kumar', classesConducted: 2, teachingHours: '3h' },
  { id: 'TA003', studentId: '', classId: '', date: '2026-04-28', status: 'present', category: 'tutors', personName: 'Anita Verma', classesConducted: 2, teachingHours: '2.5h' },
  { id: 'TA004', studentId: '', classId: '', date: '2026-04-27', status: 'present', category: 'tutors', personName: 'Vikram Singh', classesConducted: 1, teachingHours: '1.5h' },
  { id: 'TA005', studentId: '', classId: '', date: '2026-04-27', status: 'late', category: 'tutors', personName: 'Kavita Singh', classesConducted: 2, teachingHours: '3h' },

  { id: 'FA001', studentId: '', classId: '', date: '2026-04-28', status: 'present', category: 'frontline', personName: 'Sarah Johnson', context: 'Lead Gen Specialist', checkIn: '9:00 AM', checkOut: '6:00 PM' },
  { id: 'FA002', studentId: '', classId: '', date: '2026-04-28', status: 'present', category: 'frontline', personName: 'Michael Brown', context: 'Sales Executive', checkIn: '9:15 AM', checkOut: '6:00 PM' },
  { id: 'FA003', studentId: '', classId: '', date: '2026-04-28', status: 'absent', category: 'frontline', personName: 'Emily Davis', context: 'Customer Support' },
  { id: 'FA004', studentId: '', classId: '', date: '2026-04-27', status: 'present', category: 'frontline', personName: 'David Wilson', context: 'Lead Gen Specialist', checkIn: '9:00 AM', checkOut: '6:15 PM' },
  { id: 'FA005', studentId: '', classId: '', date: '2026-04-27', status: 'present', category: 'frontline', personName: 'Lisa Anderson', context: 'Sales Manager', checkIn: '8:45 AM', checkOut: '6:00 PM' },

  { id: 'OA001', studentId: '', classId: '', date: '2026-04-28', status: 'present', category: 'operations', personName: 'John Smith', context: 'Operations Manager', checkIn: '9:00 AM', checkOut: '6:00 PM' },
  { id: 'OA002', studentId: '', classId: '', date: '2026-04-28', status: 'present', category: 'operations', personName: 'Emma Johnson', context: 'HR Coordinator', checkIn: '9:30 AM', checkOut: '6:00 PM' },
  { id: 'OA003', studentId: '', classId: '', date: '2026-04-28', status: 'late', category: 'operations', personName: 'Robert Lee', context: 'Finance Officer', checkIn: '10:00 AM', checkOut: '6:00 PM' },
  { id: 'OA004', studentId: '', classId: '', date: '2026-04-27', status: 'present', category: 'operations', personName: 'Sophia Martinez', context: 'Content Manager', checkIn: '9:00 AM', checkOut: '6:00 PM' },
  { id: 'OA005', studentId: '', classId: '', date: '2026-04-27', status: 'present', category: 'operations', personName: 'James Taylor', context: 'IT Support', checkIn: '8:30 AM', checkOut: '5:30 PM' },
];

export const payments: Payment[] = [
  {
    id: 'P001',
    studentId: 'S001',
    amount: 12000,
    date: '2024-01-15',
    type: 'membership',
    status: 'paid',
    method: 'card',
  },
  {
    id: 'P002',
    studentId: 'S002',
    amount: 1500,
    date: '2026-03-01',
    type: 'membership',
    status: 'paid',
    method: 'upi',
  },
  {
    id: 'P003',
    studentId: 'S003',
    amount: 4500,
    date: '2025-12-10',
    type: 'membership',
    status: 'paid',
    method: 'cash',
  },
  {
    id: 'P004',
    studentId: 'S004',
    amount: 1500,
    date: '2026-03-05',
    type: 'membership',
    status: 'pending',
    method: 'upi',
  },
];