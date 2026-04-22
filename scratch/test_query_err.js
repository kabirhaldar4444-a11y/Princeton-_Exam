import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ziaonlzktgmgizkmspkh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppYW9ubHprdGdtZ2l6a21zcGtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NjA2MzAsImV4cCI6MjA5MTMzNjYzMH0.6Q0ZAiO-6HnaqjPWHlrLInkzfw59CAkUZrW5LdqX2rA'
);

async function checkSubmissions() {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .order('submitted_at', { ascending: false });

  if (error) {
    console.log('QUERY ERROR:', error.message);
  } else {
    console.log('QUERY SUCCESS:', data.length, 'records');
  }
}

checkSubmissions();
