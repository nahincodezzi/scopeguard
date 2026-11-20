"use client";

import React, { useState, useEffect } from "react";
import { Building2, DollarSign, CreditCard, Check, ArrowRight } from "lucide-react";

export function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [agencyName, setAgencyName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [hourlyRate, setHourlyRate] = useState("65");
  const [currency, setCurrency] = useState("USD");
  const [timezone, setTimezone] = useState(
    typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC"
  );
  const [stripeConnected, setStripeConnected] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) {
          if (!d.profile.onboarding_completed || !d.profile.agency_name) {
            setIsOpen(true);
            if (d.profile.agency_name) setAgencyName(d.profile.agency_name);
            if (d.profile.logo_url) setLogoUrl(d.profile.logo_url);
            if (d.profile.stripe_connected) setStripeConnected(true);
          }
        }
      })
      .catch(() => {});
  }, []);

  if (!isOpen) return null;

  const handleStep1Next = () => {
    if (!agencyName.trim()) {
      setError("Agency name is required so clients see your official brand.");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleStep2Next = () => {
    setStep(3);
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agency_name: agencyName.trim(),
          logo_url: logoUrl.trim(),
          timezone,
          stripe_connected: stripeConnected,
          onboarding_completed: true,
        }),
      });
      setIsOpen(false);
      window.location.reload();
    } catch (e: any) {
      setError(e.message || "Failed to complete setup");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-surface border border-border rounded-card shadow-modal overflow-hidden p-6">
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border-soft">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-semibold font-mono-nums ${
                  step === s
                    ? "bg-ink text-white"
                    : step > s
                    ? "bg-accent-soft text-accent"
                    : "bg-surface-2 text-muted"
                }`}
              >
                {step > s ? <Check className="w-3.5 h-3.5" /> : s}
              </div>
            ))}
          </div>
          <span className="text-[12px] font-medium text-muted">
            Step {step} of 3
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-btn bg-rose-50 border border-rose-200 text-rose-700 text-[13px]">
            {error}
          </div>
        )}

        {/* Step 1: Agency Brand */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-[18px] font-semibold text-ink">Welcome to ScopeGuard AI</h2>
              <p className="text-[13px] text-muted mt-1 leading-relaxed">
                Let&apos;s configure your agency branding. This will appear on all client change order approval links and receipts.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-[12.5px] font-medium text-ink mb-1.5">
                  Agency Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  placeholder="e.g. Apex Digital Studio"
                  className="w-full ledger-input px-3.5 py-2.5"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-medium text-ink mb-1.5">
                  Logo URL (Optional)
                </label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://youragency.com/logo.png"
                  className="w-full ledger-input px-3.5 py-2.5 text-[13px]"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={handleStep1Next}
                className="btn-primary flex items-center gap-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Billing Defaults */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-[18px] font-semibold text-ink">Billing Defaults</h2>
              <p className="text-[13px] text-muted mt-1 leading-relaxed">
                Set your standard hourly rate for scope calculations when not overridden by a contract SOW.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[12.5px] font-medium text-ink mb-1.5">
                  Default Hourly Rate ($/hr)
                </label>
                <input
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className="w-full ledger-input px-3.5 py-2.5 font-mono-nums"
                />
              </div>
              <div>
                <label className="block text-[12.5px] font-medium text-ink mb-1.5">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full ledger-input px-3 py-2.5 bg-surface"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="AUD">AUD ($)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[12.5px] font-medium text-ink mb-1.5">
                Timezone
              </label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full ledger-input px-3.5 py-2 text-[13px]"
              />
            </div>

            <div className="pt-4 flex justify-between">
              <button onClick={() => setStep(1)} className="btn-secondary">
                Back
              </button>
              <button onClick={handleStep2Next} className="btn-primary flex items-center gap-2">
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Payments */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-[18px] font-semibold text-ink">Connect Stripe Payments</h2>
              <p className="text-[13px] text-muted mt-1 leading-relaxed">
                Receive instant client credit card payouts directly to your bank account via Stripe Connect Standard.
              </p>
            </div>

            <div className="p-4 rounded-card border border-border bg-surface-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-btn bg-[#635BFF] flex items-center justify-center text-white">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[13.5px] font-semibold text-ink">Stripe Connect</h4>
                  <p className="text-[12px] text-muted">
                    {stripeConnected ? "Connected and ready for checkout" : "Standard 1-click client payments"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStripeConnected(!stripeConnected)}
                className={stripeConnected ? "btn-secondary text-emerald-700" : "btn-primary"}
              >
                {stripeConnected ? "Connected ✓" : "Connect Stripe"}
              </button>
            </div>

            <p className="text-[12px] text-muted">
              You can always connect or adjust payment settings later in Settings → Payments.
            </p>

            <div className="pt-4 flex justify-between">
              <button onClick={() => setStep(2)} className="btn-secondary">
                Back
              </button>
              <button
                disabled={saving}
                onClick={handleFinish}
                className="btn-primary flex items-center gap-2"
              >
                {saving ? "Saving..." : "Get Started"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
