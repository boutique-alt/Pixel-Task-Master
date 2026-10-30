"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Client } from "@/components/ClientTable";
import {
  fetchMembersDb,
  upsertMemberDb,
  deleteMemberDb,
  fetchDirectoryClientsDb,
  upsertDirectoryClientDb,
  deleteDirectoryClientDb,
  fetchTasksDb,
  upsertTaskDb,
  deleteTaskDb,
  fetchAttendanceRecordsDb,
  upsertAttendanceRecordDb,
  adminForceUpdateAttendanceRecordDb,
  deleteAttendanceRecordDb,
  fetchAuthorizedDevicesDb,
  upsertAuthorizedDeviceDb,
  fetchLeaveRequestsDb,
  upsertLeaveRequestDb,
  deleteLeaveRequestDb,
  fetchLeaveTypesDb,
  upsertLeaveTypeDb,
  deleteLeaveTypeDb,
  fetchBankDetailsDb,
  upsertBankDetailDb,
  deleteBankDetailDb,
  fetchSalaryPaymentsDb,
  upsertSalaryPaymentDb,
  deleteSalaryPaymentDb,
  fetchHRNoticesDb,
  upsertHRNoticeDb,
  deleteHRNoticeDb,
  fetchOfficeRulesDb,
  upsertOfficeRuleDb,
  deleteOfficeRuleDb,
  isRealOfficeRule,
  isWifiIpMatched,
  fetchAttendanceConfigDb,
  upsertAttendanceConfigDb,
  fetchActivitiesDb,
  insertActivityDb,
  fetchDailyReportsDb,
  upsertDailyReportDb,
  deleteDailyReportDb,
  fetchBroadcastAlertsDb,
  upsertBroadcastAlertDb,
  deleteBroadcastAlertDb,
  fetchCompanyHolidaysDb,
  upsertCompanyHolidayDb,
  deleteCompanyHolidayDb,
  fetchMemberHolidaySelectionsDb,
  upsertMemberHolidaySelectionDb,
  deleteMemberHolidaySelectionDb,
} from "@/lib/crmService";
import { 
  CompanyHoliday, 
  MemberHolidaySelection, 
  INITIAL_COMPANY_HOLIDAYS, 
  MAX_MEMBER_HOLIDAYS_QUOTA 
} from "@/lib/holidayData";
export type { CompanyHoliday, MemberHolidaySelection };
export { MAX_MEMBER_HOLIDAYS_QUOTA };
import { getSessionUser, clearSessionUser, AppUser } from "@/lib/authService";

export type Activity = {
  id: string;
  text: string;
  time: string;
  type: "status" | "comment" | "assign" | "add";
};

export type Member = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  systemRole?: "member" | "coordinator";
  status?: "Active" | "On Leave" | "Inactive";
};

export type DirectoryClient = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  category: string;
  address?: string;
  status?: "Active" | "Inactive";
};

export const CATEGORY_OPTIONS = [
  { value: "Website Creation", label: "Website Creation" },
  { value: "Website Revamp", label: "Website Revamp" },
  { value: "Landing Page", label: "Landing Page" },
  { value: "Logo Design", label: "Logo Design" },
  { value: "Logo Revamp", label: "Logo Revamp" },
  { value: "Reels", label: "Reels" },
  { value: "Creative", label: "Creative" },
  { value: "Ad Running", label: "Ad Running" },
  { value: "GBP", label: "GBP / SEO" },
  { value: "Retail", label: "Retail" },
  { value: "Other", label: "Other" },
] as const;

export type LeaveTypeOption = {
  id: string;
  name: string;
  maxDays: number;
  isPaid: boolean;
  color: "blue" | "orange" | "purple" | "green" | "gray";
  active: boolean;
};

export type LeaveRequest = {
  id: string;
  member: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  adminRemark?: string;
  appliedAt: string;
};

export type OfficeAttendanceConfig = {
  officeStartTime: string; // "09:30"
  graceTime: string; // "09:45"
  officeEndTime: string; // "18:30"
  targetHours: number; // 8
  wifiName: string; // "Panda WiFi"
  registeredWifiIp: string;
  requireWifiOrGps: boolean;
  officeLat: number | null;
  officeLng: number | null;
  allowedRadiusMeters: number;
  requireAuthorizedLaptop: boolean;
  autoCheckInOnOpen: boolean;
};

export type AuthorizedDevice = {
  id: string;
  deviceId: string;
  deviceName: string;
  assignedMember: string; // Member name or "All (Office Laptop)"
  status: "Approved" | "Pending" | "Revoked";
  requestedAt: string;
};

export type AttendanceRecord = {
  id: string;
  member: string;
  date: string; // YYYY-MM-DD
  checkInTime: string; // "09:05:12 AM"
  checkInTimestamp: number;
  checkOutTime?: string;
  checkOutTimestamp?: number;
  workingMinutes?: number;
  status: "On Time" | "Late" | "Checked Out";
  verifiedVia: string;
  deviceId: string;
  lateReason?: string;
  adminNote?: string;
};

export type HRNotice = {
  id: string;
  title: string;
  description: string;
  type: "Holiday" | "Notice" | "Urgent";
  date: string;
};

export type OfficeRule = {
  id: string;
  category: "Timing & Attendance" | "Leave Policy" | "Office Discipline";
  title: string;
  description: string;
};

export type MemberBankDetail = {
  id: string;
  member: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  upiId?: string;
  upiNumber?: string;
  qrCodeImage?: string;
  status: "Verified" | "Pending";
  updatedAt: string;
};

export type SalaryPaymentRecord = {
  id: string;
  member: string;
  amount: string;
  paymentDate: string;
  monthOrPurpose: string;
  paymentMethod: "UPI / QR Scan" | "Bank Transfer" | "Cash";
  transactionRef?: string;
};

export type DailyReportTaskItem = {
  id: string;
  name: string;
  category: string;
  taskDetails?: string;
  status?: string;
  reason?: string;
};

export type DailyReport = {
  id: string;
  date: string; // YYYY-MM-DD
  submittedAt: string; // ISO string
  submittedTimeDisplay: string; // "06:45 PM"
  member: string;
  memberPhone?: string;
  memberRole?: string;
  
  // Attendance snapshot
  attendanceStatus: string;
  checkInTime: string;
  checkOutTime: string;
  workingTimeDisplay: string;
  
  // Tasks
  totalTasksCount: number;
  completedTasks: DailyReportTaskItem[];
  pendingTasks: DailyReportTaskItem[];
  cantDoTasks?: DailyReportTaskItem[];
  
  // Remarks
  remarks?: string;
  
  // Formatted report string (used for direct WhatsApp forward or copy)
  formattedText: string;
  
  // Tamper-proof flag
  isLocked: boolean;
};

export type BroadcastAlert = {
  id: string; // e.g. "alert_1729760000000"
  title: string; // বিষয়
  message: string; // বিস্তারিত মেসেজ
  targetType: "all" | "individual" | "admin_coordinator";
  targetMember?: string; // e.g. "Rahim"
  sender?: string; // name of user who triggered the alert (to prevent self-notification)
  priority: "normal" | "urgent";
  createdAt: string; // ISO string
  createdTimeDisplay: string; // "02:30 PM"
  createdDate: string; // "2026-10-24"
  acknowledgedBy: string[]; // member names who clicked OK
};

interface CRMContextType {
  clients: Client[];
  directoryClients: DirectoryClient[];
  activities: Activity[];
  members: Member[];
  currentMember: string;
  setCurrentMember: (memberName: string) => void;
  sessionUser: AppUser | null;
  logout: () => void;
  leaveTypes: LeaveTypeOption[];
  leaveRequests: LeaveRequest[];
  // Attendance State
  attendanceConfig: OfficeAttendanceConfig;
  authorizedDevices: AuthorizedDevice[];
  attendanceRecords: AttendanceRecord[];
  currentDeviceId: string;
  currentNetworkIp: string;
  isCloudSynced: boolean;
  // HR Rules & Notices State
  hrNotices: HRNotice[];
  officeRules: OfficeRule[];
  // Bank Details & Salary Payments State
  bankDetails: MemberBankDetail[];
  salaryPayments: SalaryPaymentRecord[];
  // Daily Reports State (Tamper-Proof)
  dailyReports: DailyReport[];
  submitDailyReport: (report: Omit<DailyReport, "id" | "isLocked" | "submittedAt" | "submittedTimeDisplay">) => Promise<{ success: boolean; report: DailyReport }>;
  deleteDailyReport: (id: string) => void;
  // Broadcast Alerts State (Real-time with Sound)
  broadcastAlerts: BroadcastAlert[];
  sendBroadcastAlert: (alert: Omit<BroadcastAlert, "id" | "createdAt" | "createdTimeDisplay" | "createdDate" | "acknowledgedBy">) => Promise<{ success: boolean; alert: BroadcastAlert }>;
  acknowledgeAlert: (alertId: string, memberName: string) => Promise<void>;
  deleteBroadcastAlert: (id: string) => void;
  // Company Holiday List & Member Selection
  companyHolidays: CompanyHoliday[];
  memberHolidaySelections: MemberHolidaySelection[];
  addCompanyHoliday: (holiday: Omit<CompanyHoliday, "id">) => void;
  deleteCompanyHoliday: (id: string) => void;
  saveMemberHolidaySelection: (memberName: string, selectedHolidayIds: string[]) => void;
  updateMemberHolidaySelectionStatus: (id: string, status: MemberHolidaySelection["status"], adminRemark?: string) => void;
  // Task CRUD
  updateStatus: (id: string, status: Client["status"], user: string) => void;
  updateComment: (id: string, comment: string, user: string) => void;
  assignMember: (id: string, memberName: string, adminName: string) => void;
  addClient: (client: Client, adminName: string) => void;
  deleteClient: (id: string, adminName: string) => void;
  updateClient: (id: string, updatedData: Partial<Client>, adminName: string) => void;
  // Member CRUD
  addMember: (member: Member, adminName: string) => void;
  updateMember: (id: string, updatedData: Partial<Member>, adminName: string) => void;
  deleteMember: (id: string, adminName: string) => void;
  // Client Directory CRUD
  addDirectoryClient: (client: DirectoryClient, adminName: string) => void;
  updateDirectoryClient: (id: string, updatedData: Partial<DirectoryClient>, adminName: string) => void;
  deleteDirectoryClient: (id: string, adminName: string) => void;
  // Leave Type Options CRUD (Admin)
  addLeaveType: (option: LeaveTypeOption) => void;
  updateLeaveType: (id: string, updated: Partial<LeaveTypeOption>) => void;
  deleteLeaveType: (id: string) => void;
  // Leave Requests CRUD (Member & Admin)
  applyLeave: (req: Omit<LeaveRequest, "id" | "status" | "appliedAt">) => void;
  updateLeaveRequestStatus: (id: string, status: LeaveRequest["status"], adminRemark?: string) => void;
  deleteLeaveRequest: (id: string) => void;
  // Attendance CRUD & Actions
  updateAttendanceConfig: (updated: Partial<OfficeAttendanceConfig>) => void;
  requestDeviceAuthorization: (memberName: string, deviceName?: string) => void;
  updateDeviceStatus: (id: string, status: AuthorizedDevice["status"], assignedMember?: string) => void;
  deleteAuthorizedDevice: (id: string) => void;
  checkInMember: (memberName: string, verifiedVia: string, lateReason?: string, customTimestamp?: number) => void;
  checkOutMember: (memberName: string) => void;
  adminUpdateAttendance: (id: string, updated: Partial<AttendanceRecord>) => void;
  deleteAttendanceRecord: (id: string) => void;
  setAttendanceRecords: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  // HR Notices & Office Rules CRUD (Admin)
  addHRNotice: (notice: Omit<HRNotice, "id">) => void;
  updateHRNotice: (id: string, updated: Partial<HRNotice>) => void;
  deleteHRNotice: (id: string) => void;
  addOfficeRule: (rule: Omit<OfficeRule, "id">) => void;
  updateOfficeRule: (id: string, updated: Partial<OfficeRule>) => void;
  deleteOfficeRule: (id: string) => void;
  // Bank Details & Salary Payments CRUD (Member & Admin)
  saveMemberBankDetail: (data: Omit<MemberBankDetail, "id" | "status" | "updatedAt">) => void;
  updateBankDetailStatus: (id: string, status: MemberBankDetail["status"]) => void;
  adminUpdateBankDetail: (id: string, updated: Partial<MemberBankDetail>) => void;
  deleteBankDetail: (id: string) => void;
  addSalaryPayment: (payment: Omit<SalaryPaymentRecord, "id">) => void;
  updateSalaryPayment: (id: string, updated: Partial<SalaryPaymentRecord>) => void;
  deleteSalaryPayment: (id: string) => void;
}

