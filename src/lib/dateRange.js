// Shared date-range presets for the Activity / Audit log filters. Returns an
// ISO lower bound (or null for "all"). "custom" is handled by the caller via
// explicit from/to inputs.
export const RANGE_OPTIONS = [
  { key: "24h", label: "Last 24h" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "all", label: "All time" },
];

export function rangeSince(key) {
  const DAY = 86_400_000;
  const now = Date.now();
  switch (key) {
    case "24h":
      return new Date(now - DAY).toISOString();
    case "7d":
      return new Date(now - 7 * DAY).toISOString();
    case "30d":
      return new Date(now - 30 * DAY).toISOString();
    default:
      return null; // all time
  }
}
