import React from "react";
import { cn } from "@/lib/utils";
import { VerdictStatus, ChangeOrderStatus, LineItemStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: VerdictStatus | ChangeOrderStatus | LineItemStatus | string;
  label?: string;
  className?: string;
  showDot?: boolean;
}

export function StatusBadge({ status, label, className, showDot = true }: StatusBadgeProps) {
  const norm = status.toUpperCase().replace(/\s+/g, "_");

  let dotColor = "#9AA0AA";
  let badgeStyle = "badge-declined";
  let displayLabel = label || status;

  if (norm === "IN_SCOPE" || norm === "PAID") {
    dotColor = "#22A06B";
    badgeStyle = "badge-in-scope";
    displayLabel = label || (norm === "PAID" ? "Paid" : "In scope");
  } else if (norm === "GREY_AREA" || norm === "REVISION" || norm === "PENDING") {
    dotColor = "#F5A524";
    badgeStyle = "badge-grey-area";
    displayLabel =
      label || (norm === "GREY_AREA" ? "Grey area" : norm === "REVISION" ? "Included revision" : "Pending");
  } else if (norm === "OUT_OF_SCOPE") {
    dotColor = "#D92D20";
    badgeStyle = "badge-out-of-scope";
    displayLabel = label || "Out of scope";
  } else if (norm === "APPROVED") {
    dotColor = "#3B82F6";
    badgeStyle = "badge-approved";
    displayLabel = label || "Approved (unpaid)";
  } else if (norm === "DECLINED") {
    dotColor = "#9AA0AA";
    badgeStyle = "badge-declined";
    displayLabel = label || "Declined";
  } else if (norm === "EXPIRED") {
    dotColor = "#9AA0AA";
    badgeStyle = "badge-expired";
    displayLabel = label || "Expired";
  } else if (norm === "WITHDRAWN") {
    dotColor = "#9AA0AA";
    badgeStyle = "badge-withdrawn";
    displayLabel = label || "Withdrawn";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-medium tracking-tight whitespace-nowrap",
        badgeStyle,
        className
      )}
    >
      {showDot && (
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: dotColor }}
        />
      )}
      <span>{displayLabel}</span>
    </span>
  );
}
