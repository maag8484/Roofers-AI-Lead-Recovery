export function PilotTerms() {
  return <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-slate-700">
    <h2 className="font-bold text-slate-900">Free 30-day pilot terms</h2>
    <ul className="mt-2 list-disc space-y-1 pl-5">
      <li>Up to 40 recovered calls over 30 days, starting after setup and a successful live test call.</li>
      <li>For an operating roofing company with a forwardable business phone line. One pilot per company.</li>
      <li>Missed and after-hours overflow only. Your staff answers first; this is not a full-time receptionist replacement.</li>
      <li>No card or payment is required. If you do nothing, the pilot ends. It does not automatically become a paid subscription.</li>
      <li>At the call cap we contact you, show the count, and discuss optional paid continuation or an agreed extension. We do not silently cut off your business line.</li>
      <li>If you choose to continue: $149/month locked for 12 months for the first 10 founding customers; otherwise $299/month. Your eligibility and quoted rate are confirmed before your pilot starts.</li>
    </ul>
  </div>;
}
export function SetupFraming() {
  return <div className="space-y-3 text-sm text-slate-700">
    <h2 className="text-xl font-bold text-slate-900">Your setup is free — and we do it with you.</h2>
    <p>Booking this call isn't homework. A specialist configures your roofing workflow with you in about 15 minutes: service area, urgency rules, exclusions, and where each qualified caller goes next. Before we finish, we place a live test call so you hear exactly what your customers will hear. Then your pilot starts.</p>
    <p>What you need on the call: your business phone nearby (so we can set up forwarding) and your service area. That's it.</p>
  </div>;
}
