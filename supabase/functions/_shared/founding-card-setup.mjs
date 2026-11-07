import {termsVersion} from './founding-card-pilot.mjs';
export const consentCopy = 'Save my card for Roof AI. Nothing is due today. After setup and a successful live test, my pilot runs 14 days with up to 40 recovered calls. Unless I cancel before those 14 days end, I authorize $199/month for the first 12 paid months, then $299/month, plus applicable tax. The paid plan includes 75 recovered calls per billing month. Extra call packs are optional and require a separate purchase.';
export function founderContext(user) {
  const offer = user?.app_metadata?.roof_founding_offer;
  if (!user?.email_confirmed_at || !offer || offer.version!==termsVersion || offer.status!=='reserved' ||
      offer.user_id!==user.id || !/^[a-zA-Z0-9_-]{1,100}$/.test(offer.reservation_id??'') ||
      !/^cus_[a-zA-Z0-9]+$/.test(offer.stripe_customer_id??''))
    throw Error('No reserved card-first offer');
  return {userId:user.id,reservation:offer.reservation_id,customer:offer.stripe_customer_id};
}
export function ownedSetup(session,ctx,live) {
  const si=session?.setup_intent;
  return session?.livemode===live && session?.mode==='setup' && session.status==='complete' &&
    session.customer===ctx.customer && session.client_reference_id===ctx.userId &&
    session.metadata?.reservation===ctx.reservation && session.metadata?.terms===termsVersion &&
    si?.status==='succeeded' && si.customer===ctx.customer && si.usage==='off_session' &&
    si.metadata?.reservation===ctx.reservation && si.metadata?.terms===termsVersion &&
    si.metadata?.user_id===ctx.userId && typeof si.payment_method==='string';
}
