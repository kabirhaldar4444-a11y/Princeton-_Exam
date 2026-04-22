import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ziaonlzktgmgizkmspkh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppYW9ubHprdGdtZ2l6a21zcGtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NjA2MzAsImV4cCI6MjA5MTMzNjYzMH0.6Q0ZAiO-6HnaqjPWHlrLInkzfw59CAkUZrW5LdqX2rA'
);

async function debugRaj() {
  console.log('--- DEBUGGING RAJ ---');

  // 1. Get Raj's ID
  const { data: users } = await supabase.from('profiles').select('*').eq('email', 'raj@gmail.com').single();
  if (!users) {
      console.log('Raj not found!');
      return;
  }
  console.log(`Raj found: ${users.id}`);

  // 2. Get Submissions
  const { data: subs } = await supabase.from('submissions').select('*, exams(title)').eq('user_id', users.id);
  console.log(`Submissions found for Raj: ${subs.length}`);

  subs.forEach(s => {
      console.log(`Exam: ${s.exams?.title} (${s.exam_id}) | score: ${s.score} | is_released: ${s.is_released} | admin_score_override: ${s.admin_score_override}`);
  });

  console.log('--- DEBUG COMPLETE ---');
}

debugRaj();
