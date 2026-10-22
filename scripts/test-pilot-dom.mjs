// Local-only integration test: no real signup, email, booking or payment.
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';
import assert from 'node:assert/strict';
const dom = new JSDOM('<!doctype html><div id="root"></div>', {url:'http://localhost/signup?ref=PARTNER_DEMO', pretendToBeVisual:true});
for(const key of ['DocumentFragment','Node','CustomEvent','location','window','document','navigator','HTMLElement','HTMLInputElement','Element','MutationObserver','localStorage','sessionStorage','Event','MouseEvent','getComputedStyle']) Object.defineProperty(globalThis,key,{value:key==='getComputedStyle'?dom.window[key].bind(dom.window):dom.window[key],configurable:true});
globalThis.ResizeObserver=class {observe(){} unobserve(){} disconnect(){}};
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
process.env.VITE_PUBLIC_SUPABASE_URL='https://qa-only.invalid';process.env.VITE_PUBLIC_SUPABASE_ANON_KEY='qa-only';
const server=await createServer({server:{middlewareMode:true},appType:'custom',ssr:{noExternal:['react-router-dom','react-router'],resolve:{conditions:['module','node','import','module-sync']}}});
const React=(await import('react')).default;const {act}=await import('react');const {createRoot}=await import('react-dom/client');
const {MemoryRouter,Routes,Route}=await server.ssrLoadModule('react-router-dom');
const calls=[];let metadata={};
let company={company_name:'QA Roofing',address:'123 Test Way',business_phone:'+14155552671',phone_country:'US',phone_provider:'Verizon',contact_name:'QA Operator',contact_email:'qa@example.com',service_areas:'Test County',services:'Roof repairs',conversion_preference:'take_message',employees:[{name:'QA Operator',transfer_line:'+14155552671',email:'qa@example.com'}],summary_emails:['qa@example.com'],business_hours:'Mon–Fri 8–5',after_hours_preference:'Take message',details_submitted:false,status:'new'};
const user=()=>({id:'00000000-0000-4000-8000-000000000001',aud:'authenticated',role:'authenticated',email:'qa@example.com',email_confirmed_at:new Date().toISOString(),created_at:new Date().toISOString(),user_metadata:metadata,identities:[{id:'qa'}]});
const reply=body=>new Response(JSON.stringify(body),{status:200,headers:{'Content-Type':'application/json'}});
globalThis.fetch=async(url,opts={})=>{
 const u=String(url),body=opts.body&&JSON.parse(opts.body);calls.push({url:u,body});
 if(u.includes('/signup')){metadata=body.data;return reply(user());}
 if(u.includes('/auth/v1/user'))return reply(user());
 if(u.includes('/auth/v1/logout'))return reply({});
 if(u.includes('/roofing_companies')){if(opts.method==='POST')company={...company,...body};return reply(company);}
 if(u.includes('/profiles'))return reply({onboarding_completed:true});
 if(u.includes('/rpc/is_admin'))return reply(false);
 if(u.includes('/subscriptions'))return reply([]);
 throw new Error('Unexpected external call blocked: '+u);
};
try {
 const {AuthProvider}=await server.ssrLoadModule('/src/context/AuthContext.jsx');
 const {default:SignupPage}=await server.ssrLoadModule('/src/pages/SignupPage.jsx');
 const root=createRoot(document.getElementById('root'));
 await act(async()=>{root.render(React.createElement(MemoryRouter,null,React.createElement(AuthProvider,null,React.createElement(SignupPage))));await new Promise(r=>setTimeout(r,50));});
 function change(name,value){const el=document.querySelector(`[name="${name}"]`);assert.ok(el,name);Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new dom.window.Event('input',{bubbles:true}));el.dispatchEvent(new dom.window.Event('change',{bubbles:true}));}
 await act(async()=>{change('full_name','QA Roofer');change('email','qa@example.com');change('password','NotARealAccount!2026');document.querySelector('[name="pilot_terms"]').click();document.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));await new Promise(r=>setTimeout(r,100));});
 assert.equal(calls.length,1);assert.equal(metadata.partner_ref,'PARTNER_DEMO');assert.equal(metadata.pilot_program,'roof-ai-pilot-01');assert.match(document.body.textContent,/Confirm your email/);
 console.log('PASS: mounted signup → mocked auth request persists referral/program → confirmation screen; zero real requests, emails, bookings or payments');
 await act(async()=>root.unmount());
 const {supabase}=await server.ssrLoadModule('/src/lib/supabase.js');
 const jwt='eyJhbGciOiJIUzI1NiJ9.'+Buffer.from(JSON.stringify({exp:Math.floor(Date.now()/1000)+3600,sub:user().id})).toString('base64url')+'.mock';
 await supabase.auth.setSession({access_token:jwt,refresh_token:'mock'});
 const {default:Checkout}=await server.ssrLoadModule('/src/pages/CheckoutPage.jsx');
 const {default:Onboarding}=await server.ssrLoadModule('/src/pages/OnboardingPage.jsx');
 const {default:Dashboard}=await server.ssrLoadModule('/src/pages/DashboardPage.jsx');
 const root2=createRoot(document.getElementById('root'));
 await act(async()=>{root2.render(React.createElement(MemoryRouter,{initialEntries:['/checkout']},React.createElement(AuthProvider,null,React.createElement(Routes,null,
  React.createElement(Route,{path:'/checkout',element:React.createElement(Checkout)}),
  React.createElement(Route,{path:'/onboarding',element:React.createElement(Onboarding)}),
  React.createElement(Route,{path:'/dashboard',element:React.createElement(Dashboard)})
 ))));await new Promise(r=>setTimeout(r,200));});
 const pause=()=>new Promise(r=>setTimeout(r,100));
 for(let i=0;i<4;i++) await act(async()=>{const button=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Continue');assert.ok(button,'Continue step '+i);button.click();await pause();});
 await act(async()=>{document.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));await pause();});
 assert.equal(company.details_submitted,true);
 const scheduler=[...document.querySelectorAll('a')].find(a=>a.textContent.includes('Open Calendly'));
 assert.ok(scheduler?.href.includes('calendly.com/smith-ai-client-success/'));
 await act(async()=>{[...document.querySelectorAll('button')].find(b=>b.textContent.includes("Skip for now — I'll schedule later")).click();await pause();});
 assert.match(document.body.textContent,/Free pilot requested — no automatic billing/);
 assert.equal(calls.some(c=>c.url.includes('stripe-create-checkout')),false);
 console.log('PASS: simulated confirmed account → no-card checkout → business details mock persistence → free setup scheduler link (not booked) → dashboard; no Stripe calls');
 await act(async()=>root2.unmount());await supabase.auth.signOut({scope:'local'});

} finally {await server.close();dom.window.close();}

// Supabase/Vite development watchers can outlive this standalone mock test.
process.exit(0);