const INITIAL_MEMBERS: Member[] = [
  { id: "e1", name: "Rahim", email: "rahim@company.com", phone: "+880 1711-223344", role: "Sr. Web Developer", status: "Active" },
  { id: "e2", name: "Karim", email: "karim@company.com", phone: "+880 1811-556677", role: "UI/UX & Brand Designer", status: "Active" },
  { id: "e3", name: "Jamil", email: "jamil@company.com", phone: "+880 1911-889900", role: "SEO & GBP Specialist", status: "Active" },
];

const INITIAL_DIRECTORY_CLIENTS: DirectoryClient[] = [
  { id: "c1", name: "Ahmed Sharif", phone: "+1 (555) 123-4567", email: "ahmed@sharifstore.com", company: "Sharif Retail LLC", category: "Website Creation", status: "Active" },
  { id: "c2", name: "Fatima Traders", phone: "+1 (555) 987-6543", email: "info@fatimatraders.com", company: "Fatima Wholesale", category: "Logo Design", status: "Active" },
  { id: "c3", name: "Hamid Electronics", phone: "+1 (555) 456-7890", email: "support@hamidelec.com", company: "Hamid Tech", category: "Website Revamp", status: "Inactive" },
  { id: "c4", name: "Sara Boutique", phone: "+1 (555) 789-0123", email: "hello@saraboutique.com", company: "Sara Fashion House", category: "GBP", status: "Active" },
  { id: "c5", name: "Kabul Handicrafts", phone: "+1 (555) 111-2222", email: "sales@kabulcrafts.com", company: "Kabul Artisans", category: "Website Creation", status: "Active" },
  { id: "c6", name: "Herat Textiles", phone: "+1 (555) 333-4444", email: "contact@herattextiles.com", company: "Herat Fabrics Co.", category: "Landing Page", status: "Active" },
];

const INITIAL_CLIENTS: Client[] = [
  { id: "1", name: "Ahmed Sharif", phone: "+1 (555) 123-4567", category: "Website Creation", taskDetails: "Set up the entire Shopify store and payment gateways", member: "Rahim", expected: "50000", received: "25000", status: "Pending", comments: "Asked to call back tomorrow", taskType: "Regular", startDate: "2026-10-10", endDate: "2026-10-13" },
  { id: "2", name: "Fatima Traders", phone: "+1 (555) 987-6543", category: "Logo Design", taskDetails: "Design new logo and full branding kit", member: "Karim", expected: "120000", received: "120000", status: "Done", comments: "Paid in full", taskType: "One-Time", startDate: "2026-09-01", endDate: "2026-09-30" },
  { id: "3", name: "Hamid Electronics", phone: "+1 (555) 456-7890", category: "Website Revamp", taskDetails: "Migrate legacy site and optimize mobile speed", member: "Rahim", expected: "80000", received: "0", status: "Can't Do", reason: "Competitor", comments: "Went with brand X", taskType: "One-Time", startDate: "2026-10-01", endDate: "2026-10-05" },
  { id: "4", name: "Sara Boutique", phone: "+1 (555) 789-0123", category: "GBP", taskDetails: "Monthly SEO and Google My Business profile management", member: "Jamil", expected: "45000", received: "15000", status: "In Progress", comments: "Keyword audit completed", taskType: "Regular", startDate: "2026-10-05", endDate: "2026-10-15" },
  { id: "5", name: "Kabul Handicrafts", phone: "+1 (555) 111-2222", category: "Website Creation", taskDetails: "Build multi-vendor catalog and product pages", member: "Rahim", expected: "245000", received: "245000", status: "Done", comments: "Delivered and approved by client", taskType: "Regular", startDate: "2026-08-01", endDate: "2026-12-31" },
  { id: "6", name: "Herat Textiles", phone: "+1 (555) 333-4444", category: "Landing Page", taskDetails: "Redesign landing page for upcoming winter sale", member: "Karim", expected: "167000", received: "100000", status: "Pending", comments: "", taskType: "One-Time", startDate: "2026-10-08", endDate: "2026-10-13" },
];

const INITIAL_LEAVE_TYPES: LeaveTypeOption[] = [
  { id: "lt1", name: "Casual Leave", maxDays: 10, isPaid: true, color: "blue", active: true },
  { id: "lt2", name: "Sick Leave", maxDays: 5, isPaid: true, color: "orange", active: true },
  { id: "lt3", name: "Half-Day", maxDays: 4, isPaid: true, color: "purple", active: true },
  { id: "lt4", name: "Unpaid Leave", maxDays: 0, isPaid: false, color: "gray", active: true },
];

const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [
  { id: "lr1", member: "Rahim", leaveType: "Casual Leave", startDate: "2026-10-15", endDate: "2026-10-15", days: 1, status: "Pending", reason: "Family event", appliedAt: "2026-10-12" },
  { id: "lr2", member: "Rahim", leaveType: "Sick Leave", startDate: "2026-09-15", endDate: "2026-09-16", days: 2, status: "Approved", reason: "Viral fever", adminRemark: "Get well soon", appliedAt: "2026-09-14" },
  { id: "lr3", member: "Karim", leaveType: "Casual Leave", startDate: "2026-10-18", endDate: "2026-10-19", days: 2, status: "Pending", reason: "Personal trip", appliedAt: "2026-10-13" },
  { id: "lr4", member: "Rahim", leaveType: "Casual Leave", startDate: "2026-07-20", endDate: "2026-07-22", days: 3, status: "Approved", reason: "Out of town", adminRemark: "Approved", appliedAt: "2026-07-15" },
];

const INITIAL_ATTENDANCE_CONFIG: OfficeAttendanceConfig = {
  officeStartTime: "09:30",
  graceTime: "09:45",
  officeEndTime: "18:30",
  targetHours: 8,
  wifiName: "Panda WiFi",
  registeredWifiIp: "49.37.8.225, 49.37.8.*, 103.145.22.10",
  requireWifiOrGps: true,
  officeLat: 22.463493,
  officeLng: 88.382777,
  allowedRadiusMeters: 100,
  requireAuthorizedLaptop: false,
  autoCheckInOnOpen: true,
};

const INITIAL_ATTENDANCE_RECORDS: AttendanceRecord[] = [];

const INITIAL_HR_NOTICES: HRNotice[] = [
  {
    id: "hn_1",
    title: "Eid-ul-Fitr Holidays",
    description: "Office closed from Apr 10 to Apr 12.",
    type: "Holiday",
    date: "2026-04-10",
  },
  {
    id: "hn_2",
    title: "New Timesheet Policy",
    description: "Submit your timesheet by Friday 5 PM.",
    type: "Notice",
    date: "2026-10-13",
  },
];

const INITIAL_OFFICE_RULES: OfficeRule[] = [
  {
    id: "or_1",
    category: "Timing & Attendance",
    title: "Auto Check-In via Panda WiFi / Office GPS",
    description: "Members must connect to Panda WiFi or be inside the Office GPS radius from an approved office laptop for automatic check-in.",
  },
  {
    id: "or_2",
    category: "Timing & Attendance",
    title: "Grace Period & Punctuality",
    description: "Check-in before the daily grace time (09:45 AM). Check-ins after grace time are automatically marked as Late.",
  },
  {
    id: "or_3",
    category: "Leave Policy",
    title: "Advance Leave Application",
    description: "All planned leaves must be applied through the Leave Apply portal for Admin approval. Emergency sick leaves must be informed on the same morning.",
  },
  {
    id: "or_4",
    category: "Office Discipline",
    title: "Daily Task Status & Remarks",
    description: "Every member must update their assigned client task status and add remarks before checking out at the end of the shift.",
  },
];

