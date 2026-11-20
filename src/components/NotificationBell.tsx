"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell, Check, Eye, DollarSign, XCircle, HelpCircle, FileText, Clock } from "lucide-react";
import { NotificationItem } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // 10s poll for real-time alerts
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_all_read" }),
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "paid":
        return <DollarSign className="w-3.5 h-3.5 text-emerald-600" />;
      case "approved":
        return <Check className="w-3.5 h-3.5 text-blue-600" />;
      case "viewed":
        return <Eye className="w-3.5 h-3.5 text-indigo-600" />;
      case "declined":
        return <XCircle className="w-3.5 h-3.5 text-rose-600" />;
      case "question":
        return <HelpCircle className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-muted" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-text-2 hover:text-ink hover:bg-surface-2 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent ring-2 ring-surface" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface border border-border rounded-card shadow-modal z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border-soft flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[13.5px] font-semibold text-ink">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-accent-soft text-accent text-[11px] font-medium font-mono-nums">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[12px] text-muted hover:text-ink font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-border-soft">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-muted text-[13px]">
                No notifications yet.
              </div>
            ) : (
              notifications.slice(0, 15).map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 flex items-start gap-3 hover:bg-surface-2 transition-colors ${
                    !n.read ? "bg-accent-soft/30" : ""
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-surface border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="text-[13px] font-medium text-ink truncate">{n.title}</p>
                      <span className="text-[11px] text-muted flex items-center gap-1 flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(n.created_at)}
                      </span>
                    </div>
                    <p className="text-[12px] text-text-2 leading-relaxed line-clamp-2">
                      {n.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
