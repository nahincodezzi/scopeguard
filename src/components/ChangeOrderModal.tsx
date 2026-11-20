"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Link as LinkIcon,
  Copy,
  Check,
  ExternalLink,
  CreditCard,
  Calendar,
  AlertCircle,
  FileCheck2,
} from "lucide-react";
import { formatMoney } from "@/lib/utils";

interface ChangeOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
  scopeCheck?: any;
  onSuccess?: (co: any) => void;
}

export function ChangeOrderModal({
  isOpen,
  onClose,
  project,
  scopeCheck,
  onSuccess,
}: ChangeOrderModalProps) {
  const [title, setTitle] = useState("");
  const [lineItems, setLineItems] = useState<any[]>([]);
  const [paymentTerms, setPaymentTerms] = useState<"full" | "deposit_50" | "invoice">("full");
  const [expiryDays, setExpiryDays] = useState(14);
  const [emailCopy, setEmailCopy] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [createdResult, setCreatedResult] = useState<{
    changeOrder: any;
    approvalUrl: string;
    finalReply: string;
  } | null>(null);

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedReply, setCopiedReply] = useState(false);
  const [profile, setProfile] = useState<any>({ stripe_connected: true, agency_name: "" });

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) setProfile(d.profile);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (scopeCheck) {
      // Use AI-generated title (B3 Fix)
      setTitle(scopeCheck.change_order_title || "Additional feature set");
      // Use work_description (B2 Fix)
      const items = (scopeCheck.line_items || [])
        .filter((li: any) => li.status === "OUT_OF_SCOPE")
        .map((li: any) => ({
          request: li.request,
          work_description: li.work_description || li.request,
          estimated_hours: li.estimated_hours || 0,
          fee: (li.estimated_hours || 0) * (project.hourly_rate || 65),
          clause_id: li.clause_id || "§3",
        }));

      if (items.length === 0 && scopeCheck.line_items) {
        // Fallback for custom or revision checks
        scopeCheck.line_items.forEach((li: any) => {
          items.push({
            request: li.request,
            work_description: li.work_description || li.request,
            estimated_hours: li.estimated_hours || 2,
            fee: (li.estimated_hours || 2) * (project.hourly_rate || 65),
            clause_id: li.clause_id || "§3",
          });
        });
      }
      setLineItems(items);
    } else {
      setTitle("");
      setLineItems([
        {
          request: "Custom feature development",
          work_description: "Implementation of additional project requirements",
          estimated_hours: 8,
          fee: 8 * (project?.hourly_rate || 65),
          clause_id: "§3",
        },
      ]);
    }
    setCreatedResult(null);
    setError("");
  }, [scopeCheck, project, isOpen]);

  if (!isOpen) return null;

  const totalHours = lineItems.reduce((acc, item) => acc + (Number(item.estimated_hours) || 0), 0);
  const rate = project?.hourly_rate || 65;
  const totalFee = totalHours * rate;

  const handleHourChange = (index: number, newHours: number) => {
    const next = [...lineItems];
    next[index].estimated_hours = newHours;
    next[index].fee = newHours * rate;
    setLineItems(next);
  };

  const handleCreate = async () => {
    if (!profile.agency_name) {
      setError("Please set your agency name in Settings before generating client change orders.");
      return;
    }
    if (!title.trim()) {
      setError("Please provide a title the client will see.");
      return;
    }

    setCreating(true);
    setError("");

    try {
      const res = await fetch("/api/change-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: project.id,
          scope_check_id: scopeCheck?.id,
          title: title.trim(),
          line_items: lineItems,
          total_hours: totalHours,
          total_fee: totalFee,
          hourly_rate: rate,
          timeline_impact: scopeCheck?.timeline_impact || "about 1 week",
          client_request_quote: scopeCheck?.message || title,
          agreement_clause_quote:
            scopeCheck?.line_items?.[0]?.clause_text ||
            "Section 3 explicit exclusions: work outside baseline deliverables.",
          payment_terms: paymentTerms,
          expiry_days: expiryDays,
          email_client_copy: emailCopy,
          apply_revision: scopeCheck?.counts_as_revision || false,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create change order");
      }

      const data = await res.json();

      // B4 Fix: replace {{APPROVAL_LINK}} in reply draft with real link
      let finalReply = scopeCheck?.polite_reply_draft || "";
      if (finalReply.includes("{{APPROVAL_LINK}}")) {
        finalReply = finalReply.replace(/\{\{APPROVAL_LINK\}\}/g, data.approvalUrl);
      } else {
        finalReply = `Hi ${project.client_name.split(" ")[0]},\n\nPlease review and approve the change order for ${title} here: ${data.approvalUrl}\n\nBest,\n${project.title} Team`;
      }

      setCreatedResult({
        changeOrder: data.changeOrder,
        approvalUrl: data.approvalUrl,
        finalReply,
      });

      if (onSuccess) onSuccess(data.changeOrder);
    } catch (err: any) {
      setError(err.message || "Failed to create change order");
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (text: string, type: "link" | "reply") => {
    navigator.clipboard.writeText(text);
    if (type === "link") {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedReply(true);
      setTimeout(() => setCopiedReply(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-[2px]">
      <div className="w-full max-w-2xl bg-surface border border-border rounded-card shadow-modal overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-btn bg-accent-soft flex items-center justify-center text-accent">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono-nums text-[12px] font-semibold text-muted">
                  {createdResult ? createdResult.changeOrder.number : "NEW CHANGE ORDER"}
                </span>
                <span className="text-[12px] text-muted">·</span>
                <span className="text-[12px] font-medium text-text-2 truncate max-w-[200px]">
                  {project?.title}
                </span>
              </div>
              <h3 className="text-[16px] font-semibold text-ink tracking-tight">
                {createdResult ? "Change Order Created" : "Create Paid Change Order"}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface-2 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {error && (
            <div className="p-3 rounded-btn bg-rose-50 border border-rose-200 text-rose-700 text-[13px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {createdResult ? (
            /* SUCCESS STATE */
            <div className="space-y-5">
              <div className="p-4 rounded-card bg-emerald-50/50 border border-emerald-200 flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[14px] font-semibold text-emerald-950">
                    {createdResult.changeOrder.number} is ready for client approval
                  </h4>
                  <p className="text-[12.5px] text-emerald-800 mt-0.5 leading-relaxed">
                    Total: <strong className="font-mono-nums">${createdResult.changeOrder.total_fee.toLocaleString()}</strong>.
                    Send the approval link or copy the drafted client reply below.
                  </p>
                </div>
              </div>

              {/* Public Link Card */}
              <div>
                <label className="block text-[12px] font-semibold text-muted uppercase tracking-wider mb-1.5">
                  Public Client Approval Link
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 ledger-input px-3.5 py-2.5 font-mono text-[13px] text-ink bg-surface-2 truncate select-all">
                    {createdResult.approvalUrl}
                  </div>
                  <button
                    onClick={() => copyToClipboard(createdResult.approvalUrl, "link")}
                    className="btn-secondary h-10 px-3.5 flex items-center gap-2 flex-shrink-0"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? "Copied" : "Copy link"}</span>
                  </button>
                  <a
                    href={createdResult.approvalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary h-10 px-3 flex items-center justify-center flex-shrink-0"
                    title="Preview as client"
                  >
                    <ExternalLink className="w-4 h-4 text-muted" />
                  </a>
                </div>
              </div>

              {/* Reply with Link */}
              <div>
                <label className="block text-[12px] font-semibold text-muted uppercase tracking-wider mb-1.5">
                  Drafted Email Reply (With Live Approval Link)
                </label>
                <div className="p-3.5 rounded-btn bg-surface-2 border border-border text-[13px] text-ink whitespace-pre-wrap leading-relaxed font-sans max-h-48 overflow-y-auto">
                  {createdResult.finalReply}
                </div>
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => copyToClipboard(createdResult.finalReply, "reply")}
                    className="btn-primary h-10 px-4 flex items-center gap-2"
                  >
                    {copiedReply ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedReply ? "Reply Copied!" : "Copy reply (with link)"}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* CREATE FORM STATE */
            <div className="space-y-4">
              {/* Editable Title */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[12.5px] font-semibold text-ink">
                    Title the client will see <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-muted flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-accent" /> AI Suggested
                  </span>
                </div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. French store, CAD pricing & wholesale login"
                  className="w-full ledger-input px-3.5 py-2.5 font-medium text-ink"
                />
              </div>

              {/* Line Items Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[12.5px] font-semibold text-ink">
                    Additional Scope Line Items
                  </label>
                  <span className="text-[11.5px] text-muted font-mono-nums">
                    Rate: ${rate}/hr
                  </span>
                </div>
                <div className="border border-border rounded-btn overflow-hidden bg-surface">
                  <table className="w-full text-left text-[13px]">
                    <thead className="bg-surface-2 border-b border-border text-[11px] font-semibold text-muted uppercase">
                      <tr>
                        <th className="py-2 px-3">Work Description</th>
                        <th className="py-2 px-3 text-right w-20">Hours</th>
                        <th className="py-2 px-3 text-right w-24">Fee</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-soft">
                      {lineItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-surface-2/50 transition-colors">
                          <td className="py-2.5 px-3">
                            <div className="font-medium text-ink">{item.request}</div>
                            <div className="text-[11.5px] text-muted mt-0.5 line-clamp-1">
                              {item.work_description}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={item.estimated_hours}
                              onChange={(e) =>
                                handleHourChange(idx, parseFloat(e.target.value) || 0)
                              }
                              className="w-16 ledger-input py-1 px-1.5 text-right font-mono-nums text-[13px]"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono-nums font-medium text-ink">
                            ${(item.estimated_hours * rate).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[11.5px] text-muted mt-1.5">
                  Hours are AI estimates at the contract rate. Edit any row before sending.
                </p>
              </div>

              {/* Total Summary Footer Bar */}
              <div className="p-3.5 rounded-btn bg-surface-2 border border-border flex items-center justify-between">
                <div>
                  <span className="text-[12px] text-muted block">Estimated Impact</span>
                  <span className="text-[13px] font-medium text-ink font-mono-nums">
                    {totalHours} h × ${rate}/hr · {scopeCheck?.timeline_impact || "adds about 1 week"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] uppercase font-semibold text-muted block tracking-wider">
                    Total Due
                  </span>
                  <span className="text-[20px] font-bold text-ink font-mono-nums">
                    {formatMoney(totalFee)}
                  </span>
                </div>
              </div>

              {/* Payment Terms & Expiry */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[12px] font-medium text-muted mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={paymentTerms}
                    onChange={(e: any) => setPaymentTerms(e.target.value)}
                    className="w-full ledger-input px-3 py-2 bg-surface text-[13px]"
                  >
                    <option value="full">Pay in full on approval</option>
                    <option value="deposit_50">50% deposit, rest on delivery</option>
                    <option value="invoice">Add to next invoice</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-muted mb-1">
                    Link Expiry
                  </label>
                  <select
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(parseInt(e.target.value))}
                    className="w-full ledger-input px-3 py-2 bg-surface text-[13px]"
                  >
                    <option value={14}>14 days</option>
                    <option value={7}>7 days</option>
                    <option value={9999}>Never</option>
                  </select>
                </div>
              </div>

              {/* Stripe Status Indicator */}
              <div className="p-3 rounded-btn border border-border bg-surface flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4 text-accent" />
                  <div>
                    <span className="text-[12.5px] font-medium text-ink block">
                      Stripe Checkout · Connected
                    </span>
                    <span className="text-[11px] text-muted">
                      Funds flow directly to your connected bank account
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium">
                  Active
                </span>
              </div>

              {/* Client Copy & Remind */}
              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="emailCopy"
                  checked={emailCopy}
                  onChange={(e) => setEmailCopy(e.target.checked)}
                  className="rounded text-accent focus:ring-accent"
                />
                <label htmlFor="emailCopy" className="text-[12.5px] text-text-2 cursor-pointer">
                  Email the client a copy and remind them after 3 days if pending
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-3.5 border-t border-border bg-surface-2 flex items-center justify-end gap-2.5">
          {createdResult ? (
            <button onClick={onClose} className="btn-primary">
              Done
            </button>
          ) : (
            <>
              <button onClick={onClose} className="btn-secondary" disabled={creating}>
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || lineItems.length === 0}
                className="btn-primary flex items-center gap-2"
              >
                {creating ? "Creating Link..." : "Create link & copy reply"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
