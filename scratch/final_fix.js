import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ziaonlzktgmgizkmspkh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppYW9ubHprdGdtZ2l6a21zcGtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NjA2MzAsImV4cCI6MjA5MTMzNjYzMH0.6Q0ZAiO-6HnaqjPWHlrLInkzfw59CAkUZrW5LdqX2rA'
);

async function finalFix() {
  console.log('--- STARTING FINAL FIX ---');

  // 1. Get the exam ID
  const { data: exams } = await supabase.from('exams').select('id, title').eq('title', 'testexam').single();
  if (!exams) {
    console.log('Exam "testexam" not found. Cannot proceed.');
    return;
  }
  const examId = exams.id;
  console.log(`Found exam: ${exams.title} (${examId})`);

  // 2. Get candidates
  const { data: candidates } = await supabase.from('profiles').select('id, email, full_name').eq('role', 'candidate');
  
  if (!candidates || candidates.length === 0) {
    console.log('No candidates found.');
  } else {
    console.log(`Allotting exam to ${candidates.length} candidates...`);
    for (const c of candidates) {
      const { error } = await supabase
        .from('profiles')
        .update({ allotted_exam_ids: [examId] })
        .eq('id', c.id);
      
      if (error) console.error(`Failed to allot for ${c.email}:`, error.message);
      else console.log(`Success: Allotted to ${c.full_name} (${c.email})`);
    }
  }

  // 3. Ensure info@pmi.com exists as admin (even if we don't know UID, we can't insert without UID from Auth)
  // But we can check if it's there.
  const { data: admin } = await supabase.from('profiles').select('*').eq('email', 'info@pmi.com').single();
  if (!admin) {
    console.log('WARNING: info@pmi.com still missing from DB profiles. It will be created next time they log in due to our code changes.');
  } else {
    console.log('Admin info@pmi.com already exists in DB.');
    if (admin.role !== 'admin') {
      await supabase.from('profiles').update({ role: 'admin' }).eq('id', admin.id);
      console.log('Updated info@pmi.com role to admin.');
    }
  }

  console.log('--- FIX COMPLETE ---');
}

finalFix();
