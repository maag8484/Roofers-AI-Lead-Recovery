import {
  PhoneCall,
  Bot,
  CalendarCheck,
  Phone,
  MessageSquareText,
  BarChart3,
} from "lucide-react";

// Features the product ACTUALLY delivers (call handling + AI + booking live in
// n8n; the dashboard shows analytics). Kept honest per product scope.
export const FEATURES = [
  {
    icon: PhoneCall,
    title: "24/7 Missed-Call Recovery",
    description: "Every call you can't answer is caught and handled instantly, day or night.",
  },
  {
    icon: Bot,
    title: "AI Lead Qualification",
    description: "Your AI receptionist greets callers, answers questions, and qualifies the lead.",
  },
  {
    icon: CalendarCheck,
    title: "Appointment Booking",
    description: "Qualified leads get booked straight onto your calendar — no back-and-forth.",
  },
  {
    icon: Phone,
    title: "Dedicated Business Number",
    description: "A number that forwards to your AI, so nothing slips through the cracks.",
  },
  {
    icon: MessageSquareText,
    title: "Warm Transfer & Messages",
    description: "Route hot callers to your team live, or capture a message and email it over.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Dashboard",
    description: "See recovered leads, booked estimates, and response times as they happen.",
  },
];

// "What you'll need" before starting the business-setup form.
export const CHECKLIST = [
  { label: "Business name & address", hint: "As they should appear to callers." },
  { label: "Business phone number", hint: "The line that forwards to your AI." },
  { label: "Service area", hint: "Counties or ZIP codes you cover." },
  { label: "Services you offer", hint: "e.g. residential & commercial roofing, gutters, repairs." },
  { label: "Business hours", hint: "When calls should be handled live." },
  { label: "Scheduling link (optional)", hint: "Calendly or your booking system, if you use one." },
];
