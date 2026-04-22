-- ============================================================================================================================
-- PMIS EXAM PORTAL — COMPLETE MASTER BACKEND SCHEMA
-- ============================================================================================================================
-- DESCRIPTION:
--   This script provides the 100% complete, production-ready backend for the PMIS Portal.
--   It is designed to be IDEMPOTENT (safe to run multiple times).
-- 
-- INSTRUCTIONS:
--   1. Open your Supabase Dashboard.
--   2. Go to the "SQL Editor" section.
--   3. Create a "New Query".
--   4. Paste this ENTIRE script and click "Run".
-- ============================================================================================================================

-- SECTION 1: EXTENSIONS
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- SECTION 2: TABLE DEFINITIONS
-- All tables created with IF NOT EXISTS for safety.

-- 1. profiles (Central User Identity)
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
  pan_card_url        TEXT,        -- Added: PAN Card support
  signature_url       TEXT,
  created_at          TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- Idempotent Column Additions (Adds columns to existing tables)
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
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pan_card_url        TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signature_url       TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at          TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW());

-- Constraints
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD  CONSTRAINT profiles_role_check CHECK (role IN ('super_admin', 'admin', 'candidate'));

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_phone_key;
ALTER TABLE public.profiles ADD  CONSTRAINT profiles_phone_key UNIQUE (phone);

-- 2. exams (Exam Definitions)
CREATE TABLE IF NOT EXISTS public.exams (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT        NOT NULL,
  description TEXT,
  duration    INTEGER     NOT NULL,   -- in minutes
  created_at  TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- 3. questions (Exam Questions)
CREATE TABLE IF NOT EXISTS public.questions (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id        UUID        REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  question_text  TEXT        NOT NULL,
  options        JSONB       NOT NULL,   -- e.g. ["A", "B", "C", "D"]
  correct_option INTEGER     NOT NULL,   -- 0-indexed
  created_at     TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- 4. submissions (Candidate Attempts)
CREATE TABLE IF NOT EXISTS public.submissions (
  id                   UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id              UUID        REFERENCES auth.users(id) NOT NULL,
  exam_id              UUID        REFERENCES public.exams(id) NOT NULL,
  score                INTEGER     NOT NULL,
  total_questions      INTEGER     NOT NULL,
  answers              JSONB       NOT NULL,   -- question index -> chosen index
  is_released          BOOLEAN     DEFAULT FALSE,
  admin_score_override INTEGER,
  submitted_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW())
);


-- SECTION 3: STORAGE BUCKETS (Public Configuration)
INSERT INTO storage.buckets (id, name, public)
VALUES ('aadhaar_cards', 'aadhaar_cards', TRUE)
ON CONFLICT (id) DO UPDATE SET public = TRUE;

INSERT INTO storage.buckets (id, name, public)
VALUES ('candidate_documents', 'candidate_documents', TRUE)
ON CONFLICT (id) DO UPDATE SET public = TRUE;


-- SECTION 4: STORAGE POLICIES
-- Drop existing policies to ensure zero-duplicate errors
DROP POLICY IF EXISTS "Public view aadhaar_cards"          ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload aadhaar_cards" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update aadhaar_cards" ON storage.objects;
DROP POLICY IF EXISTS "Public view candidate_documents"          ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload candidate_documents" ON storage.objects;

-- Create Policies
CREATE POLICY "Public view aadhaar_cards" ON storage.objects FOR SELECT USING (bucket_id = 'aadhaar_cards');
CREATE POLICY "Authenticated upload aadhaar_cards" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'aadhaar_cards');
CREATE POLICY "Authenticated update aadhaar_cards" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'aadhaar_cards');

CREATE POLICY "Public view candidate_documents" ON storage.objects FOR SELECT USING (bucket_id = 'candidate_documents');
CREATE POLICY "Authenticated upload candidate_documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'candidate_documents');


