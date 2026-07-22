/**
 * FORAGE — auth infrastructure
 * app/_auth-store.ts
 *
 * Thin wrappers around supabase.auth for the email-OTP signup/signin flow.
 * No screen currently imports this file — it's infrastructure only.
 */

import type { AuthChangeEvent, AuthError, Session, Subscription } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type OtpRequestResult = { error: string | null };

export type VerifyOtpResult = { error: string | null; isNewUser: boolean };

export type CreateUserProfileResult = { error: string | null };

export type GetSessionResult = { session: Session | null; error: string | null };

// Distinct, recognizable error returned by sendSignInOtp when no account
// exists for the given email — lets the UI show "we don't have an account
// for that email" instead of a raw Supabase error string.
export const AUTH_ERROR_NO_ACCOUNT_FOUND = 'no-account-found';

// GoTrue's response for signInWithOtp({ shouldCreateUser: false }) against
// an email with no account: AuthApiError "Signups not allowed for otp",
// HTTP 400. Confirmed against the installed @supabase/auth-js source and
// supabase/supabase#13066 — there is no dedicated error *code* for this on
// older GoTrue versions, only the message, so message is checked first;
// `signup_disabled` is included in case a newer server populates .code.
function isNoAccountError(error: AuthError): boolean {
  return error.code === 'signup_disabled' || error.message.includes('Signups not allowed for otp');
}

/**
 * Requests a signup-or-signin OTP for `email` (shouldCreateUser: true).
 *
 * Note: Supabase does NOT distinguish "this email already has an account"
 * from "this is a brand-new email" here — signInWithOtp with
 * shouldCreateUser:true silently sends a login OTP to existing users with
 * the exact same { error: null } response as a new signup, by design (see
 * supabase/auth#1547 — this is intentional user-enumeration avoidance, not
 * a bug). Whether the email was new or existing can only be determined
 * after the code is verified, via verifyOtp()'s isNewUser — that's where
 * any "looks like you already have an account" messaging belongs.
 */
export async function sendSignUpOtp(email: string): Promise<OtpRequestResult> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });

  return { error: error ? error.message : null };
}

/**
 * Requests a signin OTP for `email` (shouldCreateUser: false). Fails with
 * AUTH_ERROR_NO_ACCOUNT_FOUND if no account exists for that email.
 */
export async function sendSignInOtp(email: string): Promise<OtpRequestResult> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });

  if (!error) return { error: null };
  if (isNoAccountError(error)) return { error: AUTH_ERROR_NO_ACCOUNT_FOUND };
  return { error: error.message };
}

/**
 * Verifies an email OTP and, on success, reports whether this auth user
 * already has a row in `users` — the calling screen uses isNewUser to
 * decide whether to route to profile creation (name/DOB) or straight past
 * it.
 */
export async function verifyOtp(email: string, token: string): Promise<VerifyOtpResult> {
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });

  if (error) {
    return { error: error.message, isNewUser: false };
  }
  if (!data.session) {
    return { error: 'Verification succeeded but no session was returned.', isNewUser: false };
  }

  const { data: existingUser, error: lookupError } = await supabase
    .from('users')
    .select('id')
    .eq('id', data.session.user.id)
    .maybeSingle();

  if (lookupError) {
    return { error: lookupError.message, isNewUser: false };
  }

  return { error: null, isNewUser: existingUser === null };
}

/**
 * Creates the `users` row for the currently authenticated session. id and
 * email come from the verified session (via getUser()), not as params —
 * they shouldn't be re-typed/re-supplied by the caller.
 */
export async function createUserProfile(
  name: string,
  dateOfBirth: string
): Promise<CreateUserProfileResult> {
  const { data, error: userError } = await supabase.auth.getUser();

  if (userError) {
    return { error: userError.message };
  }
  if (!data.user) {
    return { error: 'No authenticated user — sign in before creating a profile.' };
  }
  if (!data.user.email) {
    return { error: 'Authenticated user has no email on the session.' };
  }

  const { error } = await supabase.from('users').insert({
    id: data.user.id,
    name,
    email: data.user.email,
    date_of_birth: dateOfBirth,
  });

  return { error: error ? error.message : null };
}

/** Thin wrapper around supabase.auth.getSession(). */
export async function getCurrentSession(): Promise<GetSessionResult> {
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error: error ? error.message : null };
}

/**
 * Thin wrapper around supabase.auth.onAuthStateChange(). Returns the
 * Subscription so the caller can unsubscribe() — no React Query hook wrapper
 * yet, that's a later pass.
 */
export function subscribeToAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void
): Subscription {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(callback);
  return subscription;
}
