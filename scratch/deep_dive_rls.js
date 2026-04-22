import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ziaonlzktgmgizkmspkh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppYW9ubHprdGdtZ2l6a21zcGtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NjA2MzAsImV4cCI6MjA5MTMzNjYzMH0.6Q0ZAiO-6HnaqjPWHlrLInkzfw59CAkUZrW5LdqX2rA'
);

async function deepDive() {
  console.log('--- ADMIN DEEP DIVE ---');

  // 1. Check admin user details
  const { data: admin, error: aErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'info@pmi.com')
    .single();

  if (aErr) console.log('Admin Profile Error:', aErr.message);
  else console.log('Admin Profile in DB:', JSON.stringify(admin, null, 2));

  // 2. Check a candidate's profile to see if we can update it with service role? 
  // No, we don't have service role.
  
  // 3. Let's try to find out what RLS policies are active
  // Since we can't query pg_policies directly via anon key easily, 
  // let's try to update a profile and see if we get a more descriptive error.
  console.log('\n--- ATTEMPTING UPDATE FROM SCRIPTS (ANON KEY) ---');
  if (admin) {
     const { data, error, status } = await supabase
       .from('profiles')
       .update({ full_name: 'Master Admin Verified' })
       .eq('id', admin.id)
       .select();
     console.log('Update result for self:', { status, data, error: error?.message });
  }

  // 4. Check if there are any SQL files we missed
  // I already checked SECURE_UPGRADE.sql. 
}

deepDive();
