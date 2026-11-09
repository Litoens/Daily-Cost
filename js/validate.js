// Pure validation helpers. No DOM, no imports. Returns i18n keys; app.js translates them.

export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 4 to 16 characters with at least one ASCII letter and one digit; symbols and other characters are allowed.
export function isValidPassword(pw) {
  return typeof pw === 'string' && pw.length >= 4 && pw.length <= 16 && /[A-Za-z]/.test(pw) && /\d/.test(pw);
}

// Maps a Supabase auth error to an i18n key by code first, then by message. Null when unknown.
export function authErrorKey(error) {
  const code = error?.code || '';
  const message = error?.message || '';
  if (code === 'invalid_credentials' || /invalid login credentials/i.test(message)) return 'err.invalidLogin';
  if (code === 'user_already_exists' || /already registered/i.test(message)) return 'err.alreadyRegistered';
  if (code === 'email_not_confirmed' || /email not confirmed/i.test(message)) return 'err.emailNotConfirmed';
  if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit' || /rate limit/i.test(message)) return 'err.rateLimit';
  if (code === 'weak_password') return 'auth.invalidPassword';
  if (code === 'same_password') return 'pw.same';
  if (/failed to fetch|networkerror|load failed/i.test(message)) return 'err.network';
  return null;
}
