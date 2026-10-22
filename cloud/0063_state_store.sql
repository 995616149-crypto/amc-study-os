-- AMC Study OS — durable learner-state store (WorkBuddy Cloud Database / PostgreSQL)
--
-- WHY THIS EXISTS
-- ---------------
-- The deployment ships its D1 file inside the uploaded project tree and starts
-- `wrangler dev --local --persist-to .wrangler/state`.  Every publish therefore
-- replaces the live database with the developer's local copy.  Measured, not
-- assumed: a marker row written on the live site disappeared after a republish and
-- the attempt count fell back 28 -> 27.
--
-- Content (questions, textbook, canonical tables) is immutable/rebuildable and may
-- keep travelling in the bundled D1.  Learner state may not.  This schema is the
-- durable copy of that state.
--
-- SHAPE
-- -----
-- One row per SQLite table, holding that table's rows as JSON.  Deliberately NOT a
-- per-column mirror: the app's ~50 mutable statements are written in SQLite
-- dialect, and hand-translating WHERE/ORDER BY/LIKE/subqueries to PostgREST would
-- put the learner record behind a translator that can fail silently.  A row-level
-- snapshot cannot corrupt a row: whatever was read back is exactly what is written
-- back, and the restore path is plain SQLite again.
--
-- ACCESS
-- ------
-- RLS is enabled with NO policy and every table privilege is revoked from `anon`
-- and `authenticated`, so the publishable key — which is public, it ships in the
-- browser bundle — cannot read or write this table at all.  The only way in is the
-- two SECURITY DEFINER functions below, and both require the server-side secret.
-- A wrong secret raises; there is no partial access.
--
-- BEFORE RUNNING THIS FILE: replace every `__SET_STATE_SECRET__` below with a long
-- random string of your own (e.g. `openssl rand -hex 32`), then set the same value
-- as the server-only `STATE_SECRET` environment variable.  The two must match.  If
-- you leave the placeholder in place, the guard is public and protects nothing.
-- Leaving it unset server-side simply disables cloud state mirroring, and the app
-- stores learner state in its own D1 database instead.

CREATE TABLE IF NOT EXISTS public.app_state_snapshot (
  table_name  text PRIMARY KEY,
  revision    bigint      NOT NULL,
  row_count   integer     NOT NULL DEFAULT 0,
  payload     jsonb       NOT NULL DEFAULT '[]'::jsonb,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.app_state_snapshot IS
  'Durable mirror of AMC Study OS mutable learner state; one row per source table, rows as JSON.';

ALTER TABLE public.app_state_snapshot ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.app_state_snapshot FROM anon, authenticated;

-- Read every snapshot row.  Returns [] on a fresh store.
CREATE OR REPLACE FUNCTION public.amc_state_load(p_secret text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  result jsonb;
BEGIN
  IF p_secret IS DISTINCT FROM '__SET_STATE_SECRET__' THEN
    RAISE EXCEPTION 'amc_state_unauthorised' USING ERRCODE = '42501';
  END IF;
  SELECT coalesce(jsonb_agg(jsonb_build_object(
           'table_name', t.table_name,
           'revision',   t.revision,
           'row_count',  t.row_count,
           'payload',    t.payload)), '[]'::jsonb)
    INTO result
    FROM public.app_state_snapshot t;
  RETURN result;
END;
$fn$;

-- Upsert one table's snapshot.  `p_revision` is monotonic: a snapshot never moves
-- backwards, so a stale writer cannot overwrite newer live state.
CREATE OR REPLACE FUNCTION public.amc_state_sync(
  p_secret   text,
  p_table    text,
  p_revision bigint,
  p_rows     integer,
  p_payload  jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF p_secret IS DISTINCT FROM '__SET_STATE_SECRET__' THEN
    RAISE EXCEPTION 'amc_state_unauthorised' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.app_state_snapshot (table_name, revision, row_count, payload, updated_at)
  VALUES (p_table, p_revision, p_rows, p_payload, now())
  ON CONFLICT (table_name) DO UPDATE
     SET revision   = EXCLUDED.revision,
         row_count  = EXCLUDED.row_count,
         payload    = EXCLUDED.payload,
         updated_at = EXCLUDED.updated_at
   WHERE EXCLUDED.revision >= public.app_state_snapshot.revision;
  RETURN jsonb_build_object('ok', true, 'table', p_table, 'revision', p_revision, 'rows', p_rows);
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.amc_state_load(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.amc_state_sync(text, text, bigint, integer, jsonb) TO anon, authenticated;
