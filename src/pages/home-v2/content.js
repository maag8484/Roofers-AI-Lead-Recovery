/**
 * Shared /home-v2 marketing copy.
 *
 * Keep operational claims bounded to configured, verified capabilities. Any
 * example numbers shown in the UI must be visibly labeled as illustrative.
 */

export const PROBLEMS = [
  {
    icon: "Phone",
    title: "Homeowner calls",
    body: "A storm just damaged their roof. They're ready to book an inspection — today.",
  },
  {
    icon: "PhoneOff",
    title: "No one answers",
    body: "You're on a roof, driving, or it's after hours. The call goes to voicemail.",
  },
  {
    icon: "Bell",
    title: "The next step is unclear",
    body: "Some callers leave a voicemail or call back. Others keep looking. Without a consistent process, you may not know which opportunities stalled.",
  },
];

export const STEPS = [
  {
    "n": 1,
    "icon": "Phone",
    "title": "Get your free missed-call audit.",
    "body": "We look at one recent period of your call history together — how many calls went unanswered, how many were real new opportunities, what happened next. Your numbers, not a made-up ROI claim. If the audit shows there's no real gap, we'll tell you."
  },
  {
    "n": 2,
    "icon": "MessageSquare",
    "title": "Book your free setup.",
    "body": "First, share your setup details. A specialist helps prepare your roofing workflow during onboarding: your service area, what counts as urgent, what to exclude, and exactly where each qualified caller goes — callback request, booking request, or straight to you. We then arrange a separate launch call to set up forwarding and run a live test together so you hear exactly what your customers will hear. You keep your existing number, and your team still answers first. Your pilot starts only after setup and a successful live test."
  },
  {
    "n": 3,
    "icon": "Calendar",
    "title": "Run the free 30-day pilot.",
    "body": "For 30 days, your missed and after-hours calls get answered, qualified, and sent to you as clear next steps in your dashboard. At the end, you get a report of exactly what it caught. Keep it only if the numbers say so."
  }
];

export const OUTCOME_FLOW = [
  { icon: "Phone", label: "Lead", tone: "brand" },
  { icon: "Bot", label: "AI responds", tone: "brand" },
  { icon: "Calendar", label: "Approved next step", tone: "emerald" },
  { icon: "ClipboardCheck", label: "Owner notification", tone: "emerald" },
];

export const DASH_STATS = [
  { icon: "Users", value: 17, suffix: "", label: "Leads Recovered", tone: "brand" },
  { icon: "Phone", value: 23, suffix: "", label: "Missed Calls Responded", tone: "brand" },
  { icon: "Calendar", value: 8, suffix: "", label: "Inspections Booked", tone: "emerald" },
  { icon: "Clock", value: 18, suffix: "s", label: "Avg Response Time", tone: "brand" },
];

export const TRUST_BUILDERS = [
  "Configured with your team",
  "No contracts",
  "Cancel anytime",
  "Keep your current business number",
  "Authorized overflow coverage",
];

export const WHO_ITS_FOR = [
  "Run Google Ads",
  "Use Google LSAs",
  "Get website leads",
  "Miss calls after hours",
  "Want more inspections booked",
];

export const PLAN_FEATURES = ["Answers missed and after-hours calls (your team answers first)", "Collects roofing need, service area and urgency", "Separates new inquiries from other callers", "Creates a callback or booking request for each qualified caller", "Team notifications for every recovered lead", "Lead tracking dashboard", "Unlimited users", "Keep your current number — no new phone number required"];

export const PLAN_TRUST = [
  "No contracts",
  "Free 30-Day Pilot",
  "No new phone number required",
  "Keep your current workflow",
  "Activation follows an authorized test",
];

