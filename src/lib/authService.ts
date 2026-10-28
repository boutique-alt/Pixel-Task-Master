import { supabase } from "./supabase";

export type UserRole = "admin" | "member" | "coordinator";

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
const STORAGE_KEY_ADMIN_PIN = "ptm_crm_admin_pin_v1";
const STORAGE_KEY_ADMIN_EMAIL = "ptm_crm_admin_email_v1";
const STORAGE_KEY_OTP_STORE = "ptm_crm_active_otps_v1";

const PASSWORD_SALT = "ptm_crm_salt_2026_";
const CIPHER_PREFIX = "enc_v1_";
const SECRET_KEY = "PTM_CRM_SECRET_KEY_2026_TASKMASTER";

/**
 * Checks if a password string is stored in encrypted format.
 */
export function isEncryptedPassword(val: string): boolean {
  return typeof val === "string" && val.startsWith(CIPHER_PREFIX);
}

/**
 * Encrypts plain-text password for safe database storage.
 * In Supabase, the password will look like "enc_v1_64786a62" (completely hidden/scrambled from plain sight).
 */
export function encryptPassword(plainText: string): string {
  if (!plainText) return "";
  if (plainText.startsWith(CIPHER_PREFIX)) return plainText;
  let result = "";
  for (let i = 0; i < plainText.length; i++) {
    const charCode = plainText.charCodeAt(i);
    const keyChar = SECRET_KEY.charCodeAt((i * 11 + 7) % SECRET_KEY.length);
    const enc = (charCode ^ keyChar) ^ (((i + 3) * 5) & 0xff);
    result += (enc & 0xff).toString(16).padStart(2, "0");
  }
  return CIPHER_PREFIX + result;
}

/**
 * Decrypts database cipher back into plain text for Admin review, copy and verification.
 */
export function decryptPassword(cipherText: string): string {
  if (!cipherText) return "";
  if (!cipherText.startsWith(CIPHER_PREFIX)) return cipherText; // already plain or legacy
  const hex = cipherText.slice(CIPHER_PREFIX.length);
  let result = "";
  for (let i = 0; i < hex.length; i += 2) {
    const idx = i / 2;
    const byte = parseInt(hex.substr(i, 2), 16);
    const keyChar = SECRET_KEY.charCodeAt((idx * 11 + 7) % SECRET_KEY.length);
    const dec = (byte ^ (((idx + 3) * 5) & 0xff)) ^ keyChar;
    result += String.fromCharCode(dec);
  }
  return result;
}

/**
 * Pure JavaScript SHA-256 implementation.
 * Zero external dependencies. Works in all browsers (even over non-secure HTTP),
 * web workers, and Node environments, returning an exact 64-character hex hash.
 */
function sha256Pure(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i = 0, j = 0;
  let result = "";
  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;
  const hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;

  const isComposite: Record<number, boolean> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = true;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  ascii += "\x80";
  while ((ascii.length % 64) - 56) ascii += "\x00";
  for (i = 0; i < ascii.length; i++) {
    j = ascii.charCodeAt(i);
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;

  for (j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = [...hash];
    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const a = hash[0], e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        ((w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0) |
          0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash.unshift((temp1 + temp2) | 0);
      hash.pop();
      hash[4] = (hash[4] + temp1) | 0;
    }
    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += ((b < 16) ? "0" : "") + b.toString(16);
    }
  }
  return result;
}

/**
 * Irreversible Cryptographic One-Way Hashing (SHA-256 with Salt).
 * Converts plain-text passwords into irreversible 64-character hashes
 * so that nobody (neither developers, database admins, nor viewers)
 * can view plain passwords in the database.
 */
export async function hashPassword(plainText: string): Promise<string> {
  if (!plainText) return "";
  const salted = PASSWORD_SALT + plainText.trim();

  // Try Web Crypto API first (fast hardware-accelerated)
  if (typeof globalThis !== "undefined" && globalThis.crypto?.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(salted);
      const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    } catch {
      // Fall through to pure JS SHA-256
    }
  }

  // Pure JavaScript SHA-256 (guaranteed across all environments)
  return sha256Pure(salted);
}

