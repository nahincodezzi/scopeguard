"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, FolderKanban, FileCheck2, Settings, Plus, Sparkles, X } from "lucide-react";

export function CommandMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [projects, setProjects] = useState<any[]>([]);
  const [changeOrders, setChangeOrders] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/projects")
        .then((r) => r.json())
        .then((d) => setProjects(d.projects || []))
        .catch(() => {});
      fetch("/api/change-orders")
        .then((r) => r.json())
        .then((d) => setChangeOrders(d.changeOrders || []))
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredProjects = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.client_name.toLowerCase().includes(query.toLowerCase()) ||
      p.client_company.toLowerCase().includes(query.toLowerCase())
  );

  const filteredCOs = changeOrders.filter(
    (co) =>
      co.number.toLowerCase().includes(query.toLowerCase()) ||
      co.title.toLowerCase().includes(query.toLowerCase())
  );

  const navigateTo = (path: string) => {
    setIsOpen(false);
    router.push(path);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-ink/40 backdrop-blur-[2px]">
      <div className="w-full max-w-lg bg-surface border border-border rounded-card shadow-modal overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        <div className="relative border-b border-border flex items-center px-4 py-3">
          <Search className="w-4 h-4 text-muted mr-2 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, change orders, or actions (⌘K)..."
            className="w-full bg-transparent text-[14px] text-ink placeholder:text-muted focus:outline-none"
            autoFocus
          />
          <button
            onClick={() => setIsOpen(false)}
            className="text-muted hover:text-ink p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-2 space-y-3">
          {/* Actions */}
          <div>
            <div className="px-2 py-1 text-[11px] font-semibold text-muted uppercase tracking-wider">
              Actions
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => navigateTo("/projects")}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[13px] text-ink hover:bg-surface-2 transition-colors"
              >
                <Plus className="w-4 h-4 text-accent" />
                <span>Create new project</span>
              </button>
              <button
                onClick={() => navigateTo("/projects/proj-dawn-shopify")}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[13px] text-ink hover:bg-surface-2 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-accent" />
                <span>Open SOW Scope Analyzer</span>
              </button>
              <button
                onClick={() => navigateTo("/settings")}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[13px] text-ink hover:bg-surface-2 transition-colors"
              >
                <Settings className="w-4 h-4 text-muted" />
                <span>Settings & Workspace</span>
              </button>
            </div>
          </div>

          {/* Projects */}
          {filteredProjects.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-semibold text-muted uppercase tracking-wider">
                Projects
              </div>
              <div className="space-y-0.5">
                {filteredProjects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => navigateTo(`/projects/${p.id}`)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-[13px] text-ink hover:bg-surface-2 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FolderKanban className="w-4 h-4 text-muted flex-shrink-0" />
                      <span className="truncate">{p.title}</span>
                    </div>
                    <span className="text-[12px] text-muted flex-shrink-0">{p.client_company}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Change Orders */}
          {filteredCOs.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-semibold text-muted uppercase tracking-wider">
                Change Orders
              </div>
              <div className="space-y-0.5">
                {filteredCOs.map((co) => (
                  <button
                    key={co.id}
                    onClick={() => navigateTo(`/change-orders`)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-[13px] text-ink hover:bg-surface-2 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileCheck2 className="w-4 h-4 text-muted flex-shrink-0" />
                      <span className="font-mono-nums text-[12px] font-medium text-muted">{co.number}</span>
                      <span className="truncate">{co.title}</span>
                    </div>
                    <span className="font-mono-nums text-[12px] font-medium text-ink flex-shrink-0">
                      ${co.total_fee.toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-2 bg-surface-2 border-t border-border-soft flex items-center justify-between text-[11px] text-muted">
          <span>Navigate with ⌘K</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
}
