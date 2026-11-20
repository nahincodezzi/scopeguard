"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Plus,
  Sparkles,
  ArrowRight,
  Send,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Check,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { formatMoney, formatRelativeTime } from "@/lib/utils";
import { ChangeOrderModal } from "@/components/ChangeOrderModal";

export default function Dashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [changeOrders, setChangeOrders] = useState<any[]>([]);
  const [scopeChecks, setScopeChecks] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filter tab for scope alerts
  const [alertTab, setAlertTab] = useState<"all" | "action" | "billed">("action");

  // Quick check state
  const [quickProject, setQuickProject] = useState("");
  const [quickMessage, setQuickMessage] = useState("");
  const [quickAnalyzing, setQuickAnalyzing] = useState(false);

  // New Project modal state
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newProjTitle, setNewProjTitle] = useState("");
  const [newProjClient, setNewProjClient] = useState("");
  const [newProjEmail, setNewProjEmail] = useState("");
  const [newProjCompany, setNewProjCompany] = useState("");
  const [newProjRate, setNewProjRate] = useState("65");
  const [newProjRevisions, setNewProjRevisions] = useState("2");

  // Change order modal for review
  const [coModalOpen, setCoModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedCheck, setSelectedCheck] = useState<any>(null);

  const [reminderSent, setReminderSent] = useState(false);

  const loadData = async () => {
    try {
      const [projRes, coRes, profRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/change-orders"),
        fetch("/api/profile"),
      ]);

      const [projData, coData, profData] = await Promise.all([
        projRes.json(),
        coRes.json(),
        profRes.json(),
      ]);

      setProjects(projData.projects || []);
      setChangeOrders(coData.changeOrders || []);
      setProfile(profData.profile || {});

      if (projData.projects?.length > 0) {
        setQuickProject(projData.projects[0].id);
        // fetch checks for primary project
        const primaryRes = await fetch(`/api/projects/${projData.projects[0].id}`);
        const primaryData = await primaryRes.json();
        setScopeChecks(primaryData.scopeChecks || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuickAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickMessage.trim() || !quickProject) return;

    setQuickAnalyzing(true);
    try {
      const res = await fetch(`/api/projects/${quickProject}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: quickMessage.trim(),
          source: "email",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/projects/${quickProject}`);
      } else {
        alert(data.error || "Analysis failed");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setQuickAnalyzing(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newProjTitle,
          client_name: newProjClient,
          client_email: newProjEmail,
          client_company: newProjCompany || newProjClient,
          hourly_rate: Number(newProjRate) || 65,
          allowed_revisions: Number(newProjRevisions) || 2,
        }),
      });
      if (res.ok) {
        setNewProjectOpen(false);
        setNewProjTitle("");
        setNewProjClient("");
        setNewProjEmail("");
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // KPIs calculation
  const paidOrders = changeOrders.filter((co) => co.status === "PAID");
  const pendingOrders = changeOrders.filter((co) => co.status === "PENDING");
  const approvedOrders = changeOrders.filter((co) => co.status === "APPROVED");

  const revenueRecovered = paidOrders.reduce((sum, co) => sum + co.total_fee, 0);
  const pendingTotal = pendingOrders.reduce((sum, co) => sum + co.total_fee, 0);

  const totalDecided = paidOrders.length + approvedOrders.length + changeOrders.filter((co) => co.status === "DECLINED").length;
  const approvalRate = totalDecided > 0
    ? Math.round(((paidOrders.length + approvedOrders.length) / totalDecided) * 100)
    : 100;

  const outOfScopeCount = scopeChecks.filter((sc) => sc.status === "OUT_OF_SCOPE").length;
  const greyAreaCount = scopeChecks.filter((sc) => sc.status === "GREY_AREA").length;
  const inScopeCount = scopeChecks.filter((sc) => sc.status === "IN_SCOPE").length;
  const totalChecks = outOfScopeCount + greyAreaCount + inScopeCount || 1;

  // Filtered scope checks
  const filteredAlerts = scopeChecks.filter((sc) => {
    if (alertTab === "action") return sc.status === "OUT_OF_SCOPE" || sc.status === "GREY_AREA";
    if (alertTab === "billed") return sc.status === "OUT_OF_SCOPE" && changeOrders.some((co) => co.scope_check_id === sc.id);
    return true;
  });

  const currentDateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const sendRemindersAction = () => {
    setReminderSent(true);
    setTimeout(() => setReminderSent(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* 2.1 Greeting Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="text-[12px] font-medium text-muted uppercase tracking-wider mb-1">
            {currentDateStr}
          </div>
          <h1 className="text-[26px] font-semibold tracking-tight text-ink">
            Overview
          </h1>
          <p className="text-[13.5px] text-text-2 mt-0.5">
            {pendingOrders.length > 0 ? (
              <>
                <strong className="font-semibold text-ink">{pendingOrders.length} client requests</strong> are waiting for your review.{" "}
                <strong className="font-semibold text-ink font-mono-nums">{formatMoney(pendingTotal)}</strong> is ready to bill.
              </>
            ) : (
              "All client requests and change orders are up to date."
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setNewProjectOpen(true)}
            className="btn-secondary"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>New project</span>
          </button>
          <button
            onClick={() => {
              if (projects.length > 0) {
                router.push(`/projects/${projects[0].id}`);
              } else {
                setNewProjectOpen(true);
              }
            }}
            className="btn-primary"
          >
            <Sparkles className="w-4 h-4 mr-1.5" />
            <span>Analyze a message</span>
          </button>
        </div>
      </div>

      {/* 2.1 KPI Row (4 Cards, auto-fit, min 220px) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Revenue Recovered (Hero card on ink background) */}
        <div className="rounded-card bg-ink text-white p-5 flex flex-col justify-between border border-ink shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-medium text-slate-400">Revenue recovered</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-mono-nums font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +18.4%
            </span>
          </div>

          <div className="my-2">
            <div className="text-[28px] font-semibold tracking-tight font-mono-nums text-white">
              {formatMoney(revenueRecovered)}
            </div>
            <div className="text-[12px] text-slate-400 mt-1">
              From {paidOrders.length} paid change orders this month
            </div>
          </div>

          {/* Sparkline visualization */}
          <div className="pt-2 flex items-end gap-1.5 h-8">
            <div className="w-1/6 bg-slate-700/60 rounded-t h-[30%]" />
            <div className="w-1/6 bg-slate-700/60 rounded-t h-[45%]" />
            <div className="w-1/6 bg-slate-700/60 rounded-t h-[35%]" />
            <div className="w-1/6 bg-slate-700/60 rounded-t h-[65%]" />
            <div className="w-1/6 bg-slate-600 rounded-t h-[80%]" />
            <div className="w-1/6 bg-emerald-400 rounded-t h-[100%]" />
          </div>
        </div>

        {/* KPI 2: Out-of-scope caught */}
        <div className="ledger-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-medium text-muted">Out-of-scope caught</span>
            <AlertTriangle className="w-4 h-4 text-[#D92D20]" />
          </div>

          <div className="my-1">
            <div className="text-[28px] font-semibold text-ink font-mono-nums">
              {outOfScopeCount}
            </div>
            <div className="text-[12px] text-muted mt-0.5">
              Identified scope additions
            </div>
          </div>

          {/* 3-segment bar (out / grey / in) */}
          <div className="pt-3 space-y-1.5">
            <div className="w-full h-2 rounded-full bg-surface-2 flex overflow-hidden">
              <div
                style={{ width: `${(outOfScopeCount / totalChecks) * 100}%` }}
                className="bg-[#D92D20] h-full"
                title={`${outOfScopeCount} Out of scope`}
              />
              <div
                style={{ width: `${(greyAreaCount / totalChecks) * 100}%` }}
                className="bg-[#F5A524] h-full"
                title={`${greyAreaCount} Grey area`}
              />
              <div
                style={{ width: `${(inScopeCount / totalChecks) * 100}%` }}
                className="bg-[#22A06B] h-full"
                title={`${inScopeCount} In scope`}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted font-mono-nums">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D92D20]" />
                {outOfScopeCount} out
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F5A524]" />
                {greyAreaCount} grey
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22A06B]" />
                {inScopeCount} in
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: Pending change orders */}
        <div className="ledger-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-medium text-muted">Pending change orders</span>
            <Clock className="w-4 h-4 text-[#F5A524]" />
          </div>

          <div className="my-1">
            <div className="text-[28px] font-semibold text-ink font-mono-nums">
              {formatMoney(pendingTotal)}
            </div>
            <div className="text-[12px] text-muted mt-0.5">
              {pendingOrders.length} orders awaiting client
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between text-[12px] border-t border-border-soft">
            <span className="text-muted">Oldest: 2d ago</span>
            <button
              onClick={sendRemindersAction}
              className="text-accent font-medium hover:underline text-[12px]"
            >
              {reminderSent ? "Reminders sent!" : "Send reminders"}
            </button>
          </div>
        </div>

        {/* KPI 4: Approval rate */}
        <div className="ledger-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-medium text-muted">Approval rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="my-1">
            <div className="text-[28px] font-semibold text-ink font-mono-nums">
              {approvalRate}%
            </div>
            <div className="text-[12px] text-muted mt-0.5">
              {paidOrders.length + approvedOrders.length} of {totalDecided || 1} approved
            </div>
          </div>

          <div className="pt-3 space-y-1.5">
            <div className="w-full h-2 rounded-full bg-surface-2 overflow-hidden">
              <div
                style={{ width: `${approvalRate}%` }}
                className="bg-accent h-full rounded-full transition-all duration-500"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted">
              <span>Client acceptance</span>
              <span className="font-mono-nums">High trust</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: 2/3 Scope Alerts & 1/3 Right Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3 width): Scope Alerts */}
        <div className="lg:col-span-2 space-y-4">
          <div className="ledger-card p-0 overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between bg-surface">
              <div className="flex items-center gap-3">
                <h3 className="text-[15px] font-semibold text-ink">Scope Alerts</h3>
                <span className="px-2 py-0.5 rounded-full bg-surface-2 border border-border text-[11.5px] font-mono-nums text-muted">
                  {filteredAlerts.length}
                </span>
              </div>

              {/* Filter tabs */}
              <div className="flex items-center bg-surface-2 p-0.5 rounded-btn border border-border text-[12.5px]">
                <button
                  onClick={() => setAlertTab("all")}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    alertTab === "all" ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setAlertTab("action")}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    alertTab === "action" ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
                  }`}
                >
                  Needs action
                </button>
                <button
                  onClick={() => setAlertTab("billed")}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    alertTab === "billed" ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
                  }`}
                >
                  Billed
                </button>
              </div>
            </div>

            {/* Alerts Table / List */}
            <div className="divide-y divide-border-soft">
              {filteredAlerts.length === 0 ? (
                <div className="p-8 text-center text-muted text-[13px]">
                  No scope alerts match this filter.
                </div>
              ) : (
                filteredAlerts.map((check) => {
                  const project = projects.find((p) => p.id === check.project_id) || projects[0];
                  const linkedCO = changeOrders.find(
                    (co) => co.scope_check_id === check.id || co.project_id === check.project_id
                  );

                  return (
                    <div
                      key={check.id}
                      className="p-4 hover:bg-surface-2/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusBadge status={check.status} />
                          <span className="text-[13px] font-semibold text-ink">
                            {project?.title}
                          </span>
                          <span className="text-[12px] text-muted">·</span>
                          <span className="text-[12px] text-muted">
                            {project?.client_name} ({project?.client_company})
                          </span>
                        </div>

                        <p className="text-[13px] text-text-2 italic line-clamp-1">
                          &ldquo;{check.message}&rdquo;
                        </p>

                        <div className="flex items-center gap-3 text-[11.5px] text-muted">
                          <span>
                            {check.counts_as_revision
                              ? `Revision ${check.revision_number || 1} of ${project?.allowed_revisions || 2}`
                              : check.line_items?.[0]?.clause_id
                              ? `Matched ${check.line_items[0].clause_id}`
                              : "SOW Exclusions"}
                          </span>
                          <span>·</span>
                          {/* Bug B1 Fix: Timezone-correct relative time */}
                          <span>{formatRelativeTime(check.created_at)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 justify-between sm:justify-end flex-shrink-0">
                        <div className="text-right">
                          <span className="font-mono-nums font-semibold text-[14px] text-ink block">
                            {check.suggested_price > 0
                              ? formatMoney(check.suggested_price)
                              : "$0 (Covered)"}
                          </span>
                          <span className="text-[11px] text-muted font-mono-nums">
                            {check.estimated_hours}h estimated
                          </span>
                        </div>

                        {linkedCO ? (
                          <StatusBadge status={linkedCO.status} />
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedProject(project);
                              setSelectedCheck(check);
                              setCoModalOpen(true);
                            }}
                            className="btn-primary h-8 px-3 text-[12.5px]"
                          >
                            Bill this
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1/3 width): Pipeline, Quick Check, Revision Budget */}
        <div className="space-y-5">
          {/* Change Order Pipeline */}
          <div className="ledger-card space-y-3">
            <h3 className="text-[14px] font-semibold text-ink">Change Order Pipeline</h3>
            
            <div className="w-full h-3 rounded-full bg-surface-2 flex overflow-hidden">
              <div
                style={{ width: `${(pendingOrders.length / (changeOrders.length || 1)) * 100}%` }}
                className="bg-[#F5A524] h-full"
                title="Awaiting approval"
              />
              <div
                style={{ width: `${(approvedOrders.length / (changeOrders.length || 1)) * 100}%` }}
                className="bg-[#3B82F6] h-full"
                title="Approved, awaiting payment"
              />
              <div
                style={{ width: `${(paidOrders.length / (changeOrders.length || 1)) * 100}%` }}
                className="bg-[#22A06B] h-full"
                title="Paid via Stripe"
              />
            </div>

            <div className="space-y-2 pt-1 text-[12px]">
              <div className="flex items-center justify-between text-text-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#F5A524]" />
                  Awaiting approval
                </span>
                <span className="font-mono-nums font-medium text-ink">
                  {formatMoney(pendingTotal)} ({pendingOrders.length})
                </span>
              </div>
              <div className="flex items-center justify-between text-text-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                  Approved, awaiting payment
                </span>
                <span className="font-mono-nums font-medium text-ink">
                  $0 ({approvedOrders.length})
                </span>
              </div>
              <div className="flex items-center justify-between text-text-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#22A06B]" />
                  Paid via Stripe
                </span>
                <span className="font-mono-nums font-medium text-ink">
                  {formatMoney(revenueRecovered)} ({paidOrders.length})
                </span>
              </div>
            </div>
          </div>

          {/* Quick Check Card */}
          <div className="ledger-card space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-semibold text-ink">Quick Check</h3>
              <span className="text-[11px] text-muted">Instant Verdict</span>
            </div>

            <form onSubmit={handleQuickAnalyze} className="space-y-3">
              <div>
                <label className="block text-[11.5px] font-medium text-muted mb-1">
                  Project
                </label>
                <select
                  value={quickProject}
                  onChange={(e) => setQuickProject(e.target.value)}
                  className="w-full ledger-input px-3 py-1.5 text-[13px] bg-surface"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.client_company})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11.5px] font-medium text-muted mb-1">
                  Paste Client Message
                </label>
                <textarea
                  rows={3}
                  value={quickMessage}
                  onChange={(e) => setQuickMessage(e.target.value)}
                  placeholder="e.g. Could we also add a wholesale login for cafes with 20% off?"
                  className="w-full ledger-input p-2.5 text-[13px]"
                />
              </div>

              <button
                type="submit"
                disabled={quickAnalyzing || !quickMessage.trim()}
                className="w-full btn-primary h-9 text-[13px] flex items-center justify-center gap-2"
              >
                {quickAnalyzing ? (
                  "Analyzing..."
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Analyze Scope</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Revision Budget Card */}
          <div className="ledger-card space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-semibold text-ink">Revision Budget</h3>
              <span className="text-[11px] text-muted">Per Project</span>
            </div>

            <div className="space-y-3">
              {projects.map((proj) => {
                const used = proj.revisions_used || 0;
                const total = proj.allowed_revisions || 2;
                const ratio = used / total;

                // Color turns amber at 50% and red at 100%
                let barColor = "bg-[#22A06B]";
                let textColor = "text-[#0F7A4A]";
                if (ratio >= 1) {
                  barColor = "bg-[#D92D20]";
                  textColor = "text-[#B42318]";
                } else if (ratio >= 0.5) {
                  barColor = "bg-[#F5A524]";
                  textColor = "text-[#92560A]";
                }

                return (
                  <div key={proj.id} className="space-y-1">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="font-medium text-ink truncate max-w-[170px]">
                        {proj.title}
                      </span>
                      <span className={`font-mono-nums font-semibold ${textColor}`}>
                        {used} / {total}
                      </span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-surface-2 overflow-hidden">
                      <div
                        style={{ width: `${Math.min(ratio * 100, 100)}%` }}
                        className={`h-full rounded-full ${barColor}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* New Project Modal */}
      {newProjectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface border border-border rounded-card p-6 shadow-modal">
            <h3 className="text-[17px] font-semibold text-ink mb-1">Create New Project</h3>
            <p className="text-[12.5px] text-muted mb-4">
              Add client details and contract baseline rates.
            </p>

            <form onSubmit={handleCreateProject} className="space-y-3.5">
              <div>
                <label className="block text-[12px] font-medium text-ink mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={newProjTitle}
                  onChange={(e) => setNewProjTitle(e.target.value)}
                  placeholder="e.g. Shopify Dawn Storefront"
                  className="w-full ledger-input px-3 py-2 text-[13px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-ink mb-1">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProjClient}
                    onChange={(e) => setNewProjClient(e.target.value)}
                    placeholder="Sara Miller"
                    className="w-full ledger-input px-3 py-2 text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-ink mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    value={newProjCompany}
                    onChange={(e) => setNewProjCompany(e.target.value)}
                    placeholder="Bloom Organics"
                    className="w-full ledger-input px-3 py-2 text-[13px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-ink mb-1">
                  Client Email *
                </label>
                <input
                  type="email"
                  required
                  value={newProjEmail}
                  onChange={(e) => setNewProjEmail(e.target.value)}
                  placeholder="sara@bloomorganics.com"
                  className="w-full ledger-input px-3 py-2 text-[13px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-ink mb-1">
                    Hourly Rate ($/hr)
                  </label>
                  <input
                    type="number"
                    value={newProjRate}
                    onChange={(e) => setNewProjRate(e.target.value)}
                    className="w-full ledger-input px-3 py-2 font-mono-nums text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-ink mb-1">
                    Included Revisions
                  </label>
                  <input
                    type="number"
                    value={newProjRevisions}
                    onChange={(e) => setNewProjRevisions(e.target.value)}
                    className="w-full ledger-input px-3 py-2 font-mono-nums text-[13px]"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewProjectOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Order Creation Modal */}
      {selectedProject && (
        <ChangeOrderModal
          isOpen={coModalOpen}
          onClose={() => {
            setCoModalOpen(false);
            setSelectedProject(null);
            setSelectedCheck(null);
            loadData();
          }}
          project={selectedProject}
          scopeCheck={selectedCheck}
          onSuccess={() => loadData()}
        />
      )}
    </div>
  );
}
