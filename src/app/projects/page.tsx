"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FolderKanban, Plus, Search, ChevronRight, Sparkles, FileText } from "lucide-react";
import { formatMoney } from "@/lib/utils";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newProjTitle, setNewProjTitle] = useState("");
  const [newProjClient, setNewProjClient] = useState("");
  const [newProjEmail, setNewProjEmail] = useState("");
  const [newProjCompany, setNewProjCompany] = useState("");
  const [newProjRate, setNewProjRate] = useState("65");
  const [newProjRevisions, setNewProjRevisions] = useState("2");
  const [loading, setLoading] = useState(true);

  const loadProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
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
        setNewProjCompany("");
        loadProjects();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.client_name.toLowerCase().includes(search.toLowerCase()) ||
      p.client_company.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-[26px] font-semibold text-ink tracking-tight">Projects</h1>
          <p className="text-[13.5px] text-muted mt-0.5">
            Active client statements of work and scope tracking.
          </p>
        </div>

        <button onClick={() => setNewProjectOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4 mr-1.5" />
          <span>New project</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-muted absolute left-3.5 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by project or client..."
          className="w-full ledger-input pl-10 pr-4 py-2 text-[13.5px]"
        />
      </div>

      {/* Projects Table */}
      <div className="ledger-card p-0 overflow-hidden">
        <div className="divide-y divide-border-soft">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-muted text-[13px]">
              No projects found.
            </div>
          ) : (
            filtered.map((proj) => {
              const revUsed = proj.revisions_used || 0;
              const revAllowed = proj.allowed_revisions || 2;
              const revRatio = revUsed / revAllowed;

              let revClass = "bg-[#22A06B]";
              if (revRatio >= 1) revClass = "bg-[#D92D20]";
              else if (revRatio >= 0.5) revClass = "bg-[#F5A524]";

              return (
                <Link
                  key={proj.id}
                  href={`/projects/${proj.id}`}
                  className="p-4 hover:bg-surface-2 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 block"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-9 h-9 rounded-btn bg-surface-2 border border-border flex items-center justify-center text-ink flex-shrink-0">
                      <FolderKanban className="w-4 h-4 text-accent" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[14px] font-semibold text-ink truncate">
                          {proj.title}
                        </h3>
                        <span className="text-[12px] text-muted">·</span>
                        <span className="text-[12.5px] text-muted truncate">
                          {proj.client_company}
                        </span>
                      </div>
                      <p className="text-[12px] text-text-2 mt-0.5">
                        Client: {proj.client_name} ({proj.client_email})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 justify-between sm:justify-end flex-shrink-0">
                    <div className="text-right">
                      <span className="text-[11px] uppercase font-semibold text-muted block">
                        Rate
                      </span>
                      <span className="font-mono-nums font-semibold text-[13px] text-ink">
                        ${proj.hourly_rate}/hr
                      </span>
                    </div>

                    <div className="text-right w-24">
                      <div className="flex items-center justify-between text-[11px] font-medium text-muted mb-1">
                        <span>Revisions</span>
                        <span className="font-mono-nums font-semibold text-ink">
                          {revUsed}/{revAllowed}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-surface-2 overflow-hidden">
                        <div
                          style={{ width: `${Math.min(revRatio * 100, 100)}%` }}
                          className={`h-full ${revClass}`}
                        />
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-muted" />
                  </div>
                </Link>
              );
            })
          )}
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

            <form onSubmit={handleCreate} className="space-y-3.5">
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
    </div>
  );
}
