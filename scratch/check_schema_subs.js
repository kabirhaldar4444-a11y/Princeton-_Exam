import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ziaonlzktgmgizkmspkh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppYW9ubHprdGdtZ2l6a21zcGtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NjA2MzAsImV4cCI6MjA5MTMzNjYzMH0.6Q0ZAiO-6HnaqjPWHlrLInkzfw59CAkUZrW5LdqX2rA'
);

async function checkSubmissions() {
  console.log('--- SUBMISSIONS CHECK ---');
  // Try to insert a dummy submission to see if the table exists and what columns it has
  // Actually, let's just query it.
  const { data, error } = await supabase.from('submissions').select('*').limit(1);
  if (error) {
      console.log('Error querying submissions:', error.message);
  } else {
      console.log('Columns in submissions:', data && data.length > 0 ? Object.keys(data[0]) : 'No data, but table exists');
  }

  // Check if raj exists
  const { data: p } = await supabase.from('profiles').select('*').eq('email', 'raj@gmail.com').single();
  console.log('Raj Profile:', p);

  console.log('--- CHECK COMPLETE ---');
}

checkSubmissions();
