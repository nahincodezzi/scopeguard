import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { parseISO, formatDistanceToNowStrict, differenceInSeconds } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Bug B1 Fix:
 * Correctly parses ISO timestamps with UTC/Z and formats relative to now in user's timezone.
 * Returns "just now" for actions that occurred within the last 60 seconds.
 */
export function formatRelativeTime(isoDateString?: string | null): string {
  if (!isoDateString) return "just now";
  try {
    const date = parseISO(isoDateString);
    const now = new Date();
    const diffSec = Math.abs(differenceInSeconds(now, date));
    if (diffSec < 60) {
      return "just now";
    }
    return formatDistanceToNowStrict(date, { addSuffix: true });
  } catch (err) {
    return "recently";
  }
}

export function formatDateTime(isoDateString?: string | null): string {
  if (!isoDateString) return "";
  try {
    const date = parseISO(isoDateString);
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return isoDateString;
  }
}

export function formatMoney(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Generate cryptographically secure random token (>= 32 chars)
 */
export function generateSecureToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const values = new Uint8Array(32);
    crypto.getRandomValues(values);
    for (let i = 0; i < values.length; i++) {
      token += chars[values[i] % chars.length];
    }
  } else {
    for (let i = 0; i < 36; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return token;
}
