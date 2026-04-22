import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ziaonlzktgmgizkmspkh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppYW9ubHprdGdtZ2l6a21zcGtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NjA2MzAsImV4cCI6MjA5MTMzNjYzMH0.6Q0ZAiO-6HnaqjPWHlrLInkzfw59CAkUZrW5LdqX2rA'
);

async function checkQuestions() {
  console.log('--- CHECKING QUESTIONS ---');

  // 1. Get the exam
  const { data: exams } = await supabase.from('exams').select('*');
  console.log('Exams found:', exams.length);

  for (const e of exams) {
      const { data: qData } = await supabase.from('questions').select('id').eq('exam_id', e.id);
      console.log(`Exam: ${e.title} (${e.id}) - Questions: ${qData ? qData.length : 0}`);
  }

  console.log('--- CHECK COMPLETE ---');
}

checkQuestions();
