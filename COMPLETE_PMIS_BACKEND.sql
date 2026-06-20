-- ============================================================================================================================
-- PMIS EXAM PORTAL — COMPLETE MASTER BACKEND SCHEMA
-- Paste this ENTIRE file into your Supabase SQL Editor and click "Run".
-- This is a complete, idempotent, safe-to-run script that sets up the database and default Super Admin.
-- ============================================================================================================================

-- ============================================================================================================================
-- SECTION 1: EXTENSIONS
-- ============================================================================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- Required for crypt(), gen_salt(), gen_random_uuid()

-- ============================================================================================================================
-- SECTION 2: TABLE DEFINITIONS
-- ============================================================================================================================

-- 1. TABLE: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id                  UUID        REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
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
  pan_card_url        TEXT,
  ip_address          TEXT,
  created_at          TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- Ensure all columns exist for pre-existing tables if any
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
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pan_card_url        TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ip_address          TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at          TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW());

-- Enforce delete cascade for existing profile tables
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Enforce role values and constraints
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD  CONSTRAINT profiles_role_check CHECK (role IN ('super_admin', 'admin', 'candidate'));

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_phone_key;
ALTER TABLE public.profiles ADD  CONSTRAINT profiles_phone_key UNIQUE (phone);

-- Clean array type default
ALTER TABLE public.profiles ALTER COLUMN allotted_exam_ids TYPE UUID[] USING
  CASE
    WHEN allotted_exam_ids IS NULL THEN '{}'::UUID[]
    WHEN allotted_exam_ids = ARRAY[NULL]::UUID[] THEN '{}'::UUID[]
    ELSE allotted_exam_ids
  END;

-- 2. TABLE: exams
CREATE TABLE IF NOT EXISTS public.exams (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT        NOT NULL,
  description TEXT,
  duration    INTEGER     NOT NULL,   -- in minutes
  created_at  TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS created_at  TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW());

-- 3. TABLE: questions
CREATE TABLE IF NOT EXISTS public.questions (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id        UUID        REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  question_text  TEXT        NOT NULL,
  options        JSONB       NOT NULL,
  correct_option INTEGER     NOT NULL,   -- 0-indexed
  explanation    TEXT        DEFAULT '',
  created_at     TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS explanation TEXT DEFAULT '';
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW());

-- 4. TABLE: submissions
CREATE TABLE IF NOT EXISTS public.submissions (
  id                   UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id              UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exam_id              UUID        REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  score                INTEGER     NOT NULL,
  total_questions      INTEGER     NOT NULL,
  answers              JSONB       NOT NULL,   -- question index → chosen option index
  is_released          BOOLEAN     DEFAULT FALSE,
  admin_score_override INTEGER,
  submitted_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS submitted_at         TIMESTAMPTZ;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS admin_score_override INTEGER;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS is_released          BOOLEAN DEFAULT FALSE;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS created_at           TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW());

-- Enforce delete cascade for existing submissions tables
ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS submissions_user_id_fkey;
ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS submissions_exam_id_fkey;
ALTER TABLE public.submissions ADD CONSTRAINT submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.submissions ADD CONSTRAINT submissions_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON DELETE CASCADE;


-- ============================================================================================================================
-- SECTION 3: STORAGE BUCKETS
-- ============================================================================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('aadhaar_cards', 'aadhaar_cards', TRUE)
ON CONFLICT (id) DO UPDATE SET public = TRUE;

INSERT INTO storage.buckets (id, name, public)
VALUES ('candidate_documents', 'candidate_documents', TRUE)
ON CONFLICT (id) DO UPDATE SET public = TRUE;


-- ============================================================================================================================
-- SECTION 4: HELPER FUNCTIONS (Defined before RLS Policies)
-- ============================================================================================================================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;


-- ============================================================================================================================
-- SECTION 5: ROW LEVEL SECURITY (RLS) & POLICIES
-- ============================================================================================================================
ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

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


-- ============================================================================================================================
-- SECTION 6: STORAGE POLICIES
-- ============================================================================================================================
DROP POLICY IF EXISTS "Public view aadhaar_cards"          ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload aadhaar_cards" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update aadhaar_cards" ON storage.objects;
DROP POLICY IF EXISTS "Public view candidate_documents"          ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload candidate_documents" ON storage.objects;

