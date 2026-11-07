import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {hasFoundingCardOffer,pilotOffer,pilotAccountSummary} from '../src/lib/pilot.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const bundled=await build({stdin:{contents:"export {PricingPreview} from './src/components/onboarding/PricingPreview.jsx'; export {NextSteps} from './src/components/onboarding/NextSteps.jsx'; export {WelcomeHero} from './src/components/onboarding/WelcomeHero.jsx';",resolveDir:root},bundle:true,write:false,format:'cjs',platform:'node',jsx:'automatic',alias:{'@':root+'src'},external:['react','react-dom','framer-motion','lucide-react']});
const module={exports:{}};new Function('require','module','exports',bundled.outputFiles[0].text)(createRequire(import.meta.url),module,module.exports);
const legacy=version=>({id:'user_1',user_metadata:{pilot_program:'roof-ai-pilot-01',pilot_terms_version:version}});
const reserved={id:'user_1',app_metadata:{roof_founding_offer:{version:'pilot-14d-40calls-199-card-v4',user_id:'user_1',status:'reserved'}}};
const render=(name,user)=>renderToStaticMarkup(React.createElement(module.exports[name],{user}));

test('reserved v4 uses server-owned terms and never old no-card/no-conversion copy',()=>{
  assert.equal(hasFoundingCardOffer(reserved),true);assert.equal(pilotOffer(reserved).days,14);
  for(const name of ['WelcomeHero','PricingPreview','NextSteps']) {
    const html=render(name,reserved);assert.doesNotMatch(html,/No card required|No automatic paid conversion|It ends unless|ends automatically/i);
    assert.match(html,/separately authorize|separately authoriz|authorize card billing/);assert.match(html,/14/);
  }
  const summary=pilotAccountSummary(reserved,null);assert.match(summary.renewal,/14 full days after verified activation/);assert.doesNotMatch(summary.status,/active|paid/i);
});
test('accepted v1 and v3 retain duration, rate and no-card/no-auto conversion displays',()=>{
  for(const [version,days,rate] of [['pilot-30d-40calls-v1',30,149],['pilot-14d-40calls-199-v3',14,199]]) {
    const user=legacy(version);const html=render('PricingPreview',user);
    assert.match(html,new RegExp(`Free ${days}-Day Pilot`));assert.ok(html.includes(`$${rate}/month`));assert.match(html,/No card required. No automatic paid conversion/);
    assert.match(render('NextSteps',user),/It ends unless you choose to continue/);
    assert.equal(pilotAccountSummary(user,null).renewal,'No automatic paid conversion');
  }
});
test('editable metadata cannot enable reserved v4 UI and mismatched owner is rejected',()=>{
  assert.equal(hasFoundingCardOffer({...legacy('pilot-14d-40calls-199-card-v4'),user_metadata:{roof_founding_offer:reserved.app_metadata.roof_founding_offer}}),false);
  assert.equal(hasFoundingCardOffer({...reserved,id:'other'}),false);
  assert.equal(hasFoundingCardOffer({app_metadata:{roof_founding_offer:{version:'pilot-14d-40calls-199-card-v4'}}}),false);
});
test('recorded subscription uses actual renewal rather than pilot no-charge wording',()=>{
  assert.equal(pilotAccountSummary(reserved,{status:'active'}).renewal,null);
  assert.equal(pilotAccountSummary(legacy('pilot-30d-40calls-v1'),{status:'active'}).renewal,null);
});
