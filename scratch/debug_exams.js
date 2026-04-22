import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ziaonlzktgmgizkmspkh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppYW9ubHprdGdtZ2l6a21zcGtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NjA2MzAsImV4cCI6MjA5MTMzNjYzMH0.6Q0ZAiO-6HnaqjPWHlrLInkzfw59CAkUZrW5LdqX2rA'
);

async function debug() {
  // Check profiles with allotted_exam_ids
  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, allotted_exam_ids')
    .eq('role', 'candidate');

  console.log('=== CANDIDATE PROFILES ===');
  if (pErr) console.log('Error:', pErr);
  else {
    profiles.forEach(p => {
      console.log(`  ${p.full_name || 'N/A'} (${p.email}) - allotted_exam_ids:`, JSON.stringify(p.allotted_exam_ids), '| type:', typeof p.allotted_exam_ids);
    });
  }

  // Check exams
  const { data: exams, error: eErr } = await supabase
    .from('exams')
    .select('id, title');

  console.log('\n=== EXAMS ===');
  if (eErr) console.log('Error:', eErr);
  else {
    exams.forEach(e => {
      console.log(`  ID: ${e.id} | Title: ${e.title} | ID type: ${typeof e.id}`);
    });
  }

  // Cross-reference: check if any allotted IDs match exam IDs
  console.log('\n=== CROSS REFERENCE ===');
  if (profiles && exams) {
    const examIds = exams.map(e => e.id);
    profiles.forEach(p => {
      const allotted = p.allotted_exam_ids;
      if (allotted && Array.isArray(allotted) && allotted.length > 0) {
        allotted.forEach(aid => {
          const match = examIds.includes(aid);
          console.log(`  ${p.full_name}: exam_id ${aid} (type: ${typeof aid}) -> match: ${match}`);
        });
      } else {
        console.log(`  ${p.full_name}: No allotted exams (value: ${JSON.stringify(allotted)})`);
      }
    });
  }

  // Check submissions
  const { data: submissions, error: sErr } = await supabase
    .from('submissions')
    .select('id, user_id, exam_id');

  console.log('\n=== SUBMISSIONS ===');
  if (sErr) console.log('Error:', sErr);
  else console.log(`  Total submissions: ${submissions.length}`);
}

debug();