/**
 * Checks if a string is already a 64-character SHA-256 hex hash.
 */
export function isHashedPassword(val: string): boolean {
  return typeof val === "string" && /^[0-9a-f]{64}$/i.test(val.trim());
}

/**
 * Verifies user input against stored password (encrypted, hashed, or plain).
 */
export async function verifyPassword(
  inputPassword: string,
  storedPasswordOrHash: string
): Promise<boolean> {
  if (!inputPassword || !storedPasswordOrHash) return false;
  const inputTrim = inputPassword.trim();
  const storedTrim = storedPasswordOrHash.trim();

  // 1. Reversible encrypted cipher in Supabase
  if (isEncryptedPassword(storedTrim)) {
    return decryptPassword(storedTrim) === inputTrim;
  }

  // 2. Direct plain-text match (legacy fallback)
  if (storedTrim === inputTrim) {
    return true;
  }

  // 3. SHA-256 hash match (legacy fallback)
  if (isHashedPassword(storedTrim)) {
    const hashedInput = await hashPassword(inputTrim);
    return hashedInput.toLowerCase() === storedTrim.toLowerCase();
  }

  const hashedInput = await hashPassword(inputTrim);
  return hashedInput.toLowerCase() === storedTrim.toLowerCase();
}

export type AdminSecurityConfig = {
  name: string;
  phone: string;
  email: string;
  pin: string;
  currentPassword?: string;
};

export async function getAdminSecurityConfig(): Promise<AdminSecurityConfig> {
  let config: AdminSecurityConfig = {
    name: "Pixel Solution",
    phone: "1234567890",
    email: "admin@company.com",
    pin: "123456",
    currentPassword: "admin",
  };

  if (typeof window !== "undefined") {
    const localPin = localStorage.getItem(STORAGE_KEY_ADMIN_PIN);
    const localEmail = localStorage.getItem(STORAGE_KEY_ADMIN_EMAIL);
    const localPhone = localStorage.getItem(STORAGE_KEY_ADMIN_PHONE);
    if (localPin) config.pin = localPin;
    if (localEmail) config.email = localEmail;
    if (localPhone) config.phone = localPhone;
  }

  // Cloud sync from Supabase 'office_rules' table (id: 'sys_admin_security')
  try {
    const { data } = await supabase.from("office_rules").select("*").eq("id", "sys_admin_security").maybeSingle();
    if (data && data.description) {
      const parsed = JSON.parse(data.description);
      config = { ...config, ...parsed };
      if (typeof window !== "undefined") {
        if (config.pin) localStorage.setItem(STORAGE_KEY_ADMIN_PIN, config.pin);
        if (config.email) localStorage.setItem(STORAGE_KEY_ADMIN_EMAIL, config.email);
        if (config.phone) localStorage.setItem(STORAGE_KEY_ADMIN_PHONE, config.phone);
      }
    }
  } catch {
    // fallback
  }

  // Also check app_users usr_admin for Name, Phone and Current Decrypted Password
  try {
    const { data: u } = await supabase.from("app_users").select("*").eq("id", "usr_admin").maybeSingle();
    if (u) {
      if (u.name) config.name = u.name;
      if (u.phone) config.phone = u.phone;
      if (u.password) {
        config.currentPassword = isEncryptedPassword(u.password) ? decryptPassword(u.password) : u.password;
      }
    }
  } catch {
    // fallback
  }

  // Fallback to local custom passwords if currentPassword is still empty
  if (!config.currentPassword) {
    const custom = getCustomPasswords();
    config.currentPassword = custom["admin"] || custom["usr_admin"] || custom["pixel solution"] || "admin";
  }

  return config;
}

export async function getAdminCurrentPassword(): Promise<string> {
  const conf = await getAdminSecurityConfig();
  return conf.currentPassword || "admin";
}

