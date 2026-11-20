import fs from "fs";
import path from "path";
import {
  Profile,
  Project,
  Contract,
  ScopeCheck,
  ChangeOrder,
  ChangeOrderEvent,
  NotificationItem,
} from "./types";
import { generateSecureToken } from "./utils";

interface DatabaseSchema {
  profile: Profile;
  projects: Project[];
  contracts: Contract[];
  scope_checks: ScopeCheck[];
  change_orders: ChangeOrder[];
  change_order_events: ChangeOrderEvent[];
  notifications: NotificationItem[];
  next_co_number: number;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "db.json");

function getInitialData(): DatabaseSchema {
  const profile: Profile = {
    agency_name: "Apex Studio",
    logo_url: "",
    brand_color: "#4338CA",
    reply_email: "hello@apexstudio.design",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    allow_pay_on_invoice: true,
    stripe_account_id: "acct_1N0xTEST98234",
    stripe_connected: true,
    plan: "pro",
    stripe_customer_id: "cus_pro_scopeguard",
    subscription_status: "active",
    api_token: "sg_live_a89f2b740e69123c4a20b9e847cd9",
    onboarding_completed: true,
  };

  const project1: Project = {
    id: "proj-dawn-shopify",
    title: "Shopify Dawn Storefront & SEO",
    client_name: "Sara Miller",
    client_email: "sara@bloomorganics.com",
    client_company: "Bloom Organics",
    hourly_rate: 65,
    rate_source: "contract",
    allowed_revisions: 2,
    revisions_used: 0,
    revision_scope: "home and product page mockups",
    created_at: "2026-11-01T10:00:00Z",
  };

  const project2: Project = {
    id: "proj-zenith-brand",
    title: "Zenith SaaS Landing & Portal",
    client_name: "Marcus Vance",
    client_email: "marcus@zenithai.io",
    client_company: "Zenith AI",
    hourly_rate: 85,
    rate_source: "contract",
    allowed_revisions: 2,
    revisions_used: 1,
    revision_scope: "Figma UI prototype & landing page",
    created_at: "2026-10-25T14:30:00Z",
  };

  const contract1: Contract = {
    id: "ctr-dawn-01",
    project_id: "proj-dawn-shopify",
    version: 1,
    file_name: "Bloom_Organics_SOW_Signed_v1.pdf",
    parsed_at: "2026-11-01T10:15:00Z",
    is_active: true,
    summary:
      "Shopify store setup on Dawn theme with 5 core pages, 40 product CSV import, retail checkout, Mailchimp signup, basic SEO, and 2 design revision rounds on home and product pages. All custom B2B, multi-language, multi-currency, and maintenance are excluded.",
    included_deliverables: [
      "Shopify store on Dawn theme",
      "5 pages (Home, Shop, Product, About, Contact)",
      "40 products CSV import",
      "Shopify Payments retail checkout",
      "Mailchimp footer signup",
      "Basic SEO & meta descriptions",
    ],
    explicit_exclusions: [
      "Copywriting",
      "Photography",
      "Wholesale/B2B pricing or checkout",
      "Multi-language (e.g. French store)",
      "Multi-currency (e.g. CAD pricing)",
      "Ongoing maintenance",
    ],
    revision_limit: 2,
    revision_scope: "home and product page mockups",
    hourly_rate: 65,
    fixed_fee: 3600,
    currency: "USD",
    timeline: "3-4 weeks",
    clauses: [
      {
        id: "§1",
        text: "Included deliverables: Shopify store on Dawn theme, 5 pages (Home, Shop, Product, About, Contact), 40 products CSV import, Shopify Payments retail checkout, Mailchimp footer signup, and basic SEO.",
      },
      {
        id: "§2",
        text: "Revision limit: 2 design revision rounds on Home and Product pages. Additional revision rounds or revisions on other pages are billed at the contract hourly rate.",
      },
      {
        id: "§3",
        text: "Explicit exclusions: Copywriting, custom photography, wholesale/B2B pricing or wholesale checkout, multi-language localization (e.g. French/Spanish), multi-currency (e.g. CAD, EUR), and ongoing maintenance.",
      },
      {
        id: "§4",
        text: "Additional scope: Any work outside Section 1 and Section 2 will be documented in a Change Order at $65/hr.",
      },
    ],
  };

  const initialCOToken = generateSecureToken();

  const changeOrder1: ChangeOrder = {
    id: "co-0041-dawn",
    number: "CO-0041",
    token: initialCOToken,
    project_id: "proj-dawn-shopify",
    title: "French store, CAD pricing & wholesale login",
    line_items: [
      {
        request: "French store setup & localization",
        work_description: "Configure multi-language store, locale switcher, and French translation assets",
        estimated_hours: 8,
        fee: 520,
        clause_id: "§3",
      },
      {
        request: "CAD currency pricing for Canada",
        work_description: "Set up multi-currency market for Canada, CAD price rounding, and checkout testing",
        estimated_hours: 6,
        fee: 390,
        clause_id: "§3",
      },
      {
        request: "Wholesale B2B login & 20% discount portal",
        work_description: "Implement wholesale customer tagging, restricted B2B catalog access, and 20% tier pricing",
        estimated_hours: 13,
        fee: 845,
        clause_id: "§3",
      },
    ],
    total_hours: 27,
    total_fee: 1755,
    hourly_rate: 65,
    timeline_impact: "about 1-2 weeks",
    client_request_quote: "Set up the site in French, CAD pricing for Canada, and a wholesale login for cafes with 20% off.",
    agreement_clause_quote:
      "Section 3 explicit exclusions: Copywriting, custom photography, wholesale/B2B pricing or wholesale checkout, multi-language localization, multi-currency.",
    payment_terms: "full",
    expires_at: new Date(Date.now() + 14 * 86400000).toISOString(),
    status: "PENDING",
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  };

  const changeOrderPaid: ChangeOrder = {
    id: "co-0040-paid",
    number: "CO-0040",
    token: generateSecureToken(),
    project_id: "proj-zenith-brand",
    title: "SOC2 Compliance Security Badge & Whitepaper Download",
    line_items: [
      {
        request: "Security page & badge integration",
        work_description: "Design and implement SOC2 security trust hub and dynamic PDF gated lead form",
        estimated_hours: 10,
        fee: 850,
        clause_id: "§3",
      },
    ],
    total_hours: 10,
    total_fee: 850,
    hourly_rate: 85,
    timeline_impact: "3 days",
    client_request_quote: "Can we add a SOC2 trust badge and gated whitepaper download form on the security page?",
    agreement_clause_quote: "Excluded: Gated marketing workflows, custom CMS lead integrations.",
    payment_terms: "full",
    expires_at: new Date(Date.now() + 10 * 86400000).toISOString(),
    status: "PAID",
    paid_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    approved_by_name: "Marcus Vance",
    approved_ip: "192.168.1.45",
    approved_user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    stripe_payment_intent_id: "pi_3N9238TestPaymentIntent",
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  };

  const scopeCheck1: ScopeCheck = {
    id: "chk-001",
    project_id: "proj-dawn-shopify",
    message: "Set up the site in French, CAD pricing for Canada, and a wholesale login for cafes with 20% off.",
    source: "email",
    status: "OUT_OF_SCOPE",
    confidence_score: 96,
    reasoning:
      "The requested additions match explicit exclusions in Section 3 of the SOW. These items require 27 hours of custom work outside the baseline agreement.",
    line_items: [
      {
        request: "French store setup & localization",
        work_description: "Configure multi-language store, locale switcher, and French translation assets",
        status: "OUT_OF_SCOPE",
        clause_id: "§3",
        clause_text: "Explicit exclusions: wholesale/B2B pricing, multi-language, multi-currency.",
        estimated_hours: 8,
      },
      {
        request: "CAD currency pricing for Canada",
        work_description: "Set up multi-currency market for Canada, CAD price rounding, and checkout testing",
        status: "OUT_OF_SCOPE",
        clause_id: "§3",
        clause_text: "Explicit exclusions: wholesale/B2B pricing, multi-language, multi-currency.",
        estimated_hours: 6,
      },
      {
        request: "Wholesale B2B login & 20% discount portal",
        work_description: "Implement wholesale customer tagging, restricted B2B catalog access, and 20% tier pricing",
        status: "OUT_OF_SCOPE",
        clause_id: "§3",
        clause_text: "Explicit exclusions: wholesale/B2B pricing, multi-language, multi-currency.",
        estimated_hours: 13,
      },
    ],
    counts_as_revision: false,
    revision_number: null,
    estimated_hours: 27,
    suggested_price: 1755,
    change_order_title: "French store, CAD pricing & wholesale login",
    timeline_impact: "about 1-2 weeks",
    polite_reply_draft:
      "Hi Sara,\n\nThanks for sending these over! The ideas for French store, CAD pricing & wholesale login sound great and will make the store really stand out.\n\nBecause this is outside our initial agreed scope (§3 exclusions), we've put together a quick change order for 27 hours ($1,755 at our contract rate of $65/hr, adds about 1-2 weeks).\n\nYou can review the full breakdown and approve it right here:\n{{APPROVAL_LINK}}\n\nHappy to jump on a quick call if you have any questions!\n\nWarm regards,\nShopify Dawn Storefront & SEO Team",
    reply_tone: "friendly",
    user_feedback: null,
    model: "ScopeGuard SOW Analyzer v2.0 (Gemini 1.5 Pro Hybrid)",
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  };

  const notifications: NotificationItem[] = [
    {
      id: "notif-1",
      type: "paid",
      title: "Change order paid ($850)",
      message: "Marcus Vance paid CO-0040 via Stripe Checkout.",
      change_order_id: "co-0040-paid",
      read: false,
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: "notif-2",
      type: "created",
      title: "Change order CO-0041 created",
      message: "CO-0041 for $1,755 is pending client approval.",
      change_order_id: "co-0041-dawn",
      read: false,
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
  ];

  return {
    profile,
    projects: [project1, project2],
    contracts: [contract1],
    scope_checks: [scopeCheck1],
    change_orders: [changeOrder1, changeOrderPaid],
    change_order_events: [
      {
        id: "evt-01",
        change_order_id: "co-0041-dawn",
        type: "created",
        meta: { by: "Apex Studio" },
        created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        id: "evt-02",
        change_order_id: "co-0040-paid",
        type: "created",
        meta: {},
        created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
      },
      {
        id: "evt-03",
        change_order_id: "co-0040-paid",
        type: "approved",
        meta: { name: "Marcus Vance", ip: "192.168.1.45" },
        created_at: new Date(Date.now() - 86400000 * 2 - 3600000).toISOString(),
      },
      {
        id: "evt-04",
        change_order_id: "co-0040-paid",
        type: "paid",
        meta: { stripe_intent: "pi_3N9238TestPaymentIntent", amount: 850 },
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    ],
    notifications,
    next_co_number: 42,
  };
}

class Store {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const content = fs.readFileSync(DATA_FILE, "utf-8");
        return JSON.parse(content);
      }
    } catch (e) {
      console.error("Failed to read database file, initializing defaults", e);
    }
    const initial = getInitialData();
    this.saveData(initial);
    return initial;
  }

  private saveData(data: DatabaseSchema): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to write to database file", e);
    }
  }

  public getProfile(): Profile {
    return this.data.profile;
  }

  public updateProfile(updates: Partial<Profile>): Profile {
    this.data.profile = { ...this.data.profile, ...updates };
    this.saveData(this.data);
    return this.data.profile;
  }

  public getProjects(): Project[] {
    return this.data.projects;
  }

  public getProject(id: string): Project | undefined {
    return this.data.projects.find((p) => p.id === id);
  }

  public createProject(project: Omit<Project, "id" | "created_at" | "revisions_used">): Project {
    const newProject: Project = {
      ...project,
      id: "proj-" + generateSecureToken().slice(0, 8),
      revisions_used: 0,
      created_at: new Date().toISOString(),
    };
    this.data.projects.unshift(newProject);
    this.saveData(this.data);
    return newProject;
  }

  public updateProject(id: string, updates: Partial<Project>): Project | undefined {
    const index = this.data.projects.findIndex((p) => p.id === id);
    if (index === -1) return undefined;
    this.data.projects[index] = { ...this.data.projects[index], ...updates };
    this.saveData(this.data);
    return this.data.projects[index];
  }

  public getContract(projectId: string): Contract | undefined {
    return this.data.contracts.find((c) => c.project_id === projectId && c.is_active);
  }

  public getContractHistory(projectId: string): Contract[] {
    return this.data.contracts
      .filter((c) => c.project_id === projectId)
      .sort((a, b) => b.version - a.version);
  }

  public saveContract(
    projectId: string,
    contractData: Omit<Contract, "id" | "project_id" | "version" | "is_active">
  ): Contract {
    const existing = this.getContractHistory(projectId);
    const nextVersion = existing.length > 0 ? existing[0].version + 1 : 1;

    // deactivate previous
    this.data.contracts.forEach((c) => {
      if (c.project_id === projectId) c.is_active = false;
    });

    const newContract: Contract = {
      ...contractData,
      id: "ctr-" + generateSecureToken().slice(0, 8),
      project_id: projectId,
      version: nextVersion,
      is_active: true,
    };
    this.data.contracts.unshift(newContract);

    // Sync project allowed_revisions if contract has revision limit (Section 3 rule)
    if (newContract.revision_limit !== null && newContract.revision_limit !== undefined) {
      this.updateProject(projectId, {
        allowed_revisions: newContract.revision_limit,
        hourly_rate: newContract.hourly_rate ?? undefined,
        rate_source: "contract",
        revision_scope: newContract.revision_scope || "home and product page mockups",
      });
    }

    this.saveData(this.data);
    return newContract;
  }

  public getScopeChecks(projectId?: string): ScopeCheck[] {
    if (projectId) {
      return this.data.scope_checks
        .filter((sc) => sc.project_id === projectId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return this.data.scope_checks.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public createScopeCheck(
    check: Omit<ScopeCheck, "id" | "created_at">
  ): ScopeCheck {
    const newCheck: ScopeCheck = {
      ...check,
      id: "chk-" + generateSecureToken().slice(0, 8),
      created_at: new Date().toISOString(),
    };
    this.data.scope_checks.unshift(newCheck);
    this.saveData(this.data);
    return newCheck;
  }

  public updateScopeCheckFeedback(
    checkId: string,
    feedback: { type: "correct" | "wrong"; corrected_verdict?: string; note?: string }
  ): ScopeCheck | undefined {
    const check = this.data.scope_checks.find((sc) => sc.id === checkId);
    if (!check) return undefined;
    check.user_feedback = feedback;
    this.saveData(this.data);
    return check;
  }

  public getChangeOrders(projectId?: string): ChangeOrder[] {
    if (projectId) {
      return this.data.change_orders
        .filter((co) => co.project_id === projectId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return this.data.change_orders.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public getChangeOrderByToken(token: string): ChangeOrder | undefined {
    return this.data.change_orders.find((co) => co.token === token);
  }

  public getChangeOrderById(id: string): ChangeOrder | undefined {
    return this.data.change_orders.find((co) => co.id === id);
  }

  public createChangeOrder(data: {
    project_id: string;
    scope_check_id?: string;
    title: string;
    line_items: any[];
    total_hours: number;
    total_fee: number;
    hourly_rate: number;
    timeline_impact: string;
    client_request_quote: string;
    agreement_clause_quote: string;
    agreement_sow_link?: string;
    payment_terms?: "full" | "deposit_50" | "invoice";
    expiry_days?: number;
  }): ChangeOrder {
    const num = `CO-${String(this.data.next_co_number).padStart(4, "0")}`;
    this.data.next_co_number += 1;

    const token = generateSecureToken();
    const expiryDays = data.expiry_days || 14;
    const expiresAt = new Date(Date.now() + expiryDays * 86400000).toISOString();

    const newCO: ChangeOrder = {
      id: "co-" + generateSecureToken().slice(0, 10),
      number: num,
      token: token,
      project_id: data.project_id,
      scope_check_id: data.scope_check_id,
      title: data.title,
      line_items: data.line_items,
      total_hours: data.total_hours,
      total_fee: data.total_fee,
      hourly_rate: data.hourly_rate,
      timeline_impact: data.timeline_impact,
      client_request_quote: data.client_request_quote,
      agreement_clause_quote: data.agreement_clause_quote,
      agreement_sow_link: data.agreement_sow_link,
      payment_terms: data.payment_terms || "full",
      expires_at: expiresAt,
      status: "PENDING",
      created_at: new Date().toISOString(),
    };

    this.data.change_orders.unshift(newCO);

    this.logEvent(newCO.id, "created", {
      title: newCO.title,
      fee: newCO.total_fee,
    });

    this.saveData(this.data);
    return newCO;
  }

  public updateChangeOrder(id: string, updates: Partial<ChangeOrder>): ChangeOrder | undefined {
    const index = this.data.change_orders.findIndex((co) => co.id === id);
    if (index === -1) return undefined;
    this.data.change_orders[index] = { ...this.data.change_orders[index], ...updates };
    this.saveData(this.data);
    return this.data.change_orders[index];
  }

  public logEvent(changeOrderId: string, type: any, meta: Record<string, any> = {}): ChangeOrderEvent {
    const event: ChangeOrderEvent = {
      id: "evt-" + generateSecureToken().slice(0, 8),
      change_order_id: changeOrderId,
      type: type,
      meta: meta,
      created_at: new Date().toISOString(),
    };
    this.data.change_order_events.push(event);
    this.saveData(this.data);
    return event;
  }

  public getEvents(changeOrderId: string): ChangeOrderEvent[] {
    return this.data.change_order_events
      .filter((e) => e.change_order_id === changeOrderId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  public getNotifications(): NotificationItem[] {
    return this.data.notifications.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public addNotification(notification: Omit<NotificationItem, "id" | "read" | "created_at">): NotificationItem {
    const item: NotificationItem = {
      ...notification,
      id: "notif-" + generateSecureToken().slice(0, 8),
      read: false,
      created_at: new Date().toISOString(),
    };
    this.data.notifications.unshift(item);
    this.saveData(this.data);
    return item;
  }

  public markNotificationAsRead(id: string): void {
    const notif = this.data.notifications.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
      this.saveData(this.data);
    }
  }

  public markAllNotificationsRead(): void {
    this.data.notifications.forEach((n) => (n.read = true));
    this.saveData(this.data);
  }
}

// Global singleton for Next.js hot reload safety
const globalForStore = global as unknown as { store?: Store };
export const db = globalForStore.store ?? new Store();
if (process.env.NODE_ENV !== "production") globalForStore.store = db;
