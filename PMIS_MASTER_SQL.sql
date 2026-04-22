-- ============================================================================================================================
-- PMIS EXAM PORTAL — MASTER SQL BOOTSTRAP FILE
-- Paste this ENTIRE file into your Supabase SQL Editor and click "Run".
-- This is a complete, idempotent, safe-to-run script. It will not destroy existing data.
-- Execution Order:
--   1. Extensions
--   2. Table Definitions (CREATE IF NOT EXISTS + all ALTER ADD COLUMN IF NOT EXISTS)
--   3. Storage Buckets
--   4. Storage Policies
--   5. Row Level Security (RLS) — Enable + Drop Old + Create Clean
--   6. Helper Functions
--   7. RPC Function: create_candidate()
--   8. Fix Legacy Auth Records (Retroactive Identity Repair)
--   9. Schema Cache Reload
-- ============================================================================================================================


-- ============================================================================================================================
-- SECTION 1: EXTENSIONS
-- ============================================================================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- Required for crypt(), gen_salt(), gen_random_uuid()


-- ============================================================================================================================
-- SECTION 2: TABLE DEFINITIONS
-- All tables use CREATE IF NOT EXISTS so this is fully idempotent.
-- All ALTER ADD COLUMN IF NOT EXISTS statements follow to catch any gaps in existing installs.
-- ============================================================================================================================

-- ------------------------------------------------------------
-- TABLE: profiles
-- Central user table. Linked 1:1 with auth.users.
-- Covers all 3 roles: candidate, admin, super_admin
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id                  UUID        REFERENCES auth.users NOT NULL PRIMARY KEY,
  email               TEXT,
  full_name           TEXT,
  phone               TEXT,
  address             TEXT,
  state               TEXT,
  city                TEXT,
  role                TEXT        DEFAULT 'candidate',
  profile_completed   BOOLEAN     DEFAULT FALSE,
  disclaimer_accepted BOOLEAN     DEFAULT FALSE,
  allotted_exam_ids   UUID[]      DEFAULT '{}'::UUID[],
  is_exam_locked      BOOLEAN     DEFAULT FALSE,
  can_register        BOOLEAN     DEFAULT TRUE,
  profile_photo_url   TEXT,
  live_photo_url      TEXT,
  aadhaar_front_url   TEXT,
  aadhaar_back_url    TEXT,
  signature_url       TEXT,
  created_at          TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- Ensure all columns exist for pre-existing installs
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email               TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name           TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone               TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address             TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state               TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city                TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role                TEXT        DEFAULT 'candidate';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_completed   BOOLEAN     DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS disclaimer_accepted BOOLEAN     DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS allotted_exam_ids   UUID[]      DEFAULT '{}'::UUID[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_exam_locked      BOOLEAN     DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS can_register        BOOLEAN     DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_photo_url   TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS live_photo_url      TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS aadhaar_front_url   TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS aadhaar_back_url    TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signature_url       TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at          TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW());

-- Enforce role values (drop old constraint first if it exists with fewer roles)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD  CONSTRAINT profiles_role_check
  CHECK (role IN ('super_admin', 'admin', 'candidate'));

-- Enforce unique phone numbers
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_phone_key;
ALTER TABLE public.profiles ADD  CONSTRAINT profiles_phone_key UNIQUE (phone);

-- Fix array type and clean any rogue [NULL] entries from old migrations
ALTER TABLE public.profiles ALTER COLUMN allotted_exam_ids TYPE UUID[] USING
  CASE
    WHEN allotted_exam_ids IS NULL THEN '{}'::UUID[]
    WHEN allotted_exam_ids = ARRAY[NULL]::UUID[] THEN '{}'::UUID[]
    ELSE allotted_exam_ids
  END;
UPDATE public.profiles
  SET allotted_exam_ids = '{}'::UUID[]
  WHERE allotted_exam_ids IS NULL
     OR allotted_exam_ids = ARRAY[NULL]::UUID[];


-- ------------------------------------------------------------
-- TABLE: exams
-- Stores all exam definitions (created by admins).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exams (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT        NOT NULL,
  description TEXT,
  duration    INTEGER     NOT NULL,   -- in minutes
  created_at  TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS created_at  TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW());


-- ------------------------------------------------------------
-- TABLE: questions
-- Each question belongs to one exam. Cascades on exam delete.
-- options is a JSONB array of strings.
-- correct_option is a 0-based integer index.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.questions (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id        UUID        REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  question_text  TEXT        NOT NULL,
  options        JSONB       NOT NULL,   -- e.g. ["Option A", "Option B", "Option C", "Option D"]
  correct_option INTEGER     NOT NULL,   -- 0-indexed (0=A, 1=B, 2=C, 3=D)
  created_at     TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW());


