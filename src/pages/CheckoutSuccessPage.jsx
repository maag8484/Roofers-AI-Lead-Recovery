import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/Logo';
export default function CheckoutSuccessPage(){
 const {user}=useAuth(); const [params]=useSearchParams();
 const [result,setResult]=useState({state:'checking'});
 const id=params.get('session_id') || params.get('setup_session');
 useEffect(()=>{let active=true;
  if(!user){setResult({state:'error',message:'Sign in to verify your card authorization.'});return;}
  if(!id || !/^cs_(live|test)_[a-zA-Z0-9]+$/.test(id)){setResult({state:'error',message:'Missing or invalid Stripe session.'});return;}
  supabase.functions.invoke('founding-card-setup',{body:{action:'verify',session_id:id}})
   .then(({data,error})=>{if(!active)return;
    if(error)setResult({state:'error',message:'Unable to verify the Stripe session. No new card authorization is needed.'});
    else if(data?.verified)setResult({state:'success'});
    else setResult({state:'error',message:data?.status==='open'?'Card setup was not completed.':'Card authorization could not be verified. Contact support; do not enter your card again.'});
   }).catch(()=>{if(active)setResult({state:'error',message:'Verification unavailable. Do not repeat card entry.'});});
  return()=>{active=false};
 },[user?.id,id]);
 return <main className="mx-auto max-w-2xl space-y-6 px-5 py-12"><Logo />
 {result.state==='checking'?<><h1 className="text-3xl font-bold">Verifying your card authorization…</h1><p>Please wait. No charge or subscription is being created.</p></>:
 result.state==='success'?<><h1 className="text-3xl font-bold">Card authorized successfully — $0 due today.</h1><p>Your card has been securely saved. No subscription or pilot has been started.</p></>:
 <><h1 className="text-3xl font-bold">Card setup verification incomplete</h1><p role="alert">{result.message}</p><a className="underline" href="/checkout">Return to checkout</a></>}
 </main>;
}
