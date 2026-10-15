import { supabase } from "./supabase";
import { 
  Member, 
  DirectoryClient, 
  LeaveRequest, 
  LeaveTypeOption, 
  AttendanceRecord, 
  AuthorizedDevice, 
  HRNotice, 
  OfficeRule, 
  MemberBankDetail, 
  SalaryPaymentRecord, 
  Activity 
} from "@/context/CRMContext";
import { Client } from "@/components/ClientTable";

// 1. Members
export async function fetchMembersDb(): Promise<Member[] | null> {
  const { data, error } = await supabase.from("members").select("*").order("created_at", { ascending: true });
  if (error) {
    console.error("fetchMembersDb error:", error);
    return null;
  }
  return data.map((d: any) => ({
    id: d.id,
    name: d.name,
    email: d.email,
    phone: d.phone,
    role: d.role,
    status: d.status,
  }));
}

export async function upsertMemberDb(member: Member) {
  const { error } = await supabase.from("members").upsert({
    id: member.id,
    name: member.name,
    email: member.email,
    phone: member.phone,
    role: member.role,
    status: member.status || "Active",
  });
  if (error) console.error("upsertMemberDb error:", error);
}

export async function deleteMemberDb(id: string) {
  const { error } = await supabase.from("members").delete().eq("id", id);
  if (error) console.error("deleteMemberDb error:", error);
}

// 2. Directory Clients
export async function fetchDirectoryClientsDb(): Promise<DirectoryClient[] | null> {
  const { data, error } = await supabase.from("directory_clients").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error("fetchDirectoryClientsDb error:", error);
    return null;
  }
  return data.map((d: any) => ({
    id: d.id,
    name: d.name,
    phone: d.phone,
    email: d.email,
    company: d.company,
    category: d.category,
    address: d.address,
    status: d.status,
  }));
}

export async function upsertDirectoryClientDb(client: DirectoryClient) {
  const { error } = await supabase.from("directory_clients").upsert({
    id: client.id,
    name: client.name,
    phone: client.phone,
    email: client.email,
    company: client.company,
    category: client.category,
    address: client.address,
    status: client.status || "Active",
  });
  if (error) console.error("upsertDirectoryClientDb error:", error);
}

export async function deleteDirectoryClientDb(id: string) {
  const { error } = await supabase.from("directory_clients").delete().eq("id", id);
  if (error) console.error("deleteDirectoryClientDb error:", error);
}

// 3. Tasks / Clients Table
export async function fetchTasksDb(): Promise<Client[] | null> {
  const { data, error } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error("fetchTasksDb error:", error);
    return null;
  }
  return data.map((d: any) => ({
    id: d.id,
    name: d.name,
    phone: d.phone || "",
    category: d.category || "",
    taskDetails: d.task_details || "",
    taskType: d.task_type || "Regular",
    member: d.member || "",
    startDate: d.start_date || "",
    endDate: d.end_date || "",
    expected: d.expected || "0",
    received: d.received || "0",
    status: d.status || "Pending",
    comments: d.comments || "",
    reason: d.reason || "",
  }));
}

export async function upsertTaskDb(task: Client) {
  const { error } = await supabase.from("tasks").upsert({
    id: task.id,
    name: task.name,
    phone: task.phone,
    category: task.category,
    task_details: task.taskDetails,
    task_type: task.taskType || "Regular",
    member: task.member,
    start_date: task.startDate || null,
    end_date: task.endDate || null,
    expected: task.expected || "0",
    received: task.received || "0",
    status: task.status || "Pending",
    comments: task.comments || "",
    reason: task.reason || "",
  });
  if (error) console.error("upsertTaskDb error:", error);
}

export async function deleteTaskDb(id: string) {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) console.error("deleteTaskDb error:", error);
}

// 4. Attendance Records
export async function fetchAttendanceRecordsDb(): Promise<AttendanceRecord[] | null> {
  const { data, error } = await supabase.from("attendance_records").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error("fetchAttendanceRecordsDb error:", error);
    return null;
  }
  return data.map((d: any) => ({
    id: d.id,
    member: d.member,
    date: d.date,
    checkInTime: d.check_in_time,
    checkInTimestamp: Number(d.check_in_timestamp) || 0,
    checkOutTime: d.check_out_time,
    checkOutTimestamp: d.check_out_timestamp ? Number(d.check_out_timestamp) : undefined,
    workingMinutes: d.working_minutes,
    status: d.status,
    verifiedVia: d.verified_via,
    deviceId: d.device_id,
    lateReason: d.late_reason,
    adminNote: d.admin_note,
  }));
}

