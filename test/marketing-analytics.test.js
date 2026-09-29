import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
const script = await readFile(new URL('../public/marketing-analytics.js', import.meta.url), 'utf8');
function page(url) {
  const dom = new JSDOM('<a href="/signup">Start trial</a>', {url, runScripts:'outside-only'});
  dom.window.eval(script); return dom;
}
test('homepage loads one GA tag, removes noncampaign query data and tracks signup intent', () => {
  const dom = page('https://www.roofaileadrecovery.com/?utm_source=linkedin&email=private@example.com');
  const w = dom.window;
  assert.equal(w.document.querySelectorAll('script[src*="gtag/js"]').length, 1);
  const config = w.dataLayer.find(e=>e[0]==='config');
  assert.equal(config[2].page_location, 'https://www.roofaileadrecovery.com/?utm_source=linkedin');
  w.document.querySelector('a').addEventListener('click', e=>e.preventDefault());
  w.document.querySelector('a').click();
  assert.equal(w.dataLayer.filter(e=>e[1]==='signup_clicked').length, 1);
  w.history.pushState({}, '', '/dashboard');
  assert.equal(w['ga-disable-G-8PV83SZ3X0'], true);
  dom.window.close();
});
test('preview, QA and private routes never initialize production analytics', () => {
  for (const url of ['https://preview.vercel.app/', 'https://www.roofaileadrecovery.com/?qa=1', 'https://www.roofaileadrecovery.com/reset-password?token=secret', 'https://www.roofaileadrecovery.com/dashboard']) {
    const dom = page(url);
    assert.equal(dom.window.document.querySelector('script'), null);
    dom.window.close();
  }
});
