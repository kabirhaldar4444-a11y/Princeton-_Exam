import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function setup() {
  const email = 'admin@princeton.com';
  const password = 'qwerty@123';

  console.log(`Creating/Updating admin: ${email}...`);
  
  // 1. Create Auth User
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    if (authError.message.includes('User already registered')) {
        console.log('Account already exists in Auth. Updating profile record...');
        // If user already exists, we attempt a login to get the session ID
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email, password
        });
        
        if (loginError) {
             console.error('Login failed (Check your password):', loginError.message);
             console.log('If you want to RESET the password, please do it in the Supabase Dashboard.');
             return;
        }
        await updateProfile(loginData.user);
    } else {
        console.error('Error signing up:', authError.message);
        return;
    }
  } else if (authData.user) {
      console.log('Account created successfully in Auth.');
      await updateProfile(authData.user);
  }
}

async function updateProfile(user) {
  console.log('Setting role to "admin" in public.profiles table...');
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ 
      id: user.id, 
      role: 'admin', 
      full_name: 'Master Admin',
      email: user.email,
      profile_completed: true
    });

  if (profileError) {
    console.error('Error updating profiles table:', profileError.message);
  } else {
    console.log('\n--- SUCCESS ---');
    console.log(`Admin email: ${user.email}`);
    console.log('Role: admin (Master privileges)');
    console.log('You can now log in at http://localhost:5175');
  }
}

setup();
