"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  FileCheck2,
  Settings,
  Shield,
  Search,
  Mail,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "./NotificationBell";

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profile, setProfile] = useState<any>({
    agency_name: "Apex Studio",
    plan: "pro",
    reply_email: "hello@apexstudio.design",
  });

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) setProfile(d.profile);
      })
      .catch(() => {});
  }, []);

  const navItems = [
    { name: "Overview", href: "/", icon: LayoutDashboard },
    { name: "Projects", href: "/projects", icon: FolderKanban },
    { name: "Change Orders", href: "/change-orders", icon: FileCheck2 },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-surface border-r border-border select-none">
      {/* Brand Header */}
      <div className="p-4 flex items-center justify-between border-b border-border-soft">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-btn bg-ink flex items-center justify-center text-white">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-[15px] tracking-tight text-ink">ScopeGuard</span>
              <span className="px-1.5 py-0.2 rounded bg-accent-soft text-accent text-[10px] font-bold tracking-wider uppercase font-mono-nums">
                {profile.plan || "PRO"}
              </span>
            </div>
            <span className="text-[11px] text-muted truncate max-w-[130px]">
              {profile.agency_name || "Micro-SaaS"}
            </span>
          </div>
        </Link>
      </div>

      {/* Quick Search ⌘K trigger */}
      <div className="px-3 pt-3">
        <button
          onClick={() => {
            const event = new KeyboardEvent("keydown", {
              key: "k",
              metaKey: true,
              bubbles: true,
            });
            window.dispatchEvent(event);
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-btn bg-surface-2 border border-border text-[12.5px] text-muted hover:text-ink hover:border-border transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5" />
            <span>Search...</span>
          </div>
          <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border text-[10px] font-mono font-medium text-muted">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-btn text-[13.5px] font-medium transition-colors",
                isActive
                  ? "bg-accent-soft text-accent font-semibold"
                  : "text-text-2 hover:text-ink hover:bg-surface-2"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4",
                  isActive ? "text-accent" : "text-muted"
                )}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Gmail Extension Promo Card */}
      <div className="p-3 mx-3 mb-3 rounded-card bg-surface-2 border border-border flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 flex-shrink-0">
            <Mail className="w-3.5 h-3.5" />
          </div>
          <span className="text-[12px] font-semibold text-ink">Gmail Extension</span>
        </div>
        <p className="text-[11.5px] text-muted leading-tight">
          Analyze scope & insert paid change orders directly inside Gmail.
        </p>
        <Link
          href="/settings#extension"
          onClick={() => setMobileOpen(false)}
          className="inline-flex items-center justify-between text-[11.5px] font-medium text-accent hover:underline pt-0.5"
        >
          <span>Get Extension</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* User / Workspace Block */}
      <div className="p-3 border-t border-border-soft flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-ink text-white font-semibold text-[13px] flex items-center justify-center flex-shrink-0">
            {profile.agency_name ? profile.agency_name.charAt(0).toUpperCase() : "A"}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[13px] font-semibold text-ink truncate">
              {profile.agency_name || "My Agency"}
            </span>
            <span className="text-[11px] text-muted truncate">
              {profile.reply_email || "agency@scopeguard.ai"}
            </span>
          </div>
        </div>
        <NotificationBell />
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (232px fixed) */}
      <aside className="hidden md:flex w-[232px] flex-shrink-0 flex-col h-screen fixed top-0 left-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Topbar */}
      <header className="md:hidden flex items-center justify-between px-4 h-14 bg-surface border-b border-border sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 rounded-lg text-ink hover:bg-surface-2"
            aria-label="Toggle Navigation"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-btn bg-ink flex items-center justify-center text-white">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-[15px] text-ink">ScopeGuard</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-ink/30 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-[260px] max-w-[85%] h-full bg-surface shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
