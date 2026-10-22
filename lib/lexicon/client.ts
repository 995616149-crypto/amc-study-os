"use client";

/**
 * Lazy client access to the curated lexicon.
 *
 * The dictionary data (a few hundred entries) must never sit in the first-paint
 * bundle, so it is imported on demand and cached in a module-level promise. After
 * the first load every lookup is synchronous.
 */

import type { WordEntry } from "@/lib/word-lookup-core";

type LexiconModule = typeof import("./clinical-lexicon");

let loading: Promise<LexiconModule> | null = null;
let loaded: LexiconModule | null = null;

export function loadLexicon(): Promise<LexiconModule> {
  if (loaded) return Promise.resolve(loaded);
  if (!loading) {
    loading = import("./clinical-lexicon").then((module) => {
      loaded = module;
      return module;
    }).catch((error) => {
      loading = null;
      throw error;
    });
  }
  return loading;
}

export function isLexiconReady(): boolean {
  return loaded !== null;
}

/** Synchronous lookup; returns null while the chunk is still loading. */
export function peekLocal(surface: string, context: string): WordEntry | null {
  if (!loaded) return null;
  return loaded.lookupLocal(surface, context) as WordEntry | null;
}

/** Fire-and-forget warm-up. Any failure is non-fatal: cold words still work. */
export function warmLexicon(): void {
  void loadLexicon().catch(() => {});
}
