const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
  console.log('Attempting login simulation for user3@gmail.com...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'user3@gmail.com',
    password: 'ABC123'
  });

  if (error) {
    console.error('Login Error:', error.message);
    console.error('Full Error Object:', JSON.stringify(error, null, 2));
  } else {
    console.log('Login logic reached user. Checking profile...');
    const { data: profile, error: pError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
      
    if (pError) {
      console.error('Profile query failed:', pError.message);
      console.error('Full Profile Error:', JSON.stringify(pError, null, 2));
    } else {
      console.log('Profile fetched successfully:', profile.full_name);
    }
  }
}

testLogin();
