import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ziaonlzktgmgizkmspkh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppYW9ubHprdGdtZ2l6a21zcGtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NjA2MzAsImV4cCI6MjA5MTMzNjYzMH0.6Q0ZAiO-6HnaqjPWHlrLInkzfw59CAkUZrW5LdqX2rA'
);

async function testUpdate() {
  // First, get a candidate profile and the exam
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, full_name, allotted_exam_ids')
    .eq('role', 'candidate')
    .limit(1);

  const { data: exams } = await supabase
    .from('exams')
    .select('id, title')
    .limit(1);

  if (!profiles?.length || !exams?.length) {
    console.log('No profiles or exams found');
    return;
  }

  const testProfile = profiles[0];
  const testExam = exams[0];
  
  console.log(`Testing update for: ${testProfile.full_name} (${testProfile.email})`);
  console.log(`Exam to allot: ${testExam.title} (${testExam.id})`);
  console.log(`Current allotted_exam_ids: ${JSON.stringify(testProfile.allotted_exam_ids)}`);

  // Try updating allotted_exam_ids
  const { data, error } = await supabase
    .from('profiles')
    .update({ allotted_exam_ids: [testExam.id] })
    .eq('id', testProfile.id)
    .select();

  console.log('\n=== UPDATE RESULT ===');
  if (error) {
    console.log('ERROR:', error);
  } else {
    console.log('Updated data:', JSON.stringify(data));
  }

  // Verify the update
  const { data: verify } = await supabase
    .from('profiles')
    .select('id, email, allotted_exam_ids')
    .eq('id', testProfile.id)
    .single();

  console.log('\n=== VERIFICATION ===');
  console.log('allotted_exam_ids after update:', JSON.stringify(verify?.allotted_exam_ids));
}

testUpdate();
