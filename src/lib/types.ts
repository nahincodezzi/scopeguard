export type VerdictStatus = "IN_SCOPE" | "GREY_AREA" | "OUT_OF_SCOPE";
export type LineItemStatus = "IN_SCOPE" | "REVISION" | "OUT_OF_SCOPE";
export type MessageSource = "email" | "slack" | "whatsapp" | "other";
export type ReplyTone = "friendly" | "firm" | "short";
export type PaymentTerms = "full" | "deposit_50" | "invoice";
export type ChangeOrderStatus =
  | "DRAFT"
  | "PENDING"
  | "APPROVED"
  | "PAID"
  | "DECLINED"
  | "EXPIRED"
  | "WITHDRAWN";

export type EventType =
  | "created"
  | "sent"
  | "viewed"
  | "approved"
  | "paid"
  | "declined"
  | "reminded"
  | "withdrawn"
  | "question";

export interface Profile {
  agency_name: string; // required
  logo_url: string;
  brand_color: string;
  reply_email: string;
  timezone: string; // default e.g. "Asia/Dhaka", "America/New_York", etc.
  allow_pay_on_invoice: boolean;
  stripe_account_id: string | null;
  stripe_connected: boolean;
  plan: "free" | "pro" | "agency";
  stripe_customer_id: string | null;
  subscription_status: "active" | "trialing" | "past_due" | "canceled";
  api_token: string;
  onboarding_completed: boolean;
}

export interface SOWClause {
  id: string; // e.g. "§1", "§3"
  text: string;
}

export interface Contract {
  id: string;
  project_id: string;
  version: number;
  file_name: string;
  file_uri?: string;
  parsed_at: string;
  is_active: boolean;
  summary: string;
  included_deliverables: string[];
  explicit_exclusions: string[];
  revision_limit: number | null;
  revision_scope: string | null;
  hourly_rate: number | null;
  fixed_fee: number | null;
  currency: string | null;
  timeline: string | null;
  clauses: SOWClause[];
}

export interface Project {
  id: string;
  title: string;
  client_name: string;
  client_email: string;
  client_company: string;
  hourly_rate: number;
  rate_source: "contract" | "default";
  allowed_revisions: number; // single source of truth
  revisions_used: number;
  revision_scope: string | null;
  created_at: string;
}

export interface ScopeCheckLineItem {
  request: string;
  work_description: string;
  status: LineItemStatus;
  clause_id: string;
  clause_text: string;
  estimated_hours: number;
}

export interface ScopeCheck {
  id: string;
  project_id: string;
  message: string;
  source: MessageSource;
  status: VerdictStatus;
  confidence_score: number;
  reasoning: string;
  line_items: ScopeCheckLineItem[];
  counts_as_revision: boolean;
  revision_number: number | null;
  estimated_hours: number;
  suggested_price: number;
  change_order_title: string;
  timeline_impact: string;
  polite_reply_draft: string;
  reply_tone: ReplyTone;
  user_feedback: {
    type: "correct" | "wrong";
    corrected_verdict?: string;
    note?: string;
  } | null;
  model: string;
  created_at: string; // ISO string with Z
}

export interface ChangeOrderLineItem {
  request: string;
  work_description: string;
  estimated_hours: number;
  fee: number;
  clause_id?: string;
  clause_text?: string;
}

export interface ChangeOrder {
  id: string;
  number: string; // CO-0001, sequential per workspace
  token: string; // random token >= 32 chars
  project_id: string;
  scope_check_id?: string;
  title: string; // AI generated title, editable
  line_items: ChangeOrderLineItem[];
  total_hours: number;
  total_fee: number;
  hourly_rate: number;
  timeline_impact: string;
  client_request_quote: string;
  agreement_clause_quote: string;
  agreement_sow_link?: string;
  payment_terms: PaymentTerms;
  expires_at: string; // ISO string
  stripe_checkout_session_id?: string | null;
  stripe_payment_intent_id?: string | null;
  paid_at?: string | null;
  approved_by_name?: string | null;
  approved_ip?: string | null;
  approved_user_agent?: string | null;
  declined_at?: string | null;
  decline_reason?: string | null;
  viewed_at?: string | null;
  reminder_sent_at?: string | null;
  status: ChangeOrderStatus;
  created_at: string; // ISO with Z
}

export interface ChangeOrderEvent {
  id: string;
  change_order_id: string;
  type: EventType;
  meta: Record<string, any>;
  created_at: string; // ISO with Z
}

export interface NotificationItem {
  id: string;
  type: EventType;
  title: string;
  message: string;
  change_order_id?: string;
  read: boolean;
  created_at: string;
}
