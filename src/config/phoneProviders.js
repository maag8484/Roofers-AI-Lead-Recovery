// US business phone / VoIP providers offered in the onboarding form.
//
// Smith.ai needs to know who carries the customer's business line before they
// can set up call forwarding — the forwarding steps differ per provider (star
// codes on a landline vs. an admin portal setting on a VoIP system).
//
// Grouped so the list stays scannable: VoIP/UCaaS first (61% of US small
// businesses now run VoIP as their primary system), then the cable/telco
// carriers, then mobile. "Other" reveals a free-text input in the form.
export const PHONE_PROVIDER_GROUPS = [
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
  {
    label: "Mobile carriers",
    options: ["T-Mobile", "Verizon Wireless", "AT&T Wireless", "US Cellular", "Mint Mobile"],
  },
];

// Sentinel value for the "not in this list" choice — reveals a free-text field.
export const PHONE_PROVIDER_OTHER = "Other";

// Flat list of every selectable value, including the sentinel.
export const PHONE_PROVIDER_VALUES = [
  ...PHONE_PROVIDER_GROUPS.flatMap((g) => g.options),
  PHONE_PROVIDER_OTHER,
];
