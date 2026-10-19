// Build-time rendering must never create a database/auth client. Effects and
// event handlers are not executed by React's server renderer; fail closed if
// a future homepage import tries to use a service during rendering.
export const supabase = new Proxy({}, {
  get() { throw new Error("Public pre-render attempted to access an authenticated service"); },
});

export function invokeFunction() {
  throw new Error("Public pre-render cannot invoke an external function");
}

export const EMAIL_REDIRECT_TO = "https://www.roofaileadrecovery.com/checkout";
