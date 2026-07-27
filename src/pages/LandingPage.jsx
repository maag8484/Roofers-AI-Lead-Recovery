import { Link } from "react-router-dom";
import {
  ArrowRight,
  Play,
  Check,
  Phone,
  PhoneOff,
  Bell,
  MessageSquare,
  Calendar,
  Users,
  Clock,
  Bot,
  ClipboardCheck,
  ChevronDown,
} from "lucide-react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { PhoneMockup } from "@/components/marketing/PhoneMockup";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const PROBLEMS = [
  {
    icon: Phone,
    tone: "bg-brand-50 text-brand-600",
    title: "Homeowner calls",
    body: "A storm just damaged their roof. They're ready to book an inspection — today.",
  },
  {
    icon: PhoneOff,
    tone: "bg-red-50 text-red-500",
    title: "No one answers",
    body: "You're on a roof, driving, or it's after hours. The call goes to voicemail.",
  },
  {
    icon: Bell,
    tone: "bg-secondary text-slate-500",
    title: "They call a competitor",
    body: "Within minutes, the next roofer on Google picks up — and wins your job.",
  },
];

const STEPS = [
  {
    n: 1,
    icon: Phone,
    tone: "bg-brand-600",
    title: "Lead calls or submits a form",
    body: "A missed call, web form, or after-hours inquiry triggers Roof AI automatically.",
  },
  {
    n: 2,
    icon: MessageSquare,
    tone: "bg-brand-600",
    title: "Roof AI responds instantly",
    body: "A personalized SMS goes out within 30 seconds, qualifies the lead, and answers questions.",
  },
  {
    n: 3,
    icon: Calendar,
    tone: "bg-emerald-500",
    title: "Inspection gets scheduled",
    body: "The appointment lands directly on your Google Calendar — and you get a notification.",
  },
];

const DASH_STATS = [
  { icon: Users, tone: "bg-brand-50 text-brand-600", value: "17", label: "Leads Recovered", color: "text-brand-600" },
  { icon: Phone, tone: "bg-brand-50 text-brand-600", value: "23", label: "Missed Calls Responded", color: "text-brand-600" },
  { icon: Calendar, tone: "bg-emerald-50 text-emerald-600", value: "8", label: "Inspections Booked", color: "text-emerald-600" },
  { icon: Clock, tone: "bg-brand-50 text-brand-600", value: "18s", label: "Avg Response Time", color: "text-brand-600" },
];

const TRUST_BUILDERS = [
  "Setup in under 15 minutes",
  "No contracts",
  "Cancel anytime",
  "Works with Google Calendar",
  "No sales call required",
];

const WHO_ITS_FOR = [
  "Run Google Ads",
  "Use Google LSAs",
  "Get website leads",
  "Miss calls after hours",
  "Want more inspections booked",
];


const PLAN_FEATURES = [
  "AI responds to missed calls in under 30 seconds",
  "Live receptionist backup for unanswered calls",
  "AI qualifies every homeowner",
  "Books inspections directly on your calendar",
  "SMS & Email notifications",
  "Google Calendar integration",
  "Lead tracking dashboard",
  "Unlimited users",
];

