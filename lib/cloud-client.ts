"use client";

import { createWorkBuddyCloud, type WorkBuddyCloudClient } from "@tencent-ai/workbuddy-cloud-sdk";
import { CLOUD_OAUTH_RELAY_BASE_URL, CLOUD_PUBLISHABLE_KEY } from "./cloud-config";

/**
 * The single WorkBuddy cloud client, created lazily in the browser.
 *
 * `endpoint` is intentionally omitted, which is the SDK's recommended form: the
 * data plane `/.cloud/**` is same-origin with the app, and a hard-coded absolute
 * value goes stale when the app is republished onto a new domain.
 *
 * Omitting it means the SDK resolves `location.origin`, which does not exist outside
 * a browser — so the client must never be constructed at module scope: the first
 * render of a client component also happens on the server, where that constructor
 * throws. Hence this lazy factory, resolved only from effects and event handlers.
 *
 * `oauthRelayBaseUrl` is mandatory for web WeChat QR login: the relay runs on the
 * central gateway domain and cannot be derived from the app origin.
 */
let cached: WorkBuddyCloudClient | null = null;

export function getCloud(): WorkBuddyCloudClient {
  if (typeof window === "undefined") {
    throw new Error("WorkBuddy cloud client is browser-only");
  }
  if (!cached) {
    cached = createWorkBuddyCloud({
      publishableKey: CLOUD_PUBLISHABLE_KEY,
      oauthRelayBaseUrl: CLOUD_OAUTH_RELAY_BASE_URL,
    });
  }
  return cached;
}
