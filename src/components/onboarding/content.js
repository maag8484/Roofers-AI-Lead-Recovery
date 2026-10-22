import {
  PhoneCall,
  Bot,
  CalendarCheck,
  Phone,
  MessageSquareText,
  BarChart3,
} from "lucide-react";

export const FEATURES = [
  { icon: PhoneCall, title: "Overflow call recovery", description: "Missed and after-hours calls, up to 40 recovered calls during the 30-day pilot." },
  { icon: Bot, title: "Roofing qualification", description: "Collect roofing need, service area and urgency using your approved workflow." },
  { icon: CalendarCheck, title: "A clear next step", description: "Create a callback or booking request for each qualified caller." },
  { icon: Phone, title: "Keep your current number", description: "Your team answers first. Forward only approved overflow and after-hours calls." },
  { icon: MessageSquareText, title: "Team notifications", description: "Route recovered leads to the destination your team confirms during setup." },
  { icon: BarChart3, title: "Your pilot report", description: "See exactly what the pilot caught before deciding whether to continue." },
];

// "What you'll need" before starting the business-setup form.
export const CHECKLIST = [
  { label: "Business name & address", hint: "As they should appear to callers." },
  { label: "Business phone number", hint: "The line that forwards to your AI." },
  { label: "Service area", hint: "Counties or ZIP codes you cover." },
  { label: "Services you offer", hint: "e.g. residential & commercial roofing, gutters, repairs." },
  { label: "Business hours", hint: "When your staff answers first and after-hours coverage applies." },
  { label: "Scheduling link (optional)", hint: "Calendly or your booking system, if you use one." },
];