export async function upsertAttendanceRecordDb(rec: AttendanceRecord) {
  const { error } = await supabase.from("attendance_records").upsert({
    id: rec.id,
    member: rec.member,
    date: rec.date,
    check_in_time: rec.checkInTime,
    check_in_timestamp: rec.checkInTimestamp,
    check_out_time: rec.checkOutTime || null,
    check_out_timestamp: rec.checkOutTimestamp || null,
    working_minutes: rec.workingMinutes || null,
    status: rec.status,
    verified_via: rec.verifiedVia,
    device_id: rec.deviceId,
    late_reason: rec.lateReason || null,
    admin_note: rec.adminNote || null,
  });
  if (error) console.error("upsertAttendanceRecordDb error:", error);
}

// 5. Authorized Devices
export async function fetchAuthorizedDevicesDb(): Promise<AuthorizedDevice[] | null> {
  const { data, error } = await supabase.from("authorized_devices").select("*").order("created_at", { ascending: true });
  if (error) {
    console.error("fetchAuthorizedDevicesDb error:", error);
    return null;
  }
  return data.map((d: any) => ({
    id: d.id,
    deviceId: d.device_id,
    deviceName: d.device_name,
    assignedMember: d.assigned_member,
    status: d.status,
    requestedAt: d.requested_at,
  }));
}

export async function upsertAuthorizedDeviceDb(dev: AuthorizedDevice) {
  const { error } = await supabase.from("authorized_devices").upsert({
    id: dev.id,
    device_id: dev.deviceId,
    device_name: dev.deviceName,
    assigned_member: dev.assignedMember,
    status: dev.status,
    requested_at: dev.requestedAt,
  });
  if (error) console.error("upsertAuthorizedDeviceDb error:", error);
}

// 6. Leave Requests & Options
export async function fetchLeaveRequestsDb(): Promise<LeaveRequest[] | null> {
  const { data, error } = await supabase.from("leave_requests").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error("fetchLeaveRequestsDb error:", error);
    return null;
  }
  return data.map((d: any) => ({
    id: d.id,
    member: d.member,
    leaveType: d.leave_type,
    startDate: d.start_date,
    endDate: d.end_date,
    days: d.days,
    reason: d.reason,
    status: d.status,
    adminRemark: d.admin_remark,
    appliedAt: d.applied_at,
  }));
}

export async function upsertLeaveRequestDb(req: LeaveRequest) {
  const { error } = await supabase.from("leave_requests").upsert({
    id: req.id,
    member: req.member,
    leave_type: req.leaveType,
    start_date: req.startDate,
    end_date: req.endDate,
    days: req.days,
    reason: req.reason,
    status: req.status,
    admin_remark: req.adminRemark || null,
    applied_at: req.appliedAt,
  });
  if (error) console.error("upsertLeaveRequestDb error:", error);
}

export async function fetchLeaveTypesDb(): Promise<LeaveTypeOption[] | null> {
  const { data, error } = await supabase.from("leave_type_options").select("*");
  if (error) {
    console.error("fetchLeaveTypesDb error:", error);
    return null;
  }
  return data.map((d: any) => ({
    id: d.id,
    name: d.name,
    maxDays: d.max_days,
    isPaid: d.is_paid,
    color: d.color,
    active: d.active,
  }));
}

export async function upsertLeaveTypeDb(lt: LeaveTypeOption) {
  const { error } = await supabase.from("leave_type_options").upsert({
    id: lt.id,
    name: lt.name,
    max_days: lt.maxDays,
    is_paid: lt.isPaid,
    color: lt.color,
    active: lt.active,
  });
  if (error) console.error("upsertLeaveTypeDb error:", error);
}

// 7. Member Bank Details
export async function fetchBankDetailsDb(): Promise<MemberBankDetail[] | null> {
  const { data, error } = await supabase.from("member_bank_details").select("*");
  if (error) {
    console.error("fetchBankDetailsDb error:", error);
    return null;
  }
  return data.map((d: any) => ({
    id: d.id,
    member: d.member,
    accountHolderName: d.account_holder_name,
    bankName: d.bank_name,
    accountNumber: d.account_number,
    ifscCode: d.ifsc_code,
    branchName: d.branch_name || "",
    upiId: d.upi_id,
    upiNumber: d.upi_number,
    qrCodeImage: d.qr_code_image,
    status: d.status,
    updatedAt: d.updated_at,
  }));
}