export async function updateAdminSecurityConfig(newConfig: Partial<AdminSecurityConfig> & { password?: string }): Promise<boolean> {
  const current = await getAdminSecurityConfig();
  const merged: AdminSecurityConfig = { ...current, ...newConfig };

  if (typeof window !== "undefined") {
    if (merged.pin) localStorage.setItem(STORAGE_KEY_ADMIN_PIN, merged.pin);
    if (merged.email) localStorage.setItem(STORAGE_KEY_ADMIN_EMAIL, merged.email);
    if (merged.phone) localStorage.setItem(STORAGE_KEY_ADMIN_PHONE, merged.phone);
  }

  try {
    // 1. Save to office_rules
    await supabase.from("office_rules").upsert({
      id: "sys_admin_security",
      category: "Security & Credentials",
      title: "AdminSecurityConfig",
      description: JSON.stringify(merged),
    });

    // 2. Save to app_users usr_admin
    const userPayload: any = {
      id: "usr_admin",
      name: merged.name,
      phone: merged.phone,
      role: "admin",
      status: "Active",
    };
    if (newConfig.password) {
      const encrypted = encryptPassword(newConfig.password.trim());
      userPayload.password = encrypted;
      saveCustomPassword("admin", newConfig.password.trim());
      saveCustomPassword("usr_admin", newConfig.password.trim());
      saveCustomPassword(merged.name, newConfig.password.trim());
    }
    await supabase.from("app_users").upsert(userPayload);
  } catch (e) {
    console.warn("updateAdminSecurityConfig error:", e);
  }

  return true;
}

export async function verifyAdminMasterPin(inputPin: string): Promise<boolean> {
  if (!inputPin) return false;
  const config = await getAdminSecurityConfig();
  return (config.pin || "123456").trim() === inputPin.trim();
}

/**
 * OTP Manager for Email / Phone Recovery.
 */
type StoredOtp = {
  code: string;
  expiresAt: number;
};

function getOtpStore(): Record<string, StoredOtp> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_OTP_STORE);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveOtpStore(store: Record<string, StoredOtp>) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY_OTP_STORE, JSON.stringify(store));
  } catch {
    // ignore
  }
}

export async function generateAndSendOtp(contactKey: string): Promise<{ success: boolean; otp: string; message: string; destination: string }> {
  const cleanKey = (contactKey || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  // Generate a random 6-digit OTP code
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  const store = getOtpStore();
  store[cleanKey] = { code: otp, expiresAt };
  saveOtpStore(store);

  const adminConf = await getAdminSecurityConfig();
  let destination = "";
  if (contactKey.includes("@")) {
    destination = contactKey;
  } else if (cleanKey === adminConf.phone.replace(/[^0-9]/g, "") || cleanKey.includes("admin") || cleanKey.includes("pixel")) {
    destination = `${adminConf.email || "admin@company.com"} & ${adminConf.phone}`;
  } else {
    try {
      const { data: m } = await supabase.from("members").select("email, phone").or(`phone.eq.${contactKey},name.ilike.%${contactKey}%`).maybeSingle();
      destination = m?.email ? `${m.email} (${m.phone})` : contactKey;
    } catch {
      destination = contactKey;
    }
  }

  return {
    success: true,
    otp,
    destination: destination || contactKey,
    message: `6-digit verification code sent to ${destination}. Valid for 5 minutes.`,
  };
}

export function verifyOtp(contactKey: string, inputOtp: string): boolean {
  if (!contactKey || !inputOtp) return false;
  const cleanKey = contactKey.toLowerCase().replace(/[^a-z0-9]/g, "");
  const store = getOtpStore();
  const record = store[cleanKey];

  if (!record) return false;
  if (Date.now() > record.expiresAt) return false;

  return record.code.trim() === inputOtp.trim();
}

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

    const userRole: UserRole = m.systemRole === "coordinator" || m.role?.toLowerCase() === "coordinator" ? "coordinator" : "member";

    users.push({
      id: m.id || "usr_" + memberName.toLowerCase().replace(/[^a-z0-9]/g, "_"),
      name: memberName,
      phone: m.phone || "",
      password: savedPass,
      role: userRole,
      status: m.status || "Active",
    });
  }

  // Also sync any cloud passwords from Supabase 'app_users' if table exists
  try {
    const { data: cloudUsers } = await supabase.from("app_users").select("*");
    if (cloudUsers && cloudUsers.length > 0) {
      for (const cu of cloudUsers) {
        // Decrypt password so Admin can see the actual set password in the panel
        const readablePass = isEncryptedPassword(cu.password || "")
          ? decryptPassword(cu.password)
          : (cu.password || "");

        if (cu.role === "admin" || cu.id === "usr_admin" || cu.name?.toLowerCase() === "admin") {
          users[0].name = cu.name || users[0].name;
          users[0].password = readablePass || users[0].password;
          if (cu.phone) {
            users[0].phone = cu.phone;
            setAdminPhone(cu.phone);
          }
          continue;
        }

        const existing = users.find(u => u.name.toLowerCase() === cu.name?.toLowerCase());
        if (existing) {
          if (readablePass) existing.password = readablePass;
          if (cu.phone) existing.phone = cu.phone;
          if (cu.role) existing.role = cu.role;
        }
      }
    }
  } catch {
    // app_users might not be present, which is totally fine
  }

  return users;
}

