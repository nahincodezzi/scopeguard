"use client";

import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useParams, useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  Check,
  Clock,
  AlertTriangle,
  FileText,
  CreditCard,
  DollarSign,
  Download,
  HelpCircle,
  XCircle,
  ExternalLink,
  ChevronRight,
  Shield,
} from "lucide-react";
import { formatMoney, formatDateTime } from "@/lib/utils";

export default function ClientApprovalPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const token = params.token as string;
  const isPaidParam = searchParams.get("paid") === "1";

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [fullName, setFullName] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Modal / Interaction states
  const [stripeModalOpen, setStripeModalOpen] = useState(false);
  const [testCardNumber, setTestCardNumber] = useState("4242 •••• •••• 4242");
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [questionSent, setQuestionSent] = useState(false);

  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  const loadApprovalData = async () => {
    try {
      const res = await fetch(`/api/public/approve/${token}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Invalid or expired link");
      }
      const json = await res.json();
      setData(json);

      if (json.changeOrder?.approved_by_name) {
        setFullName(json.changeOrder.approved_by_name);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadApprovalData();
  }, [token]);

  // Handle Stripe Checkout simulation / approval
  const handleApproveAndPay = async () => {
    if (!fullName.trim() || !consent) return;
    setStripeModalOpen(true);
  };

  const confirmStripePayment = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/public/approve/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve_and_pay",
          approved_by_name: fullName.trim(),
          consent: true,
          test_payment: true,
        }),
      });
      if (res.ok) {
        setStripeModalOpen(false);
        loadApprovalData();
      } else {
        const err = await res.json();
        alert(err.error || "Payment failed");
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveInvoice = async () => {
    if (!fullName.trim() || !consent) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/public/approve/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve_invoice",
          approved_by_name: fullName.trim(),
          consent: true,
        }),
      });
      if (res.ok) {
        loadApprovalData();
      } else {
        const err = await res.json();
        alert(err.error || "Approval failed");
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/public/approve/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "decline",
          decline_reason: declineReason.trim() || "Declined by client",
        }),
      });
      if (res.ok) {
        setDeclineModalOpen(false);
        loadApprovalData();
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/public/approve/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "question",
          question_text: questionText.trim(),
        }),
      });
      if (res.ok) {
        setQuestionSent(true);
        setTimeout(() => {
          setQuestionModalOpen(false);
          setQuestionSent(false);
          setQuestionText("");
        }, 2000);
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const downloadPDFReceipt = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[13px] text-muted">Loading change order...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full ledger-card text-center p-8 space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <XCircle className="w-6 h-6" />
          </div>
          <h2 className="text-[18px] font-semibold text-ink">Change Order Unavailable</h2>
          <p className="text-[13px] text-muted leading-relaxed">
            {error || "This change order link is invalid, withdrawn, or has expired. Please contact the agency for a refreshed link."}
          </p>
        </div>
      </div>
    );
  }

  const { changeOrder: co, project, agency } = data;
  const isAwaiting = co.status === "PENDING";
  const isApproved = co.status === "APPROVED";
  const isPaid = co.status === "PAID";
  const isDeclined = co.status === "DECLINED";
  const isExpired = co.status === "EXPIRED";

  const clientFirstName = project?.client_name ? project.client_name.split(" ")[0] : "there";
  const canSubmitApproval = fullName.trim().length > 1 && consent && !submitting;

  return (
    <>
      {/* Head with noindex and custom branding (Section 7) */}
      <head>
        <title>{`Change order from ${agency.name}`}</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta property="og:title" content={`Change order ${co.number} from ${agency.name}`} />
        <meta property="og:description" content={co.title} />
      </head>

      <div className="min-h-screen bg-bg text-ink py-8 sm:py-14 px-3 sm:px-6">
        {/* Print Stylesheet for PDF generation */}
        <style jsx global>{`
          @media print {
            body { background: white !important; }
            .no-print { display: none !important; }
            .print-only { display: block !important; }
            .ledger-card { border: none !important; box-shadow: none !important; padding: 0 !important; }
          }
        `}</style>

        <div className="max-w-2xl mx-auto space-y-6">
          {/* 2.4 Header (Agency logo, name, email + Status Pill) */}
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              {agency.logo_url ? (
                <img
                  src={agency.logo_url}
                  alt={agency.name}
                  className="w-10 h-10 rounded-btn object-cover border border-border"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-btn flex items-center justify-center font-bold text-[16px] text-white shadow-sm flex-shrink-0"
                  style={{ backgroundColor: agency.brand_color || "#4338CA" }}
                >
                  {agency.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="text-[15px] font-semibold text-ink leading-tight">
                  {agency.name}
                </h2>
                <a
                  href={`mailto:${agency.reply_email}`}
                  className="text-[12px] text-muted hover:text-ink transition-colors"
                >
                  {agency.reply_email}
                </a>
              </div>
            </div>

            {/* Status Pill */}
            <div>
              {isPaid ? (
                <span className="badge-paid px-3 py-1 rounded-full text-[12px] font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#22A06B]" />
                  <span>Paid & Active</span>
                </span>
              ) : isApproved ? (
                <span className="badge-approved px-3 py-1 rounded-full text-[12px] font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                  <span>Approved (Pay on invoice)</span>
                </span>
              ) : isDeclined ? (
                <span className="badge-declined px-3 py-1 rounded-full text-[12px] font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#9AA0AA]" />
                  <span>Declined</span>
                </span>
              ) : isExpired ? (
                <span className="badge-expired px-3 py-1 rounded-full text-[12px] font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#9AA0AA]" />
                  <span>Expired</span>
                </span>
              ) : (
                <span className="badge-pending px-3 py-1 rounded-full text-[12px] font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#F5A524]" />
                  <span>Awaiting you</span>
                </span>
              )}
            </div>
          </div>

          {/* PAID RECEIPT BANNER */}
          {isPaid && (
            <div className="p-4 rounded-card bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[14px] font-semibold text-emerald-950">
                    Payment Settled & Approved
                  </h4>
                  <p className="text-[12px] text-emerald-800 font-mono-nums">
                    Paid on {formatDateTime(co.paid_at)} · Reference: {co.stripe_payment_intent_id || "Stripe Checkout"}
                  </p>
                </div>
              </div>
              <button
                onClick={downloadPDFReceipt}
                className="btn-secondary h-9 px-3.5 text-[12.5px] text-emerald-900 border-emerald-300 flex items-center gap-1.5 flex-shrink-0 no-print"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
            </div>
          )}

          {/* DECLINED BANNER */}
          {isDeclined && (
            <div className="p-4 rounded-card bg-surface-2 border border-border flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0">
                <XCircle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[14px] font-semibold text-ink">Change Order Declined</h4>
                <p className="text-[12.5px] text-muted">
                  Declined on {formatDateTime(co.declined_at)}. Reason: {co.decline_reason || "None specified."}
                </p>
              </div>
            </div>
          )}

          {/* EXPIRED BANNER */}
          {isExpired && (
            <div className="p-4 rounded-card bg-amber-50 border border-amber-200 flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-700 flex-shrink-0" />
              <div>
                <h4 className="text-[14px] font-semibold text-amber-950">Link Expired</h4>
                <p className="text-[12.5px] text-amber-800">
                  This change order expired on {formatDateTime(co.expires_at)}. Please ask {agency.name} for a new link.
                </p>
              </div>
            </div>
          )}

          {/* MAIN DOCUMENT CARD */}
          <div className="ledger-card p-6 sm:p-8 space-y-6 bg-surface">
            {/* Title & Metadata */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[12px] text-muted font-mono-nums">
                <span className="font-semibold text-ink">{co.number}</span>
                <span>·</span>
                <span>{project?.title}</span>
              </div>
              <h1 className="text-[24px] sm:text-[28px] font-bold text-ink tracking-tight leading-snug">
                {co.title}
              </h1>
            </div>

            {/* Greeting */}
            <div className="text-[13.5px] text-text-2 leading-relaxed">
              Hi {clientFirstName}, here is the breakdown of the additional work you requested. To maintain delivery quality and project schedule, please review and approve the scope below.
            </div>

            {/* Quote of Client Request */}
            {co.client_request_quote && (
              <div className="p-4 rounded-btn bg-surface-2 border border-border-soft space-y-1">
                <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block">
                  Your Request
                </span>
                <p className="text-[13px] text-ink italic leading-relaxed">
                  &ldquo;{co.client_request_quote}&rdquo;
                </p>
              </div>
            )}

            {/* What Our Agreement Says */}
            <div className="p-4 rounded-btn bg-surface-2 border border-border-soft space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                  What Our Agreement Says
                </span>
                <span className="text-[11.5px] text-muted">Signed SOW</span>
              </div>
              <p className="text-[12.5px] text-text-2 leading-relaxed">
                {co.agreement_clause_quote}
              </p>
            </div>

            {/* Line Items Table */}
            <div className="space-y-2 pt-2">
              <span className="text-[12px] font-semibold text-muted uppercase tracking-wider block">
                Additional Work Breakdown
              </span>

              <div className="border border-border rounded-btn overflow-hidden">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-surface-2 border-b border-border text-[11px] font-semibold text-muted uppercase">
                    <tr>
                      <th className="py-2.5 px-3.5">Deliverable</th>
                      <th className="py-2.5 px-3 text-right">Hours</th>
                      <th className="py-2.5 px-3.5 text-right">Fee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-soft">
                    {co.line_items.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-surface-2/40">
                        <td className="py-3 px-3.5">
                          <div className="font-semibold text-ink">{item.request}</div>
                          {/* Bug B2 Fix: Uses work_description, not repeating SOW clause */}
                          <div className="text-[12px] text-muted mt-0.5 leading-relaxed">
                            {item.work_description}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono-nums text-text-2">
                          {item.estimated_hours}h
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono-nums font-semibold text-ink">
                          ${item.fee?.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Bar (Ink Background, Mono Total, Hours × Rate, Timeline) */}
            <div className="rounded-btn bg-ink text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] uppercase font-semibold text-slate-400 block tracking-wider">
                  Total Additional Investment
                </span>
                <span className="text-[13px] text-slate-300 font-mono-nums mt-0.5 block">
                  {co.total_hours} hrs × ${co.hourly_rate}/hr · {co.timeline_impact || "schedule impact: about 1 week"}
                </span>
              </div>

              <div className="sm:text-right">
                <span className="text-[26px] sm:text-[30px] font-bold font-mono-nums text-white">
                  {formatMoney(co.total_fee)}
                </span>
              </div>
            </div>

            {/* APPROVE SECTION (Enabled when PENDING) */}
            {isAwaiting && (
              <div className="pt-4 border-t border-border space-y-4 no-print">
                <div className="space-y-3">
                  <div>
                    <label className="block text-[12.5px] font-medium text-ink mb-1">
                      Your Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Sara Miller"
                      className="w-full ledger-input px-3.5 py-3 text-[15px]"
                    />
                  </div>

                  <div className="flex items-start gap-2.5 pt-1">
                    <input
                      type="checkbox"
                      id="consentCheck"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="mt-1 rounded text-accent focus:ring-accent"
                    />
                    <label htmlFor="consentCheck" className="text-[12.5px] text-text-2 leading-relaxed cursor-pointer select-none">
                      I approve this additional work and the fee of{" "}
                      <strong className="text-ink font-mono-nums">{formatMoney(co.total_fee)}</strong> on behalf of{" "}
                      <strong className="text-ink">{project.client_company || project.client_name}</strong>.
                    </label>
                  </div>
                </div>

                {/* Primary & Secondary Action Buttons */}
                <div className="space-y-2.5 pt-2">
                  <button
                    onClick={handleApproveAndPay}
                    disabled={!canSubmitApproval}
                    className="w-full h-[52px] rounded-btn bg-ink text-white font-semibold text-[15px] flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-40 transition-all shadow-sm"
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>Approve & pay {formatMoney(co.total_fee)}</span>
                  </button>

                  {agency.allow_pay_on_invoice && (
                    <button
                      onClick={handleApproveInvoice}
                      disabled={!canSubmitApproval}
                      className="w-full h-[46px] rounded-btn bg-surface border border-border text-ink font-medium text-[14px] flex items-center justify-center gap-2 hover:bg-surface-2 disabled:opacity-40 transition-colors"
                    >
                      <Check className="w-4 h-4 text-blue-600" />
                      <span>Approve now, pay on invoice</span>
                    </button>
                  )}
                </div>

                {/* Under actions: Ask a question & Decline (Fixes B7) */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setQuestionModalOpen(true)}
                    className="text-[12.5px] text-muted hover:text-ink font-medium flex items-center gap-1.5"
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>Ask a question</span>
                  </button>

                  <button
                    onClick={() => setDeclineModalOpen(true)}
                    className="text-[12.5px] text-rose-600 hover:text-rose-700 font-medium"
                  >
                    Decline request
                  </button>
                </div>
              </div>
            )}

            {/* AUDIT EVIDENCE FOOTER */}
            {(isApproved || isPaid) && co.approved_by_name && (
              <div className="p-4 rounded-btn bg-surface-2 border border-border text-[12px] text-muted space-y-1 font-mono-nums">
                <div className="font-semibold text-ink flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Authorized Signature Evidence</span>
                </div>
                <div>Approved by: {co.approved_by_name}</div>
                <div>IP Address: {co.approved_ip || "127.0.0.1"}</div>
                <div>User Agent: {co.approved_user_agent || "Web Browser"}</div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center text-[12px] text-muted space-y-1 pb-8">
            <div>
              {co.number} · Valid until {formatDateTime(co.expires_at)}
            </div>
            <div>Sent securely by {agency.name}</div>
          </div>
        </div>
      </div>

      {/* STRIPE CHECKOUT SIMULATION MODAL (Section 6) */}
      {stripeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-border rounded-card p-6 shadow-modal space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-[#635BFF] flex items-center justify-center text-white">
                  <CreditCard className="w-4 h-4" />
                </div>
                <span className="font-semibold text-[15px] text-ink">Stripe Checkout</span>
              </div>
              <span className="font-mono-nums font-semibold text-[16px] text-ink">
                {formatMoney(co.total_fee)}
              </span>
            </div>

            <div className="space-y-3">
              <p className="text-[12.5px] text-muted leading-relaxed">
                Paying <strong className="text-ink">{agency.name}</strong> for {co.number}: &ldquo;{co.title}&rdquo;.
              </p>

              <div>
                <label className="block text-[11.5px] font-medium text-muted mb-1">
                  Card Number (Test Mode Enabled)
                </label>
                <input
                  type="text"
                  value={testCardNumber}
                  onChange={(e) => setTestCardNumber(e.target.value)}
                  className="w-full ledger-input px-3.5 py-2.5 font-mono text-[14px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-medium text-muted mb-1">Expiry</label>
                  <input
                    type="text"
                    defaultValue="12 / 28"
                    className="w-full ledger-input px-3 py-2 text-center font-mono text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-muted mb-1">CVC</label>
                  <input
                    type="text"
                    defaultValue="342"
                    className="w-full ledger-input px-3 py-2 text-center font-mono text-[13px]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setStripeModalOpen(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmStripePayment}
                disabled={submitting}
                className="flex-1 btn-primary bg-[#635BFF] hover:bg-[#5349e4]"
              >
                {submitting ? "Processing..." : `Pay ${formatMoney(co.total_fee)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASK A QUESTION MODAL (Fixes B7) */}
      {questionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-border rounded-card p-6 shadow-modal space-y-4">
            <h3 className="text-[16px] font-semibold text-ink">Ask a Question</h3>
            <p className="text-[12.5px] text-muted leading-relaxed">
              Have questions regarding {co.number}? Send a message directly to {agency.name}.
            </p>

            {questionSent ? (
              <div className="p-4 rounded-btn bg-emerald-50 text-emerald-800 text-center text-[13px] font-medium">
                Question sent! The agency will contact you shortly.
              </div>
            ) : (
              <form onSubmit={handleSendQuestion} className="space-y-3">
                <textarea
                  rows={4}
                  required
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="e.g. Can we split the Canadian pricing setup into phase 2?"
                  className="w-full ledger-input p-3 text-[13.5px]"
                />

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setQuestionModalOpen(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="btn-primary">
                    {submitting ? "Sending..." : "Send to Agency"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* DECLINE MODAL (Fixes B7) */}
      {declineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-border rounded-card p-6 shadow-modal space-y-4">
            <h3 className="text-[16px] font-semibold text-ink">Decline Change Order</h3>
            <p className="text-[12.5px] text-muted leading-relaxed">
              Declining this scope adjustment will notify {agency.name} that you wish to proceed only with the baseline deliverables.
            </p>

            <form onSubmit={handleDecline} className="space-y-3">
              <div>
                <label className="block text-[12px] font-medium text-ink mb-1">
                  Optional Reason
                </label>
                <textarea
                  rows={3}
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="e.g. Decided to postpone until next quarter."
                  className="w-full ledger-input p-3 text-[13px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDeclineModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary bg-rose-600 hover:bg-rose-700 text-white"
                >
                  {submitting ? "Declining..." : "Confirm Decline"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
