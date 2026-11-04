import {serviceClient} from '../_shared/supabase.ts';
import {stripe, STRIPE_MODE} from '../_shared/stripe.ts';
import {createFounderActivationHandler} from '../_shared/founder-worker-handlers.mjs';
Deno.serve(createFounderActivationHandler({db:serviceClient(),stripe,live:STRIPE_MODE==='live',env:(name:string)=>Deno.env.get(name)}));
