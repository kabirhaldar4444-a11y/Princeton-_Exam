import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testLogin() {
  console.log("Attempting login...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'use@gmail.com',
    password: 'ABC123'
  });

  if (authError) {
    console.error("Auth Error:", authError);
    return;
  }

  console.log("Login successful. Fetching profile for ID:", authData.user.id);
  
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (profileError) {
    console.error("Profile Fetch Error:", profileError);
  } else {
    console.log("Profile Data:", profile);
  }
}

testLogin();
