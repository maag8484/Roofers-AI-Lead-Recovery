// US business phone / VoIP providers offered in the onboarding form.
//
// Smith.ai needs to know who carries the customer's business line before they
// can set up call forwarding — the forwarding steps differ per provider (star
// codes on a landline vs. an admin portal setting on a VoIP system).
//
// Grouped so the list stays scannable, with MOBILE CARRIERS FIRST — most
// roofing companies run the business off a cell line, so the common answer
// should be the first thing in the dropdown rather than something they scroll
// past ~29 VoIP/telco entries to reach. VoIP/UCaaS and the cable/telco carriers
// follow. "Other" reveals a free-text input in the form.
//
// Group ORDER here is the render order: both the onboarding form and the
// account page map over PHONE_PROVIDER_GROUPS directly.
export const PHONE_PROVIDER_GROUPS = [
  {
    label: "Mobile carriers",
    options: ["T-Mobile", "Verizon Wireless", "AT&T Wireless", "US Cellular", "Mint Mobile"],
  },
  {
    label: "VoIP / cloud phone systems",
    options: [
      "RingCentral",
      "Nextiva",
      "Zoom Phone",
      "Dialpad",
      "Vonage",
      "Ooma",
      "8x8",
      "GoTo Connect",
      "Grasshopper",
      "OpenPhone",
      "Aircall",
      "Google Voice",
      "Microsoft Teams Phone",
      "CallRail",
      "Phone.com",
      "Talkroute",
      "Line2",
      "MagicJack",
    ],
  },
  {
    label: "Cable & telephone carriers",
    options: [
      "AT&T",
      "Verizon",
      "Spectrum (Charter)",
      "Comcast Business (Xfinity)",
      "Cox Business",
      "CenturyLink / Lumen",
      "Frontier",
      "Windstream",
      "Optimum / Altice",
      "Mediacom",
      "Consolidated Communications",
    ],
  },
];

// Sentinel value for the "not in this list" choice — reveals a free-text field.
export const PHONE_PROVIDER_OTHER = "Other";

// Flat list of every selectable value, including the sentinel.
export const PHONE_PROVIDER_VALUES = [
  ...PHONE_PROVIDER_GROUPS.flatMap((g) => g.options),
  PHONE_PROVIDER_OTHER,
];
