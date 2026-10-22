import { supabase } from "./supabase";

export type UserRole = "admin" | "member";

export type AppUser = {
  id: string;
  name: string;
  phone: string;
  password: string;
  role: UserRole;
  status?: "Active" | "Inactive" | "On Leave";
};

const STORAGE_KEY_PASSWORDS = "ptm_crm_custom_passwords_v2";
const STORAGE_KEY_SESSION = "ptm_crm_session_user_v1";
const STORAGE_KEY_MEMBERS = "ptm_crm_members_v2";
const STORAGE_KEY_ADMIN_PHONE = "ptm_crm_admin_phone_v2";

export const DEFAULT_MEMBERS = [
  { id: "e1", name: "Rahim", email: "rahim@company.com", phone: "+880 1711-223344", role: "Sr. Web Developer", status: "Active" },
  { id: "e2", name: "Karim", email: "karim@company.com", phone: "+880 1811-556677", role: "UI/UX & Brand Designer", status: "Active" },
  { id: "e3", name: "Jamil", email: "jamil@company.com", phone: "+880 1911-889900", role: "SEO & GBP Specialist", status: "Active" },
];

export const INITIAL_APP_USERS: AppUser[] = [
  {
    id: "usr_admin",
    name: "Admin",
    phone: "9876543210",
    password: "admin",
    role: "admin",
    status: "Active",
  },
  {
    id: "usr_rahim",
    name: "Rahim",
    phone: "+880 1711-223344",
    password: "123",
    role: "member",
    status: "Active",
  },
  {
    id: "usr_karim",
    name: "Karim",
    phone: "+880 1811-556677",
    password: "123",
    role: "member",
    status: "Active",
  },
  {
    id: "usr_jamil",
    name: "Jamil",
    phone: "+880 1911-889900",
    password: "123",
    role: "member",
    status: "Active",
  },
];

export function getAdminPhone(): string {
  if (typeof window === "undefined") return "9876543210";
  return localStorage.getItem(STORAGE_KEY_ADMIN_PHONE) || "9876543210";
}

export function setAdminPhone(p: string) {
  if (typeof window !== "undefined" && p) {
    localStorage.setItem(STORAGE_KEY_ADMIN_PHONE, p);
  }
}

// Helper to check phone match across international (+880, +91) and local (01...) formats
export function isPhoneMatch(p1: string, p2: string): boolean {
  const d1 = (p1 || "").replace(/[^0-9]/g, "");
  const d2 = (p2 || "").replace(/[^0-9]/g, "");
  if (!d1 || !d2) return false;
  if (d1 === d2) return true;

  // Strip leading zeros (e.g., "01711223344" -> "1711223344")
  const s1 = d1.replace(/^0+/, "");
  const s2 = d2.replace(/^0+/, "");
  if (s1 === s2) return true;
  if (s1.endsWith(s2) || s2.endsWith(s1)) return true;

  // Compare core 9 or 10 digits
  const core1 = s1.length >= 9 ? s1.slice(-9) : s1;
  const core2 = s2.length >= 9 ? s2.slice(-9) : s2;
  return core1 === core2;
}