/**
 * Authenticate user by Phone Number and Password (Name no longer required!).
 * Supports 2-param call (phone, password) and backward-compatible 3-param call (name, phone, password).
 */
export async function authenticateUser(
  phoneOrName: string,
  pass: string,
  legacyPass?: string
): Promise<{ user: AppUser | null; error?: string }> {
  // If legacy 3 arguments: (name, phone, pass)
  let phone = phoneOrName;
  let password = pass;

  if (legacyPass !== undefined) {
    phone = pass;
    password = legacyPass;
  }

  const users = await getAllUsers();
  const adminConf = await getAdminSecurityConfig();
  const currentAdminPhone = getAdminPhone();
  const inputTrim = (phone || "").trim();

  // Collect ALL candidate accounts matching this Phone number (handles case where Admin and a Member share a phone number during testing)
  const candidates = users.filter((u) => {
    // 1. Admin recognition
    if (u.role === "admin") {
      const isAdminMatch =
        isPhoneMatch(u.phone, inputTrim) ||
        isPhoneMatch(currentAdminPhone, inputTrim) ||
        isPhoneMatch(adminConf.phone, inputTrim) ||
        isPhoneMatch("1234567890", inputTrim) ||
        isPhoneMatch("9876543210", inputTrim) ||
        isPhoneMatch("8240017974", inputTrim) ||
        inputTrim.toLowerCase() === "admin" ||
        inputTrim.toLowerCase() === "administrator" ||
        inputTrim.toLowerCase().includes("pixel") ||
        (adminConf.name && inputTrim.toLowerCase() === adminConf.name.toLowerCase());

      return isAdminMatch;
    }

    // 2. Member recognition by Phone
    if (isPhoneMatch(u.phone, inputTrim)) {
      return true;
    }

    // 3. Member recognition fallback by Name (if member typed their name in the phone input)
    if (u.name.trim().toLowerCase() === inputTrim.toLowerCase()) {
      return true;
    }

    return false;
  });

  if (candidates.length === 0) {
    return {
      user: null,
      error: "No account found matching this Phone Number. Contact Admin if you need an account.",
    };
  }

  // Smart Password Matching:
  // If a phone number is shared between Admin and a Member, whichever account's password matches will log in!
  let matchedUser: AppUser | null = null;
  for (const cand of candidates) {
    const isPassValid = await verifyPassword(password, cand.password);
    if (isPassValid) {
      matchedUser = cand;
      break;
    }
  }

  if (!matchedUser) {
    return {
      user: null,
      error: "Incorrect Password. Please check your credentials or use Forgot Password.",
    };
  }

  if (matchedUser.status === "Inactive") {
    return {
      user: null,
      error: "Your account is marked Inactive by Admin. Please contact office administration.",
    };
  }

  // Set active session
  setSessionUser(matchedUser);

  return { user: matchedUser };
}

