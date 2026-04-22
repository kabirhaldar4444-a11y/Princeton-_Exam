import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ziaonlzktgmgizkmspkh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppYW9ubHprdGdtZ2l6a21zcGtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NjA2MzAsImV4cCI6MjA5MTMzNjYzMH0.6Q0ZAiO-6HnaqjPWHlrLInkzfw59CAkUZrW5LdqX2rA'
);

async function checkAllSubs() {
  console.log('--- ALL SUBMISSIONS ---');
  const { data: subs } = await supabase.from('submissions').select('*, profiles(email), exams(title)');
  
  if (subs && subs.length > 0) {
      subs.forEach(s => {
          console.log(`User: ${s.profiles?.email} | Exam: ${s.exams?.title} | Released: ${s.is_released}`);
      });
  } else {
      console.log('No submissions found in the entire table.');
  }

  // Also check if Raj actually EXISTS as a user in AUTH
  const { data: profiles } = await supabase.from('profiles').select('*');
  console.log('\n--- ALL PROFILES ---');
  profiles.forEach(p => console.log(`Profile: ${p.email} | ID: ${p.id}`));

  console.log('--- CHECK COMPLETE ---');
}

checkAllSubs();