-- SECTION 5: ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Cleanup existing policies
DROP POLICY IF EXISTS "Public profiles"                       ON public.profiles;
DROP POLICY IF EXISTS "Profile self-update"                   ON public.profiles;
DROP POLICY IF EXISTS "Admin can update any profile"          ON public.profiles;
DROP POLICY IF EXISTS "Exams viewable"                        ON public.exams;
DROP POLICY IF EXISTS "Exams admin"                           ON public.exams;
DROP POLICY IF EXISTS "Questions viewable"                    ON public.questions;
DROP POLICY IF EXISTS "Questions admin"                       ON public.questions;
DROP POLICY IF EXISTS "Submissions insert"                    ON public.submissions;
DROP POLICY IF EXISTS "Submissions view"                      ON public.submissions;
DROP POLICY IF EXISTS "Submissions admin"                     ON public.submissions;

-- Core RLS Policies
CREATE POLICY "Public profiles" ON public.profiles FOR SELECT USING (TRUE);
CREATE POLICY "Profile self-update" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK(auth.uid() = id);
CREATE POLICY "Admin can update any profile" ON public.profiles FOR UPDATE USING (public.get_user_role() IN ('admin', 'super_admin'));

CREATE POLICY "Exams viewable" ON public.exams FOR SELECT USING (TRUE);
CREATE POLICY "Exams admin" ON public.exams FOR ALL USING (public.get_user_role() IN ('admin', 'super_admin'));

CREATE POLICY "Questions viewable" ON public.questions FOR SELECT USING (TRUE);
CREATE POLICY "Questions admin" ON public.questions FOR ALL USING (public.get_user_role() IN ('admin', 'super_admin'));

CREATE POLICY "Submissions insert" ON public.submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Submissions view" ON public.submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Submissions admin" ON public.submissions FOR ALL USING (public.get_user_role() IN ('admin', 'super_admin'));


-- SECTION 6: HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;


-- SECTION 7: RPC — create_candidate()
-- Robust function that handles auth.users, auth.identities, and public.profiles atomically.
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

  -- 1. Create the user in Supabase Auth (Confirmed immediately)
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated', p_email,
    crypt(p_password, gen_salt('bf')), NOW(), 
    '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', p_full_name),
    FALSE, NOW(), NOW()
  );

  -- 2. Create identity (Mandatory for GoTrue login)
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  )
  VALUES (
    gen_random_uuid(), new_user_id, format('{"sub":"%s","email":"%s"}', new_user_id::text, p_email)::jsonb,
    'email', new_user_id::text, NOW(), NOW(), NOW()
  );

  -- 3. Create the profile in public.profiles
  INSERT INTO public.profiles (
    id, email, full_name, role, profile_completed, allotted_exam_ids
  )
  VALUES (
    new_user_id, p_email, p_full_name, 'candidate', false,
    CASE WHEN p_exam_id IS NOT NULL THEN ARRAY[p_exam_id] ELSE ARRAY[]::UUID[] END
  );

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_candidate(TEXT, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_candidate(TEXT, TEXT, TEXT, UUID) TO service_role;


-- SECTION 8: RETROACTIVE IDENTITY REPAIR
-- Ensures any manually created users without identities can log in.
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
SELECT gen_random_uuid(), id, format('{"sub":"%s","email":"%s"}', id::text, email)::jsonb, 'email', id::text, NOW(), created_at, updated_at
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM auth.identities);


-- SECTION 9: REFRESH CACHE
NOTIFY pgrst, 'reload schema';


-- ============================================================================================================================
-- BOOTSTRAP INSTRUCTIONS (Run these manually as needed)
-- -------------------------------------------------------------------------
-- 1. SET FIRST ADMIN:
--    UPDATE public.profiles SET role = 'admin' WHERE email = 'YOUR_EMAIL@HERE.com';
--
-- 2. SET SUPER ADMIN (Hardcoded in logic):
--    UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@pmi.com';
-- ============================================================================================================================
