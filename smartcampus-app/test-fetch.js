const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: './.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'ibrahimprsonal2@gmail.com',
    password: 'JGDa@@2345##',
  });

  if (authError) {
    console.error("Auth error:", authError);
    return;
  }

  const userId = authData.user.id;
  console.log("Logged in user:", userId);

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  console.log("Profile data:", data);
  console.log("Profile error:", error);
}

test();
