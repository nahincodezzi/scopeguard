"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileCheck2,
  Copy,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  X,
  Eye,
  CreditCard,
  DollarSign,
  Send,
  ShieldAlert,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { formatMoney, formatDateTime, formatRelativeTime } from "@/lib/utils";

export default function ChangeOrdersPage() {
  const [changeOrders, setChangeOrders] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Timeline drawer state
  const [selectedCO, setSelectedCO] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [coRes, projRes] = await Promise.all([
        fetch("/api/change-orders"),
        fetch("/api/projects"),
      ]);
      const [coData, projData] = await Promise.all([coRes.json(), projRes.json()]);
      setChangeOrders(coData.changeOrders || []);
      setProjects(projData.projects || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openDrawer = async (co: any) => {
    setSelectedCO(co);
    setDrawerOpen(true);
    try {
      const res = await fetch(`/api/change-orders/${co.id}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAction = async (coId: string, action: string) => {
    try {
      const res = await fetch(`/api/change-orders/${coId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        loadData();
        if (selectedCO?.id === coId) {
          const updated = await res.json();
          setSelectedCO(updated.changeOrder);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const copyApprovalLink = (token: string) => {
    const url = `${window.location.origin}/approve/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  // Summary counts
  const pending = changeOrders.filter((c) => c.status === "PENDING");
  const approved = changeOrders.filter((c) => c.status === "APPROVED");
  const paid = changeOrders.filter((c) => c.status === "PAID");
  const declined = changeOrders.filter((c) => c.status === "DECLINED");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-[26px] font-semibold text-ink tracking-tight">Change Orders</h1>
          <p className="text-[13.5px] text-muted mt-0.5">
            Client approvals, legal agreements, and Stripe payment receipts.
          </p>
        </div>
      </div>

      {/* 2.5 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="ledger-card">
          <span className="text-[12px] font-medium text-muted block mb-1">Awaiting approval</span>
          <span className="text-[24px] font-semibold text-ink font-mono-nums block">
            {formatMoney(pending.reduce((s, c) => s + c.total_fee, 0))}
          </span>
          <span className="text-[11.5px] text-[#92560A] font-medium font-mono-nums">
            {pending.length} orders pending
          </span>
        </div>

        <div className="ledger-card">
          <span className="text-[12px] font-medium text-muted block mb-1">Approved, unpaid</span>
          <span className="text-[24px] font-semibold text-ink font-mono-nums block">
            {formatMoney(approved.reduce((s, c) => s + c.total_fee, 0))}
          </span>
          <span className="text-[11.5px] text-[#1D4ED8] font-medium font-mono-nums">
            {approved.length} orders
          </span>
        </div>

        <div className="ledger-card">
          <span className="text-[12px] font-medium text-muted block mb-1">Paid via Stripe</span>
          <span className="text-[24px] font-semibold text-ink font-mono-nums block">
            {formatMoney(paid.reduce((s, c) => s + c.total_fee, 0))}
          </span>
          <span className="text-[11.5px] text-[#0F7A4A] font-medium font-mono-nums">
            {paid.length} orders settled
          </span>
        </div>

        <div className="ledger-card">
          <span className="text-[12px] font-medium text-muted block mb-1">Declined</span>
          <span className="text-[24px] font-semibold text-ink font-mono-nums block">
            {formatMoney(declined.reduce((s, c) => s + c.total_fee, 0))}
          </span>
          <span className="text-[11.5px] text-muted font-medium font-mono-nums">
            {declined.length} declined
          </span>
        </div>
      </div>

      {/* Change Orders Table */}
      <div className="ledger-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-surface-2 border-b border-border text-[11px] font-semibold text-muted uppercase">
              <tr>
                <th className="py-3 px-4">CO Number & Title</th>
                <th className="py-3 px-4">Project & Client</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {changeOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted text-[13px]">
                    No change orders generated yet.
                  </td>
                </tr>
              ) : (
                changeOrders.map((co) => {
                  const proj = projects.find((p) => p.id === co.project_id);
                  return (
                    <tr key={co.id} className="hover:bg-surface-2/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openDrawer(co)}
                            className="font-mono-nums font-semibold text-ink hover:text-accent hover:underline"
                          >
                            {co.number}
                          </button>
                        </div>
                        <div className="text-[12.5px] text-text-2 font-medium truncate max-w-[240px] mt-0.5">
                          {co.title}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-ink">{proj?.title || "Project"}</div>
                        <div className="text-[11.5px] text-muted">
                          {proj?.client_name} ({proj?.client_company})
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono-nums font-semibold text-ink">
                        {formatMoney(co.total_fee)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={co.status} />
                      </td>

                      <td className="py-3.5 px-4 text-[12px] text-muted">
                        {/* Bug B1 Fix */}
                        <div>{formatRelativeTime(co.created_at)}</div>
                        <div className="text-[11px] text-muted/80">{co.payment_terms}</div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => copyApprovalLink(co.token)}
                            className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface-2"
                            title="Copy public approval link"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <a
                            href={`/approve/${co.token}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface-2"
                            title="Open client approval page"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => openDrawer(co)}
                            className="btn-secondary h-8 px-2.5 text-[12px]"
                          >
                            Timeline
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2.5 Timeline Drawer per Change Order */}
      {drawerOpen && selectedCO && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-ink/30 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />

          <div className="relative w-full max-w-md bg-surface h-full shadow-modal border-l border-border z-10 flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-surface-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono-nums font-semibold text-[13px] text-ink">
                    {selectedCO.number}
                  </span>
                  <StatusBadge status={selectedCO.status} />
                </div>
                <h3 className="text-[14px] font-semibold text-ink mt-0.5 truncate max-w-[280px]">
                  {selectedCO.title}
                </h3>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1 rounded-lg text-muted hover:text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-6">
              {/* Overview Details */}
              <div className="space-y-2 pb-4 border-b border-border-soft">
                <div className="flex justify-between text-[13px]">
                  <span className="text-muted">Total Fee:</span>
                  <span className="font-mono-nums font-semibold text-ink">
                    {formatMoney(selectedCO.total_fee)}
                  </span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-muted">Estimated Hours:</span>
                  <span className="font-mono-nums text-text-2">{selectedCO.total_hours} hrs</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-muted">Payment Terms:</span>
                  <span className="text-text-2 capitalize">{selectedCO.payment_terms}</span>
                </div>
                {selectedCO.approved_by_name && (
                  <div className="flex justify-between text-[13px]">
                    <span className="text-muted">Approved By:</span>
                    <span className="font-medium text-ink">{selectedCO.approved_by_name}</span>
                  </div>
                )}
                {selectedCO.approved_ip && (
                  <div className="flex justify-between text-[13px]">
                    <span className="text-muted">Approver IP:</span>
                    <span className="font-mono text-[12px] text-text-2">{selectedCO.approved_ip}</span>
                  </div>
                )}
                {selectedCO.stripe_payment_intent_id && (
                  <div className="flex justify-between text-[13px]">
                    <span className="text-muted">Stripe Reference:</span>
                    <span className="font-mono text-[12px] text-emerald-700">
                      {selectedCO.stripe_payment_intent_id}
                    </span>
                  </div>
                )}
              </div>

              {/* Public Link Copy */}
              <div className="space-y-1.5">
                <label className="text-[11.5px] font-semibold text-muted uppercase">
                  Approval Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}/approve/${selectedCO.token}`}
                    className="w-full ledger-input px-2.5 py-1.5 font-mono text-[12px] bg-surface-2 truncate select-all"
                  />
                  <button
                    onClick={() => copyApprovalLink(selectedCO.token)}
                    className="btn-secondary h-8 px-2.5 text-[12px] flex-shrink-0"
                  >
                    {copiedToken === selectedCO.token ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              {/* Legal & Evidence Audit Trail */}
              <div>
                <h4 className="text-[13px] font-semibold text-ink mb-3">
                  Audit Trail & Timeline
                </h4>

                <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                  {events.length === 0 ? (
                    <div className="text-[12px] text-muted">No events recorded.</div>
                  ) : (
                    events.map((evt) => (
                      <div key={evt.id} className="relative">
                        <div className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-accent ring-4 ring-surface" />
                        <div>
                          <span className="text-[12.5px] font-semibold text-ink capitalize block">
                            {evt.type === "created"
                              ? "Change Order Created"
                              : evt.type === "viewed"
                              ? "Viewed by Client"
                              : evt.type === "approved"
                              ? "Approved by Client"
                              : evt.type === "paid"
                              ? "Payment Settled"
                              : evt.type === "declined"
                              ? "Declined by Client"
                              : evt.type}
                          </span>
                          <span className="text-[11px] text-muted block font-mono-nums">
                            {formatDateTime(evt.created_at)}
                          </span>

                          {evt.meta?.name && (
                            <p className="text-[11.5px] text-text-2 mt-0.5">
                              Approver: <strong>{evt.meta.name}</strong> (IP: {evt.meta.ip})
                            </p>
                          )}
                          {evt.meta?.question && (
                            <p className="text-[11.5px] text-text-2 italic mt-0.5 bg-amber-50 p-2 rounded border border-amber-200">
                              &ldquo;{evt.meta.question}&rdquo;
                            </p>
                          )}
                          {evt.meta?.reason && (
                            <p className="text-[11.5px] text-rose-700 italic mt-0.5 bg-rose-50 p-2 rounded border border-rose-200">
                              Reason: {evt.meta.reason}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Fallback and Row Actions */}
              <div className="space-y-2 pt-4 border-t border-border-soft">
                <h5 className="text-[12px] font-semibold text-muted uppercase">
                  Management Actions
                </h5>

                {selectedCO.status !== "PAID" && (
                  <button
                    onClick={() => handleAction(selectedCO.id, "mark_paid_manual")}
                    className="w-full btn-secondary text-emerald-700 h-9 text-[12.5px] flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark Paid Manually (Fallback)</span>
                  </button>
                )}

                <button
                  onClick={() => handleAction(selectedCO.id, "resend")}
                  className="w-full btn-secondary h-9 text-[12.5px] flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Resend Client Reminder</span>
                </button>

                {selectedCO.status === "PENDING" && (
                  <button
                    onClick={() => handleAction(selectedCO.id, "withdraw")}
                    className="w-full btn-secondary text-rose-700 h-9 text-[12.5px] flex items-center justify-center gap-1.5"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Withdraw Change Order</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
