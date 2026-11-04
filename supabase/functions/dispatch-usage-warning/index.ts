import {stripe, STRIPE_MODE} from '../_shared/stripe.ts';
import {serviceClient} from '../_shared/supabase.ts';
import {createUsageWarningHandler} from '../_shared/dispatch-usage-warning.mjs';

Deno.serve(createUsageWarningHandler({stripe, mode: STRIPE_MODE, db: serviceClient(),
  token: Deno.env.get('ROOF_WARNING_WORKER_SECRET'), sendgridKey: Deno.env.get('SENDGRID_API_KEY'),
  ready: Deno.env.get('ROOF_USAGE_EMAIL_READY') === 'true' && Deno.env.get('ROOF_PACK_FULFILLMENT_READY') === 'true'}));