-- ------------------------------------------------------------
-- TABLE: submissions
-- Records each exam attempt by a candidate.
-- submitted_at is set explicitly by the frontend (not a DB default).
-- admin_score_override allows admins to manually adjust scores.
-- is_released controls visibility of results to the candidate.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.submissions (
  id                   UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id              UUID        REFERENCES auth.users(id) NOT NULL,
  exam_id              UUID        REFERENCES public.exams(id) NOT NULL,
  score                INTEGER     NOT NULL,
  total_questions      INTEGER     NOT NULL,
  answers              JSONB       NOT NULL,   -- { "0": 2, "1": 0, ... } question index → chosen option index
  is_released          BOOLEAN     DEFAULT FALSE,
  admin_score_override INTEGER,
  submitted_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS submitted_at         TIMESTAMPTZ;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS admin_score_override INTEGER;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS is_released          BOOLEAN DEFAULT FALSE;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS created_at           TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW());


-- ============================================================================================================================
-- SECTION 3: STORAGE BUCKETS
-- Both buckets are PUBLIC (no signed URLs needed for document display).
-- ============================================================================================================================

-- Bucket 1: aadhaar_cards — stores Aadhaar front/back images and digital signatures
INSERT INTO storage.buckets (id, name, public)
VALUES ('aadhaar_cards', 'aadhaar_cards', TRUE)
ON CONFLICT (id) DO UPDATE SET public = TRUE;

-- Bucket 2: candidate_documents — stores live webcam photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('candidate_documents', 'candidate_documents', TRUE)
ON CONFLICT (id) DO NOTHING;


-- ============================================================================================================================
-- SECTION 4: STORAGE POLICIES
-- Drop and recreate to ensure clean state.
-- ============================================================================================================================

-- --- aadhaar_cards bucket policies ---
DROP POLICY IF EXISTS "Public view aadhaar_cards"          ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload aadhaar_cards" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update aadhaar_cards" ON storage.objects;

CREATE POLICY "Public view aadhaar_cards"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'aadhaar_cards');

CREATE POLICY "Authenticated upload aadhaar_cards"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'aadhaar_cards');

CREATE POLICY "Authenticated update aadhaar_cards"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'aadhaar_cards');

-- --- candidate_documents bucket policies ---
DROP POLICY IF EXISTS "Public view candidate_documents"          ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload candidate_documents" ON storage.objects;

CREATE POLICY "Public view candidate_documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'candidate_documents');

CREATE POLICY "Authenticated upload candidate_documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'candidate_documents');


-- ============================================================================================================================
-- SECTION 5: ROW LEVEL SECURITY (RLS)
-- Enable RLS on all tables, then drop all old policies and create clean ones.
-- ============================================================================================================================

ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Drop all old policies (prevents duplicate policy errors on re-run)
DROP POLICY IF EXISTS "Public profiles"                       ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profile self-update"                   ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile"    ON public.profiles;
DROP POLICY IF EXISTS "Admin can update any profile"          ON public.profiles;

DROP POLICY IF EXISTS "Exams viewable"                        ON public.exams;
DROP POLICY IF EXISTS "Anyone can view exams"                 ON public.exams;
DROP POLICY IF EXISTS "Exams admin"                           ON public.exams;
DROP POLICY IF EXISTS "Admins can manage exams"               ON public.exams;

DROP POLICY IF EXISTS "Questions viewable"                    ON public.questions;
DROP POLICY IF EXISTS "Anyone can view questions"             ON public.questions;
DROP POLICY IF EXISTS "Questions admin"                       ON public.questions;
DROP POLICY IF EXISTS "Admins can manage questions"           ON public.questions;

DROP POLICY IF EXISTS "Submissions insert"                    ON public.submissions;
DROP POLICY IF EXISTS "Users can insert their own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Submissions view"                      ON public.submissions;
DROP POLICY IF EXISTS "Users can view their own submissions"  ON public.submissions;
DROP POLICY IF EXISTS "Submissions admin"                     ON public.submissions;
DROP POLICY IF EXISTS "Admins can manage submissions"         ON public.submissions;
DROP POLICY IF EXISTS "Admins can update submissions"         ON public.submissions;

-- ---- PROFILES policies ----
-- Anyone authenticated can read all profiles (needed for admin dashboards)
CREATE POLICY "Public profiles"
  ON public.profiles FOR SELECT
  USING (TRUE);

-- Each user can update only their own profile row
CREATE POLICY "Profile self-update"
  ON public.profiles FOR UPDATE
  USING     (auth.uid() = id)
  WITH CHECK(auth.uid() = id);

-- Admins can update any profile (for allotted_exam_ids, is_exam_locked, etc.)
CREATE POLICY "Admin can update any profile"
  ON public.profiles FOR UPDATE
  USING (public.get_user_role() IN ('admin', 'super_admin'));

-- ---- EXAMS policies ----
CREATE POLICY "Exams viewable"
  ON public.exams FOR SELECT
  USING (TRUE);

CREATE POLICY "Exams admin"
  ON public.exams FOR ALL
  USING (public.get_user_role() IN ('admin', 'super_admin'));

-- ---- QUESTIONS policies ----
CREATE POLICY "Questions viewable"
  ON public.questions FOR SELECT
  USING (TRUE);

CREATE POLICY "Questions admin"
  ON public.questions FOR ALL
  USING (public.get_user_role() IN ('admin', 'super_admin'));

-- ---- SUBMISSIONS policies ----
-- Candidates can only insert their own submissions
CREATE POLICY "Submissions insert"
  ON public.submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Candidates can only view their own submissions
