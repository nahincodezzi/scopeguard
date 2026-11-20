"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  DollarSign,
  CreditCard,
  Crown,
  Puzzle,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { formatMoney } from "@/lib/utils";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"workspace" | "billing" | "payments" | "plan" | "extension">("workspace");

  const [profile, setProfile] = useState<any>({
    agency_name: "Apex Studio",
    logo_url: "",
    brand_color: "#4338CA",
    reply_email: "hello@apexstudio.design",
    timezone: "UTC",
    allow_pay_on_invoice: true,
    stripe_account_id: "acct_1N0xTEST98234",
    stripe_connected: true,
    plan: "pro",
    api_token: "sg_live_a89f2b740e69123c4a20b9e847cd9",
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) setProfile(d.profile);
      })
      .catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const copyApiToken = () => {
    navigator.clipboard.writeText(profile.api_token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-[26px] font-semibold text-ink tracking-tight">Settings</h1>
          <p className="text-[13.5px] text-muted mt-0.5">
            Configure your agency workspace, billing rates, Stripe connect, and Chrome extension.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[12.5px] font-medium">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Saved successfully</span>
          </div>
        )}
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto pb-px">
        {[
          { id: "workspace", label: "Workspace", icon: Building2 },
          { id: "billing", label: "Billing Defaults", icon: DollarSign },
          { id: "payments", label: "Payments (Stripe)", icon: CreditCard },
          { id: "plan", label: "Plan & Subscription", icon: Crown },
          { id: "extension", label: "Gmail Extension", icon: Puzzle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                isActive
                  ? "border-accent text-accent font-semibold"
                  : "border-transparent text-muted hover:text-ink hover:border-border"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Workspace */}
      {activeTab === "workspace" && (
        <form onSubmit={handleSave} className="ledger-card space-y-4 max-w-2xl">
          <div className="border-b border-border-soft pb-3">
            <h3 className="text-[15px] font-semibold text-ink">Agency Workspace</h3>
            <p className="text-[12.5px] text-muted mt-0.5">
              These details white-label client change order approval links and receipts.
            </p>
          </div>

          <div>
            <label className="block text-[12.5px] font-medium text-ink mb-1">
              Agency Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={profile.agency_name}
              onChange={(e) => setProfile({ ...profile, agency_name: e.target.value })}
              className="w-full ledger-input px-3.5 py-2 text-[13.5px]"
            />
          </div>

          <div>
            <label className="block text-[12.5px] font-medium text-ink mb-1">
              Logo URL
            </label>
            <input
              type="url"
              value={profile.logo_url}
              onChange={(e) => setProfile({ ...profile, logo_url: e.target.value })}
              placeholder="https://youragency.com/logo.png"
              className="w-full ledger-input px-3.5 py-2 text-[13.5px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12.5px] font-medium text-ink mb-1">
                Brand Accent Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={profile.brand_color || "#4338CA"}
                  onChange={(e) => setProfile({ ...profile, brand_color: e.target.value })}
                  className="w-9 h-9 rounded-btn border border-border p-1 cursor-pointer bg-surface"
                />
                <input
                  type="text"
                  value={profile.brand_color || "#4338CA"}
                  onChange={(e) => setProfile({ ...profile, brand_color: e.target.value })}
                  className="w-full ledger-input px-3 py-2 text-[13px] font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12.5px] font-medium text-ink mb-1">
                Reply-To Email
              </label>
              <input
                type="email"
                required
                value={profile.reply_email}
                onChange={(e) => setProfile({ ...profile, reply_email: e.target.value })}
                className="w-full ledger-input px-3.5 py-2 text-[13.5px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12.5px] font-medium text-ink mb-1">
              Workspace Timezone
            </label>
            <input
              type="text"
              value={profile.timezone}
              onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
              className="w-full ledger-input px-3.5 py-2 text-[13.5px]"
            />
            <p className="text-[11.5px] text-muted mt-1">
              Used to format relative and audit timestamps accurately (e.g. Asia/Dhaka, America/New_York).
            </p>
          </div>

          <div className="pt-3 border-t border-border-soft flex justify-end">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Saving..." : "Save Workspace"}
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Billing Defaults */}
      {activeTab === "billing" && (
        <form onSubmit={handleSave} className="ledger-card space-y-4 max-w-2xl">
          <div className="border-b border-border-soft pb-3">
            <h3 className="text-[15px] font-semibold text-ink">Billing Defaults</h3>
            <p className="text-[12.5px] text-muted mt-0.5">
              Default contract rates applied when SOW does not specify an hourly rate override.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12.5px] font-medium text-ink mb-1">
                Default Rate ($/hr)
              </label>
              <input
                type="number"
                defaultValue="65"
                className="w-full ledger-input px-3.5 py-2 font-mono-nums text-[13.5px]"
              />
            </div>
            <div>
              <label className="block text-[12.5px] font-medium text-ink mb-1">
                Default Currency
              </label>
              <select className="w-full ledger-input px-3 py-2 bg-surface text-[13.5px]">
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-2">
            <input
              type="checkbox"
              id="allowInvoice"
              checked={profile.allow_pay_on_invoice}
              onChange={(e) =>
                setProfile({ ...profile, allow_pay_on_invoice: e.target.checked })
              }
              className="rounded text-accent focus:ring-accent"
            />
            <label htmlFor="allowInvoice" className="text-[13px] text-text-2 cursor-pointer">
              Allow clients to select <strong>&ldquo;Approve now, pay on invoice&rdquo;</strong> as secondary option
            </label>
          </div>

          <div className="pt-3 border-t border-border-soft flex justify-end">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Saving..." : "Save Defaults"}
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Payments */}
      {activeTab === "payments" && (
        <div className="ledger-card space-y-5 max-w-2xl">
          <div className="border-b border-border-soft pb-3">
            <h3 className="text-[15px] font-semibold text-ink">Client Payment Gateway</h3>
            <p className="text-[12.5px] text-muted mt-0.5">
              Collect client card payments via Stripe Connect Standard. Funds deposit directly to your bank account.
            </p>
          </div>

          <div className="p-4 rounded-btn border border-border bg-surface-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-btn bg-[#635BFF] flex items-center justify-center text-white flex-shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-[13.5px] font-semibold text-ink">Stripe Connect Standard</h4>
                <p className="text-[12px] text-muted font-mono-nums">
                  Account: {profile.stripe_account_id || "acct_1N0xTEST98234"}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                const nextStatus = !profile.stripe_connected;
                setProfile({ ...profile, stripe_connected: nextStatus });
                fetch("/api/profile", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ stripe_connected: nextStatus }),
                });
              }}
              className={profile.stripe_connected ? "btn-secondary text-emerald-700" : "btn-primary"}
            >
              {profile.stripe_connected ? "Connected ✓" : "Connect Stripe"}
            </button>
          </div>

          <div className="space-y-2 text-[12.5px] text-text-2">
            <h5 className="font-semibold text-ink text-[13px]">Manual Payment Fallback:</h5>
            <p className="text-muted leading-relaxed">
              If a client wires funds via bank transfer or ACH, you can always mark the change order as paid manually from the Change Orders list timeline drawer.
            </p>
          </div>
        </div>
      )}

      {/* Tab 4: Plan & Subscription */}
      {activeTab === "plan" && (
        <div className="space-y-4 max-w-3xl">
          <div className="border-b border-border-soft pb-3">
            <h3 className="text-[15px] font-semibold text-ink">SaaS Subscription Plans</h3>
            <p className="text-[12.5px] text-muted mt-0.5">
              Choose the tier that fits your agency volume. Upgrade or downgrade anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Free */}
            <div className="ledger-card flex flex-col justify-between">
              <div>
                <span className="text-[12px] font-bold text-muted uppercase">Free</span>
                <div className="text-[24px] font-bold font-mono-nums text-ink mt-1">$0</div>
                <p className="text-[11.5px] text-muted mt-1">For solo starters testing scope.</p>

                <ul className="space-y-2 mt-4 text-[12.5px] text-text-2">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-muted" /> 1 active project
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-muted" /> 10 checks / month
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-muted" /> ScopeGuard badge
                  </li>
                </ul>
              </div>

              <button
                disabled={profile.plan === "free"}
                onClick={() => setProfile({ ...profile, plan: "free" })}
                className="mt-6 btn-secondary w-full text-[12.5px]"
              >
                {profile.plan === "free" ? "Current Plan" : "Downgrade"}
              </button>
            </div>

            {/* Pro */}
            <div className="ledger-card border-accent ring-1 ring-accent flex flex-col justify-between relative bg-accent-soft/10">
              <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-accent text-white text-[10px] font-bold uppercase tracking-wider">
                Popular
              </span>
              <div>
                <span className="text-[12px] font-bold text-accent uppercase">Pro</span>
                <div className="text-[24px] font-bold font-mono-nums text-ink mt-1">
                  $19<span className="text-[13px] text-muted font-normal">/mo</span>
                </div>
                <p className="text-[11.5px] text-muted mt-1">For freelancers & boutique studios.</p>

                <ul className="space-y-2 mt-4 text-[12.5px] text-text-2">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-accent" /> Unlimited projects
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-accent" /> 300 checks / month
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-accent" /> 100% White-label
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-accent" /> Stripe client checkout
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-accent" /> Gmail extension access
                  </li>
                </ul>
              </div>

              <button
                disabled={profile.plan === "pro"}
                onClick={() => setProfile({ ...profile, plan: "pro" })}
                className="mt-6 btn-primary w-full text-[12.5px]"
              >
                {profile.plan === "pro" ? "Current Plan" : "Upgrade to Pro"}
              </button>
            </div>

            {/* Agency */}
            <div className="ledger-card flex flex-col justify-between">
              <div>
                <span className="text-[12px] font-bold text-muted uppercase">Agency</span>
                <div className="text-[24px] font-bold font-mono-nums text-ink mt-1">
                  $49<span className="text-[13px] text-muted font-normal">/mo</span>
                </div>
                <p className="text-[11.5px] text-muted mt-1">For scaling digital agencies.</p>

                <ul className="space-y-2 mt-4 text-[12.5px] text-text-2">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-ink" /> Team seats (seats placeholder)
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-ink" /> 1,000 checks / month
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-ink" /> Custom approval domain
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-ink" /> Priority webhook dispatcher
                  </li>
                </ul>
              </div>

              <button
                disabled={profile.plan === "agency"}
                onClick={() => setProfile({ ...profile, plan: "agency" })}
                className="mt-6 btn-secondary w-full text-[12.5px]"
              >
                {profile.plan === "agency" ? "Current Plan" : "Upgrade to Agency"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Extension */}
      {activeTab === "extension" && (
        <div id="extension" className="ledger-card space-y-5 max-w-2xl">
          <div className="border-b border-border-soft pb-3">
            <h3 className="text-[15px] font-semibold text-ink">Gmail Chrome Extension (Manifest V3)</h3>
            <p className="text-[12.5px] text-muted mt-0.5">
              Analyze scope and insert paid change order links without leaving Gmail.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-[12px] font-semibold text-muted uppercase tracking-wider">
              Your Extension API Token
            </label>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={profile.api_token}
                className="w-full ledger-input px-3.5 py-2 font-mono text-[13px] bg-surface-2 truncate select-all"
              />
              <button
                onClick={copyApiToken}
                className="btn-secondary h-10 px-3.5 flex items-center gap-1.5 flex-shrink-0"
              >
                {copiedToken ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedToken ? "Copied" : "Copy Token"}</span>
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <h4 className="text-[13.5px] font-semibold text-ink">Setup Instructions:</h4>
            <ol className="list-decimal list-inside space-y-2 text-[13px] text-text-2 leading-relaxed">
              <li>
                Open Chrome and go to <code className="bg-surface-2 px-1.5 py-0.5 rounded border border-border">chrome://extensions</code>.
              </li>
              <li>
                Enable <strong>Developer mode</strong> in the top right.
              </li>
              <li>
                Click <strong>Load unpacked</strong> and select the <code className="bg-surface-2 px-1.5 py-0.5 rounded border border-border">extension</code> folder from this project.
              </li>
              <li>
                Click the ScopeGuard extension icon in your toolbar and paste your API token.
              </li>
              <li>
                Open any client email thread in Gmail and click the <strong>&ldquo;Analyze Scope&rdquo;</strong> button in the email action bar!
              </li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