const INITIAL_BANK_DETAILS: MemberBankDetail[] = [
  {
    id: "bd_1",
    member: "Rahim",
    accountHolderName: "MD. RAHIM UDDIN",
    bankName: "State Bank of India (SBI)",
    accountNumber: "30458912045",
    ifscCode: "SBIN0001234",
    branchName: "Salt Lake Sector V Branch",
    upiId: "rahim@oksbi",
    upiNumber: "9876543210",
    status: "Verified",
    updatedAt: "2026-10-10",
  },
  {
    id: "bd_2",
    member: "Karim",
    accountHolderName: "KARIM AHMED",
    bankName: "HDFC Bank",
    accountNumber: "501004829102",
    ifscCode: "HDFC0000456",
    branchName: "Park Street Branch",
    upiId: "karim@hdfcbank",
    upiNumber: "9830011223",
    status: "Pending",
    updatedAt: "2026-10-12",
  },
];

const INITIAL_SALARY_PAYMENTS: SalaryPaymentRecord[] = [
  {
    id: "sp_1",
    member: "Rahim",
    amount: "25000",
    paymentDate: "2026-10-05",
    monthOrPurpose: "September 2026 Salary",
    paymentMethod: "Bank Transfer",
    transactionRef: "UTR883920112",
  },
  {
    id: "sp_2",
    member: "Rahim",
    amount: "5000",
    paymentDate: "2026-10-12",
    monthOrPurpose: "Festival Bonus",
    paymentMethod: "UPI / QR Scan",
    transactionRef: "UPI-42859102",
  },
  {
    id: "sp_3",
    member: "Karim",
    amount: "22000",
    paymentDate: "2026-10-05",
    monthOrPurpose: "September 2026 Salary",
    paymentMethod: "Bank Transfer",
    transactionRef: "UTR883920449",
  },
];

const INITIAL_ACTIVITIES: Activity[] = [
  { id: "a1", text: "Karim marked Fatima Traders as Done", time: "2 hours ago", type: "status" },
  { id: "a2", text: "Admin assigned Sara Boutique to Jamil", time: "5 hours ago", type: "assign" },
];

const STORAGE_KEYS = {
  CLIENTS: "ptm_crm_clients_v2",
  DIRECTORY_CLIENTS: "ptm_crm_directory_clients_v2",
  ACTIVITIES: "ptm_crm_activities_v2",
  MEMBERS: "ptm_crm_members_v2",
  CURRENT_MEMBER: "ptm_crm_current_member_v2",
  LEAVE_TYPES: "ptm_crm_leave_types_v1",
  LEAVE_REQUESTS: "ptm_crm_leave_requests_v1",
  ATTENDANCE_CONFIG: "ptm_crm_att_config_v2",
  AUTHORIZED_DEVICES: "ptm_crm_auth_devices_v1",
  ATTENDANCE_RECORDS: "ptm_crm_att_records_v1",
  THIS_LAPTOP_ID: "ptm_this_laptop_device_id_v1",
  HR_NOTICES: "ptm_crm_hr_notices_v1",
  OFFICE_RULES: "ptm_crm_office_rules_v1",
  BANK_DETAILS: "ptm_crm_bank_details_v1",
  SALARY_PAYMENTS: "ptm_crm_salary_payments_v1",
  DAILY_REPORTS: "ptm_crm_daily_reports_v1",
  BROADCAST_ALERTS: "ptm_crm_broadcast_alerts_v1",
  COMPANY_HOLIDAYS: "ptm_crm_company_holidays_v1",
  HOLIDAY_SELECTIONS: "ptm_crm_holiday_selections_v1",
};

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export function getLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isTaskOnDate(
  t: { taskType?: string; startDate?: string; endDate?: string; status?: string },
  dateStr: string,
  forMemberPortal: boolean = false
): boolean {
  if (!dateStr) return true;

  // Rule 1: Scheduled / Date-based check (Exact Date or Range Match)
  // If the task has a specific date assigned (like today 2026-10-30):
  if (t.startDate === dateStr || t.endDate === dateStr) return true;
  if (t.startDate && t.endDate && t.startDate <= dateStr && t.endDate >= dateStr) return true;

  // Rule 2: Automatic Rollover / Carry-Forward Rule (ONLY FOR MEMBER PORTAL):
  // When a member views their daily tasks, any unfinished task from past dates rolls over
  if (forMemberPortal) {
    const isUnfinished = t.status === "Pending" || t.status === "In Progress";
    if (isUnfinished && t.endDate && t.endDate < dateStr) {
      return true;
    }
  }

  // Rule 3: Regular Tasks with no specific date bounds (or for member daily view)
  if (t.taskType === "Regular" && (!t.startDate && !t.endDate)) {
    return true;
  }

  return false;
}