export async function upsertBankDetailDb(detail: MemberBankDetail) {
  const { error } = await supabase.from("member_bank_details").upsert({
    id: detail.id,
    member: detail.member,
    account_holder_name: detail.accountHolderName,
    bank_name: detail.bankName,
    account_number: detail.accountNumber,
    ifsc_code: detail.ifscCode,
    branch_name: detail.branchName,
    upi_id: detail.upiId,
    upi_number: detail.upiNumber,
    qr_code_image: detail.qrCodeImage,
    status: detail.status,
    updated_at: detail.updatedAt,
  });
  if (error) console.error("upsertBankDetailDb error:", error);
}

export async function deleteBankDetailDb(id: string) {
  const { error } = await supabase.from("member_bank_details").delete().eq("id", id);
  if (error) console.error("deleteBankDetailDb error:", error);
}

// 8. Salary Payments
export async function fetchSalaryPaymentsDb(): Promise<SalaryPaymentRecord[] | null> {
  const { data, error } = await supabase.from("salary_payments").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error("fetchSalaryPaymentsDb error:", error);
    return null;
  }
  return data.map((d: any) => ({
    id: d.id,
    member: d.member,
    amount: d.amount,
    paymentDate: d.payment_date,
    monthOrPurpose: d.month_or_purpose,
    paymentMethod: d.payment_method,
    transactionRef: d.transaction_ref,
  }));
}

export async function upsertSalaryPaymentDb(payment: SalaryPaymentRecord) {
  const { error } = await supabase.from("salary_payments").upsert({
    id: payment.id,
    member: payment.member,
    amount: payment.amount,
    payment_date: payment.paymentDate,
    month_or_purpose: payment.monthOrPurpose,
    payment_method: payment.paymentMethod,
    transaction_ref: payment.transactionRef || null,
  });
  if (error) console.error("upsertSalaryPaymentDb error:", error);
}

export async function deleteSalaryPaymentDb(id: string) {
  const { error } = await supabase.from("salary_payments").delete().eq("id", id);
  if (error) console.error("deleteSalaryPaymentDb error:", error);
}

// 9. HR Notices & Rules
export async function fetchHRNoticesDb(): Promise<HRNotice[] | null> {
  const { data, error } = await supabase.from("hr_notices").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error("fetchHRNoticesDb error:", error);
    return null;
  }
  return data.map((d: any) => ({
    id: d.id,
    title: d.title,
    description: d.description,
    type: d.type,
    date: d.date,
  }));
}

export async function upsertHRNoticeDb(notice: HRNotice) {
  const { error } = await supabase.from("hr_notices").upsert({
    id: notice.id,
    title: notice.title,
    description: notice.description,
    type: notice.type,
    date: notice.date || null,
  });
  if (error) console.error("upsertHRNoticeDb error:", error);
}

export async function deleteHRNoticeDb(id: string) {
  const { error } = await supabase.from("hr_notices").delete().eq("id", id);
  if (error) console.error("deleteHRNoticeDb error:", error);
}

export async function fetchOfficeRulesDb(): Promise<OfficeRule[] | null> {
  const { data, error } = await supabase.from("office_rules").select("*");
  if (error) {
    console.error("fetchOfficeRulesDb error:", error);
    return null;
  }
  return data.map((d: any) => ({
    id: d.id,
    category: d.category,
    title: d.title,
    description: d.description,
  }));
}

export async function upsertOfficeRuleDb(rule: OfficeRule) {
  const { error } = await supabase.from("office_rules").upsert({
    id: rule.id,
    category: rule.category,
    title: rule.title,
    description: rule.description,
  });
  if (error) console.error("upsertOfficeRuleDb error:", error);
}

export async function deleteOfficeRuleDb(id: string) {
  const { error } = await supabase.from("office_rules").delete().eq("id", id);
  if (error) console.error("deleteOfficeRuleDb error:", error);
}

// 10. Activities
export async function fetchActivitiesDb(): Promise<Activity[] | null> {
  const { data, error } = await supabase.from("activities").select("*").order("created_at", { ascending: false }).limit(50);
  if (error) {
    console.error("fetchActivitiesDb error:", error);
    return null;
  }
  return data.map((d: any) => ({
    id: d.id,
    text: d.text,
    time: d.time,
    type: d.type,
  }));
}

export async function insertActivityDb(act: Activity) {
  const { error } = await supabase.from("activities").insert({
    id: act.id,
    text: act.text,
    time: act.time,
    type: act.type,
  });
  if (error) console.error("insertActivityDb error:", error);
}
