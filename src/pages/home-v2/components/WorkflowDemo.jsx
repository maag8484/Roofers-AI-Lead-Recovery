import { useState } from "react";
import { DEMO_VIDEO } from "../media";

const examples = [
  { title: "Storm damage", need: "Missing shingles after a storm", urgency: "No active leak reported", next: "Inspection requested", note: "Your team confirms availability before an appointment is booked." },
  { title: "Active leak", need: "Water entering the home", urgency: "Urgent review requested", next: "On-call callback requested", note: "Your approved escalation rules apply. This example does not promise emergency dispatch." },
  { title: "Replacement estimate", need: "Replacement estimate for an aging roof", urgency: "Routine inquiry", next: "Estimator callback requested", note: "Your estimator confirms the scope and next step. No roof price is quoted." },
];

export function WorkflowDemo() {
  const [selected, setSelected] = useState(0);
  const example = examples[selected];
  return <section id="workflow-demo" aria-labelledby="workflow-demo-title" className="scroll-mt-24 border-y border-[var(--line)] bg-[var(--deep)] px-5 py-20 sm:px-8">
    <div className="mx-auto max-w-[1280px]">
      <p className="text-xs font-bold uppercase tracking-widest text-[var(--acid)]">Illustrative workflow · not customer results</p>
      <h2 id="workflow-demo-title" className="hv2-display mt-4 text-3xl text-[var(--text)] sm:text-5xl">See what reaches your team.</h2>
      <p className="mt-4 max-w-2xl leading-relaxed text-[var(--text-dim)]">Choose a roofing inquiry. This example shows the details and next step a configured workflow can collect. It runs only in this page; no call, text, or booking is sent.</p>
      <div className="mt-8 flex flex-wrap gap-3" role="group" aria-label="Example roofing inquiry">
        {examples.map((item, i) => <button key={item.title} type="button" aria-pressed={selected === i} onClick={() => setSelected(i)} className={`rounded-full border px-5 py-3 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500 ${selected === i ? "border-blue-600 bg-blue-600 text-white" : "border-[var(--line-2)] bg-[var(--surface)] text-[var(--text)]"}`}>{item.title}</button>)}
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <article aria-live="polite" aria-atomic="true" className="hv2-glass rounded-3xl p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dim)]">Example team handoff</p>
          <h3 className="hv2-display mt-3 text-2xl text-[var(--text)]">{example.next}</h3>
          <dl className="mt-6 grid gap-4 text-sm">
            {[["Homeowner", "Alex · fictional homeowner"], ["Address", "Example property · service-area check required"], ["Roofing need", example.need], ["Urgency", example.urgency], ["Assigned next step", "Your designated team member follows up"]].map(([label, value]) => <div key={label} className="border-t border-[var(--line)] pt-3"><dt className="font-bold text-[var(--text)]">{label}</dt><dd className="mt-1 text-[var(--text-dim)]">{value}</dd></div>)}
          </dl>
          <p className="mt-6 rounded-xl border border-[var(--line-2)] p-4 text-sm leading-relaxed text-[var(--text-dim)]">{example.note} A request is not a confirmed appointment.</p>
        </article>
        <div>
          <video controls playsInline preload="none" poster={DEMO_VIDEO.poster} aria-label={DEMO_VIDEO.title} className="aspect-video w-full rounded-2xl bg-black">
            <source src={DEMO_VIDEO.src} type="video/mp4" />
            Your browser cannot play this video. <a href="/roofing-missed-call-demo/">Open the walkthrough page</a>.
          </video>
          <p className="mt-3 text-sm text-[var(--text-dim)]">84-second walkthrough with captions. Conversations and figures are illustrative.</p>
          <a href="#inquiry" className="mt-6 inline-flex rounded-full bg-blue-600 px-6 py-3 font-bold text-white">Review my phone setup</a>
          <p className="mt-3 text-sm text-[var(--text-dim)]">Request a human callback. No account or card needed for this conversation.</p>
        </div>
      </div>
    </div>
  </section>;
}
