-- ============================================================================================================================
-- PMIS EXAM PORTAL — ADMISSIONS SCHEMA & ADMIN RPC UPGRADES
-- Paste and run this script in your Supabase SQL Editor.
-- ============================================================================================================================

-- Ensure pgcrypto extension is active
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================================================================
-- 1. TABLE DEFINITION & NON-DESTRUCTIVE UPGRADES
-- ============================================================================================================================
CREATE TABLE IF NOT EXISTS public.admissions (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name         TEXT        NOT NULL,
  email             TEXT        NOT NULL,
  phone             TEXT        NOT NULL,
  course_name       TEXT        NOT NULL,
  pincode           TEXT,
  state             TEXT,
  city              TEXT,
  address           TEXT,
  aadhaar_front_url TEXT,
  aadhaar_back_url  TEXT,
  pan_url           TEXT,
  signature_url     TEXT,
  profile_photo_url TEXT,
  video_url         TEXT,
  ip_address        TEXT,
  status            TEXT        DEFAULT 'pending',
  created_at        TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- Non-Destructive Column Upgrades
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS full_name         TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS email             TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS phone             TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS course_name       TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS pincode           TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS state             TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS city              TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS address           TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS aadhaar_front_url TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS aadhaar_back_url  TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS pan_url           TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS signature_url       TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS video_url         TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS ip_address          TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS status            TEXT DEFAULT 'pending';
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS created_at          TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW());

-- ============================================================================================================================
-- 2. STORAGE BUCKET CONFIGURATION & POLICIES
-- ============================================================================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('aadhaar_cards', 'aadhaar_cards', TRUE)
ON CONFLICT (id) DO UPDATE SET public = TRUE;

INSERT INTO storage.buckets (id, name, public)
VALUES ('candidate_documents', 'candidate_documents', TRUE)
ON CONFLICT (id) DO UPDATE SET public = TRUE;

-- Storage Policies for aadhaar_cards
DROP POLICY IF EXISTS "Public view aadhaar_cards" ON storage.objects;
DROP POLICY IF EXISTS "Public upload aadhaar_cards" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload aadhaar_cards" ON storage.objects;

CREATE POLICY "Public view aadhaar_cards" ON storage.objects 
  FOR SELECT USING (bucket_id = 'aadhaar_cards');

CREATE POLICY "Public upload aadhaar_cards" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'aadhaar_cards');

-- Storage Policies for candidate_documents
DROP POLICY IF EXISTS "Public view candidate_documents" ON storage.objects;
DROP POLICY IF EXISTS "Public upload candidate_documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload candidate_documents" ON storage.objects;

CREATE POLICY "Public view candidate_documents" ON storage.objects 
  FOR SELECT USING (bucket_id = 'candidate_documents');

CREATE POLICY "Public upload candidate_documents" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'candidate_documents');

-- ============================================================================================================================
-- 3. ROW LEVEL SECURITY (RLS) FOR ADMISSIONS TABLE
-- ============================================================================================================================
ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public insert admissions" ON public.admissions;
DROP POLICY IF EXISTS "Public select admissions" ON public.admissions;
DROP POLICY IF EXISTS "Admin select admissions"  ON public.admissions;
DROP POLICY IF EXISTS "Admin update admissions"  ON public.admissions;
DROP POLICY IF EXISTS "Admin delete admissions"  ON public.admissions;

-- Allow anyone (anon + authenticated) to submit admission forms
CREATE POLICY "Public insert admissions" ON public.admissions 
  FOR INSERT TO public WITH CHECK (TRUE);

-- Allow public to select rows (required for RETURNING * or application verification)
CREATE POLICY "Public select admissions" ON public.admissions 
  FOR SELECT TO public USING (TRUE);

-- Restrict UPDATE to admins and super_admins
CREATE POLICY "Admin update admissions" ON public.admissions 
  FOR UPDATE USING (public.get_user_role() IN ('admin', 'super_admin'));

-- Restrict DELETE to admins and super_admins
CREATE POLICY "Admin delete admissions" ON public.admissions 
  FOR DELETE USING (public.get_user_role() IN ('admin', 'super_admin'));

-- Grant table privileges
GRANT ALL ON public.admissions TO anon, authenticated, service_role;