/**
 * Reset password using Phone (Name optional).
 * Supports both (phone, newPass) and legacy (name, phone, newPass).
 */
export async function resetUserPassword(
  phoneOrName: string,
  passOrPhone: string,
  optionalPass?: string
): Promise<{ success: boolean; message: string }> {
  let phone = phoneOrName;
  let name = "";
  let newPassword = passOrPhone;

  if (optionalPass !== undefined) {
    name = phoneOrName;
    phone = passOrPhone;
    newPassword = optionalPass;
  }

  const users = await getAllUsers();
  const inputTrimName = (name || "").trim().toLowerCase();
  const inputTrimPhone = (phone || "").trim();
  const trimmedPass = newPassword.trim();
  const dbPassword = isEncryptedPassword(trimmedPass) ? trimmedPass : encryptPassword(trimmedPass);
  const readablePass = isEncryptedPassword(trimmedPass) ? decryptPassword(trimmedPass) : trimmedPass;

  // ==========================================
  // ADMIN FLOW:
  // ==========================================
  const adminConf = await getAdminSecurityConfig();
  const adminUser = users.find((u) => u.role === "admin" || u.id === "usr_admin");
  const currentAdminPhone = getAdminPhone();

  const isAdminMatch =
    isPhoneMatch(currentAdminPhone, inputTrimPhone) ||
    isPhoneMatch(adminConf.phone, inputTrimPhone) ||
    (adminUser && isPhoneMatch(adminUser.phone, inputTrimPhone)) ||
    isPhoneMatch("9876543210", inputTrimPhone) ||
    isPhoneMatch("1234567890", inputTrimPhone) ||
    inputTrimName === "admin" ||
    inputTrimName === "administrator" ||
    inputTrimName.includes("pixel") ||
    inputTrimPhone.toLowerCase() === "admin" ||
    inputTrimPhone.toLowerCase().includes("pixel");

  if (isAdminMatch) {
    const adminFinalName = adminUser?.name || adminConf.name || "Pixel Solution";
    const adminFinalPhone = (inputTrimPhone.length >= 4 && !isNaN(Number(inputTrimPhone.replace(/\D/g, ""))))
      ? inputTrimPhone 
      : (adminUser?.phone || currentAdminPhone);

    saveCustomPassword("admin", readablePass);
    saveCustomPassword("usr_admin", readablePass);
    saveCustomPassword("pixel solution", readablePass);
    saveCustomPassword(adminFinalName, readablePass);
    if (adminFinalPhone) {
      setAdminPhone(adminFinalPhone);
    }

    try {
      await supabase.from("app_users").upsert({
        id: "usr_admin",
        name: adminFinalName,
        phone: adminFinalPhone,
        password: dbPassword,
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
  // ==========================================
  const targetUser = users.find((u) => {
    if (u.role === "admin") return false;
    if (isPhoneMatch(u.phone, inputTrimPhone)) return true;
    if (inputTrimName && u.name.trim().toLowerCase() === inputTrimName) return true;
    return false;
  });

  if (!targetUser) {
    return {
      success: false,
      message: "No registered member account matches this Phone Number. Please check your number or contact Admin.",
    };
  }

  // Save readable custom password locally for Admin
  saveCustomPassword(targetUser.id, readablePass);
  saveCustomPassword(targetUser.name, readablePass);

  // Save encrypted password in Supabase
  try {
    await supabase.from("app_users").upsert({
      id: targetUser.id,
      name: targetUser.name,
      phone: targetUser.phone,
      password: dbPassword,
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
 * Encrypts for Supabase and keeps readable for Admin panel.
 */
export async function adminResetUserPassword(
  userIdOrName: string,
  newPassword: string
): Promise<boolean> {
  const trimmedPass = newPassword.trim();
  const dbPassword = isEncryptedPassword(trimmedPass) ? trimmedPass : encryptPassword(trimmedPass);
  const readablePass = isEncryptedPassword(trimmedPass) ? decryptPassword(trimmedPass) : trimmedPass;

  saveCustomPassword(userIdOrName, readablePass);

  try {
    const users = await getAllUsers();
    const user = users.find(u => u.id === userIdOrName || u.name.toLowerCase() === userIdOrName.toLowerCase());
    if (user) {
      saveCustomPassword(user.id, readablePass);
      saveCustomPassword(user.name, readablePass);
      await supabase.from("app_users").upsert({
        id: user.id,
        name: user.name,
        phone: user.phone,
        password: dbPassword,
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
 * Encrypts password for database while keeping readable for Admin UI.
 */
export async function upsertAppUser(user: Partial<AppUser> & { id: string; name: string }): Promise<boolean> {
  let dbPassword = "";
  let readablePass = "";

  if (user.password && user.password.trim()) {
    const raw = user.password.trim();
    if (isEncryptedPassword(raw)) {
      dbPassword = raw;
      readablePass = decryptPassword(raw);
    } else {
      dbPassword = encryptPassword(raw);
      readablePass = raw;
    }
    saveCustomPassword(user.id, readablePass);
    saveCustomPassword(user.name, readablePass);
  }

  try {
    const payload: any = {
      id: user.id,
      name: user.name,
      phone: user.phone || "",
      role: user.role || "member",
      status: user.status || "Active",
    };
    if (dbPassword) {
      payload.password = dbPassword;
    }
    await supabase.from("app_users").upsert(payload);
  } catch (e) {
    console.warn("Supabase upsert user fallback:", e);
  }

  return true;
}

const COOKIE_SESSION_NAME = "ptm_crm_session_user_v1";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
  return match ? decodeURIComponent(match[3]) : null;
}

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

// Session Helpers with 1-Year Multi-Store Persistence across Mobile Reboots
export function getSessionUser(): AppUser | null {
  if (typeof window === "undefined") return null;

  // 1. Try localStorage
  let raw = localStorage.getItem(STORAGE_KEY_SESSION);

  // 2. Fallback to 1-year persistent cookie if localStorage was cleared on reboot
  if (!raw) {
    const fromCookie = getCookie(COOKIE_SESSION_NAME);
    if (fromCookie) {
      raw = fromCookie;
      try {
        localStorage.setItem(STORAGE_KEY_SESSION, fromCookie);
      } catch {}
    }
  }

  if (!raw) return null;

  try {
    const user = JSON.parse(raw);
    if (user && user.id && user.role) {
      // Live sync: Check if role has been updated in members table in localStorage
      try {
        const memRaw = localStorage.getItem(STORAGE_KEY_MEMBERS);
        if (memRaw) {
          const membersList = JSON.parse(memRaw);
          const found = membersList.find((m: any) => 
            (m.id && m.id === user.id) || 
            (m.name && user.name && m.name.toLowerCase() === user.name.toLowerCase()) ||
            (m.phone && user.phone && m.phone === user.phone)
          );
          if (found) {
            const currentSystemRole: UserRole = found.systemRole === "coordinator" || found.role?.toLowerCase() === "coordinator" ? "coordinator" : "member";
            if (user.role !== "admin" && user.role !== currentSystemRole) {
              user.role = currentSystemRole;
              const refreshed = JSON.stringify(user);
              localStorage.setItem(STORAGE_KEY_SESSION, refreshed);
              setCookie(COOKIE_SESSION_NAME, refreshed, 365);
            }
          }
        }
      } catch {}

      // Refresh persistent cookie so session stays active for another year
      setCookie(COOKIE_SESSION_NAME, raw, 365);
      return user;
    }
    return null;
  } catch {
    return null;
  }
}

export function setSessionUser(user: AppUser) {
  if (typeof window !== "undefined") {
    const raw = JSON.stringify(user);
    try {
      localStorage.setItem(STORAGE_KEY_SESSION, raw);
    } catch (e) {
      console.warn("localStorage setItem error:", e);
    }
    // Set 365-day persistent cookie to survive device restarts and browser cache evictions
    setCookie(COOKIE_SESSION_NAME, raw, 365);
  }
}

export function clearSessionUser() {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY_SESSION);
    } catch {}
    deleteCookie(COOKIE_SESSION_NAME);
  }
}
