import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ziaonlzktgmgizkmspkh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppYW9ubHprdGdtZ2l6a21zcGtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NjA2MzAsImV4cCI6MjA5MTMzNjYzMH0.6Q0ZAiO-6HnaqjPWHlrLInkzfw59CAkUZrW5LdqX2rA'
);

async function checkSchema() {
  // Query a profile to see the structure
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return;
  }

  console.log('Profile keys:', Object.keys(profile));
  console.log('allotted_exam_ids value:', profile.allotted_exam_ids);
  console.log('allotted_exam_ids type:', typeof profile.allotted_exam_ids);
  console.log('Is array?', Array.isArray(profile.allotted_exam_ids));

  // Check if there's a singular column too
  console.log('Is there allotted_exam_id?', 'allotted_exam_id' in profile);
  
  // Check the admin user
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'info@pmi.com')
    .single();

  console.log('\nAdmin Profile in DB (info@pmi.com):', adminProfile ? {
    id: adminProfile.id,
    email: adminProfile.email,
    role: adminProfile.role
  } : 'NOT FOUND IN DB');
}

checkSchema();
