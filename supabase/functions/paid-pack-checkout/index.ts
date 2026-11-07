import {handleOptions, json} from '../_shared/cors.ts';
import {getUser, serviceClient} from '../_shared/supabase.ts';
import {stripe, STRIPE_MODE} from '../_shared/stripe.ts';
import {createPackCheckoutHandler} from '../_shared/paid-pack-checkout.mjs';

Deno.serve(createPackCheckoutHandler({getUser, db: serviceClient(), stripe,
  mode: STRIPE_MODE, ready: Deno.env.get('ROOF_PACK_FULFILLMENT_READY') === 'true',
  json, handleOptions}));
