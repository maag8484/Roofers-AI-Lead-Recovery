// A recorded paid period is history, not proof that its payment remains settled.
// Re-read Stripe on each purchase/warning attempt so later refunds and disputes
// immediately withhold new paid-period actions without deleting receipts.
export async function currentPaidSettlement(sub, stripe) {
  const invoiceId = typeof sub?.latest_invoice === 'string' ? sub.latest_invoice : sub?.latest_invoice?.id;
  const customerId = typeof sub?.customer === 'string' ? sub.customer : sub?.customer?.id;
  if (!sub?.id || !sub.livemode || sub.status !== 'active' || !invoiceId || !customerId) return false;
  const invoice = await stripe.invoices.retrieve(invoiceId, {expand: ['payment_intent.latest_charge']});
  const intent = invoice?.payment_intent;
  const charge = intent?.latest_charge;
  return !!(invoice?.id === invoiceId && invoice.livemode && invoice.status === 'paid' && invoice.paid &&
    invoice.subscription === sub.id && invoice.customer === customerId && invoice.currency === 'usd' &&
    Number.isSafeInteger(invoice.amount_paid) && invoice.amount_paid > 0 &&
    intent && typeof intent !== 'string' && intent.livemode && intent.status === 'succeeded' &&
    intent.customer === customerId && intent.currency === 'usd' && intent.amount_received === invoice.amount_paid &&
    charge && typeof charge !== 'string' && charge.livemode && charge.paid && charge.captured &&
    !charge.disputed && charge.amount_refunded === 0);
}
