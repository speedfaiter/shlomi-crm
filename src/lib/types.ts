export type LeadStatus =
  | "new"
  | "contacted"
  | "interested"
  | "scheduled"
  | "closed"
  | "not_interested";

export interface Lead {
  id: string;
  name: string;
  phone: string;
  city: string;
  child_age: number | null;
  source: string;
  status: LeadStatus;
  notes: string;
  follow_up_date: string | null;
  follow_up_count: number;
  last_follow_up_at: string | null;
  whatsapp_opt_out: boolean;
  created_at: string;
  updated_at: string;
}

export interface FollowUpLog {
  id: string;
  lead_id: string;
  message_type: string;
  template: string;
  status: string;
  sent_at: string;
}

export type LeadInsert = Omit<Lead, "id" | "created_at" | "updated_at">;

export const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "חדש",
  contacted: "נוצר קשר",
  interested: "מתעניין",
  scheduled: "נקבע מועד",
  closed: "סגור",
  not_interested: "לא מעוניין",
};

export const STATUS_COLORS: Record<LeadStatus, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  interested: "bg-purple-100 text-purple-800",
  scheduled: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
  not_interested: "bg-red-100 text-red-800",
};

export const SOURCE_LABELS: Record<string, string> = {
  manual: "ידני",
  ravmesser: "רב מסר",
  facebook: "פייסבוק",
  website: "אתר",
  referral: "הפניה",
};
