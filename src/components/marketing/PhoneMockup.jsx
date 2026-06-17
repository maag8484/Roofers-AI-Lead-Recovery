import { Home, Phone, CheckCircle2 } from "lucide-react";

/** The hero chat mockup — mirrors the SMS conversation in the design. */
export function PhoneMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[340px]">
      {/* Floating "lead recovered" chip */}
      <div className="absolute -right-4 top-6 z-10 flex items-center gap-2.5 rounded-xl border border-border bg-white px-3.5 py-2.5 shadow-lg sm:-right-10">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
          <Phone className="h-4 w-4 text-emerald-600" />
        </span>
        <span className="text-xs leading-tight">
          <span className="block font-medium text-muted-foreground">New lead recovered</span>
          <span className="block font-bold text-ink">+$12,000 job</span>
        </span>
      </div>

      {/* Phone body */}
      <div className="overflow-hidden rounded-[2.25rem] border-[6px] border-ink-900 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 bg-brand-600 px-4 py-3.5 text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
            <Home className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold leading-tight">Roof AI</p>
            <p className="text-xs text-white/80">Auto-replying now</p>
          </div>
        </div>

        {/* Conversation */}
        <div className="space-y-3 px-3.5 py-4">
          <Bubble side="left">Missed call from (214) 555-0142</Bubble>
          <Bubble side="right">
            Hi! This is Apex Roofing. Sorry we missed you — are you looking for a roof
            repair or a full replacement?
          </Bubble>
          <Bubble side="left">Repair — got a leak after the storm</Bubble>
          <Bubble side="right">
            Got it. I can get you a free inspection. Does tomorrow at 2:00 PM work?
          </Bubble>
          <div className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            Inspection booked · Tue 2:00 PM
          </div>
        </div>
      </div>
    </div>
  );
}

function Bubble({ side, children }) {
  const isRight = side === "right";
  return (
    <div className={isRight ? "flex justify-end" : "flex justify-start"}>
      <div
        className={
          "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-snug " +
          (isRight
            ? "rounded-br-md bg-brand-600 text-white"
            : "rounded-bl-md bg-secondary text-ink")
        }
      >
        {children}
      </div>
    </div>
  );
}