CREATE POLICY "Public view aadhaar_cards" ON storage.objects FOR SELECT USING (bucket_id = 'aadhaar_cards');
CREATE POLICY "Authenticated upload aadhaar_cards" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'aadhaar_cards');
CREATE POLICY "Authenticated update aadhaar_cards" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'aadhaar_cards');

CREATE POLICY "Public view candidate_documents" ON storage.objects FOR SELECT USING (bucket_id = 'candidate_documents');
CREATE POLICY "Authenticated upload candidate_documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'candidate_documents');


-- ============================================================================================================================
-- SECTION 7: RPC — create_candidate()
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

  -- 1. Create the user in Supabase Auth
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at,
    phone, phone_confirmed_at, confirmation_token, recovery_token, email_change_token_new, email_change
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated', p_email,
    crypt(p_password, gen_salt('bf')), NOW(), 
    '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', p_full_name),
    FALSE, NOW(), NOW(),
    NULL, NULL, '', '', '', ''
  );

  -- 2. Create identity
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


-- ============================================================================================================================
-- SECTION 7.5: RPC — delete_user()
-- ============================================================================================================================
CREATE OR REPLACE FUNCTION public.delete_user(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Verify requester is an admin or super_admin
  IF NOT (public.get_user_role() IN ('admin', 'super_admin')) THEN
    RAISE EXCEPTION 'Access Denied: Only administrators can delete users.';
  END IF;

  -- 1. Delete from public.submissions
  DELETE FROM public.submissions WHERE user_id = p_user_id;

  -- 2. Delete from public.profiles
  DELETE FROM public.profiles WHERE id = p_user_id;

  -- 3. Delete from auth.users (cascades to identities)
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.delete_user(UUID) TO authenticated;
-- SECTION 8: RETROACTIVE IDENTITY REPAIR
-- ============================================================================================================================
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
SELECT gen_random_uuid(), id, format('{"sub":"%s","email":"%s"}', id::text, email)::jsonb, 'email', id::text, NOW(), created_at, updated_at
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM auth.identities);


-- ============================================================================================================================
-- SECTION 9: SEED DEFAULT SUPER ADMIN
-- ============================================================================================================================
DO $$
DECLARE
  v_admin_id UUID := '00000000-0000-4000-a000-000000000001';
  v_email TEXT := 'kabirhaldar4444@gmail.com';
  v_password TEXT := '123456';
  v_full_name TEXT := 'Super Admin';
BEGIN
  -- 1. Insert into auth.users if not exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_admin_id OR email = v_email) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at,
      phone, phone_confirmed_at, confirmation_token, recovery_token, email_change_token_new, email_change
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_admin_id,
      'authenticated',
      'authenticated',
      v_email,
      crypt(v_password, gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('full_name', v_full_name),
      FALSE,
      NOW(),
      NOW(),
      NULL, NULL, '', '', '', ''
    );
  END IF;

  -- Resolve actual ID (in case it existed under a different ID already)
  SELECT id INTO v_admin_id FROM auth.users WHERE email = v_email;

  -- 2. Insert into auth.identities if not exists
  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_admin_id) THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    )
    VALUES (
      gen_random_uuid(),
      v_admin_id,
      format('{"sub":"%s","email":"%s"}', v_admin_id::TEXT, v_email)::JSONB,
      'email',
      v_admin_id::TEXT,
      NOW(),
      NOW(),
      NOW()
    );
  END IF;

  -- 3. Insert into public.profiles if not exists or update role
  INSERT INTO public.profiles (
    id, email, full_name, role, profile_completed, disclaimer_accepted, allotted_exam_ids
  )
  VALUES (
    v_admin_id,
    v_email,
    v_full_name,
    'admin',
    TRUE,
    TRUE,
    '{}'::UUID[]
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    profile_completed = EXCLUDED.profile_completed,
    disclaimer_accepted = EXCLUDED.disclaimer_accepted;

END $$;


-- ============================================================================================================================
-- SECTION 10: REFRESH CACHE
-- ============================================================================================================================
NOTIFY pgrst, 'reload schema';
