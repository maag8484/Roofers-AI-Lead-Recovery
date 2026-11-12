export function DashboardPreview() {
  const stages = [
    ["Calls handled", "Which calls reached the configured workflow?"],
    ["Qualified inquiries", "Which callers matched your roofing services and area?"],
    ["Callback / booking requests", "Which next steps were sent to your team?"],
    ["Confirmed inspections", "Which appointments did your team confirm?"],
  ];
  return <section aria-labelledby="pilot-report-title" className="border-y border-[var(--line)] bg-[var(--deep)] px-5 py-20 sm:px-8">
    <div className="mx-auto max-w-[1280px]">
      <p className="text-xs font-bold uppercase tracking-widest text-[var(--acid)]">Your pilot report</p>
      <h2 id="pilot-report-title" className="hv2-display mt-4 text-3xl text-[var(--text)] sm:text-5xl">See what happened after the call.</h2>
      <p className="mt-4 max-w-2xl leading-relaxed text-[var(--text-dim)]">Review the calls handled during your pilot, the details collected, and the next steps your team verified. These are report categories, not published customer results.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{stages.map(([title, description]) => <article key={title} className="hv2-glass rounded-2xl p-6"><h3 className="font-bold text-[var(--text)]">{title}</h3><p className="mt-3 text-sm leading-relaxed text-[var(--text-dim)]">{description}</p></article>)}</div>
      <p className="mt-6 max-w-3xl text-sm leading-relaxed text-[var(--text-dim)]">Requests, confirmed appointments, held inspections, signed jobs, and collected revenue stay separate. Customer outcomes require your team's records; missing evidence stays unverified. A missed call is not automatically a lost job.</p>
      <a href="#inquiry" className="mt-6 inline-block font-bold text-[var(--acid)] underline">Discuss a measured pilot</a>
    </div>
  </section>;
}
