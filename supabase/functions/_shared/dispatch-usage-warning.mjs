// Only a pending row may be claimed. Once a provider request starts, never
// automatically retry it: even a timeout can mean the provider accepted it.
export async function dispatchWarning(id, {resolve,claim,send,finish}) {
  if (!await resolve(id)) return 'ineligible';
  if (!await claim(id)) return 'already_handled';
  const mail = await resolve(id); // recheck eligibility and fresh usage after claim
  if (!mail) {await finish(id,'suppressed',null);return 'suppressed';}
  const receipt = await send(mail,id);
  if (!receipt) throw Error('Provider acceptance uncertain; reconcile claimed row');
  await finish(id,'sent',receipt);
  return 'provider_accepted';
}
