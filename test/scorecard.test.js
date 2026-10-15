import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
const html = await readFile(new URL('../public/resources/roofing-missed-call-scorecard/index.html', import.meta.url), 'utf8');
const script = await readFile(new URL('../public/revenue-recovery-assets/scorecard.js', import.meta.url), 'utf8');
function page(query='') {
 const dom = new JSDOM(html,{url:'https://www.roofaileadrecovery.com/resources/roofing-missed-call-scorecard/'+query,runScripts:'outside-only'});
 dom.window.gtag=(...args)=>(dom.window.events ||= []).push(args);
 dom.window.fetch=()=>{throw Error('Counts must not leave this page');};
 dom.window.eval(script);return dom;
}
function review(dom,values) {
 const form=dom.window.document.querySelector('[data-call-review]');
 for (const [key,value] of Object.entries(values)) { form.elements[key].value=String(value);form.elements[key].dispatchEvent(new dom.window.Event('input',{bubbles:true})); }
 form.dispatchEvent(new dom.window.Event('submit',{cancelable:true}));
 return dom.window.document.querySelector('[data-call-review-result]');
}
test('call review uses actual counts, clears stale results and emits no numeric inputs',()=>{
 const dom=page();const result=review(dom,{missed:12,eligible:5,nextStep:3});
 assert.equal(result.hidden,false);assert.match(result.textContent,/2 eligible opportunities need/);assert.match(result.textContent,/60%/);
 assert.equal(dom.window.events.length,1);assert.equal(dom.window.events[0][1],'scorecard_review_complete');
 assert.deepEqual(Object.keys(dom.window.events[0][2]),['send_to','page_path']);
 assert.equal(dom.window.sessionStorage.length,0);assert.equal(dom.window.localStorage.length,0);
 dom.window.document.querySelector('[name="missed"]').dispatchEvent(new dom.window.Event('input',{bubbles:true}));assert.equal(result.hidden,true);
 review(dom,{missed:12,eligible:5,nextStep:4});assert.equal(dom.window.events.length,1);dom.window.close();
});
test('impossible relationships and fractional counts cannot produce findings',()=>{
 for(const values of [{missed:2,eligible:3,nextStep:1},{missed:3,eligible:2,nextStep:3},{missed:1.5,eligible:1,nextStep:0},{missed:-1,eligible:0,nextStep:0}]){
  const dom=page();assert.equal(review(dom,values).hidden,true);assert.equal(dom.window.events,undefined);dom.window.close();
 }
});
test('zero eligible opportunities cannot create invented revenue or divide by zero',()=>{
 const dom=page('?qa=1');const r=review(dom,{missed:0,eligible:0,nextStep:0});assert.equal(r.hidden,false);assert.match(r.textContent,/zero eligible/);assert.doesNotMatch(r.textContent,/NaN|Infinity|\$/);assert.equal(dom.window.events,undefined);dom.window.close();
});
test('sharing copies only a public referral link, never entered counts',async()=>{
 const dom=page();review(dom,{missed:829,eligible:511,nextStep:124});let copied;
 Object.defineProperty(dom.window.navigator,'clipboard',{value:{writeText:async text=>{copied=text;}}});
 dom.window.document.querySelector('[data-share-scorecard]').click();await new Promise(r=>setTimeout(r,0));
 const url=new URL(copied);assert.equal(url.hash,'#call-review');assert.equal(url.searchParams.get('utm_source'),'shared_resource');assert.equal(copied.includes('829'),false);assert.match(dom.window.document.querySelector('[data-share-status]').textContent,/not included/);dom.window.close();
});