const FAQS = [
  {
    q: "How does it work?",
    a: "When you miss a call or get a web lead, Roof AI instantly sends a personalized text, qualifies the homeowner, answers their questions, and books an inspection straight onto your Google Calendar — all automatically, usually within 30 seconds.",
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
    q: "What happens after hours?",
    a: "Roof AI works 24/7. Late-night and weekend inquiries get the same instant response and booking experience as calls during business hours.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. There are no contracts and no setup fees. Start with a 7-day free trial and cancel anytime from your dashboard.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Problem />
        <HowItWorks />
        <CalendarFlow />
        <WhoItsFor />
        <DashboardPreview />
        <Pricing />
        <WhyRoofersJoin />
        <TheMath />
        <SmithAiTrust />
        <ComparisonTable />
        <Faq />
        <BottomCta />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="hero-gradient">
      <div className="container grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <Badge variant="success" className="mb-6 py-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Recovering Roofing Leads 24/7
          </Badge>
          <h1 className="text-4xl font-extrabold leading-[1.08] text-ink sm:text-5xl">
            Stop Losing Roofing Leads to{" "}
            <span className="text-brand-600">Missed Calls</span> &amp; Slow Follow-Up
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Roof AI Lead Recovery instantly responds to missed calls, web leads, and
            after-hours inquiries to help roofing companies book more estimates.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button variant="secondary" size="lg">
              <Play className="fill-brand-600 text-brand-600" /> Watch 90-Second Demo
            </Button>
            <Button size="lg" asChild>
              <Link to="/signup">
                Start Free Trial <ArrowRight />
              </Link>
            </Button>
          </div>
          <ul className="mt-6 grid max-w-md grid-cols-1 gap-2 sm:grid-cols-2">
            {TRUST_BUILDERS.map((t) => (
              <li key={t} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 shrink-0 text-emerald-500" /> {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="py-6">
          <PhoneMockup />
        </div>
      </div>
    </section>
  );
}

function SectionHeading({ eyebrow, title, subtitle, dark }) {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center">
      <p className="mb-3 text-sm font-bold uppercase tracking-widest text-brand-600">
        {eyebrow}
      </p>
      <h2 className={"text-3xl font-extrabold sm:text-4xl " + (dark ? "text-white" : "text-ink")}>
        {title}
      </h2>
      {subtitle && (
        <p className={"mt-4 text-lg " + (dark ? "text-slate-400" : "text-muted-foreground")}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

function Problem() {
  return (
    <section className="py-20">
      <div className="container">
        <SectionHeading
          eyebrow="The Problem"
          title="Every Missed Call Costs Money"
          subtitle="When a homeowner reaches voicemail, they don't wait around. They dial the next roofer on the list."
        />
        <div className="mx-auto grid max-w-3xl gap-5">
          {PROBLEMS.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border border-border bg-white p-7 shadow-sm"
            >
              <span className={"mb-5 flex h-12 w-12 items-center justify-center rounded-xl " + p.tone}>
                <p.icon className="h-6 w-6" />
              </span>
              <h3 className="text-xl font-bold text-ink">{p.title}</h3>
              <p className="mt-2 text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-secondary/40 py-20">
      <div className="container">
        <SectionHeading eyebrow="How It Works" title="Three steps. Zero missed leads." />
        <div className="mx-auto grid max-w-3xl gap-5">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-border bg-white p-7 shadow-sm"
            >
              <div className="mb-4 flex items-center gap-3">
                <span className={"flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white " + s.tone}>
                  {s.n}
                </span>
                <s.icon className="h-5 w-5 text-brand-600" />
              </div>
              <h3 className="text-xl font-bold text-ink">{s.title}</h3>
              <p className="mt-2 text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CalendarFlow() {
  const flow = [
    { icon: Phone, tone: "bg-brand-50 text-brand-600", label: "Lead" },
    { icon: Bot, tone: "bg-brand-50 text-brand-600", label: "AI responds" },
    { icon: Calendar, tone: "bg-emerald-50 text-emerald-600", label: "Google Calendar" },
    { icon: ClipboardCheck, tone: "bg-emerald-50 text-emerald-600", label: "Roof Inspection" },
  ];
  return (
    <section className="py-20">
      <div className="container">
        <SectionHeading
          eyebrow="The Outcome"
          title="From Missed Lead to Booked Inspection"
          subtitle="Roof AI turns a single inquiry into an inspection on your calendar — automatically."
        />
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-4 sm:flex-row">
          {flow.map((f, i) => (
            <div key={f.label} className="flex flex-col items-center gap-4 sm:flex-row">
              <div className="flex w-40 flex-col items-center rounded-2xl border border-border bg-white p-6 text-center shadow-sm">
                <span className={"mb-3 flex h-12 w-12 items-center justify-center rounded-xl " + f.tone}>
                  <f.icon className="h-6 w-6" />
                </span>
                <p className="font-semibold text-ink">{f.label}</p>
              </div>
              {i < flow.length - 1 && (
                <ChevronDown className="h-6 w-6 shrink-0 text-brand-600 sm:-rotate-90" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhoItsFor() {
  return (
    <section className="bg-secondary/40 py-20">
      <div className="container">
        <SectionHeading
          eyebrow="Who It's For"
          title="Perfect For Roofing Companies That:"
          subtitle="If any of these sound like you, Roof AI will pay for itself fast."
        />
        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
          {WHO_ITS_FOR.map((w) => (
            <div
              key={w}
              className="flex items-center gap-3 rounded-2xl border border-border bg-white p-5 shadow-sm"
            >
              <Check className="h-5 w-5 shrink-0 text-emerald-500" />
              <span className="font-medium text-ink">{w}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <section className="py-20">
      <div className="container">
        <SectionHeading
          eyebrow="Your Dashboard"
          title="What You'll See In Your Dashboard"
          subtitle="Every recovered lead, response, and booking — tracked in one clean view."
        />
        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-5 sm:grid-cols-2">
          {DASH_STATS.map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-white p-7 shadow-sm">
              <span className={"mb-5 flex h-12 w-12 items-center justify-center rounded-xl " + s.tone}>
                <s.icon className="h-6 w-6" />
              </span>
              <p className={"text-4xl font-extrabold " + s.color}>{s.value}</p>
              <p className="mt-1 text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link
            to="/signup"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            See the full dashboard <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="bg-secondary/40 py-20">
      <div className="container">
        <SectionHeading
          eyebrow="Pricing"
          title="Recover More Roofing Jobs for Less Than the Profit From One Roof"
          subtitle="One plan. Everything included. No surprises."
        />
        <div className="mx-auto max-w-lg rounded-3xl border-2 border-brand-600 bg-white p-8 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-ink">Roof AI Lead Recovery</h3>
            <Badge variant="success">7-Day Free Trial</Badge>
          </div>
          <div className="mt-4 flex items-end gap-1">
            <span className="text-5xl font-extrabold text-ink">$299</span>
            <span className="mb-1.5 text-muted-foreground">/month</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">No setup fees. Cancel anytime.</p>

          <ul className="mt-6 space-y-3">
            {PLAN_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3 text-ink">
                <Check className="h-5 w-5 shrink-0 text-emerald-500" /> {f}
              </li>
            ))}
          </ul>

          <Button size="lg" className="mt-7 w-full" asChild>
            <Link to="/signup">
              Start Recovering Missed Leads <ArrowRight />
            </Link>
          </Button>
          <ul className="mt-4 space-y-1.5">
            {[
              "No contracts",
              "7-Day Free Trial",
              "No new phone number required",
              "Keep your current workflow",
              "Setup takes about 10 minutes",
            ].map((t) => (
              <li key={t} className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 shrink-0 text-emerald-500" /> {t}
              </li>
            ))}</ul>
        </div>
      </div>
    </section>
  );
}

function WhyRoofersJoin() {
  const boxes = [
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
  return (
    <section className="py-20">
      <div className="container">
        <SectionHeading
          eyebrow="Why Roofers Join"
          title="Not Just a Feature. A Revenue Safety Net."
          subtitle="Roof AI doesn't add work to your plate — it recovers the revenue you were already losing."
        />
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-3">
          {boxes.map((b) => (
            <div key={b.title} className="rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
              <div className="mb-4 text-4xl">{b.emoji}</div>
              <h3 className="mb-2 text-lg font-bold text-ink">{b.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TheMath() {
  return (
    <section className="bg-ink-900 py-20 text-white">
      <div className="container">
        <SectionHeading
          dark
          eyebrow="Simple ROI Calculator"
          title="Recover Just One Roofing Job…"
          subtitle="That's all it takes."
        />
        <div className="mx-auto grid max-w-3xl gap-5 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] py-10 text-center">
            <p className="text-5xl font-extrabold text-white">$12,000<span className="text-2xl">+</span></p>
            <p className="mt-2 text-slate-400">Average roof replacement value</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] py-10 text-center">
            <p className="text-5xl font-extrabold text-emerald-400">$299</p>
            <p className="mt-2 text-slate-400">Monthly investment</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 py-10 text-center">
            <p className="text-5xl font-extrabold text-emerald-400">40x</p>
            <p className="mt-2 text-slate-400">Return on just one recovered job</p>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center">
          <p className="text-lg font-semibold text-white">
            One recovered customer could pay for your subscription{" "}
            <span className="text-emerald-400">many times over.</span>
          </p>
          <p className="mt-3 text-slate-400">
            Instead of thinking <span className="italic">"$299 is expensive"</span> — ask yourself:{" "}
            <span className="font-semibold text-white">"Can I afford to keep missing calls?"</span>
          </p>
        </div>
        <div className="mt-10 text-center">
          <Button size="lg" className="shadow-[0_0_40px_rgba(37,99,235,0.5)]" asChild>
            <Link to="/signup">
              Start Your Free Trial <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function SmithAiTrust() {
  return (
    <section className="bg-secondary/40 py-20">
      <div className="container">
        <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-white p-10 shadow-sm">
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-3xl">
              🤝
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">
                Trusted Call Handling
              </p>
              <h3 className="mt-1 text-xl font-extrabold text-ink">
                Live Receptionist Support Powered by Smith.ai
              </h3>
              <p className="mt-2 text-muted-foreground leading-relaxed">
                When AI needs a human, your customers speak with a{" "}
                <span className="font-semibold text-ink">trained live receptionist</span> —
                not voicemail. Smith.ai handles overflow calls so every homeowner gets a
                real response, every single time.
              </p>
            </div>
          </div>
          <div className="mt-8 grid gap-4 border-t border-border pt-8 sm:grid-cols-3">
            {[
              { emoji: "🎯", text: "Every call answered by a real person when AI can't" },
              { emoji: "🏆", text: "Smith.ai is trusted by thousands of businesses" },
              { emoji: "📞", text: "No customer ever reaches voicemail" },
            ].map((item) => (
              <div key={item.text} className="flex items-start gap-3">
                <span className="text-xl">{item.emoji}</span>
                <p className="text-sm text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section id="faq" className="py-20">
      <div className="container">
        <SectionHeading eyebrow="FAQ" title="Frequently Asked Questions" />
        <div className="mx-auto max-w-3xl">
          <Accordion type="single" collapsible className="space-y-3">
            {FAQS.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger>{f.q}</AccordionTrigger>
                <AccordionContent>{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}

function ComparisonTable() {
  const rows = [
    {
      without: "Missed calls go to voicemail",
      with: "Every missed call gets an immediate response",
    },
    {
      without: "Homeowners call another roofer",
      with: "Homeowners stay engaged with your business",
    },
    {
      without: "Lost inspections",
      with: "More inspections booked automatically",
    },
    {
      without: "Lost revenue",
      with: "Revenue recovered 24/7",
    },
    {
      without: "After-hours leads disappear",
      with: "24/7 lead recovery — even while you sleep",
    },
  ];

  return (
    <section className="py-20">
      <div className="container">
        <SectionHeading
          eyebrow="The Real Question"
          title="Can You Afford NOT to Have This?"
          subtitle="Instead of asking 'should I spend $299?' — ask yourself what you're losing every month without it."
        />
        <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-border shadow-sm">
          {/* Header */}
          <div className="grid grid-cols-2">
            <div className="bg-red-50 px-6 py-4 text-center">
              <p className="font-bold text-red-700">❌ Without Roof AI</p>
            </div>
            <div className="bg-emerald-50 px-6 py-4 text-center">
              <p className="font-bold text-emerald-700">✅ With Roof AI</p>
            </div>
          </div>
          {/* Rows */}
          {rows.map((r, i) => (
            <div
              key={i}
              className={`grid grid-cols-2 border-t border-border ${i % 2 === 0 ? "bg-white" : "bg-secondary/30"}`}
            >
              <div className="flex items-center gap-3 px-6 py-4 text-sm text-red-700 border-r border-border">
                <span className="shrink-0">❌</span> {r.without}
              </div>
              <div className="flex items-center gap-3 px-6 py-4 text-sm text-emerald-700">
                <span className="shrink-0">✅</span> {r.with}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-muted-foreground text-sm">
          People buy because they don't want the left column.{" "}
          <span className="font-semibold text-ink">Which column are you in right now?</span>
        </p>
      </div>
    </section>
  );
}

function BottomCta() {
  return (
    <section className="py-20">
      <div className="container">
        <div className="mx-auto max-w-3xl rounded-3xl border-2 border-brand-600 bg-brand-50/40 p-10 text-center sm:p-14">
          <h2 className="text-3xl font-extrabold text-ink sm:text-4xl">
            Stop Losing Roofing Jobs to Voicemail
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Every missed call is a homeowner looking for help. We'll respond within seconds —
            so you book more inspections and recover more revenue.
          </p>
          <Button size="lg" className="mt-8" asChild>
            <Link to="/signup">
              Start Your 7-Day Free Trial <ArrowRight />
            </Link>
          </Button>
          <p className="mt-4 text-sm text-muted-foreground">
            No contracts · No setup fee · Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="cta-gradient py-20 text-white">
      <div className="container text-center">
        <h2 className="text-3xl font-extrabold sm:text-4xl">
          Stop Losing Roofing Jobs to Voicemail
        </h2>
        <p className="mt-4 text-lg text-white/90">
          Every missed call is a homeowner looking for help. We'll respond within seconds.
          Book more inspections. Recover more revenue.
        </p>
        <Button variant="white" size="lg" className="mt-8" asChild>
          <Link to="/signup">
            Start Your 7-Day Free Trial <ArrowRight />
          </Link>
        </Button>
        <p className="mt-4 text-sm text-white/60">
          No contracts · No setup fee · Cancel anytime
        </p>
      </div>
    </section>
  );
}
