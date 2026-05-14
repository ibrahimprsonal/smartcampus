-- SMART CAMPUS INITIAL SCHEMA

-- 1. ENUMS
CREATE TYPE user_role AS ENUM ('student', 'cr', 'acr', 'teacher', 'super_admin');
CREATE TYPE user_status AS ENUM ('pending', 'approved', 'rejected', 'banned');
CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE notice_type AS ENUM ('notice', 'deadline');

-- 2. TABLES

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    student_id TEXT UNIQUE, 
    department TEXT,
    semester TEXT,
    section TEXT,
    whatsapp_number TEXT,
    address TEXT,
    status user_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notices table
CREATE TABLE public.notices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type notice_type NOT NULL DEFAULT 'notice',
    deadline_at TIMESTAMPTZ,
    is_global BOOLEAN DEFAULT FALSE,
    target_department TEXT,
    target_semester TEXT,
    target_section TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notice Links
CREATE TABLE public.notice_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    notice_id UUID REFERENCES public.notices(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    button_text TEXT NOT NULL,
    sort_order INT DEFAULT 0
);

-- Acknowledgments (Read Receipts)
CREATE TABLE public.acknowledgments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    notice_id UUID REFERENCES public.notices(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(notice_id, user_id)
);

-- Discussion Posts
CREATE TABLE public.discussion_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    department TEXT NOT NULL,
    semester TEXT NOT NULL,
    section TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Message Requests
CREATE TABLE public.message_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status request_status DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(sender_id, receiver_id)
);

-- Messages
CREATE TABLE public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Section Requests
CREATE TABLE public.section_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    from_department TEXT,
    from_semester TEXT,
    from_section TEXT,
    to_department TEXT,
    to_semester TEXT,
    to_section TEXT,
    status request_status DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activity Log
CREATE TABLE public.activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ROW LEVEL SECURITY (RLS)

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notice_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Super Admins can view all profiles" ON public.profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
);
CREATE POLICY "CR/ACR can view profiles in their section" ON public.profiles FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.profiles AS viewer 
        WHERE viewer.id = auth.uid() 
        AND viewer.role IN ('cr', 'acr')
        AND viewer.department = public.profiles.department
        AND viewer.semester = public.profiles.semester
        AND viewer.section = public.profiles.section
    )
);

-- Notices Policies
CREATE POLICY "Anyone approved can view global notices" ON public.notices FOR SELECT USING (
    is_global = TRUE AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'approved')
);
CREATE POLICY "Users can view notices targeted to their section" ON public.notices FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND status = 'approved'
        AND target_department = department
        AND target_semester = semester
        AND target_section = section
    )
);
CREATE POLICY "Teachers and Admins can create notices" ON public.notices FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'super_admin', 'cr', 'acr'))
);

-- Discussion Posts Policies
CREATE POLICY "Users can view/create posts in their own section" ON public.discussion_posts FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND status = 'approved'
        AND department = public.discussion_posts.department
        AND semester = public.discussion_posts.semester
        AND section = public.discussion_posts.section
    )
);

-- 4. FUNCTIONS & TRIGGERS

-- Automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, status)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', (NEW.raw_user_meta_data->>'role')::user_role, 'pending');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to log activity
CREATE OR REPLACE FUNCTION public.log_activity(action_text TEXT, detail_json JSONB DEFAULT '{}'::jsonb)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.activity_log (user_id, action, details)
  VALUES (auth.uid(), action_text, detail_json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. SEED DATA

-- Seed Super Admin (Note: In a real Supabase environment, you would usually create this via the dashboard or CLI)
-- This SQL attempts to seed into auth.users and public.profiles.
-- Ensure extensions are available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  super_admin_id UUID := gen_random_uuid();
BEGIN
  -- Insert into auth.users (if not exists)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'ibrahimprsonal@gmail.com') THEN
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, confirmation_token, recovery_token)
    VALUES (
      super_admin_id,
      'ibrahimprsonal@gmail.com',
      extensions.crypt('JGDa@@2345##', extensions.gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Super Admin","role":"super_admin"}',
      NOW(),
      NOW(),
      'authenticated',
      '',
      ''
    );

    -- The trigger handle_new_user will automatically insert into public.profiles with status 'pending'
    -- We need to update it to 'approved' and ensure it has the 'super_admin' role if not already set.
    UPDATE public.profiles 
    SET status = 'approved', role = 'super_admin' 
    WHERE id = super_admin_id;
  END IF;
END $$;
