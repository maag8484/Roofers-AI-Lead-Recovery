import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

// Operator-supplied evidence only. This does not query production or certify records.
export function summarizePilot(data) {
  if (!data.pilot_id || !data.period_start || !data.period_end) throw new Error('Pilot ID and reporting period are required.');
  if (!Number.isFinite(Date.parse(data.period_start)) || !Number.isFinite(Date.parse(data.period_end)) || Date.parse(data.period_end) <= Date.parse(data.period_start)) throw new Error('Invalid reporting period.');
  if (!Array.isArray(data.calls)) throw new Error('calls must be an array.');
  const seen = new Set();
  const real = data.calls.filter(c => c.is_test === false);
  for (const c of real) {
    if (!c.provider_call_id || !c.evidence_ref || !c.lead_key) throw new Error('Real calls require provider ID, evidence reference and privacy-safe lead key.');
    if (seen.has(c.provider_call_id)) throw new Error('Duplicate provider call ID.');
    seen.add(c.provider_call_id);
    const at = Date.parse(c.occurred_at);
    if (!Number.isFinite(at) || at < Date.parse(data.period_start) || at >= Date.parse(data.period_end)) throw new Error('Call outside reporting period.');
    if (c.staff_answered !== false) throw new Error('Overflow report requires staff_answered=false.');
    for (const key of ['appointment_confirmed','inspection_held','job_signed','invoice_paid']) {
      if (c[key] === true && (!c.customer_evidence_ref || !c.verified_by)) throw new Error('Customer outcome requires evidence and verifier.');
    }
    if (c.invoice_paid === true && (!Number.isFinite(c.collected_amount) || c.collected_amount < 0 || !c.currency || !c.invoice_id)) throw new Error('Paid invoice requires amount, currency and invoice ID.');
  }
  const count = key => real.filter(c => c[key] === true).length;
  const known = key => real.filter(c => typeof c[key] === 'boolean').length;
  return {
    pilot_id: data.pilot_id, period_start: data.period_start, period_end: data.period_end,
    coverage_reconciled: data.coverage_reconciled === true,
    recorded_real_calls: real.length, excluded_test_calls: data.calls.filter(c => c.is_test === true).length,
    unclassified_test_status: data.calls.filter(c => typeof c.is_test !== 'boolean').length,
    unique_callers: new Set(real.map(c => c.lead_key)).size,
    stages: Object.fromEntries(['handled','qualified','notification_delivered','callback_requested','booking_requested','appointment_confirmed','inspection_held','job_signed','invoice_paid'].map(key => [key, { verified_true: count(key), known: known(key), unverified: real.length-known(key) }])),
    publication_permission: data.publication_permission === true,
  };
}

export function renderReport(report) {
  const rows = Object.entries(report.stages).map(([name,s]) => `| ${name.replaceAll('_',' ')} | ${s.verified_true} | ${s.known} | ${s.unverified} |`).join('\n');
  return `# Pilot evidence review: ${report.pilot_id}\n\nPeriod: ${report.period_start} to ${report.period_end} (end exclusive).\n\nStatus: ${report.recorded_real_calls ? 'Operator-entered evidence; source verification still required.' : 'No real-call evidence supplied. This is not a customer result.'}\n\nCoverage reconciliation: ${report.coverage_reconciled ? 'Marked complete by operator' : 'Incomplete — do not interpret missing calls as zero'}\n\nRecorded real calls: ${report.recorded_real_calls}; unique callers: ${report.unique_callers}; excluded tests: ${report.excluded_test_calls}; unclassified test status: ${report.unclassified_test_status}.\n\n| Stage | Evidence-marked yes | Known yes/no | Unverified |\n|---|---:|---:|---:|\n${rows}\n\nNo incremental revenue or saved jobs are inferred. Requests are separate from confirmed appointments. Customer outcomes require customer evidence. Permission to publish: ${report.publication_permission ? 'Recorded; verify written permission and case-study thresholds before publication' : 'Not recorded — internal review only'}.\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [input,output] = process.argv.slice(2);
  if (!input || !output) throw new Error('Usage: node scripts/pilot-report.mjs input.json output.md');
  const result = summarizePilot(JSON.parse(await readFile(input,'utf8')));
  await writeFile(output, renderReport(result));
}
