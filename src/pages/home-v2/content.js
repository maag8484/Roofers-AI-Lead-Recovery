/**
 * All /home-v2 copy, lifted VERBATIM from the live landing page.
 *
 * This route is a UI/UX and motion upgrade — the words, numbers, section order
 * and claims are unchanged from src/pages/LandingPage.jsx. Keeping them in one
 * file makes that parity auditable at a glance.
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
    title: "They call a competitor",
    body: "Within minutes, the next roofer on Google picks up — and wins your job.",
  },
];

export const STEPS = [
  {
    n: 1,
    icon: "Phone",
    title: "Lead calls or submits a form",
    body: "A missed call, web form, or after-hours inquiry triggers Roof AI automatically.",
  },
  {
    n: 2,
    icon: "MessageSquare",
    title: "Roof AI responds instantly",
    body: "A personalized SMS goes out within 30 seconds, qualifies the lead, and answers questions.",
  },
  {
    n: 3,
    icon: "Calendar",
    title: "Inspection gets scheduled",
    body: "The appointment lands directly on your Google Calendar — and you get a notification.",
  },
];

export const OUTCOME_FLOW = [
  { icon: "Phone", label: "Lead", tone: "brand" },
  { icon: "Bot", label: "AI responds", tone: "brand" },
  { icon: "Calendar", label: "Google Calendar", tone: "emerald" },
  { icon: "ClipboardCheck", label: "Roof Inspection", tone: "emerald" },
];

export const DASH_STATS = [
  { icon: "Users", value: 17, suffix: "", label: "Leads Recovered", tone: "brand" },
  { icon: "Phone", value: 23, suffix: "", label: "Missed Calls Responded", tone: "brand" },
  { icon: "Calendar", value: 8, suffix: "", label: "Inspections Booked", tone: "emerald" },
  { icon: "Clock", value: 18, suffix: "s", label: "Avg Response Time", tone: "brand" },
];

export const TRUST_BUILDERS = [
  "Setup in under 15 minutes",
  "No contracts",
  "Cancel anytime",
  "Works with Google Calendar",
  "No sales call required",
];

export const WHO_ITS_FOR = [
  "Run Google Ads",
  "Use Google LSAs",
  "Get website leads",
  "Miss calls after hours",
  "Want more inspections booked",
];

export const PLAN_FEATURES = [
  "AI responds to missed calls in under 30 seconds",
  "Live receptionist backup for unanswered calls",
  "AI qualifies every homeowner",
  "Books inspections directly on your calendar",
  "SMS & Email notifications",
  "Google Calendar integration",
  "Lead tracking dashboard",
  "Unlimited users",
];

export const PLAN_TRUST = [
  "No contracts",
  "7-Day Free Trial",
  "No new phone number required",
  "Keep your current workflow",
  "Setup takes about 10 minutes",
];

export const WHY_ROOFERS_JOIN = [
  {
    emoji: "💰",
    title: "Recover Lost Revenue",
    desc: "Stop losing homeowners to the next roofer who answers first. Every missed call is money already spent on marketing — walking out the door.",
  },
  {
    emoji: "📅",
    title: "Book More Inspections",
    desc: "Turn missed calls into scheduled estimates automatically. No manual follow-up. No leads falling through the cracks.",
  },
  {
    emoji: "⏰",
    title: "Works 24/7",
    desc: "On the roof. Driving. After hours. Every lead gets an immediate response — even when you can't pick up.",
  },
];

export const SMITH_AI_POINTS = [
  { emoji: "🎯", text: "Every call answered by a real person when AI can't" },
  { emoji: "🏆", text: "Smith.ai is trusted by thousands of businesses" },
  { emoji: "📞", text: "No customer ever reaches voicemail" },
];

export const COMPARISON_ROWS = [
  {
    without: "Missed calls go to voicemail",
    with: "Every missed call gets an immediate response",
  },
  {
    without: "Homeowners call another roofer",
    with: "Homeowners stay engaged with your business",
  },
  { without: "Lost inspections", with: "More inspections booked automatically" },
  { without: "Lost revenue", with: "Revenue recovered 24/7" },
  {
    without: "After-hours leads disappear",
    with: "24/7 lead recovery — even while you sleep",
  },
];

export const FAQS = [
  {
    q: "How does Roof AI Lead Recovery work?",
    a: "When a homeowner calls your roofing company and nobody answers, Roof AI instantly sends a personalized text within 30 seconds. It qualifies the lead by asking what kind of roofing work is needed, answers their questions, and books an inspection straight onto your Google Calendar — all automatically.",
  },
  {
    q: "How much does it cost?",
    a: "$299 per month with a 7-day free trial. No long-term contracts, no setup fees, and no sales call required. Cancel anytime from your dashboard.",
  },
  {
    q: "What percentage of missed calls do roofers actually lose?",
    a: "Industry data shows 62% of callers who reach voicemail hang up without leaving a message, and 80% never call back. For roofing companies where an average job is $5,000–$30,000, even 2–3 missed calls per week can mean $50,000 or more in lost annual revenue.",
  },
  {
    q: "How is this different from an answering service?",
    a: "Traditional answering services cost $200–$500/month and take messages — they don't qualify leads or book estimates. Roof AI Lead Recovery qualifies the homeowner, determines urgency, and books the inspection automatically. It's faster, cheaper per recovered lead, and works 24/7 without hold times.",
  },
  {
    q: "Will this replace my receptionist?",
    a: "No — it backs them up. Roof AI catches the calls and leads that slip through when your team is busy, on a roof, or off the clock. It never sleeps and never puts a lead on hold.",
  },
  {
    q: "How long does setup take?",
    a: "About 15 minutes. You sign up, get a business phone number, and connect your Google Calendar in one click. No sales call required.",
  },
  {
    q: "Can I see every conversation?",
    a: "Yes. Your dashboard shows every recovered lead, every response, and every booked estimate in one clean view, updated in real time.",
  },
  {
    q: "Do I need to change my phone number?",
    a: "No. You keep your existing business phone and your current workflow — Roof AI handles only the calls you miss.",
  },
  {
    q: "Does it work after business hours?",
    a: "Yes. Roof AI works 24/7. Most roofing emergencies — storm damage, leaks, blow-offs — happen outside business hours, and those late-night and weekend inquiries get the same instant response and booking experience as calls during the day.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. There are no contracts and no setup fees. Start with a 7-day free trial and cancel anytime from your dashboard.",
  },
];