export const WHY_ROOFERS_JOIN = [
  {
    emoji: "💰",
    title: "Recover More Opportunities",
    desc: "Give unanswered callers a clear next step and measure what happens instead of assuming every missed call was lost revenue.",
  },
  {
    emoji: "📅",
    title: "Book More Inspections",
    desc: "Collect the details needed for a callback or an approved booking route, then keep a human owner for follow-through.",
  },
  {
    emoji: "⏰",
    title: "Works 24/7",
    desc: "Use approved overflow and after-hours coverage while your team keeps answering first.",
  },
];

export const SMITH_AI_POINTS = [
  { emoji: "🎯", text: "Escalation rules are agreed before activation" },
  { emoji: "🧭", text: "Unsupported requests are routed to a clear next step" },
  { emoji: "📞", text: "Your team remains the primary call owner" },
];

export const COMPARISON_ROWS = [
  {
    without: "Missed calls go to voicemail",
    with: "Approved missed calls follow a defined workflow",
  },
  {
    without: "Caller outcome is unknown",
    with: "Caller receives a clear next step",
  },
  { without: "Unstructured callback notes", with: "Qualified details reach an owner" },
  { without: "Revenue outcome is assumed", with: "Appointments and paid jobs are measured separately" },
  {
    without: "After-hours leads disappear",
    with: "Configured after-hours coverage",
  },
];

export const FAQS = [
{"q": "How does the free pilot work?", "a": "After free onboarding, a separate launch call and a successful live test, your missed and after-hours calls are answered and qualified on your real business line for 30 days, up to 40 recovered calls. You see every recovered lead in your dashboard, and at the end you receive a report of exactly what the pilot caught. If you do nothing, the pilot simply ends — keeping the service is your choice, at the rate quoted before your pilot started."},
  {
    q: "How does Roof AI Lead Recovery work?",
    a: "After your team approves the routing and conversation rules, Roof AI can handle eligible unanswered or after-hours inquiries, collect the roofing details you require and create an approved callback or booking next step. Exact channels and destinations are verified during setup.",
  },
  {
    q: "How much does it cost?",
    a: "The missed-call audit and the 30-day pilot are both free. If you keep the service after the pilot, the founding rate is $149 per month, locked for 12 months, for the first 10 customers; the standard price is $299 per month. There are no setup fees and no long-term contracts, and you can cancel future renewal from your dashboard.",
  },
  {
    q: "Is every missed call a lost roofing job?",
    a: "No. Some callers leave voicemail, call back, are existing customers or do not fit your service area. The useful baseline is the number of unique missed callers that were legitimate new opportunities, then what happened after follow-up.",
  },
  {
    q: "How is this different from an answering service?",
    a: "The important comparison is your actual workflow. Roof AI is designed as an overflow and after-hours recovery layer that can collect roofing-specific details and assign a next step. Existing staff or answering services may already cover that need, so we verify the gap before recommending activation.",
  },
  {
    q: "Will this replace my receptionist?",
    a: "No. Your team keeps answering first. Roof AI is configured only for approved overflow and after-hours situations, with escalation and follow-up rules your team controls.",
  },
  {
    q: "How long does setup take?",
    a: "Setup happens in stages: share your details first, complete onboarding, then arrange a separate launch/forwarding call with a live test. Your pilot starts only once setup and the live test are complete. Timing depends on scheduling and your carrier's forwarding setup; we confirm the full flow works with you before activation.",
  },
  {
    q: "Can I see every conversation?",
    a: "The dashboard is designed to show recovered-lead activity and recorded outcomes. What appears depends on the configured workflow and connected data sources.",
  },
  {
    q: "Do I need to change my phone number?",
    a: "No. You keep your existing business phone and your current workflow — Roof AI handles only the calls you miss.",
  },
  {
    q: "Does it work after business hours?",
    a: "Approved after-hours calls can follow a configured acknowledgment, qualification and callback or booking workflow. Roof AI does not promise emergency dispatch, pricing, insurance outcomes or an appointment your team has not confirmed.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. There are no contracts and no setup fees — start with the free audit and 30-day pilot, and if you continue to a paid plan you can cancel anytime from your dashboard.",
  },
];
