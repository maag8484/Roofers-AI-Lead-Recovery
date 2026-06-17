import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** Format a US phone number string for display. */
export function formatPhone(value) {
  if (!value) return "";
  const digits = value.replace(/\D/g, "").replace(/^1/, "");
  const m = digits.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (!m) return value;
  return `+1 (${m[1]}) ${m[2]}-${m[3]}`;
}

/** Format an ISO date/time into a friendly label. */
export function formatDateTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
