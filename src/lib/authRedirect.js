/**
 * Where Supabase sends the user after they click an email confirmation link.
 *
 * Without an explicit emailRedirectTo, Supabase falls back to the project's
 * Site URL, which in practice means a confirmed user can land on the marketing
 * page with a live session and no idea what to do next. Pointing it at
 * /checkout keeps the intended flow: signup -> confirm -> pay -> details form.
 *
 * NOTE: this URL must also be listed under Authentication -> URL Configuration
 * -> Redirect URLs in the Supabase dashboard, or Supabase will ignore it.
 */
export const EMAIL_REDIRECT_TO = `${window.location.origin}/checkout`;
