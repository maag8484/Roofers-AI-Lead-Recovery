import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

test('retired checkout cannot start a Stripe trial or charge, even for an old client', async () => {
  let handler;
  const source = readFileSync('supabase/functions/stripe-create-checkout/index.ts', 'utf8')
    .replace(/^import .*;$/gm, '');
  // Run the actual edge handler offline. The sandbox has no network or Stripe.
  vm.runInNewContext(source, {
    Deno: { serve: fn => { handler = fn; } },
    handleOptions: req => req.method === 'OPTIONS' ? new Response('ok') : null,
    json: (body, status = 200) => new Response(JSON.stringify(body), {status}),
  });
  const response = await handler(new Request('https://example.invalid/checkout', {
    method: 'POST', body: JSON.stringify({trial_type:'7-day', success_url:'https://example.invalid/success'}),
  }));
  assert.equal(response.status, 410);
  const body = await response.json();
  assert.equal(body.error, 'legacy_checkout_retired');
  assert.match(body.message, /14-day pilot/);
  assert.equal(body.url, undefined);
  assert.equal((await handler(new Request('https://example.invalid/checkout'))).status, 405);
  assert.equal((await handler(new Request('https://example.invalid/checkout', {method:'OPTIONS'}))).status, 200);
});