export function parseTimeToMs(dateStr: string, timeStr?: string): number {
  if (!timeStr) return 0;
  const match = timeStr.trim().match(/(\d+)(?:[:\s](\d+))?(?:[:\s](\d+))?\s*(AM|PM)?/i);
  if (!match) return 0;

  let h = parseInt(match[1], 10);
  const m = match[2] ? parseInt(match[2], 10) : 0;
  const s = match[3] ? parseInt(match[3], 10) : 0;
  const ampm = match[4]?.toUpperCase();

  if (ampm === "PM" && h < 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;

  const [y, mon, d] = (dateStr || getLocalDateString()).split("-").map(Number);
  return new Date(y, mon - 1, d, h, m, s).getTime();
}

export function CRMProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [directoryClients, setDirectoryClients] = useState<DirectoryClient[]>(INITIAL_DIRECTORY_CLIENTS);
  const [activities, setActivities] = useState<Activity[]>(INITIAL_ACTIVITIES);
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [currentMember, setCurrentMember] = useState<string>("Rahim");
  const [sessionUser, setSessionUserState] = useState<AppUser | null>(null);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeOption[]>(INITIAL_LEAVE_TYPES);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(INITIAL_LEAVE_REQUESTS);

  const [attendanceConfig, setAttendanceConfig] = useState<OfficeAttendanceConfig>(INITIAL_ATTENDANCE_CONFIG);
  const [authorizedDevices, setAuthorizedDevices] = useState<AuthorizedDevice[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE_RECORDS);
  const [currentDeviceId, setCurrentDeviceId] = useState<string>("OFFICE-LAPTOP-INIT");
  const [currentNetworkIp, setCurrentNetworkIp] = useState<string>("");

  const [hrNotices, setHrNotices] = useState<HRNotice[]>(INITIAL_HR_NOTICES);
  const [officeRules, setOfficeRules] = useState<OfficeRule[]>(INITIAL_OFFICE_RULES);
  const [bankDetails, setBankDetails] = useState<MemberBankDetail[]>(INITIAL_BANK_DETAILS);
  const [salaryPayments, setSalaryPayments] = useState<SalaryPaymentRecord[]>(INITIAL_SALARY_PAYMENTS);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [broadcastAlerts, setBroadcastAlerts] = useState<BroadcastAlert[]>([]);
  const [companyHolidays, setCompanyHolidays] = useState<CompanyHoliday[]>(INITIAL_COMPANY_HOLIDAYS);
  const [memberHolidaySelections, setMemberHolidaySelections] = useState<MemberHolidaySelection[]>([]);

  const [isHydrated, setIsHydrated] = useState(false);
  const [isCloudSynced, setIsCloudSynced] = useState(false);

  // Load persisted data and initialize device ID + IP
  useEffect(() => {
    try {
      // 1. Get or create unique hardware/browser Device ID for this laptop
      let devId = localStorage.getItem(STORAGE_KEYS.THIS_LAPTOP_ID);
      if (!devId) {
        const randomHex = Math.random().toString(16).substring(2, 6).toUpperCase();
        devId = `OFFICE-LAPTOP-${randomHex}`;
        localStorage.setItem(STORAGE_KEYS.THIS_LAPTOP_ID, devId);
      }
      setCurrentDeviceId(devId);

      // 2. Load saved CRM data
      const savedClients = localStorage.getItem(STORAGE_KEYS.CLIENTS);
      const savedDirectory = localStorage.getItem(STORAGE_KEYS.DIRECTORY_CLIENTS);
      const savedActivities = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
      const savedMembers = localStorage.getItem(STORAGE_KEYS.MEMBERS);
      const savedCurrentMember = localStorage.getItem(STORAGE_KEYS.CURRENT_MEMBER);
      const savedLeaveTypes = localStorage.getItem(STORAGE_KEYS.LEAVE_TYPES);
      const savedLeaveRequests = localStorage.getItem(STORAGE_KEYS.LEAVE_REQUESTS);
      const savedAttConfig = localStorage.getItem(STORAGE_KEYS.ATTENDANCE_CONFIG);
      const legacyAttConfig = localStorage.getItem("ptm_crm_att_config_v1");
      const savedAuthDevices = localStorage.getItem(STORAGE_KEYS.AUTHORIZED_DEVICES);
      const savedAttRecords = localStorage.getItem(STORAGE_KEYS.ATTENDANCE_RECORDS);
      const savedHrNotices = localStorage.getItem(STORAGE_KEYS.HR_NOTICES);
      const savedOfficeRules = localStorage.getItem(STORAGE_KEYS.OFFICE_RULES);
      const savedBankDetails = localStorage.getItem(STORAGE_KEYS.BANK_DETAILS);
      const savedSalaryPayments = localStorage.getItem(STORAGE_KEYS.SALARY_PAYMENTS);
      const savedDailyReports = localStorage.getItem(STORAGE_KEYS.DAILY_REPORTS);
      const savedBroadcastAlerts = localStorage.getItem(STORAGE_KEYS.BROADCAST_ALERTS);
      const savedHolidays = localStorage.getItem(STORAGE_KEYS.COMPANY_HOLIDAYS);
      const savedHolidaySelections = localStorage.getItem(STORAGE_KEYS.HOLIDAY_SELECTIONS);

      let parsedClients: Client[] | null = null;
      if (savedClients) {
        parsedClients = JSON.parse(savedClients);
        if (parsedClients) setClients(parsedClients);
      }
      if (savedDirectory) setDirectoryClients(JSON.parse(savedDirectory));
      if (savedActivities) setActivities(JSON.parse(savedActivities));
      if (savedMembers) setMembers(JSON.parse(savedMembers));
      if (savedLeaveTypes) setLeaveTypes(JSON.parse(savedLeaveTypes));
      if (savedLeaveRequests) setLeaveRequests(JSON.parse(savedLeaveRequests));
      if (savedHrNotices) setHrNotices(JSON.parse(savedHrNotices));
      if (savedHolidays) {
        try {
          const parsed = JSON.parse(savedHolidays);
          if (Array.isArray(parsed) && parsed.length > 0) setCompanyHolidays(parsed);
        } catch {}
      }
      if (savedHolidaySelections) {
        try {
          const parsed = JSON.parse(savedHolidaySelections);
          if (Array.isArray(parsed)) setMemberHolidaySelections(parsed);
        } catch {}
      }
      if (savedOfficeRules) {
        try {
          const parsedRules = JSON.parse(savedOfficeRules);
          if (Array.isArray(parsedRules)) {
            const cleanRules = parsedRules.filter(isRealOfficeRule);
            setOfficeRules(cleanRules.length > 0 ? cleanRules : INITIAL_OFFICE_RULES);
          }
        } catch {
          setOfficeRules(INITIAL_OFFICE_RULES);
        }
      }
      if (savedBankDetails) setBankDetails(JSON.parse(savedBankDetails));
      if (savedSalaryPayments) setSalaryPayments(JSON.parse(savedSalaryPayments));
      if (savedDailyReports) setDailyReports(JSON.parse(savedDailyReports));
      if (savedBroadcastAlerts) setBroadcastAlerts(JSON.parse(savedBroadcastAlerts));

      let parsedAttConfig: OfficeAttendanceConfig = INITIAL_ATTENDANCE_CONFIG;
      if (savedAttConfig) {
        try {
          const loadedCfg = JSON.parse(savedAttConfig);
          parsedAttConfig = {
            ...INITIAL_ATTENDANCE_CONFIG,
            ...loadedCfg,
            requireWifiOrGps: loadedCfg.requireWifiOrGps !== undefined ? loadedCfg.requireWifiOrGps : true,
            requireAuthorizedLaptop: loadedCfg.requireAuthorizedLaptop !== undefined ? loadedCfg.requireAuthorizedLaptop : true,
          };
          setAttendanceConfig(parsedAttConfig);
        } catch {
          setAttendanceConfig(INITIAL_ATTENDANCE_CONFIG);
        }
      } else if (legacyAttConfig) {
        try {
          const oldCfg = JSON.parse(legacyAttConfig);
          parsedAttConfig = { ...INITIAL_ATTENDANCE_CONFIG, ...oldCfg, autoCheckInOnOpen: true };
          setAttendanceConfig(parsedAttConfig);
          localStorage.setItem(STORAGE_KEYS.ATTENDANCE_CONFIG, JSON.stringify(parsedAttConfig));
        } catch {
          setAttendanceConfig(INITIAL_ATTENDANCE_CONFIG);
        }
      }

      if (savedAuthDevices) {
        setAuthorizedDevices(JSON.parse(savedAuthDevices));
      } else {
        // Pre-authorize this primary office laptop on first run so Admin/Member can test right away
        const initialDevices: AuthorizedDevice[] = [
          {
            id: "dev_primary",
            deviceId: devId,
            deviceName: "Primary Office Laptop (Windows / Chrome)",
            assignedMember: "All (Office Laptop)",
            status: "Approved",
            requestedAt: getLocalDateString(),
          },
        ];
        setAuthorizedDevices(initialDevices);
        localStorage.setItem(STORAGE_KEYS.AUTHORIZED_DEVICES, JSON.stringify(initialDevices));
      }

      if (savedAttRecords) {
        try {
          const parsed: AttendanceRecord[] = JSON.parse(savedAttRecords);
          const seen = new Set<string>();
          const deduped: AttendanceRecord[] = [];
          for (const r of parsed) {
            const key = `${(r.member || "").trim().toLowerCase()}_${r.date}`;
            if (!seen.has(key)) {
              seen.add(key);
              deduped.push(r);
            }
          }
          setAttendanceRecords(deduped);
        } catch (e) {
          console.error(e);
        }
      }

      const activeSession = getSessionUser();
      if (activeSession) {
        setSessionUserState(activeSession);
        if (activeSession.role === "member" || activeSession.role === "coordinator") {
          setCurrentMember(activeSession.name);
        } else if (savedCurrentMember) {
          setCurrentMember(savedCurrentMember);
        }
      } else if (savedCurrentMember) {
        setCurrentMember(savedCurrentMember);
      } else if (parsedClients && parsedClients.length > 0 && parsedClients[0].member) {
        setCurrentMember(parsedClients[0].member);
      }

      // 3. Detect live public IP for Panda WiFi verification using first-party endpoint + fast multi-provider race
      const detectIp = () => {
        // First try our own first-party endpoint (instant & immune to ad-blockers)
        fetch("/api/attendance/network-ip", { cache: "no-store" })
          .then((r) => r.json())
          .then((data) => {
            if (data?.ip && data.ip !== "127.0.0.1") {
              setCurrentNetworkIp(String(data.ip).trim());
            } else {
              throw new Error("Local fallback");
            }
          })
          .catch(() => {
            // Fallback to high-speed public providers if local proxy differs
            Promise.any([
              fetch("https://api64.ipify.org?format=json").then((r) => r.json()).then((d) => d.ip),
              fetch("https://api.ipify.org?format=json").then((r) => r.json()).then((d) => d.ip),
              fetch("https://ipinfo.io/json").then((r) => r.json()).then((d) => d.ip),
              fetch("https://icanhazip.com").then((r) => r.text()).then((t) => t.trim()),
            ])
              .then((ip) => {
                if (ip) {
                  setCurrentNetworkIp(String(ip).trim());
                }
              })
              .catch(() => {});
          });
      };

      detectIp();
      // Periodically refresh IP every 20 seconds and on window focus/online so WiFi switch immediately triggers
      const ipInterval = setInterval(detectIp, 20000);
      window.addEventListener("focus", detectIp);
      window.addEventListener("online", detectIp);

      // 4. Live fetch from Supabase Cloud Database
      (async () => {
        try {
          const fetchPromises = [
            fetchMembersDb(),
            fetchDirectoryClientsDb(),
            fetchTasksDb(),
            fetchAttendanceRecordsDb(),
            fetchAuthorizedDevicesDb(),
            fetchLeaveRequestsDb(),
            fetchLeaveTypesDb(),
            fetchBankDetailsDb(),
            fetchSalaryPaymentsDb(),
            fetchHRNoticesDb(),
            fetchOfficeRulesDb(),
            fetchActivitiesDb(),
            fetchAttendanceConfigDb(),
            fetchDailyReportsDb(),
            fetchBroadcastAlertsDb(),
            fetchCompanyHolidaysDb(),
            fetchMemberHolidaySelectionsDb(),
          ] as const;

          const [
            dbMembers, 
            dbClients, 
            dbTasks, 
            dbAttRecs, 
            dbAuthDevs, 
            dbLeaveReqs, 
            dbLeaveTypes, 
            dbBankDetails, 
            dbPayments, 
            dbNotices, 
            dbRules, 
            dbActs,
            dbConfig,
            dbReports,
            dbAlerts,
            dbHolidays,
            dbSelections,
          ] = await Promise.all(fetchPromises);

          if (dbConfig) {
            const mergedDbConfig: OfficeAttendanceConfig = {
              ...INITIAL_ATTENDANCE_CONFIG,
              ...dbConfig,
              requireWifiOrGps: dbConfig.requireWifiOrGps !== undefined ? dbConfig.requireWifiOrGps : true,
              requireAuthorizedLaptop: dbConfig.requireAuthorizedLaptop !== undefined ? dbConfig.requireAuthorizedLaptop : false,
              allowedRadiusMeters: dbConfig.allowedRadiusMeters || 100,
            };
            setAttendanceConfig(mergedDbConfig);
            try {
              localStorage.setItem(STORAGE_KEYS.ATTENDANCE_CONFIG, JSON.stringify(mergedDbConfig));
            } catch (e) {
              console.error(e);
            }
          }

          if (dbMembers && dbMembers.length > 0) setMembers(dbMembers);
          if (dbClients && dbClients.length > 0) setDirectoryClients(dbClients);
          if (dbTasks && dbTasks.length > 0) setClients(dbTasks);
          if (dbAttRecs && dbAttRecs.length > 0) {
            const seen = new Set<string>();
            const deduped: AttendanceRecord[] = [];
            const duplicateIds: string[] = [];

            for (const r of dbAttRecs) {
              const key = `${(r.member || "").trim().toLowerCase()}_${r.date}`;
              if (!seen.has(key)) {
                seen.add(key);
                deduped.push(r);
              } else {
                duplicateIds.push(r.id);
              }
            }

            setAttendanceRecords(deduped);
            try {
              localStorage.setItem(STORAGE_KEYS.ATTENDANCE_RECORDS, JSON.stringify(deduped));
            } catch (e) {
              console.error(e);
            }

            // Automatically purge duplicate entries from Supabase in background
            if (duplicateIds.length > 0) {
              for (const dupId of duplicateIds) {
                deleteAttendanceRecordDb(dupId);
              }
            }
          }
          if (dbAuthDevs && dbAuthDevs.length > 0) setAuthorizedDevices(dbAuthDevs);
          if (dbLeaveReqs && dbLeaveReqs.length > 0) setLeaveRequests(dbLeaveReqs);
          if (dbLeaveTypes && dbLeaveTypes.length > 0) setLeaveTypes(dbLeaveTypes);
          if (dbBankDetails && dbBankDetails.length > 0) setBankDetails(dbBankDetails);
          if (dbPayments && dbPayments.length > 0) setSalaryPayments(dbPayments);
          if (dbNotices && dbNotices.length > 0) setHrNotices(dbNotices);
          if (dbRules && dbRules.length > 0) {
            const cleanDbRules = dbRules.filter(isRealOfficeRule);
            if (cleanDbRules.length > 0) setOfficeRules(cleanDbRules);
          }
          if (dbActs && dbActs.length > 0) setActivities(dbActs);
          if (dbReports && dbReports.length > 0) setDailyReports(dbReports);
          if (dbAlerts && dbAlerts.length > 0) setBroadcastAlerts(dbAlerts);
          if (dbHolidays && dbHolidays.length > 0) setCompanyHolidays(dbHolidays);
          if (dbSelections && dbSelections.length > 0) setMemberHolidaySelections(dbSelections);
        } catch (err) {
          console.warn("Supabase initial sync error:", err);
        } finally {
          setIsCloudSynced(true);
        }
      })();
    } catch (e) {
      console.error("Failed to read CRM state from localStorage", e);
    } finally {
      setIsHydrated(true);
    }

    const handleStorageChange = (e: StorageEvent) => {
      try {
        if (e.key === STORAGE_KEYS.CLIENTS && e.newValue) {
          setClients(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEYS.DIRECTORY_CLIENTS && e.newValue) {
          setDirectoryClients(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEYS.ACTIVITIES && e.newValue) {
          setActivities(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEYS.MEMBERS && e.newValue) {
          setMembers(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEYS.CURRENT_MEMBER && e.newValue) {
          setCurrentMember(e.newValue);
        } else if (e.key === STORAGE_KEYS.LEAVE_TYPES && e.newValue) {
          setLeaveTypes(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEYS.LEAVE_REQUESTS && e.newValue) {
          setLeaveRequests(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEYS.ATTENDANCE_CONFIG && e.newValue) {
          setAttendanceConfig(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEYS.AUTHORIZED_DEVICES && e.newValue) {
          setAuthorizedDevices(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEYS.ATTENDANCE_RECORDS && e.newValue) {
          setAttendanceRecords(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEYS.HR_NOTICES && e.newValue) {
          setHrNotices(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEYS.OFFICE_RULES && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            if (Array.isArray(parsed)) {
              setOfficeRules(parsed.filter(isRealOfficeRule));
            }
          } catch {}
        } else if (e.key === STORAGE_KEYS.BANK_DETAILS && e.newValue) {
          setBankDetails(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEYS.SALARY_PAYMENTS && e.newValue) {
          setSalaryPayments(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEYS.DAILY_REPORTS && e.newValue) {
          setDailyReports(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEYS.BROADCAST_ALERTS && e.newValue) {
          setBroadcastAlerts(JSON.parse(e.newValue));
        }
      } catch (err) {
        console.error("Error syncing CRM state across tabs", err);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Periodic background check for instant real-time alerts & live tasks sync across all members & admin
  useEffect(() => {
    if (!isHydrated) return;
    const interval = setInterval(async () => {
      try {
        const [cloudAlerts, cloudTasks] = await Promise.all([
          fetchBroadcastAlertsDb(),
          fetchTasksDb(),
        ]);
        if (cloudAlerts) {
          setBroadcastAlerts((prev) => {
            if (JSON.stringify(prev) !== JSON.stringify(cloudAlerts)) {
              return cloudAlerts;
            }
            return prev;
          });
        }
        if (cloudTasks !== null) {
          setClients((prev) => {
            // Compare IDs to see if length or items changed
            const prevIds = prev.map((p) => p.id).sort().join(",");
            const cloudIds = cloudTasks.map((c) => c.id).sort().join(",");
            const isDifferent = prevIds !== cloudIds || JSON.stringify(prev) !== JSON.stringify(cloudTasks);

            if (isDifferent) {
              try {
                localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(cloudTasks));
              } catch {}
              return cloudTasks;
            }
            return prev;
          });
        }
      } catch {
        // silent fallback
      }
    }, 6000);
    return () => clearInterval(interval);
  }, [isHydrated]);

  // Persist changes to localStorage
  useEffect(() => {
    if (!isHydrated) return;
    try { localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients)); } catch (e) { console.error(e); }
  }, [clients, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try { localStorage.setItem(STORAGE_KEYS.DIRECTORY_CLIENTS, JSON.stringify(directoryClients)); } catch (e) { console.error(e); }
  }, [directoryClients, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try { localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities)); } catch (e) { console.error(e); }
  }, [activities, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try { localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members)); } catch (e) { console.error(e); }
  }, [members, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try { localStorage.setItem(STORAGE_KEYS.CURRENT_MEMBER, currentMember); } catch (e) { console.error(e); }
  }, [currentMember, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try { localStorage.setItem(STORAGE_KEYS.LEAVE_TYPES, JSON.stringify(leaveTypes)); } catch (e) { console.error(e); }
  }, [leaveTypes, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try { localStorage.setItem(STORAGE_KEYS.LEAVE_REQUESTS, JSON.stringify(leaveRequests)); } catch (e) { console.error(e); }
  }, [leaveRequests, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try { localStorage.setItem(STORAGE_KEYS.ATTENDANCE_CONFIG, JSON.stringify(attendanceConfig)); } catch (e) { console.error(e); }
  }, [attendanceConfig, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try { localStorage.setItem(STORAGE_KEYS.AUTHORIZED_DEVICES, JSON.stringify(authorizedDevices)); } catch (e) { console.error(e); }
  }, [authorizedDevices, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try { localStorage.setItem(STORAGE_KEYS.ATTENDANCE_RECORDS, JSON.stringify(attendanceRecords)); } catch (e) { console.error(e); }
  }, [attendanceRecords, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try { localStorage.setItem(STORAGE_KEYS.HR_NOTICES, JSON.stringify(hrNotices)); } catch (e) { console.error(e); }
  }, [hrNotices, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      const cleanToStore = officeRules.filter(isRealOfficeRule);
      localStorage.setItem(STORAGE_KEYS.OFFICE_RULES, JSON.stringify(cleanToStore));
    } catch (e) {
      console.error(e);
    }
  }, [officeRules, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try { localStorage.setItem(STORAGE_KEYS.BANK_DETAILS, JSON.stringify(bankDetails)); } catch (e) { console.error(e); }
  }, [bankDetails, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try { localStorage.setItem(STORAGE_KEYS.SALARY_PAYMENTS, JSON.stringify(salaryPayments)); } catch (e) { console.error(e); }
  }, [salaryPayments, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try { localStorage.setItem(STORAGE_KEYS.DAILY_REPORTS, JSON.stringify(dailyReports)); } catch (e) { console.error(e); }
  }, [dailyReports, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try { localStorage.setItem(STORAGE_KEYS.BROADCAST_ALERTS, JSON.stringify(broadcastAlerts)); } catch (e) { console.error(e); }
  }, [broadcastAlerts, isHydrated]);

  const addActivity = (text: string, type: Activity["type"]) => {
    const newActivity: Activity = {
      id: Math.random().toString(36).substr(2, 9),
      text,
      time: "Just now",
      type,
    };
    setActivities((prev) => [newActivity, ...prev.slice(0, 29)]);
    insertActivityDb(newActivity);
  };

  // --- TASK CRUD ---
  const updateStatus = (id: string, status: Client["status"], user: string) => {
    const updatedBy = user?.trim() || "User";
    const target = clients.find((c) => c.id === id);
    if (target) {
      addActivity(`${updatedBy} changed status of ${target.name} to ${status}`, "status");
      let received = target.received;
      if (status === "Done") received = target.expected;
      if (status === "Can't Do") received = "0";
      upsertTaskDb({ ...target, status, received, statusUpdatedBy: updatedBy });
    }
    setClients((prev) => prev.map((c) => {
      if (c.id === id) {
        let received = c.received;
        if (status === "Done") received = c.expected;
        if (status === "Can't Do") received = "0";
        return { ...c, status, received, statusUpdatedBy: updatedBy };
      }
      return c;
    }));
  };

  const updateComment = (id: string, comment: string, user: string) => {
    const target = clients.find((c) => c.id === id);
    if (target && target.comments !== comment) {
      addActivity(`${user} updated comment on ${target.name}: "${comment || "Cleared"}"`, "comment");
      upsertTaskDb({ ...target, comments: comment });
    }
    setClients((prev) => prev.map((c) => {
      if (c.id === id && c.comments !== comment) {
        return { ...c, comments: comment };
      }
      return c;
    }));
  };

  const assignMember = (id: string, memberName: string, adminName: string) => {
    const target = clients.find((c) => c.id === id);
    if (target) {
      addActivity(`${adminName} assigned ${target.name} to ${memberName}`, "assign");
      upsertTaskDb({ ...target, member: memberName });
    }
    setClients((prev) => prev.map((c) => {
      if (c.id === id) {
        return { ...c, member: memberName };
      }
      return c;
    }));
    if (memberName) {
      setCurrentMember(memberName);
    }
  };

  const addClient = (client: Client, adminName: string) => {
    setClients((prev) => [client, ...prev]);
    upsertTaskDb(client);
    if (client.member) {
      setCurrentMember(client.member);
    }
    setDirectoryClients((prev) => {
      const exists = prev.some((dc) => dc.name.toLowerCase() === client.name.toLowerCase());
      if (exists) return prev;
      const newDir: DirectoryClient = {
        id: "c_" + Math.random().toString(36).substr(2, 7),
        name: client.name,
        phone: client.phone,
        category: client.category,
        status: "Active",
      };
      upsertDirectoryClientDb(newDir);
      return [newDir, ...prev];
    });
    addActivity(`${adminName} assigned new task "${client.name}" to ${client.member || "Unassigned"}`, "add");
  };

  const deleteClient = (id: string, adminName: string) => {
    const client = clients.find(c => c.id === id);
    if (client) addActivity(`${adminName} deleted task for ${client.name}`, "status");
    deleteTaskDb(id);
    setClients(prev => {
      const updated = prev.filter(c => c.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const updateClient = (id: string, updatedData: Partial<Client>, adminName: string) => {
    const target = clients.find((c) => c.id === id);
    if (target) {
      addActivity(`${adminName} updated task details for ${target.name}`, "status");
      upsertTaskDb({ ...target, ...updatedData });
    }
    setClients(prev => prev.map(c => (c.id === id ? { ...c, ...updatedData } : c)));
    if (updatedData.member) {
      setCurrentMember(updatedData.member);
    }
  };

  // --- MEMBER CRUD ---
  const addMember = (member: Member, adminName: string) => {
    const newMember: Member = { status: "Active", role: "Team Member", ...member };
    setMembers(prev => [...prev, newMember]);
    upsertMemberDb(newMember);
    setCurrentMember(member.name);
    addActivity(`${adminName} added new member ${member.name}`, "add");
  };

  const updateMember = (id: string, updatedData: Partial<Member>, adminName: string) => {
    const oldMember = members.find((m) => m.id === id);
    if (oldMember) {
      addActivity(`${adminName} updated member ${oldMember.name}`, "status");
      upsertMemberDb({ ...oldMember, ...updatedData });
    }
    setMembers(prev => prev.map(e => (e.id === id ? { ...e, ...updatedData } : e)));
    if (oldMember && updatedData.name && oldMember.name !== updatedData.name) {
      setClients((prev) =>
        prev.map((c) => (c.member === oldMember.name ? { ...c, member: updatedData.name } : c))
      );
      setLeaveRequests((prev) =>
        prev.map((lr) => (lr.member === oldMember.name ? { ...lr, member: updatedData.name! } : lr))
      );
      setAttendanceRecords((prev) =>
        prev.map((ar) => (ar.member === oldMember.name ? { ...ar, member: updatedData.name! } : ar))
      );
      if (currentMember === oldMember.name) {
        setCurrentMember(updatedData.name);
      }
    }
  };

  const deleteMember = (id: string, adminName: string) => {
    const targetMember = members.find((e) => e.id === id);
    deleteMemberDb(id);
    setMembers(prev => prev.filter(e => e.id !== id));
    if (targetMember) {
      addActivity(`${adminName} removed member ${targetMember.name}`, "status");
    }
  };

  // --- CLIENT DIRECTORY CRUD ---
  const addDirectoryClient = (client: DirectoryClient, adminName: string) => {
    const newClient: DirectoryClient = { status: "Active", ...client };
    setDirectoryClients((prev) => [newClient, ...prev]);
    upsertDirectoryClientDb(newClient);
    addActivity(`${adminName} added new client ${client.name}`, "add");
  };

  const updateDirectoryClient = (id: string, updatedData: Partial<DirectoryClient>, adminName: string) => {
    const oldClient = directoryClients.find((c) => c.id === id);
    if (oldClient) {
      addActivity(`${adminName} updated client profile for ${oldClient.name}`, "status");
      upsertDirectoryClientDb({ ...oldClient, ...updatedData });
    }
    setDirectoryClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updatedData } : c))
    );
    if (oldClient) {
      setClients((prev) =>
        prev.map((t) => {
          if (t.name === oldClient.name) {
            const updatedTask = {
              ...t,
              name: updatedData.name ?? t.name,
              phone: updatedData.phone ?? t.phone,
              category: updatedData.category ?? t.category,
            };
            upsertTaskDb(updatedTask);
            return updatedTask;
          }
          return t;
        })
      );
    }
  };

  const deleteDirectoryClient = (id: string, adminName: string) => {
    const target = directoryClients.find((c) => c.id === id);
    deleteDirectoryClientDb(id);
    setDirectoryClients((prev) => prev.filter((c) => c.id !== id));
    if (target) {
      addActivity(`${adminName} deleted client profile ${target.name}`, "status");
    }
  };

  // --- LEAVE TYPE OPTIONS CRUD (ADMIN) ---
  const addLeaveType = (option: LeaveTypeOption) => {
    setLeaveTypes((prev) => [...prev, option]);
    upsertLeaveTypeDb(option);
    addActivity(`Admin added new leave option: ${option.name}`, "add");
  };

  const updateLeaveType = (id: string, updated: Partial<LeaveTypeOption>) => {
    const oldType = leaveTypes.find((lt) => lt.id === id);
    if (oldType) {
      upsertLeaveTypeDb({ ...oldType, ...updated });
    }
    setLeaveTypes((prev) => prev.map((lt) => (lt.id === id ? { ...lt, ...updated } : lt)));
    if (oldType && updated.name && oldType.name !== updated.name) {
      setLeaveRequests((prev) =>
        prev.map((lr) => (lr.leaveType === oldType.name ? { ...lr, leaveType: updated.name! } : lr))
      );
    }
  };

  const deleteLeaveType = (id: string) => {
    setLeaveTypes((prev) => {
      const updated = prev.filter((lt) => lt.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.LEAVE_TYPES, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
    deleteLeaveTypeDb(id);
  };

  // --- LEAVE REQUESTS CRUD (MEMBER & ADMIN) ---
  const applyLeave = (req: Omit<LeaveRequest, "id" | "status" | "appliedAt">) => {
    const newReq: LeaveRequest = {
      ...req,
      id: "lr_" + Math.random().toString(36).substr(2, 9),
      status: "Pending",
      appliedAt: getLocalDateString(),
    };
    setLeaveRequests((prev) => {
      const updated = [newReq, ...prev];
      try {
        localStorage.setItem(STORAGE_KEYS.LEAVE_REQUESTS, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
    upsertLeaveRequestDb(newReq);
    addActivity(`${req.member} applied for ${req.days} day(s) of ${req.leaveType}`, "add");
  };

  const updateLeaveRequestStatus = (id: string, status: LeaveRequest["status"], adminRemark?: string) => {
    const target = leaveRequests.find((lr) => lr.id === id);
    if (target) {
      upsertLeaveRequestDb({ ...target, status, adminRemark });
      addActivity(`Admin ${status.toLowerCase()} ${target.member}'s ${target.leaveType} request`, "status");
    }
    setLeaveRequests((prev) => {
      const updated = prev.map((lr) =>
        lr.id === id
          ? { ...lr, status, adminRemark: adminRemark !== undefined ? adminRemark : lr.adminRemark }
          : lr
      );
      try {
        localStorage.setItem(STORAGE_KEYS.LEAVE_REQUESTS, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const deleteLeaveRequest = (id: string) => {
    setLeaveRequests((prev) => {
      const updated = prev.filter((lr) => lr.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.LEAVE_REQUESTS, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
    deleteLeaveRequestDb(id);
  };

  // --- ATTENDANCE & SECURITY CRUD ---
  const updateAttendanceConfig = (updated: Partial<OfficeAttendanceConfig>) => {
    setAttendanceConfig((prev) => {
      const next = { ...prev, ...updated };
      upsertAttendanceConfigDb(next);
      try {
        localStorage.setItem(STORAGE_KEYS.ATTENDANCE_CONFIG, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
    addActivity("Admin updated Office Attendance & WiFi/GPS Security rules", "status");
  };

  const requestDeviceAuthorization = (memberName: string, deviceName = "Office Laptop (Windows / Browser)") => {
    const newDev: AuthorizedDevice = {
      id: "dev_" + Math.random().toString(36).substr(2, 9),
      deviceId: currentDeviceId,
      deviceName,
      assignedMember: memberName,
      status: "Pending",
      requestedAt: getLocalDateString(),
    };
    upsertAuthorizedDeviceDb(newDev);
    setAuthorizedDevices((prev) => {
      const existing = prev.find((d) => d.deviceId === currentDeviceId);
      if (existing) {
        return prev.map((d) =>
          d.deviceId === currentDeviceId
            ? { ...d, assignedMember: memberName, status: "Pending" }
            : d
        );
      }
      return [newDev, ...prev];
    });
    addActivity(`${memberName} requested authorization for laptop ${currentDeviceId}`, "add");
  };

  const updateDeviceStatus = (id: string, status: AuthorizedDevice["status"], assignedMember?: string) => {
    const target = authorizedDevices.find((d) => d.id === id);
    if (target) {
      upsertAuthorizedDeviceDb({
        ...target,
        status,
        assignedMember: assignedMember !== undefined ? assignedMember : target.assignedMember,
      });
    }
    setAuthorizedDevices((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, status, assignedMember: assignedMember !== undefined ? assignedMember : d.assignedMember }
          : d
      )
    );
    addActivity(`Admin marked device as ${status}`, "status");
  };

  const deleteAuthorizedDevice = (id: string) => {
    setAuthorizedDevices((prev) => prev.filter((d) => d.id !== id));
  };

  const checkInMember = (
    memberName: string, 
    verifiedVia: string, 
    lateReason?: string,
    customTimestamp?: number
  ) => {
    if (!memberName || memberName === "all" || memberName.toLowerCase() === "admin") return;
    const now = customTimestamp ? new Date(customTimestamp) : new Date();
    const todayStr = getLocalDateString(now);

    const timeString = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    // Compare against graceTime (e.g. "09:45")
    const [graceH, graceM] = (attendanceConfig.graceTime || "09:45").split(":").map(Number);
    const isLate =
      now.getHours() > graceH || (now.getHours() === graceH && now.getMinutes() > graceM);

    const cleanMemberSlug = memberName.toLowerCase().trim().replace(/[^a-z0-9]/g, "_");
    const deterministicId = `att_${cleanMemberSlug}_${todayStr}`;

    let created = false;
    setAttendanceRecords((prev) => {
      // 1. Prevent duplicate check-in on the same day (1st connection of the day stays locked)
      const alreadyToday = prev.some(
        (r) => r.id === deterministicId || (r.member.trim().toLowerCase() === memberName.trim().toLowerCase() && r.date === todayStr)
      );
      if (alreadyToday) return prev;

      // 2. Double check localStorage before creating anything new
      try {
        const storedRaw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.ATTENDANCE_RECORDS) : null;
        if (storedRaw) {
          const storedRecs: AttendanceRecord[] = JSON.parse(storedRaw);
          const inStorage = storedRecs.find(
            (r) => r.id === deterministicId || (r.member.trim().toLowerCase() === memberName.trim().toLowerCase() && r.date === todayStr)
          );
          if (inStorage && inStorage.checkInTime) {
            return [inStorage, ...prev.filter((p) => p.id !== inStorage.id)];
          }
        }
      } catch (e) {
        // ignore
      }

      created = true;
      const newRecord: AttendanceRecord = {
        id: deterministicId,
        member: memberName.trim(),
        date: todayStr,
        checkInTime: timeString,
        checkInTimestamp: now.getTime(),
        status: isLate ? "Late" : "On Time",
        verifiedVia,
        deviceId: currentDeviceId,
        lateReason: lateReason?.trim() || undefined,
      };
      upsertAttendanceRecordDb(newRecord);
      return [newRecord, ...prev];
    });

    if (created) {
      addActivity(`${memberName} checked in at ${timeString} (${verifiedVia})`, "status");
    }
  };

  // Auto Check-In background watcher disabled per new plan:
  // Check-In is now user-action driven!
  // When Member/Coordinator connects to Panda WiFi or Office GPS, the "Check In Now" button activates,
  // and the user explicitly clicks the button to check in.
  useEffect(() => {
    // Left intentionally passive to respect explicit user-initiated check-in
  }, []);

  const checkOutMember = (memberName: string, customCheckoutDate?: Date) => {
    const now = customCheckoutDate || new Date();
    const todayStr = getLocalDateString(now);
    const timeString = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    setAttendanceRecords((prev) =>
      prev.map((r) => {
        if (
          r.member.toLowerCase() === memberName.toLowerCase() &&
          r.date === todayStr &&
          !r.checkOutTime
        ) {
          const diffMins = Math.max(1, Math.round((now.getTime() - r.checkInTimestamp) / 60000));
          const updatedRecord: AttendanceRecord = {
            ...r,
            checkOutTime: timeString,
            checkOutTimestamp: now.getTime(),
            workingMinutes: diffMins,
            status: "Checked Out",
          };
          upsertAttendanceRecordDb(updatedRecord);
          return updatedRecord;
        }
        return r;
      })
    );
    addActivity(`${memberName} checked out at ${timeString}`, "status");
  };

  // Auto Check-Out after 7:30 PM (19:30) for any Member / Coordinator who didn't manually check out
  useEffect(() => {
    if (!isHydrated) return;

    const runAutoCheckoutAfter730Pm = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Check if current time is >= 7:30 PM (19:30)
      const isPast730Pm = currentHour > 19 || (currentHour === 19 && currentMinute >= 30);
      if (!isPast730Pm) return;

      const todayStr = getLocalDateString(now);

      // Find any member or coordinator who checked in today but has not checked out yet
      setAttendanceRecords((prev) => {
        let changed = false;
        const updated = prev.map((r) => {
          if (r.date === todayStr && !r.checkOutTime) {
            changed = true;
            // Check out time is fixed at 07:30:00 PM if auto-checked out
            const autoCheckoutTimeStr = "07:30:00 PM";
            const checkoutDate = new Date(now);
            checkoutDate.setHours(19, 30, 0, 0);
            const checkoutTs = checkoutDate.getTime();
            const diffMins = Math.max(1, Math.round((checkoutTs - r.checkInTimestamp) / 60000));

            const autoRecord: AttendanceRecord = {
              ...r,
              checkOutTime: autoCheckoutTimeStr,
              checkOutTimestamp: checkoutTs,
              workingMinutes: diffMins,
              status: "Checked Out",
            };
            upsertAttendanceRecordDb(autoRecord);
            addActivity(`${r.member} auto checked out at 07:30 PM (System Rule)`, "status");
            return autoRecord;
          }
          return r;
        });

        if (changed) {
          try {
            localStorage.setItem(STORAGE_KEYS.ATTENDANCE_RECORDS, JSON.stringify(updated));
          } catch (e) {
            console.error(e);
          }
          return updated;
        }
        return prev;
      });
    };

    // Check on initial load
    runAutoCheckoutAfter730Pm();
    // And run periodic check every minute
    const autoCheckoutInterval = setInterval(runAutoCheckoutAfter730Pm, 60000);
    return () => clearInterval(autoCheckoutInterval);
  }, [isHydrated]);

  const adminUpdateAttendance = (id: string, updated: Partial<AttendanceRecord>) => {
    setAttendanceRecords((prev) => {
      let targetRecord: AttendanceRecord | undefined;
      const nextRecords = prev.map((r) => {
        if (r.id === id) {
          // 1. Normalize checkInTime if user entered "10:00" or "10 00" or "10:00 AM"
          let newCheckInTime = typeof updated.checkInTime === "string" && updated.checkInTime.trim()
            ? updated.checkInTime.trim()
            : r.checkInTime;
          if (newCheckInTime && !newCheckInTime.toUpperCase().includes("AM") && !newCheckInTime.toUpperCase().includes("PM")) {
            const parts = newCheckInTime.replace(/\s+/, ":").split(":");
            if (parts.length >= 2) {
              const h = Number(parts[0]);
              const m = parts[1].padStart(2, "0");
              const ampm = h >= 12 ? "PM" : "AM";
              const formattedH = h % 12 === 0 ? 12 : h % 12;
              newCheckInTime = `${String(formattedH).padStart(2, "0")}:${m}:00 ${ampm}`;
            }
          }

          // 2. Normalize checkOutTime if user entered "06:30" or "18:30"
          let newCheckOutTime = typeof updated.checkOutTime === "string" && updated.checkOutTime.trim()
            ? updated.checkOutTime.trim()
            : (updated.checkOutTime === null || updated.checkOutTime === "" ? undefined : r.checkOutTime);
          if (newCheckOutTime && !newCheckOutTime.toUpperCase().includes("AM") && !newCheckOutTime.toUpperCase().includes("PM")) {
            const parts = newCheckOutTime.replace(/\s+/, ":").split(":");
            if (parts.length >= 2) {
              const h = Number(parts[0]);
              const m = parts[1].padStart(2, "0");
              const ampm = h >= 12 ? "PM" : "AM";
              const formattedH = h % 12 === 0 ? 12 : h % 12;
              newCheckOutTime = `${String(formattedH).padStart(2, "0")}:${m}:00 ${ampm}`;
            }
          }

          // 3. Compute timestamps from date + normalized time strings
          const newInMs = parseTimeToMs(r.date, newCheckInTime) || r.checkInTimestamp;
          const newOutMs = newCheckOutTime ? (parseTimeToMs(r.date, newCheckOutTime) || r.checkOutTimestamp) : undefined;

          // 4. Recalculate workingMinutes if checkOutTime exists
          let newWorkingMinutes = updated.workingMinutes !== undefined ? updated.workingMinutes : r.workingMinutes;
          if (newCheckOutTime && newInMs && newOutMs && newOutMs > newInMs) {
            newWorkingMinutes = Math.max(1, Math.round((newOutMs - newInMs) / 60000));
          } else if (!newCheckOutTime) {
            newWorkingMinutes = undefined;
          }

          // 5. Recalculate status against graceTime
          let newStatus = updated.status || r.status;
          if (newCheckOutTime) {
            newStatus = "Checked Out";
          } else if (newCheckInTime && !updated.status) {
            const [graceH, graceM] = (attendanceConfig.graceTime || "09:45").split(":").map(Number);
            const match = newCheckInTime.match(/(\d+):(\d+).*?(AM|PM)/i);
            if (match) {
              let h = Number(match[1]);
              const m = Number(match[2]);
              const ampm = match[3].toUpperCase();
              if (ampm === "PM" && h < 12) h += 12;
              if (ampm === "AM" && h === 12) h = 0;
              const isLate = h > graceH || (h === graceH && m > graceM);
              newStatus = isLate ? "Late" : "On Time";
            }
          }

          targetRecord = {
            ...r,
            ...updated,
            checkInTime: newCheckInTime,
            checkInTimestamp: newInMs,
            checkOutTime: newCheckOutTime || undefined,
            checkOutTimestamp: newOutMs,
            workingMinutes: newWorkingMinutes,
            status: newStatus,
          };
          return targetRecord;
        }
        return r;
      });

      if (targetRecord) {
        adminForceUpdateAttendanceRecordDb(targetRecord);
        try {
          localStorage.setItem(STORAGE_KEYS.ATTENDANCE_RECORDS, JSON.stringify(nextRecords));
        } catch (e) {
          console.error(e);
        }
      }

      return nextRecords;
    });
    addActivity("Admin updated an attendance record", "status");
  };

  const deleteAttendanceRecord = (id: string) => {
    setAttendanceRecords((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.ATTENDANCE_RECORDS, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
    deleteAttendanceRecordDb(id);
    addActivity("Admin removed an attendance record", "status");
  };

  // --- HR NOTICES & OFFICE RULES CRUD ---
  const addHRNotice = (notice: Omit<HRNotice, "id">) => {
    const newNotice: HRNotice = {
      ...notice,
      id: "hn_" + Math.random().toString(36).substr(2, 9),
    };
    setHrNotices((prev) => [newNotice, ...prev]);
    upsertHRNoticeDb(newNotice);
    addActivity(`Admin posted HR Notice: ${notice.title}`, "add");
  };

  const updateHRNotice = (id: string, updated: Partial<HRNotice>) => {
    const target = hrNotices.find((n) => n.id === id);
    if (target) {
      upsertHRNoticeDb({ ...target, ...updated });
    }
    setHrNotices((prev) => prev.map((n) => (n.id === id ? { ...n, ...updated } : n)));
  };

  const deleteHRNotice = (id: string) => {
    deleteHRNoticeDb(id);
    setHrNotices((prev) => prev.filter((n) => n.id !== id));
  };

  const addOfficeRule = (rule: Omit<OfficeRule, "id">) => {
    const newRule: OfficeRule = {
      ...rule,
      id: "or_" + Math.random().toString(36).substr(2, 9),
    };
    setOfficeRules((prev) => [...prev, newRule]);
    upsertOfficeRuleDb(newRule);
    addActivity(`Admin added Office Rule: ${rule.title}`, "add");
  };

  const updateOfficeRule = (id: string, updated: Partial<OfficeRule>) => {
    const target = officeRules.find((r) => r.id === id);
    if (target) {
      upsertOfficeRuleDb({ ...target, ...updated });
    }
    setOfficeRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));
  };

  const deleteOfficeRule = (id: string) => {
    deleteOfficeRuleDb(id);
    setOfficeRules((prev) => prev.filter((r) => r.id !== id));
  };

  // --- BANK DETAILS CRUD (MEMBER & ADMIN) ---
  const saveMemberBankDetail = (data: Omit<MemberBankDetail, "id" | "status" | "updatedAt">) => {
    const todayStr = getLocalDateString();
    let toSave: MemberBankDetail | null = null;
    setBankDetails((prev) => {
      const existing = prev.find(
        (b) => b.member.trim().toLowerCase() === data.member.trim().toLowerCase()
      );
      if (existing) {
        toSave = { ...existing, ...data, status: "Pending", updatedAt: todayStr };
        return prev.map((b) => (b.id === existing.id ? toSave! : b));
      }
      toSave = {
        ...data,
        id: "bd_" + Math.random().toString(36).substr(2, 9),
        status: "Pending",
        updatedAt: todayStr,
      };
      return [toSave, ...prev];
    });
    if (toSave) upsertBankDetailDb(toSave);
    addActivity(`${data.member} submitted/updated Bank & UPI details`, "add");
  };

  const updateBankDetailStatus = (id: string, status: MemberBankDetail["status"]) => {
    const target = bankDetails.find((b) => b.id === id);
    if (target) {
      upsertBankDetailDb({ ...target, status });
    }
    setBankDetails((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
  };

  const adminUpdateBankDetail = (id: string, updated: Partial<MemberBankDetail>) => {
    const target = bankDetails.find((b) => b.id === id);
    if (target) {
      upsertBankDetailDb({ ...target, ...updated });
    }
    setBankDetails((prev) => prev.map((b) => (b.id === id ? { ...b, ...updated } : b)));
  };

  const deleteBankDetail = (id: string) => {
    deleteBankDetailDb(id);
    setBankDetails((prev) => prev.filter((b) => b.id !== id));
  };

  // --- SALARY / PAYMENT HISTORY CRUD (ADMIN -> MEMBER) ---
  const addSalaryPayment = (payment: Omit<SalaryPaymentRecord, "id">) => {
    const newPayment: SalaryPaymentRecord = {
      ...payment,
      id: "sp_" + Math.random().toString(36).substr(2, 9),
    };
    setSalaryPayments((prev) => [newPayment, ...prev]);
    upsertSalaryPaymentDb(newPayment);
    addActivity(`Admin paid ₹${payment.amount} to ${payment.member} (${payment.monthOrPurpose})`, "add");
  };

  const updateSalaryPayment = (id: string, updated: Partial<SalaryPaymentRecord>) => {
    const target = salaryPayments.find((p) => p.id === id);
    if (target) {
      upsertSalaryPaymentDb({ ...target, ...updated });
    }
    setSalaryPayments((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
  };

  const deleteSalaryPayment = (id: string) => {
    deleteSalaryPaymentDb(id);
    setSalaryPayments((prev) => prev.filter((p) => p.id !== id));
  };

  const submitDailyReport = async (
    reportData: Omit<DailyReport, "id" | "isLocked" | "submittedAt" | "submittedTimeDisplay">
  ): Promise<{ success: boolean; report: DailyReport }> => {
    const now = new Date();
    const id = `rep_${reportData.date}_${reportData.member.trim().toLowerCase().replace(/\s+/g, "_")}`;
    const submittedAt = now.toISOString();
    const submittedTimeDisplay = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

    const newReport: DailyReport = {
      ...reportData,
      id,
      submittedAt,
      submittedTimeDisplay,
      isLocked: true,
    };

    setDailyReports((prev) => {
      const filtered = prev.filter((r) => r.id !== id);
      const updated = [newReport, ...filtered];
      try {
        localStorage.setItem(STORAGE_KEYS.DAILY_REPORTS, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    // Cloud sync in Supabase
    await upsertDailyReportDb(newReport);

    // Activity feed
    const actText = `${reportData.member} submitted Daily Work Report (${reportData.completedTasks.length} Done, ${reportData.pendingTasks.length} Pending)`;
    addActivity(actText, "status");

    return { success: true, report: newReport };
  };

  const deleteDailyReport = (id: string) => {
    setDailyReports((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.DAILY_REPORTS, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
    deleteDailyReportDb(id);
  };

  const sendBroadcastAlert = async (
    alertData: Omit<BroadcastAlert, "id" | "createdAt" | "createdTimeDisplay" | "createdDate" | "acknowledgedBy">
  ): Promise<{ success: boolean; alert: BroadcastAlert }> => {
    const now = new Date();
    const id = `alert_${now.getTime()}_${Math.random().toString(36).substring(2, 6)}`;
    const createdAt = now.toISOString();
    const createdTimeDisplay = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    const createdDate = createdAt.split("T")[0];

    const newAlert: BroadcastAlert = {
      ...alertData,
      id,
      createdAt,
      createdTimeDisplay,
      createdDate,
      acknowledgedBy: [],
    };

    setBroadcastAlerts((prev) => {
      const updated = [newAlert, ...prev];
      try {
        localStorage.setItem(STORAGE_KEYS.BROADCAST_ALERTS, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    // Cloud sync
    await upsertBroadcastAlertDb(newAlert);

    // Dispatch background Web Push so notification arrives even if app/website is closed
    try {
      fetch("/api/alerts/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: newAlert.id,
          title: newAlert.title,
          message: newAlert.message,
          priority: newAlert.priority,
          targetType: newAlert.targetType,
          targetMember: newAlert.targetMember,
          sender: newAlert.sender,
          createdAt: newAlert.createdAt,
          url: newAlert.targetType === "individual" ? "/member" : (newAlert.targetType === "admin_coordinator" ? "/admin" : "/"),
        }),
      }).catch((err) => console.warn("Background push dispatch error:", err));
    } catch (e) {
      // non-blocking
    }

    // Activity
    const targetText = alertData.targetType === "all" ? "All Team Members" : (alertData.targetMember || "Member");
    addActivity(`Admin sent alert: "${alertData.title}" to ${targetText}`, "status");

    return { success: true, alert: newAlert };
  };

  const acknowledgeAlert = async (alertId: string, memberName: string) => {
    const target = broadcastAlerts.find((a) => a.id === alertId);
    if (!target) return;
    const cleanName = memberName.trim();
    if (target.acknowledgedBy.includes(cleanName)) return;

    const updatedAlert: BroadcastAlert = {
      ...target,
      acknowledgedBy: [...target.acknowledgedBy, cleanName],
    };

    setBroadcastAlerts((prev) => {
      const updated = prev.map((a) => (a.id === alertId ? updatedAlert : a));
      try {
        localStorage.setItem(STORAGE_KEYS.BROADCAST_ALERTS, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    await upsertBroadcastAlertDb(updatedAlert);
  };

  const deleteBroadcastAlert = (id: string) => {
    setBroadcastAlerts((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.BROADCAST_ALERTS, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
    deleteBroadcastAlertDb(id);
  };

  // Company Holidays & Member Selection CRUD
  const addCompanyHoliday = (holiday: Omit<CompanyHoliday, "id">) => {
    const newHoliday: CompanyHoliday = {
      ...holiday,
      id: `hol_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    };
    setCompanyHolidays((prev) => {
      const updated = [...prev, newHoliday].sort((a, b) => a.date.localeCompare(b.date));
      try {
        localStorage.setItem(STORAGE_KEYS.COMPANY_HOLIDAYS, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
    upsertCompanyHolidayDb(newHoliday);
  };

  const deleteCompanyHoliday = (id: string) => {
    setCompanyHolidays((prev) => {
      const updated = prev.filter((h) => h.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.COMPANY_HOLIDAYS, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
    deleteCompanyHolidayDb(id);
  };

  const saveMemberHolidaySelection = (memberName: string, selectedHolidayIds: string[]) => {
    const cleanMember = memberName.trim();
    const existing = memberHolidaySelections.find(
      (s) => s.member.toLowerCase() === cleanMember.toLowerCase()
    );

    // If member deselected all holidays (0 days chosen), clear the submission
    if (selectedHolidayIds.length === 0) {
      setMemberHolidaySelections((prev) => {
        const updated = prev.filter((s) => s.member.toLowerCase() !== cleanMember.toLowerCase());
        try {
          localStorage.setItem(STORAGE_KEYS.HOLIDAY_SELECTIONS, JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
        return updated;
      });
      if (existing) {
        // Delete from office_rules DB
        deleteMemberHolidaySelectionDb(existing.id);
      }
      addActivity(`${cleanMember} cleared all selected holidays (0 days)`, "status");
      return;
    }

    const updatedSelection: MemberHolidaySelection = {
      id: existing ? existing.id : `hols_${cleanMember.toLowerCase().replace(/\s+/g, "_")}`,
      member: cleanMember,
      selectedHolidayIds,
      status: "Pending", // Any modification requires admin approval
      adminRemark: "",
      updatedAt: new Date().toISOString(),
    };

    setMemberHolidaySelections((prev) => {
      const other = prev.filter((s) => s.member.toLowerCase() !== cleanMember.toLowerCase());
      const updated = [updatedSelection, ...other];
      try {
        localStorage.setItem(STORAGE_KEYS.HOLIDAY_SELECTIONS, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    upsertMemberHolidaySelectionDb(updatedSelection);
    addActivity(`${cleanMember} updated their chosen holiday list (${selectedHolidayIds.length} days)`, "status");
  };

  const updateMemberHolidaySelectionStatus = (
    id: string,
    status: MemberHolidaySelection["status"],
    adminRemark?: string
  ) => {
    let targetMember = "";
    setMemberHolidaySelections((prev) => {
      const updated = prev.map((item) => {
        if (item.id === id) {
          targetMember = item.member;
          const mod = {
            ...item,
            status,
            adminRemark: adminRemark !== undefined ? adminRemark : item.adminRemark,
          };
          upsertMemberHolidaySelectionDb(mod);
          return mod;
        }
        return item;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.HOLIDAY_SELECTIONS, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    if (targetMember) {
      addActivity(`Holiday selection for ${targetMember} marked as ${status}`, "status");
    }
  };

  const logout = () => {
    clearSessionUser();
    setSessionUserState(null);
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  return (
    <CRMContext.Provider value={{ 
      clients, directoryClients, activities, members,
      currentMember, setCurrentMember,
      sessionUser, logout,
      leaveTypes, leaveRequests,
      attendanceConfig, authorizedDevices, attendanceRecords,
      currentDeviceId, currentNetworkIp, isCloudSynced,
      hrNotices, officeRules,
      bankDetails, salaryPayments,
      dailyReports, submitDailyReport, deleteDailyReport,
      broadcastAlerts, sendBroadcastAlert, acknowledgeAlert, deleteBroadcastAlert,
      companyHolidays, memberHolidaySelections, addCompanyHoliday, deleteCompanyHoliday, saveMemberHolidaySelection, updateMemberHolidaySelectionStatus,
      updateStatus, updateComment, assignMember, 
      addClient, deleteClient, updateClient,
      addMember, updateMember, deleteMember,
      addDirectoryClient, updateDirectoryClient, deleteDirectoryClient,
      addLeaveType, updateLeaveType, deleteLeaveType,
      applyLeave, updateLeaveRequestStatus, deleteLeaveRequest,
      updateAttendanceConfig, requestDeviceAuthorization, updateDeviceStatus, deleteAuthorizedDevice,
      checkInMember, checkOutMember, adminUpdateAttendance, deleteAttendanceRecord, setAttendanceRecords,
      addHRNotice, updateHRNotice, deleteHRNotice,
      addOfficeRule, updateOfficeRule, deleteOfficeRule,
      saveMemberBankDetail, updateBankDetailStatus, adminUpdateBankDetail, deleteBankDetail,
      addSalaryPayment, updateSalaryPayment, deleteSalaryPayment
    }}>
      {children}
    </CRMContext.Provider>
  );
}

export function useCRM() {
  const context = useContext(CRMContext);
  if (!context) throw new Error("useCRM must be used within a CRMProvider");
  return context;
}
