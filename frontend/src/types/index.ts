export type UserRole = "regular" | "admin";
export type UserStatus = "active" | "disabled";

export interface User {
  _id: string;
  email: string;
  name: string;
  campus_id?: string;
  department?: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
}

export type ReportType = "lost" | "found";
export type ModerationStatus = "submitted" | "in_review" | "published" | "rejected" | "closed";
export type ItemOutcome = "open" | "claim_pending" | "returned" | "archived";

export interface Report {
  _id: string;
  user_id: string;
  type: ReportType;
  item_name: string;
  category: string;
  description: string;
  color?: string;
  brand?: string;
  location: string;
  event_time: string;
  image_urls: string[];
  custody_location?: string;
  moderation_status: ModerationStatus;
  item_outcome: ItemOutcome;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export type ClaimStatus = "submitted" | "under_review" | "info_requested" | "approved" | "rejected" | "completed" | "withdrawn";

export interface Claim {
  _id: string;
  found_report_id: string;
  claimant_id: string;
  distinctive_marks: string;
  secret_contents?: string;
  loss_circumstances: string;
  evidence_image_urls: string[];
  status: ClaimStatus;
  admin_id?: string;
  decision_reason?: string;
  admin_notes?: string;
  additional_evidence?: string;
  created_at: string;
  report?: {
    id: string;
    item_name: string;
    category: string;
    color?: string;
    location: string;
    custody_location?: string;
    image_urls: string[];
  };
  claimant?: {
    name: string;
    email: string;
    campus_id?: string;
    phone?: string;
  };
}

export interface MatchCandidate {
  _id: string;
  lost_report_id: string;
  found_report_id: string;
  score: number;
  factors: Record<string, number>;
  status: "suggested" | "dismissed" | "confirmed";
  created_at: string;
  target_report?: {
    id: string;
    item_name: string;
    category: string;
    color?: string;
    location: string;
    event_time: string;
    image_urls: string[];
  };
}

export interface AppNotification {
  _id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}
