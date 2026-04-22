const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Testing connection to:', supabaseUrl);
  const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
  
  if (error) {
    console.error('Error detected:', error.message);
    console.error('Full Error:', JSON.stringify(error, null, 2));
  } else {
    console.log('Connection successful! Profiles accessible.');
  }
}

test();