-- ============================================================================================================================
-- 4. PHONE & EMAIL UNIQUENESS VALIDATION TRIGGER
-- ============================================================================================================================
CREATE OR REPLACE FUNCTION public.validate_admission_uniqueness()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if candidate email exists in public.profiles
  IF EXISTS (SELECT 1 FROM public.profiles WHERE LOWER(email) = LOWER(TRIM(NEW.email))) THEN
    RAISE EXCEPTION 'User with email % is already registered in the system.', NEW.email;
  END IF;

  -- Check if candidate phone exists in public.profiles
  IF EXISTS (SELECT 1 FROM public.profiles WHERE TRIM(phone) = TRIM(NEW.phone)) THEN
    RAISE EXCEPTION 'Candidate with phone number % already exists.', NEW.phone;
  END IF;

  -- Check if candidate email has an existing pending application
  IF EXISTS (SELECT 1 FROM public.admissions WHERE LOWER(email) = LOWER(TRIM(NEW.email)) AND status = 'pending') THEN
    RAISE EXCEPTION 'Candidate with email % already has a pending admission application.', NEW.email;
  END IF;

  -- Check if candidate phone has an existing pending application
  IF EXISTS (SELECT 1 FROM public.admissions WHERE TRIM(phone) = TRIM(NEW.phone) AND status = 'pending') THEN
    RAISE EXCEPTION 'Candidate with phone number % already exists.', NEW.phone;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_validate_admission_uniqueness ON public.admissions;
CREATE TRIGGER trigger_validate_admission_uniqueness
  BEFORE INSERT ON public.admissions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_admission_uniqueness();

-- ============================================================================================================================
-- 5. RPC — create_user_from_admission()
-- Single transaction function for admin approval & user account generation
-- ============================================================================================================================
CREATE OR REPLACE FUNCTION public.create_user_from_admission(
  p_admission_id UUID,
  p_password     TEXT,
  p_exam_id      UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_admission RECORD;
  v_new_user_id UUID;
BEGIN
  -- Verify requester is an admin or super_admin
  IF NOT (public.get_user_role() IN ('admin', 'super_admin')) THEN
    RAISE EXCEPTION 'Access Denied: Only administrators can approve admissions and create accounts.';
  END IF;

  -- Fetch admission record
  SELECT * INTO v_admission FROM public.admissions WHERE id = p_admission_id;

  IF v_admission IS NULL THEN
    RAISE EXCEPTION 'Admission record with ID % not found.', p_admission_id;
  END IF;

  -- Check if email or phone already registered in profiles
  IF EXISTS (SELECT 1 FROM public.profiles WHERE LOWER(email) = LOWER(TRIM(v_admission.email))) THEN
    RAISE EXCEPTION 'User with email % is already registered.', v_admission.email;
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE TRIM(phone) = TRIM(v_admission.phone)) THEN
    RAISE EXCEPTION 'Candidate with phone number % already exists.', v_admission.phone;
  END IF;

  v_new_user_id := gen_random_uuid();

  -- 1. Create User in auth.users
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at,
    phone, phone_confirmed_at, confirmation_token, recovery_token, email_change_token_new, email_change
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_new_user_id,
    'authenticated',
    'authenticated',
    v_admission.email,
    crypt(p_password, gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', v_admission.full_name),
    FALSE,
    NOW(),
    NOW(),
    NULL, NULL, '', '', '', ''
  );

  -- 2. Create Email Identity in auth.identities
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  )
  VALUES (
    gen_random_uuid(),
    v_new_user_id,
    format('{"sub":"%s","email":"%s"}', v_new_user_id::text, v_admission.email)::jsonb,
    'email',
    v_new_user_id::text,
    NOW(),
    NOW(),
    NOW()
  );

  -- 3. Create Candidate Profile in public.profiles
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone,
    address,
    state,
    city,
    role,
    profile_completed,
    disclaimer_accepted,
    allotted_exam_ids,
    aadhaar_front_url,
    aadhaar_back_url,
    signature_url,
    pan_card_url,
    profile_photo_url,
    live_photo_url,
    ip_address,
    created_at
  )
  VALUES (
    v_new_user_id,
    v_admission.email,
    v_admission.full_name,
    v_admission.phone,
    v_admission.address,
    v_admission.state,
    v_admission.city,
    'candidate',
    TRUE,
    TRUE,
    CASE WHEN p_exam_id IS NOT NULL THEN ARRAY[p_exam_id] ELSE ARRAY[]::UUID[] END,
    v_admission.aadhaar_front_url,
    v_admission.aadhaar_back_url,
    v_admission.signature_url,
    v_admission.pan_url,
    COALESCE(v_admission.profile_photo_url, v_admission.video_url),
    v_admission.profile_photo_url,
    v_admission.ip_address,
    NOW()
  );

  -- 4. Mark Admission Status as Approved
  UPDATE public.admissions
  SET status = 'approved'
  WHERE id = p_admission_id;

  RETURN v_new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_user_from_admission(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_from_admission(UUID, TEXT, UUID) TO service_role;

-- Refresh cache
NOTIFY pgrst, 'reload schema';
