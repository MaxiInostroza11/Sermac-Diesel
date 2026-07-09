import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  console.log("Checking Supabase connection...");
  const { data, error } = await supabase.from('usuarios').select('*');
  if (error) {
    console.error("Error connecting or table not found:", error.message);
  } else {
    console.log(`Success! Found ${data.length} users in the database.`);
  }
}
check();
