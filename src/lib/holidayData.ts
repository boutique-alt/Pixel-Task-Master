export interface CompanyHoliday {
  id: string;
  date: string; // YYYY-MM-DD
  day: string;  // e.g. "Thursday"
  name: string; // e.g. "Diwali (Deepavali)"
}

export interface MemberHolidaySelection {
  id: string;
  member: string; // member name
  selectedHolidayIds: string[]; // array of CompanyHoliday IDs
  status: "Pending" | "Approved" | "Rejected";
  adminRemark?: string;
  updatedAt: string;
}

export const INITIAL_COMPANY_HOLIDAYS: CompanyHoliday[] = [
  { id: "h-2026-10-29", date: "2026-10-29", day: "Thursday", name: "Karwa Chauth (Karaka Chaturthi)" },
  { id: "h-2026-11-08-1", date: "2026-11-08", day: "Sunday", name: "Diwali (Deepavali)" },
  { id: "h-2026-11-08-2", date: "2026-11-08", day: "Sunday", name: "Naraka Chaturdasi" },
  { id: "h-2026-11-09", date: "2026-11-09", day: "Monday", name: "Govardhan Puja" },
  { id: "h-2026-11-11", date: "2026-11-11", day: "Wednesday", name: "Bhai Duj" },
  { id: "h-2026-11-15", date: "2026-11-15", day: "Sunday", name: "Chhath Puja (Pratihar / Surya Shashthi)" },
  { id: "h-2026-11-24-1", date: "2026-11-24", day: "Tuesday", name: "Guru Nanak's Birthday" },
  { id: "h-2026-11-24-2", date: "2026-11-24", day: "Tuesday", name: "Guru Tegh Bahadur's Martyrdom Day" },
  { id: "h-2026-12-23", date: "2026-12-23", day: "Wednesday", name: "Hazrat Ali's Birthday" },
  { id: "h-2026-12-24", date: "2026-12-24", day: "Thursday", name: "Christmas Eve" },
  { id: "h-2026-12-25", date: "2026-12-25", day: "Friday", name: "Christmas Day" },
  { id: "h-2027-01-01", date: "2027-01-01", day: "Friday", name: "New Year's Day" },
  { id: "h-2027-01-14", date: "2027-01-14", day: "Thursday", name: "Makar Sankranti / Magha Bihu" },
  { id: "h-2027-01-15", date: "2027-01-15", day: "Friday", name: "Pongal / Guru Gobind Singh's Birthday" },
  { id: "h-2027-01-26", date: "2027-01-26", day: "Tuesday", name: "Republic Day" },
  { id: "h-2027-02-11", date: "2027-02-11", day: "Thursday", name: "Sri Panchami / Basant Panchami" },
  { id: "h-2027-02-19", date: "2027-02-19", day: "Friday", name: "Shiva Ji Jayanti" },
  { id: "h-2027-02-20", date: "2027-02-20", day: "Saturday", name: "Guru Ravi Das's Birthday" },
  { id: "h-2027-03-02", date: "2027-03-02", day: "Tuesday", name: "Swami Dayananda Saraswati's Birthday" },
  { id: "h-2027-03-05", date: "2027-03-05", day: "Friday", name: "Jamat-Ul-Vida" },
  { id: "h-2027-03-06", date: "2027-03-06", day: "Saturday", name: "Maha Shivratri" },
  { id: "h-2027-03-10", date: "2027-03-10", day: "Wednesday", name: "Id-ul-Fitr" },
  { id: "h-2027-03-22", date: "2027-03-22", day: "Monday", name: "Holika Dahan / Dolyatra" },
  { id: "h-2027-03-23", date: "2027-03-23", day: "Tuesday", name: "Holi" },
  { id: "h-2027-03-26", date: "2027-03-26", day: "Friday", name: "Good Friday" },
  { id: "h-2027-03-28", date: "2027-03-28", day: "Sunday", name: "Easter Sunday" },
  { id: "h-2027-04-07", date: "2027-04-07", day: "Wednesday", name: "Chaitra Sukladi / Gudi Padava / Ugadi / 1st Navratra" },
  { id: "h-2027-04-14", date: "2027-04-14", day: "Wednesday", name: "Vaisakhi / Vishu / Tamil New Year" },
  { id: "h-2027-04-15-1", date: "2027-04-15", day: "Thursday", name: "Ram Navami" },
  { id: "h-2027-04-15-2", date: "2027-04-15", day: "Thursday", name: "Vaisakhadi (Bengal) / Bahag Bihu (Assam)" },
  { id: "h-2027-04-19", date: "2027-04-19", day: "Monday", name: "Mahavir Jayanti" },
  { id: "h-2027-05-09", date: "2027-05-09", day: "Sunday", name: "Rabindranath Tagore's Birthday" },
  { id: "h-2027-05-17", date: "2027-05-17", day: "Monday", name: "Id-ul-Zuha (Bakrid)" },
  { id: "h-2027-05-20", date: "2027-05-20", day: "Thursday", name: "Buddha Purnima" },
  { id: "h-2027-06-16", date: "2027-06-16", day: "Wednesday", name: "Muharram" },
  { id: "h-2027-07-05", date: "2027-07-05", day: "Monday", name: "Rath Yatra" },
  { id: "h-2027-08-15-1", date: "2027-08-15", day: "Sunday", name: "Independence Day / Id-e-Milad" },
  { id: "h-2027-08-15-2", date: "2027-08-15", day: "Sunday", name: "Parsi New Year / Navroz" },
  { id: "h-2027-08-17", date: "2027-08-17", day: "Tuesday", name: "Raksha Bandhan" },
  { id: "h-2027-08-25", date: "2027-08-25", day: "Wednesday", name: "Janmashtami (Vaishnav)" },
  { id: "h-2027-09-04", date: "2027-09-04", day: "Saturday", name: "Ganesh Chaturthi" },
  { id: "h-2027-09-12", date: "2027-09-12", day: "Sunday", name: "Onam" },
  { id: "h-2027-10-02", date: "2027-10-02", day: "Saturday", name: "Mahatma Gandhi's Birthday" },
  { id: "h-2027-10-06", date: "2027-10-06", day: "Wednesday", name: "Dussehra (Saptami)" },
  { id: "h-2027-10-07", date: "2027-10-07", day: "Thursday", name: "Dussehra (Mahashtami)" },
  { id: "h-2027-10-08", date: "2027-10-08", day: "Friday", name: "Dussehra (Mahanavmi)" },
  { id: "h-2027-10-09", date: "2027-10-09", day: "Saturday", name: "Dussehra (Vijaya Dashmi)" },
  { id: "h-2027-10-15", date: "2027-10-15", day: "Friday", name: "Maharishi Valmiki's Birthday" },
  { id: "h-2027-10-18", date: "2027-10-18", day: "Monday", name: "Karwa Chauth" },
  { id: "h-2027-10-28", date: "2027-10-28", day: "Thursday", name: "Naraka Chaturdasi" },
  { id: "h-2027-10-29", date: "2027-10-29", day: "Friday", name: "Diwali (Deepavali)" },
  { id: "h-2027-10-30", date: "2027-10-30", day: "Saturday", name: "Govardhan Puja" },
  { id: "h-2027-10-31", date: "2027-10-31", day: "Sunday", name: "Bhai Duj" },
];

export const MAX_MEMBER_HOLIDAYS_QUOTA = 20;

export function formatHolidayDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); // e.g. "Oct 15, 2026"
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
}

