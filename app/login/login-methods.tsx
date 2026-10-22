"use client";

import { LocalPasswordSignIn } from "./local-password-sign-in";

/**
 * The login page offers exactly one route: the local username and password.
 *
 * Email OTP, WeChat QR and WorkBuddy Cloud Auth are no longer part of the login
 * chain for this private single-owner site. Their server-side code is retained
 * (disabled, not deleted) so a rollback stays possible without a data migration.
 */
export function LoginMethods() {
  return <LocalPasswordSignIn />;
}
