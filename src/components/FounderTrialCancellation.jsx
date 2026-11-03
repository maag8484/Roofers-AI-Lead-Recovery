import {useEffect,useState} from 'react';
import {supabase} from '@/lib/supabase';
export default function FounderTrialCancellation({userId}) {
 const [rows,setRows]=useState([]),[problem,setProblem]=useState(''),[busy,setBusy]=useState('');
 useEffect(()=>{let active=true;setRows([]);setProblem('');
 if(userId)supabase.rpc('my_roof_founder_trial').then(({data,error})=>{if(active){if(error)setProblem('Could not check your founding trial. Refresh this page to retry.');else setRows(data||[]);}});
 return ()=>{active=false};},[userId]);
 async function cancel(id){setBusy(id);setProblem('');
 try{const {data,error}=await supabase.rpc('cancel_roof_founder_trial',{p_reservation:id});
 const fresh=await supabase.rpc('my_roof_founder_trial');
 if(!fresh.error)setRows(fresh.data||[]);
 if(error||!data||fresh.error||!fresh.data?.find(r=>r.reservation_id===id)?.canceled_at)throw Error();
 }catch{setProblem('Cancellation could not be confirmed. Refresh to check the status, or contact Roof AI support.');}finally{setBusy('');}}
 if(!rows.length&&!problem)return null;
 return <section aria-label="Founding pilot billing">{problem&&<p role="alert">{problem}</p>}{rows.map(r=><div key={r.reservation_id}><h2>Founding pilot billing</h2>{r.canceled_at?<p role="status">Canceled. You will not be charged for this pilot.</p>:r.claimed_at?<p>Billing is being processed. Contact support about this reservation.</p>:<><p>Your first charge is scheduled for {new Date(r.first_charge_at).toLocaleString(undefined,{dateStyle:'full',timeStyle:'long'})}. Cancel before that time to avoid the charge.</p><button type="button" disabled={!!busy} onClick={()=>cancel(r.reservation_id)} className="underline">Cancel pilot before first charge</button></>}</div>)}</section>;
}