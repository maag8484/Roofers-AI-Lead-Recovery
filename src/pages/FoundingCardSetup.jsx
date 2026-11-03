import {useEffect,useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {supabase} from '@/lib/supabase';
import {consentCopy} from '../../supabase/functions/_shared/founding-card-setup.mjs';
import {termsVersion} from '../../supabase/functions/_shared/founding-card-pilot.mjs';
export default function FoundingCardSetup(){
  const navigate=useNavigate();
  const [accepted,setAccepted]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const [requestId]=useState(()=>crypto.randomUUID());
  const sessionId=new URLSearchParams(window.location.search).get('setup_session');
  useEffect(()=>{
    if(!sessionId)return;
    let active=true;
    supabase.functions.invoke('founding-card-setup',{body:{action:'verify',session_id:sessionId}})
      .then(({data,error})=>{
        if(!active)return;
        if(!error && data?.verified)navigate('/onboarding',{replace:true});
        else setMessage('We could not confirm your card setup. No pilot or billing was started.');
      }).catch(()=>{if(active)setMessage('Card setup could not be confirmed. Please try again later.');});
    return ()=>{active=false;};
  },[sessionId,navigate]);
  async function start(){
    if(!accepted || busy)return;
    setBusy(true);setMessage('');
    try{
      const {data,error}=await supabase.functions.invoke('founding-card-setup',{body:{action:'start',accepted:true,terms:termsVersion,request_id:requestId}});
      if(error || new URL(data.url).origin!=='https://checkout.stripe.com')throw Error();
      window.location.assign(data.url);
    }catch{setMessage('Card setup is unavailable. Nothing was charged.');setBusy(false);}
  }
  return <main className="mx-auto max-w-lg space-y-5 p-8"><h1 className="text-2xl font-bold">Set up your founding pilot</h1>
    {sessionId ? <p>{message || 'Verifying card setup…'}</p> : <>
    <p>Save your card securely with Stripe. Your free pilot covers up to 40 recovered calls.</p>
    <label className="flex items-start gap-3"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)}/><span>{consentCopy}</span></label>
    <button type="button" className="rounded-lg bg-blue-700 px-4 py-2 text-white disabled:opacity-50" disabled={!accepted||busy} onClick={start}>Continue to Stripe — $0 today</button>
    {message && <p role="alert">{message}</p>}</>}
  </main>;
}