// Helper to get custom passwords dictionary from localStorage
function getCustomPasswords(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PASSWORDS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Helper to save a custom password for a user/member
function saveCustomPassword(key: string, pass: string) {
  if (typeof window === "undefined") return;
  try {
    const map = getCustomPasswords();
    map[key.toLowerCase()] = pass;
    localStorage.setItem(STORAGE_KEY_PASSWORDS, JSON.stringify(map));
  } catch (e) {
    console.error(e);
  }
}

/**
 * Get all authorized users in the system.
 * SINGLE SOURCE OF TRUTH:
 * 1. Admin account ("Admin" / getAdminPhone())
 * 2. ONLY members created by Admin (from Supabase 'members' table or localStorage 'ptm_crm_members_v2')
 * Nobody can create an account by themselves!
 */
export async function getAllUsers(): Promise<AppUser[]> {
  const customPasswords = getCustomPasswords();

  // 1. Base Admin Account
  const adminPass = customPasswords["admin"] || customPasswords["usr_admin"] || "admin";
  const adminPhone = getAdminPhone();
  const users: AppUser[] = [
    {
      id: "usr_admin",
      name: "Admin",
      phone: adminPhone,
      password: adminPass,
      role: "admin",
      status: "Active",
    },
  ];

  // 2. Fetch Members added by Admin from Supabase 'members' table
  let membersList: any[] = [];
  try {
    const { data, error } = await supabase.from("members").select("*");
    if (!error && data && data.length > 0) {
      membersList = data;
    }
  } catch (err) {
    // Supabase table might not exist yet or offline
  }

  // Fallback to localStorage members if Supabase returned nothing
  if (membersList.length === 0 && typeof window !== "undefined") {
    try {
      const local = localStorage.getItem(STORAGE_KEY_MEMBERS);
      if (local) {
        membersList = JSON.parse(local);
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Fallback to DEFAULT_MEMBERS if still empty
  if (membersList.length === 0) {
    membersList = DEFAULT_MEMBERS;
  }

  // 3. Map each Admin-created member into an authorized AppUser
  for (const m of membersList) {
    const memberName = (m.name || "").trim();
    if (!memberName) continue;

    // Check if there is a custom password for this member (by id or name)
    const savedPass = 
      customPasswords[m.id?.toLowerCase()] || 
      customPasswords[memberName.toLowerCase()] || 
      "123"; // Default password for any member added by Admin

    users.push({
      id: m.id || "usr_" + memberName.toLowerCase().replace(/[^a-z0-9]/g, "_"),
      name: memberName,
      phone: m.phone || "",
      password: savedPass,
      role: "member",
      status: m.status || "Active",
    });
  }

  // Also sync any cloud passwords from Supabase 'app_users' if table exists
  try {
    const { data: cloudUsers } = await supabase.from("app_users").select("*");
    if (cloudUsers && cloudUsers.length > 0) {
      for (const cu of cloudUsers) {
        if (cu.role === "admin" || cu.id === "usr_admin" || cu.name?.toLowerCase() === "admin") {
          users[0].name = cu.name || users[0].name;
          users[0].password = cu.password || users[0].password;
          if (cu.phone) {
            users[0].phone = cu.phone;
            setAdminPhone(cu.phone);
          }
          continue;
        }

        const existing = users.find(u => u.name.toLowerCase() === cu.name?.toLowerCase());
        if (existing) {
          if (cu.password) existing.password = cu.password;
          if (cu.phone) existing.phone = cu.phone;
        }
      }
    }
  } catch {
    // app_users might not be present, which is totally fine
  }

  return users;
}

/**
 * Authenticate user by Name, Phone, and Password.
 * Only members created by Admin are allowed!
 */
export async function authenticateUser(
  name: string,
  phone: string,
  pass: string
): Promise<{ user: AppUser | null; error?: string }> {
  const users = await getAllUsers();
  const inputTrimName = name.trim().toLowerCase();
  const currentAdminPhone = getAdminPhone();

  // Find user by matching Name and Phone number
  const matchedUser = users.find((u) => {
    const uName = u.name.trim().toLowerCase();
    const nameMatch = 
      uName === inputTrimName ||
      (inputTrimName.length >= 3 && uName.startsWith(inputTrimName)) ||
      (uName.length >= 3 && inputTrimName.startsWith(uName)) ||
      (u.role === "admin" && (inputTrimName === "admin" || inputTrimName === "administrator"));

    if (!nameMatch) return false;

    // For Admin: match current admin phone, default phone "9876543210", or u.phone
    if (u.role === "admin") {
      return (
        isPhoneMatch(u.phone, phone) ||
        isPhoneMatch(currentAdminPhone, phone) ||
        isPhoneMatch("9876543210", phone) ||
        phone.trim().length >= 4 // Permissive phone match for Admin
      );
    }

    // For Member: must match registered member phone
    return isPhoneMatch(u.phone, phone);
  });

  if (!matchedUser) {
    return {
      user: null,
      error: "No account found matching this Name and Phone Number. Only members added by Admin can log in. Contact Admin if you need an account.",
    };
  }

  if (matchedUser.status === "Inactive") {
    return {
      user: null,
      error: "Your account is marked Inactive by Admin. Please contact office administration.",
    };
  }

  if (matchedUser.password !== pass.trim()) {
    return {
      user: null,
      error: matchedUser.role === "admin" 
        ? "Incorrect Admin Password. You can reset it using 'Forgot Password'."
        : "Incorrect Password. Default password is '123' unless changed.",
    };
  }

  // Set active session
  setSessionUser(matchedUser);

  return { user: matchedUser };
}

/**
 * Reset password using verified Name and Phone.
 * Admin can ALWAYS reset their own password!
 */
export async function resetUserPassword(
  name: string,
  phone: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  const users = await getAllUsers();
  const inputTrimName = name.trim().toLowerCase();
  const trimmedPass = newPassword.trim();

  // ==========================================
  // ADMIN FLOW:
  // Admin is recognized either by:
  // 1. Master keyword "Admin" / "administrator"
  // 2. OR the custom name that Admin set on their account (matching Admin's phone)
  // 3. OR the registered Admin phone number!
  // ==========================================
  const adminUser = users.find((u) => u.role === "admin" || u.id === "usr_admin");
  const currentAdminPhone = getAdminPhone();

  const isAdminNameMatch =
    inputTrimName === "admin" ||
    inputTrimName === "administrator" ||
    (adminUser && (
      adminUser.name.trim().toLowerCase() === inputTrimName ||
      (inputTrimName.length >= 3 && adminUser.name.trim().toLowerCase().startsWith(inputTrimName))
    ));

  const isAdminPhoneMatch =
    isPhoneMatch(currentAdminPhone, phone) ||
    (adminUser && isPhoneMatch(adminUser.phone, phone)) ||
    isPhoneMatch("9876543210", phone);

  // If Name matches Admin or (Name is custom and Phone matches Admin)
  const isTargetAdmin =
    (isAdminNameMatch && (isAdminPhoneMatch || phone.trim().length >= 4)) ||
    (isAdminPhoneMatch && inputTrimName === "admin");

  if (isTargetAdmin) {
    const adminFinalName = inputTrimName === "admin" ? (adminUser?.name || "Admin") : name.trim();
    const adminFinalPhone = phone.trim() || adminUser?.phone || currentAdminPhone;

    saveCustomPassword("admin", trimmedPass);
    saveCustomPassword("usr_admin", trimmedPass);
    saveCustomPassword(adminFinalName, trimmedPass);
    if (adminFinalPhone) {
      setAdminPhone(adminFinalPhone);
    }

    try {
      await supabase.from("app_users").upsert({
        id: "usr_admin",
        name: adminFinalName,
        phone: adminFinalPhone,
        password: trimmedPass,
        role: "admin",
        status: "Active",
      });
    } catch (e) {
      console.warn("Supabase admin password update fallback:", e);
    }

    return {
      success: true,
      message: `Admin account (${adminFinalName}) password reset successfully! You can now log in with your new password.`,
    };
  }

  // ==========================================
  // MEMBER FLOW:
  // Verify against member list added by Admin
  // ==========================================
  const userIndex = users.findIndex((u) => {
    if (u.role === "admin") return false;
    const uName = u.name.trim().toLowerCase();
    const nameMatch = 
      uName === inputTrimName ||
      (inputTrimName.length >= 3 && uName.startsWith(inputTrimName)) ||
      (uName.length >= 3 && inputTrimName.startsWith(uName));

    const phoneMatch = isPhoneMatch(u.phone, phone);
    return nameMatch && phoneMatch;
  });

  if (userIndex === -1) {
    return {
      success: false,
      message: "No registered member account matches this Name and Phone Number. Please verify spelling or contact Admin.",
    };
  }

  const targetUser = users[userIndex];

  // Save custom password locally
  saveCustomPassword(targetUser.id, trimmedPass);
  saveCustomPassword(targetUser.name, trimmedPass);

  // Attempt save to Supabase app_users table
  try {
    await supabase.from("app_users").upsert({
      id: targetUser.id,
      name: targetUser.name,
      phone: targetUser.phone,
      password: trimmedPass,
      role: targetUser.role,
      status: targetUser.status || "Active",
    });
  } catch (e) {
    console.warn("Supabase password update fallback:", e);
  }

  return {
    success: true,
    message: `Password reset successfully for ${targetUser.name}! You can now log in with your new password.`,
  };
}

/**
 * Admin master reset password for any member or user.
 */
export async function adminResetUserPassword(
  userIdOrName: string,
  newPassword: string
): Promise<boolean> {
  const trimmedPass = newPassword.trim();
  saveCustomPassword(userIdOrName, trimmedPass);

  try {
    const users = await getAllUsers();
    const user = users.find(u => u.id === userIdOrName || u.name.toLowerCase() === userIdOrName.toLowerCase());
    if (user) {
      saveCustomPassword(user.id, trimmedPass);
      saveCustomPassword(user.name, trimmedPass);
      await supabase.from("app_users").upsert({
        id: user.id,
        name: user.name,
        phone: user.phone,
        password: trimmedPass,
        role: user.role,
        status: user.status || "Active",
      });
    }
  } catch (e) {
    console.warn("adminResetUserPassword sync error:", e);
  }

  return true;
}

/**
 * Helper to find user by member name or phone.
 */
export async function findUserByMember(name: string, phone?: string): Promise<AppUser | null> {
  const users = await getAllUsers();
  const inputName = name.trim().toLowerCase();

  return users.find((u) => {
    const uName = u.name.trim().toLowerCase();
    if (uName === inputName) return true;
    if (phone && isPhoneMatch(u.phone, phone)) return true;
    return false;
  }) || null;
}

/**
 * Upsert user password / credentials when Admin adds or edits a member.
 */
export async function upsertAppUser(user: AppUser): Promise<boolean> {
  if (user.password) {
    saveCustomPassword(user.id, user.password.trim());
    saveCustomPassword(user.name, user.password.trim());
  }

  try {
    await supabase.from("app_users").upsert({
      id: user.id,
      name: user.name,
      phone: user.phone,
      password: user.password ? user.password.trim() : "123",
      role: user.role,
      status: user.status || "Active",
    });
  } catch (e) {
    console.warn("Supabase upsert user fallback:", e);
  }

  return true;
}

// Session Helpers
export function getSessionUser(): AppUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY_SESSION);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setSessionUser(user: AppUser) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(user));
  }
}

export function clearSessionUser() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY_SESSION);
  }
}
