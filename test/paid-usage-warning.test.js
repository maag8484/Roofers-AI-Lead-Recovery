import test from 'node:test';
import assert from 'node:assert/strict';
import {planUsageWarning} from '../supabase/functions/_shared/paid-usage-warning.mjs';
import {termsVersion} from '../supabase/functions/_shared/founding-card-pilot.mjs';
const p={companyId:'a',startMs:100,endMs:200,phase:'paid',version:termsVersion,purchasedPacks:0};
const calls=n=>Array.from({length:n},(_,i)=>({id:String(i),atMs:101,companyId:'a',billableRecovered:true}));
test('65 distinct paid recoveries trigger one warning identity; 64 plus duplicates do not',()=>{
 const c=calls(64);
 assert.equal(planUsageWarning(p,[...c,c[0],{...c[0],id:'test',billableRecovered:false},{...c[0],id:'old',atMs:99},{...c[0],id:'other',companyId:'b'}],120),null);
 const first=planUsageWarning(p,calls(65),120), later=planUsageWarning(p,calls(74),130);
 assert.match(first.text,/10 left/);assert.match(first.text,/20 recovered calls for \$50/);
 assert.ok(first.text.includes("50 recovered calls for $100, bringing it to 125"));
 assert.equal(first.key,later.key); assert.match(later.text,/1 left/);
});
test('never offer as approaching after cap, after period, on pilot, or after purchased extension',()=>{
 for(const [period,n,t] of [[p,75,130],[p,65,200],[{...p,phase:'pilot'},65,120],[{...p,version:'legacy'},65,120],[{...p,purchasedPacks:1},65,120]])assert.equal(planUsageWarning(period,calls(n),t),null);
});
