"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Upload,
  CheckCircle2,
  XCircle,
  Sparkles,
  Copy,
  Check,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Clock,
  Layers,
  ChevronRight,
  Eye,
  Send,
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { formatMoney, formatRelativeTime } from "@/lib/utils";
import { ChangeOrderModal } from "@/components/ChangeOrderModal";

export default function ProjectDetail() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<any>(null);
  const [contract, setContract] = useState<any>(null);
  const [contractHistory, setContractHistory] = useState<any[]>([]);
  const [scopeChecks, setScopeChecks] = useState<any[]>([]);
  const [changeOrders, setChangeOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Analyzer input state
  const [source, setSource] = useState<"email" | "slack" | "whatsapp">("email");
  const [clientMessage, setClientMessage] = useState("");
  const [replyTone, setReplyTone] = useState<"friendly" | "firm" | "short">("friendly");
  const [analyzing, setAnalyzing] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [activeAnalysis, setActiveAnalysis] = useState<any>(null);

  // SOW Replace modal state
  const [replaceSowOpen, setReplaceSowOpen] = useState(false);
  const [sowInputText, setSowInputText] = useState("");
  const [sowFileName, setSowFileName] = useState("Contract_SOW_v2.txt");

  // Feedback modal
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackVerdict, setFeedbackVerdict] = useState("IN_SCOPE");
  const [feedbackNote, setFeedbackNote] = useState("");

  // Change Order creation modal
  const [coModalOpen, setCoModalOpen] = useState(false);

  // Copy reply state
  const [copiedReply, setCopiedReply] = useState(false);
  const [undoToast, setUndoToast] = useState<string | null>(null);

  const fetchProjectData = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data.project);
        setContract(data.contract);
        setContractHistory(data.contractHistory || []);
        setScopeChecks(data.scopeChecks || []);
        setChangeOrders(data.changeOrders || []);

        if (data.scopeChecks && data.scopeChecks.length > 0 && !activeAnalysis) {
          setActiveAnalysis(data.scopeChecks[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  // Handle scope check analysis
  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientMessage.trim()) return;

    if (!contract) {
      alert("Parse the SOW first. No active contract found for this project.");
      return;
    }

    setAnalyzing(true);
    setProgressText("Reading SOW…");

    const t1 = setTimeout(() => setProgressText("Comparing deliverables & exclusions…"), 400);
    const t2 = setTimeout(() => setProgressText("Pricing & drafting reply…"), 800);

    try {
      const res = await fetch(`/api/projects/${projectId}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: clientMessage.trim(),
          source,
          replyTone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setActiveAnalysis(data.scopeCheck);
      setScopeChecks((prev) => [data.scopeCheck, ...prev]);

      // If it counted as a revision, trigger revision increment
      if (data.scopeCheck.counts_as_revision) {
        setUndoToast(`Revision round recorded (${data.scopeCheck.revision_number} of ${project.allowed_revisions}).`);
        setTimeout(() => setUndoToast(null), 5000);
        fetchProjectData();
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      setAnalyzing(false);
      setProgressText("");
    }
  };

  const handleToneChange = async (tone: "friendly" | "firm" | "short") => {
    setReplyTone(tone);
    if (activeAnalysis && contract) {
      // Re-run analyze for tone
      try {
        const res = await fetch(`/api/projects/${projectId}/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: activeAnalysis.message,
            source: activeAnalysis.source,
            replyTone: tone,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setActiveAnalysis(data.scopeCheck);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleLineItemHoursChange = (index: number, newHours: number) => {
    if (!activeAnalysis) return;
    const nextLineItems = [...activeAnalysis.line_items];
    nextLineItems[index].estimated_hours = newHours;

    const rate = contract?.hourly_rate || project.hourly_rate || 65;
    const billable = nextLineItems
      .filter((li) => li.status === "OUT_OF_SCOPE")
      .reduce((s, li) => s + li.estimated_hours, 0);

    const newPrice = Math.round(billable * rate * 100) / 100;

    setActiveAnalysis({
      ...activeAnalysis,
      line_items: nextLineItems,
      estimated_hours: billable,
      suggested_price: newPrice,
    });
  };

  const handleReplaceSow = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/projects/${projectId}/sow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw_text: sowInputText,
          file_name: sowFileName,
        }),
      });
      if (res.ok) {
        setReplaceSowOpen(false);
        setSowInputText("");
        fetchProjectData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const submitFeedback = async () => {
    if (!activeAnalysis) return;
    try {
      await fetch(`/api/scope-checks/${activeAnalysis.id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "wrong",
          corrected_verdict: feedbackVerdict,
          note: feedbackNote,
        }),
      });
      setFeedbackOpen(false);
      alert("Feedback saved! Our models will use this correction.");
    } catch (e) {
      console.error(e);
    }
  };

  const undoRevision = async () => {
    if (project && project.revisions_used > 0) {
      await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          revisions_used: project.revisions_used - 1,
        }),
      });
      setUndoToast(null);
      fetchProjectData();
    }
  };

  const copyReplyOnly = () => {
    if (!activeAnalysis) return;
    navigator.clipboard.writeText(activeAnalysis.polite_reply_draft);
    setCopiedReply(true);
    setTimeout(() => setCopiedReply(false), 2000);
  };

  if (loading || !project) {
    return (
      <div className="space-y-4 animate-pulse p-4">
        <div className="h-8 bg-surface-2 rounded-btn w-1/3" />
        <div className="h-64 bg-surface-2 rounded-card" />
      </div>
    );
  }

  // Revision pill colors
  const revLeft = (project.allowed_revisions || 2) - (project.revisions_used || 0);
  let revColorClass = "badge-in-scope";
  if (revLeft <= 0) {
    revColorClass = "badge-out-of-scope";
  } else if (revLeft === 1) {
    revColorClass = "badge-grey-area";
  }

  // Find matched clauses from active analysis to highlight in SOW panel
  const matchedClauseIds = new Set(
    (activeAnalysis?.line_items || []).map((li: any) => li.clause_id)
  );

  return (
    <div className="space-y-6">
      {/* 2.2 Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <Link
            href="/projects"
            className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-[12px] text-muted">
              <span>Projects</span>
              <span>/</span>
              <span className="font-medium text-text-2">{project.client_company}</span>
            </div>
            <h1 className="text-[20px] font-semibold text-ink tracking-tight">
              {project.title}
            </h1>
          </div>
        </div>

        {/* Status Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-2.5 py-1 rounded-full bg-surface border border-border text-[12px] font-medium text-text-2">
            {project.client_name} ({project.client_email})
          </div>
          <div className="px-2.5 py-1 rounded-full bg-surface border border-border text-[12px] font-medium text-text-2 font-mono-nums">
            ${project.hourly_rate}/hr · {project.rate_source === "contract" ? "from contract" : "default"}
          </div>
          <div className={`px-2.5 py-1 rounded-full text-[12px] font-semibold font-mono-nums ${revColorClass}`}>
            Revisions {project.revisions_used || 0} / {project.allowed_revisions || 2}
          </div>
        </div>
      </div>

      {/* Undo Toast */}
      {undoToast && (
        <div className="p-3.5 rounded-btn bg-ink text-white flex items-center justify-between text-[13px] shadow-lg animate-in slide-in-from-top-2">
          <span>{undoToast}</span>
          <button
            onClick={undoRevision}
            className="text-amber-400 font-semibold hover:underline flex items-center gap-1 ml-4"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Undo</span>
          </button>
        </div>
      )}

      {/* Split Screen Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: SOW PANEL (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="ledger-card space-y-4">
            {/* SOW File Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border-soft">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-btn bg-accent-soft text-accent flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[13.5px] font-semibold text-ink truncate">
                    {contract?.file_name || "Statement of Work"}
                  </h4>
                  <p className="text-[11.5px] text-muted">
                    v{contract?.version || 1} · Parsed {formatRelativeTime(contract?.parsed_at)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setReplaceSowOpen(true)}
                className="btn-secondary h-8 px-2.5 text-[12px] flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Replace</span>
              </button>
            </div>

            {/* 3 Mini Stats */}
            <div className="grid grid-cols-3 gap-2 p-2.5 rounded-btn bg-surface-2 border border-border text-center font-mono-nums">
              <div>
                <span className="text-[10.5px] uppercase font-semibold text-muted block">Fixed Fee</span>
                <span className="text-[13.5px] font-semibold text-ink">
                  {contract?.fixed_fee ? formatMoney(contract.fixed_fee) : "—"}
                </span>
              </div>
              <div className="border-x border-border-soft">
                <span className="text-[10.5px] uppercase font-semibold text-muted block">Extra Rate</span>
                <span className="text-[13.5px] font-semibold text-ink">
                  ${contract?.hourly_rate || project.hourly_rate}/hr
                </span>
              </div>
              <div>
                <span className="text-[10.5px] uppercase font-semibold text-muted block">Deliverables</span>
                <span className="text-[13.5px] font-semibold text-ink">
                  {contract?.included_deliverables?.length || 6}
                </span>
              </div>
            </div>

            {/* Revision Tracker Card */}
            <div className="p-3.5 rounded-btn bg-surface-2 border border-border space-y-2">
              <div className="flex items-center justify-between text-[12px]">
                <span className="font-semibold text-ink">Revision Rounds Tracker</span>
                <span className="font-mono-nums font-semibold text-muted">
                  {project.revisions_used || 0} of {project.allowed_revisions || 2} used
                </span>
              </div>

              {/* Visual round segments */}
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: project.allowed_revisions || 2 }).map((_, idx) => {
                  const isUsed = idx < (project.revisions_used || 0);
                  return (
                    <div
                      key={idx}
                      className={`h-2 rounded-full transition-colors ${
                        isUsed ? "bg-[#22A06B]" : "bg-border"
                      }`}
                    />
                  );
                })}
              </div>

              <p className="text-[11.5px] text-muted leading-relaxed">
                {project.revisions_used === 0
                  ? "Both revision rounds are available for homepage and product mockups."
                  : project.revisions_used === 1
                  ? "Round 1 used. The next layout change is round 2; the one after is billable."
                  : "All included revision rounds have been utilized. Any subsequent design edits will be billable at the contract rate."}
              </p>
            </div>

            {/* Summary */}
            {contract?.summary && (
              <div className="text-[12.5px] text-text-2 leading-relaxed bg-surface p-2.5 rounded-btn border border-border-soft">
                <span className="font-semibold text-ink">Summary: </span>
                {contract.summary}
              </div>
            )}

            {/* Included Deliverables */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="text-[12px] font-semibold text-muted uppercase tracking-wider">
                  Included Deliverables (§1)
                </h5>
                <span className="text-[11px] text-emerald-700 font-medium">Covered</span>
              </div>
              <ul className="space-y-1.5 text-[12.5px]">
                {(contract?.included_deliverables || []).map((del: string, i: number) => {
                  const isMatched = matchedClauseIds.has("§1");
                  return (
                    <li
                      key={i}
                      className={`flex items-start gap-2 p-1.5 rounded transition-colors ${
                        isMatched ? "bg-emerald-50 border border-emerald-200" : ""
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="text-text-2 flex-1">{del}</span>
                      {isMatched && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-200 text-emerald-800">
                          Matched
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Excluded Items */}
            <div className="space-y-2 pt-2 border-t border-border-soft">
              <div className="flex items-center justify-between">
                <h5 className="text-[12px] font-semibold text-muted uppercase tracking-wider">
                  Explicit Exclusions (§3)
                </h5>
                <span className="text-[11px] text-rose-700 font-medium">Billable</span>
              </div>
              <ul className="space-y-1.5 text-[12.5px]">
                {(contract?.explicit_exclusions || []).map((exc: string, i: number) => {
                  const isMatched = matchedClauseIds.has("§3");
                  return (
                    <li
                      key={i}
                      className={`flex items-start gap-2 p-1.5 rounded transition-colors ${
                        isMatched ? "bg-rose-50 border border-rose-200" : ""
                      }`}
                    >
                      <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                      <span className="text-text-2 flex-1">{exc}</span>
                      {isMatched && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-rose-200 text-rose-800">
                          Matched
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ANALYZER & VERDICT (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Input Card */}
          <div className="ledger-card space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-ink">Client Request Message</span>

              {/* Source Toggle */}
              <div className="flex items-center bg-surface-2 p-0.5 rounded-btn border border-border text-[11.5px]">
                <button
                  type="button"
                  onClick={() => setSource("email")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    source === "email" ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
                  }`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => setSource("slack")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    source === "slack" ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
                  }`}
                >
                  Slack
                </button>
                <button
                  type="button"
                  onClick={() => setSource("whatsapp")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    source === "whatsapp" ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
                  }`}
                >
                  WhatsApp
                </button>
              </div>
            </div>

            <textarea
              rows={3}
              value={clientMessage}
              onChange={(e) => setClientMessage(e.target.value)}
              placeholder="Paste the client's email, message or revision request..."
              className="w-full ledger-input p-3 text-[13.5px] leading-relaxed"
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <span className="text-[11.5px] text-muted">
                Checked against {contract?.included_deliverables?.length || 6} deliverables,{" "}
                {contract?.explicit_exclusions?.length || 6} exclusions, and revision limits.
              </span>

              <button
                type="button"
                onClick={handleAnalyze}
                disabled={analyzing || !clientMessage.trim()}
                className="btn-primary flex items-center justify-center gap-2 flex-shrink-0"
              >
                <Sparkles className="w-4 h-4 text-accent" />
                <span>{analyzing ? progressText : "Analyze scope"}</span>
              </button>
            </div>
          </div>

          {/* VERDICT CARD */}
          {activeAnalysis && (
            <div className="space-y-4">
              {/* Verdict Header Tinted Card */}
              <div
                className={`p-4 rounded-card border transition-all ${
                  activeAnalysis.status === "OUT_OF_SCOPE"
                    ? "bg-rose-50/40 border-rose-200"
                    : activeAnalysis.status === "GREY_AREA"
                    ? "bg-amber-50/40 border-amber-200"
                    : "bg-emerald-50/40 border-emerald-200"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-btn flex items-center justify-center flex-shrink-0 ${
                        activeAnalysis.status === "OUT_OF_SCOPE"
                          ? "bg-rose-100 text-rose-700"
                          : activeAnalysis.status === "GREY_AREA"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={activeAnalysis.status} />
                        <span className="text-[12px] text-muted">
                          {activeAnalysis.change_order_title}
                        </span>
                      </div>
                      <h3 className="text-[16px] font-semibold text-ink mt-1">
                        {activeAnalysis.status === "OUT_OF_SCOPE"
                          ? "Out of scope — revenue opportunity"
                          : activeAnalysis.status === "GREY_AREA"
                          ? "Grey area / revision round"
                          : "In scope — covered in agreement"}
                      </h3>
                      <p className="text-[12.5px] text-text-2 mt-1 leading-relaxed">
                        {activeAnalysis.reasoning}
                      </p>
                    </div>
                  </div>

                  {/* Confidence Ring */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-11 h-11 rounded-full border-2 border-accent flex items-center justify-center font-mono-nums font-bold text-[12px] text-ink bg-surface shadow-sm">
                      {activeAnalysis.confidence_score}%
                    </div>
                    <span className="text-[10px] text-muted uppercase mt-0.5 font-semibold">
                      Confidence
                    </span>
                  </div>
                </div>
              </div>

              {/* Editable Line Item Table */}
              <div className="ledger-card p-0 overflow-hidden">
                <div className="p-3.5 border-b border-border bg-surface flex items-center justify-between">
                  <h4 className="text-[13px] font-semibold text-ink">Scope Breakdown</h4>
                  <span className="text-[11.5px] text-muted font-mono-nums">
                    Total: ${activeAnalysis.suggested_price?.toLocaleString()}
                  </span>
                </div>

                <table className="w-full text-left text-[13px]">
                  <thead className="bg-surface-2 border-b border-border text-[11px] font-semibold text-muted uppercase">
                    <tr>
                      <th className="py-2.5 px-3.5">Request</th>
                      <th className="py-2.5 px-3">SOW Clause</th>
                      <th className="py-2.5 px-3 text-right w-20">Hours</th>
                      <th className="py-2.5 px-3.5 text-right w-24">Fee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-soft">
                    {activeAnalysis.line_items?.map((li: any, idx: number) => (
                      <tr key={idx} className="hover:bg-surface-2/40">
                        <td className="py-3 px-3.5">
                          <div className="font-medium text-ink">{li.request}</div>
                          <div className="text-[11.5px] text-muted line-clamp-1">
                            {li.work_description}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-1.5 py-0.5 rounded bg-surface-2 border border-border text-[11px] font-mono-nums font-medium text-text-2">
                            {li.clause_id}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {li.status === "OUT_OF_SCOPE" ? (
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={li.estimated_hours}
                              onChange={(e) =>
                                handleLineItemHoursChange(idx, parseFloat(e.target.value) || 0)
                              }
                              className="w-16 ledger-input py-1 px-1.5 text-right font-mono-nums text-[13px]"
                            />
                          ) : (
                            <span className="font-mono-nums text-muted">0h</span>
                          )}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono-nums font-semibold text-ink">
                          ${(li.estimated_hours * (project.hourly_rate || 65)).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-surface-2 border-t border-border font-mono-nums font-semibold text-[13px]">
                    <tr>
                      <td colSpan={2} className="py-2.5 px-3.5 text-text-2">
                        Total Scope Impact ({activeAnalysis.timeline_impact})
                      </td>
                      <td className="py-2.5 px-3 text-right text-text-2">
                        {activeAnalysis.estimated_hours}h
                      </td>
                      <td className="py-2.5 px-3.5 text-right text-ink">
                        ${activeAnalysis.suggested_price?.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                <div className="p-3 bg-surface-2/50 border-t border-border-soft text-[11px] text-muted">
                  Hours are AI estimates at the contract rate. Edit any row before sending.
                </div>
              </div>

              {/* Drafted Reply Box */}
              <div className="ledger-card space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-ink">Drafted Client Reply</span>

                  {/* Tone switch */}
                  <div className="flex items-center bg-surface-2 p-0.5 rounded-btn border border-border text-[11px]">
                    <button
                      type="button"
                      onClick={() => handleToneChange("friendly")}
                      className={`px-2.5 py-0.5 rounded-md font-medium transition-colors ${
                        replyTone === "friendly" ? "bg-surface text-ink shadow-sm" : "text-muted"
                      }`}
                    >
                      Friendly
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToneChange("firm")}
                      className={`px-2.5 py-0.5 rounded-md font-medium transition-colors ${
                        replyTone === "firm" ? "bg-surface text-ink shadow-sm" : "text-muted"
                      }`}
                    >
                      Firm
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToneChange("short")}
                      className={`px-2.5 py-0.5 rounded-md font-medium transition-colors ${
                        replyTone === "short" ? "bg-surface text-ink shadow-sm" : "text-muted"
                      }`}
                    >
                      Short
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-btn bg-surface-2 border border-border text-[13px] text-ink whitespace-pre-wrap leading-relaxed font-sans max-h-48 overflow-y-auto">
                  {activeAnalysis.polite_reply_draft}
                </div>

                {/* Primary Actions */}
                <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setFeedbackOpen(true)}
                    className="text-[12px] text-muted hover:text-ink font-medium flex items-center gap-1.5"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Wrong verdict?</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={copyReplyOnly}
                      className="btn-secondary h-9 px-3 text-[12.5px] flex items-center gap-1.5"
                    >
                      {copiedReply ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedReply ? "Copied" : "Copy reply only"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCoModalOpen(true)}
                      className="btn-primary h-9 px-3.5 text-[12.5px] flex items-center gap-1.5"
                    >
                      <span>Create change order & copy reply</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Scope History */}
          <div className="ledger-card p-0 overflow-hidden">
            <div className="p-3.5 border-b border-border bg-surface flex items-center justify-between">
              <h4 className="text-[13px] font-semibold text-ink">Project Scope History</h4>
              <span className="text-[11.5px] text-muted font-mono-nums">
                {scopeChecks.length} checks
              </span>
            </div>

            <div className="divide-y divide-border-soft">
              {scopeChecks.length === 0 ? (
                <div className="p-6 text-center text-muted text-[13px]">
                  No checks performed yet for this project.
                </div>
              ) : (
                scopeChecks.map((sc) => (
                  <div
                    key={sc.id}
                    onClick={() => setActiveAnalysis(sc)}
                    className={`p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-surface-2 transition-colors ${
                      activeAnalysis?.id === sc.id ? "bg-accent-soft/30" : ""
                    }`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={sc.status} />
                        <span className="text-[11.5px] text-muted">
                          {formatRelativeTime(sc.created_at)}
                        </span>
                      </div>
                      <p className="text-[12.5px] text-text-2 italic truncate">
                        &ldquo;{sc.message}&rdquo;
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0 font-mono-nums">
                      <span className="text-[13px] font-semibold text-ink block">
                        {sc.suggested_price > 0 ? formatMoney(sc.suggested_price) : "$0"}
                      </span>
                      <span className="text-[11px] text-muted">
                        {sc.estimated_hours}h
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SOW Replace Modal */}
      {replaceSowOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-surface border border-border rounded-card p-6 shadow-modal">
            <h3 className="text-[17px] font-semibold text-ink mb-1">Upload or Paste SOW</h3>
            <p className="text-[12.5px] text-muted mb-4">
              Replaces the active statement of work while preserving past versions in history.
            </p>

            <form onSubmit={handleReplaceSow} className="space-y-3.5">
              <div>
                <label className="block text-[12px] font-medium text-ink mb-1">
                  File Reference / Name
                </label>
                <input
                  type="text"
                  value={sowFileName}
                  onChange={(e) => setSowFileName(e.target.value)}
                  className="w-full ledger-input px-3 py-2 text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-ink mb-1">
                  SOW Text (Deliverables, Exclusions, Revision Limit, Rates)
                </label>
                <textarea
                  rows={8}
                  required
                  value={sowInputText}
                  onChange={(e) => setSowInputText(e.target.value)}
                  placeholder="Paste contract text..."
                  className="w-full ledger-input p-3 text-[13px] font-mono leading-relaxed"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReplaceSowOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Parse & Save Version
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Wrong Verdict Feedback Modal */}
      {feedbackOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface border border-border rounded-card p-6 shadow-modal">
            <h3 className="text-[16px] font-semibold text-ink mb-1">Help Tune ScopeGuard AI</h3>
            <p className="text-[12.5px] text-muted mb-4">
              What should this client message have been classified as?
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[12px] font-medium text-ink mb-1">
                  Correct Verdict
                </label>
                <select
                  value={feedbackVerdict}
                  onChange={(e) => setFeedbackVerdict(e.target.value)}
                  className="w-full ledger-input px-3 py-2 text-[13px] bg-surface"
                >
                  <option value="IN_SCOPE">In Scope (Free covered deliverable)</option>
                  <option value="GREY_AREA">Grey Area (Clarification / Included revision)</option>
                  <option value="OUT_OF_SCOPE">Out of Scope (Billable change order)</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-ink mb-1">
                  Optional Note
                </label>
                <textarea
                  rows={3}
                  value={feedbackNote}
                  onChange={(e) => setFeedbackNote(e.target.value)}
                  placeholder="Why is this the correct classification?"
                  className="w-full ledger-input p-2.5 text-[13px]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFeedbackOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button onClick={submitFeedback} className="btn-primary">
                  Save Correction
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Order Creation Modal */}
      <ChangeOrderModal
        isOpen={coModalOpen}
        onClose={() => setCoModalOpen(false)}
        project={project}
        scopeCheck={activeAnalysis}
        onSuccess={() => fetchProjectData()}
      />
    </div>
  );
}