CREATE POLICY "Submissions view"
  ON public.submissions FOR SELECT
  USING (auth.uid() = user_id);

-- Admins have full control over all submissions (for score overrides, releasing results)
CREATE POLICY "Submissions admin"
  ON public.submissions FOR ALL
  USING (public.get_user_role() IN ('admin', 'super_admin'));


-- ============================================================================================================================
-- SECTION 6: HELPER FUNCTIONS
-- get_user_role() is the backbone of all admin RLS policies.
-- SECURITY DEFINER ensures it runs with elevated privilege and avoids
-- infinite recursion when called inside RLS policies.
-- ============================================================================================================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;


-- ============================================================================================================================
-- SECTION 7: RPC FUNCTION — create_candidate()
-- Called by admins via supabase.rpc('create_candidate', {...})
-- Creates a fully functional Supabase Auth user + identity + public profile
-- in one atomic transaction, bypassing the need for email invites.
-- 
-- Parameters:
--   p_email     TEXT  — Candidate email address
--   p_password  TEXT  — Plain-text password (will be bcrypt-hashed)
--   p_full_name TEXT  — Candidate display name
--   p_exam_id   UUID  — (Optional) Exam to immediately allot on creation
--
-- Returns: UUID of the newly created user
-- ============================================================================================================================

DROP FUNCTION IF EXISTS public.create_candidate(TEXT, TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS public.create_candidate(TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.create_candidate(
  p_email     TEXT,
  p_password  TEXT,
  p_full_name TEXT,
  p_exam_id   UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
BEGIN
  new_user_id := gen_random_uuid();

  -- STEP 1: Insert into auth.users
  -- email_confirmed_at = NOW() means the account is immediately confirmed (no email link needed)
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),   -- bcrypt hash
    NOW(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', p_full_name),
    FALSE,
    NOW(),
    NOW(),
    NULL, NULL, '', '', '', ''
  );

  -- STEP 2: Insert into auth.identities
  -- MANDATORY for Supabase GoTrue to allow password login.
  -- Without this entry, login will fail with "Invalid login credentials".
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    new_user_id,
    format('{"sub":"%s","email":"%s"}', new_user_id::TEXT, p_email)::JSONB,
    'email',
    new_user_id::TEXT,
    NOW(),
    NOW(),
    NOW()
  );

  -- STEP 3: Insert into public.profiles
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    profile_completed,
    disclaimer_accepted,
    allotted_exam_ids,
    signature_url
  )
  VALUES (
    new_user_id,
    p_email,
    p_full_name,
    'candidate',
    FALSE,
    FALSE,
    CASE WHEN p_exam_id IS NOT NULL THEN ARRAY[p_exam_id]::UUID[] ELSE '{}'::UUID[] END,
    NULL
  );

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution rights to authenticated users (admins) and service_role (server-side)
GRANT EXECUTE ON FUNCTION public.create_candidate(TEXT, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_candidate(TEXT, TEXT, TEXT, UUID) TO service_role;


-- ============================================================================================================================
-- SECTION 8: RETROACTIVE IDENTITY REPAIR
-- Fixes any existing auth.users rows that were created WITHOUT a corresponding
-- auth.identities record (which breaks password login).
-- Safe to run on fresh installs — will simply insert 0 rows.
-- ============================================================================================================================

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  u.id,
  format('{"sub":"%s","email":"%s"}', u.id::TEXT, u.email)::JSONB,
  'email',
  u.id::TEXT,
  NOW(),
  u.created_at,
  u.updated_at
FROM auth.users u
WHERE u.id NOT IN (SELECT user_id FROM auth.identities);


-- ============================================================================================================================
-- SECTION 9: SCHEMA CACHE RELOAD
-- Forces PostgREST (the Supabase API layer) to reload the schema cache
-- so all new tables, columns, and functions are immediately available via the JS client.
-- ============================================================================================================================

NOTIFY pgrst, 'reload schema';


-- ============================================================================================================================
-- END OF MASTER SQL FILE
-- ------------------------------------------------------------
-- WHAT TO DO AFTER RUNNING THIS:
--
-- 1. First Admin Account
--    Create your first admin manually in Supabase Dashboard → Authentication → Add User
--    Then run: UPDATE public.profiles SET role = 'admin' WHERE email = 'your@email.com';
--
-- 2. Super Admin Account
--    The app uses email 'admin@pmi.com' as the hardcoded super admin (checked in Users.jsx).
--    Create that user in Auth, then:
--    UPDATE public.profiles SET role = 'admin', profile_completed = true WHERE email = 'admin@pmi.com';
--
-- 3. Master Admin (info@pmi.com)
--    This is handled in AuthContext.jsx automatically. Just create the Auth user.
--
-- 4. Environment Variables (in .env or Vercel dashboard)
--    VITE_SUPABASE_URL=https://your-project.supabase.co
--    VITE_SUPABASE_ANON_KEY=your-anon-key
--
-- 5. Verify Storage Buckets exist in: Supabase Dashboard → Storage
--    - aadhaar_cards (public)
--    - candidate_documents (public)
-- ============================================================================================================================
