# ScopeGuard AI (v2.0) — Calm Ledger Redesign & Engine

ScopeGuard AI is a modern B2B micro-SaaS for digital agencies and freelancers. It analyzes client messages (Email, Slack, WhatsApp) against the project's Statement of Work (SOW), detects scope creep and revision limits, and generates white-labeled, paid change orders that clients approve and settle with Stripe.

---

## What was built & upgraded (Master Prompt v2)

### 1. Calm Ledger Design System (§1)
- Tokens implemented: `--bg: #F7F7F5`, `--surface: #FFFFFF`, `--surface-2: #FAFAF9`, `--ink: #14161B`, `--text-2: #3D424C`, `--muted: #5F6672`, `--border: #E7E8EB`, `--border-soft: #EFEFED`, `--accent: #4338CA`, `--accent-soft: #EEF0FF`.
- Semantic Status Colors with 3-layer badges (Text, Background, Border) + solid status dot for `IN_SCOPE`, `PAID`, `GREY_AREA`, `REVISION`, `PENDING`, `OUT_OF_SCOPE`, `APPROVED`, `DECLINED`, `EXPIRED`.
- Monospace font (`tabular-nums`) for currency figures, hours, and sequential numbers (`CO-0001`).
- Responsive 232px left sidebar with PRO chip, ⌘K search command palette, Gmail extension promo card, and mobile drawer.

### 2. Complete Bug Fixes (§5)
- **B1**: Parsed timestamps in UTC (`Z`), formatted with `formatRelativeTime` (`parseISO` + `date-fns`). Fresh checks show **"just now"**.
- **B2**: Change order additional scope text uses `line_items[].work_description` instead of repeating the raw SOW clause.
- **B3**: Change order modal headers and titles use the AI-generated descriptive title (e.g. *"French store, CAD pricing & wholesale login"*), fully editable.
- **B4**: Copying reply draft replaces `{{APPROVAL_LINK}}` with the live `/approve/[token]` URL.
- **B5**: Agency name is required during onboarding; sending unbranded change orders is blocked.
- **B6**: Removed platform branding ("Edit with Base44") from the public client approval page.
- **B7**: Added client **Decline** (with optional reason) and **Ask a question** modal on `/approve/[token]`.
- **B8**: Required full name + consent checkbox before approval; recorded approver name, IP, timestamp, and user agent as audit evidence.
- **B9**: Stripe Checkout per change order + webhook handler, with manual mark-paid fallback.
- **B10**: Single source of truth for `allowed_revisions` + `revisions_used` counter and visual revision budget bars.

### 3. Screen Implementations (§2)
- **Dashboard (Overview)**: KPI hero card with sparkline, 3-segment scope bar, pending orders reminder trigger, approval rate gauge, scope alerts table with tab filters, stacked pipeline, quick checker, and revision budget per project.
- **Project Detail (Split Screen)**: SOW panel with active/historic versioning, mini stats, revision round tracker, included/excluded lists with highlighted matched clauses; Analyzer with source switcher, progress animation, confidence ring, editable hours line-item table, tone switcher (Friendly, Firm, Short), and scope history.
- **Change Orders**: Summary KPI cards, full table, and expandable audit timeline drawer (`created` → `sent` → `viewed` → `approved` → `paid`).
- **Client Approval Page (`/approve/[token]`)**: Mobile-first, white-label, noindex, OG metadata, greeting, quote of client request, SOW clause reference, line items, ink total bar, full name + consent verification, Stripe payment modal, and print/PDF download.
- **Settings & Onboarding**: 3-step wizard, Workspace branding, Billing defaults, Stripe Connect, SaaS subscription tiers (Free, Pro $19/mo, Agency $49/mo), and Extension API token.

### 4. Chrome Extension (`/extension`) (§9)
- Manifest V3 extension ready for unpacked loading in Chrome.
- Injects **"Analyze scope"** button into Gmail thread toolbars.
- Extracts opened message text safely and matches project by client email.
- Renders 400px Calm Ledger sidebar with verdict, hours, price, and drafted reply.
- 1-click **"Insert reply + create change order"** pastes the approved draft directly into Gmail's compose box.

---

## Running the Application

### Development Server
```bash
npm run dev
# Starts on http://localhost:3000
```

### Production Build
```bash
npm run build
npm start
```

### Automated Acceptance & E2E Tests
```bash
npm run test:acceptance
npx tsx scripts/test-e2e.mjs
```
