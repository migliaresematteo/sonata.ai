import { supabase } from './supabase/supabase';

async function testConnection() {
  console.log('Testing connection to Supabase...');
  try {
    const { data, error } = await supabase.from('profiles').select('count');
    if (error) throw error;
    console.log('Connection successful!', data);
    return true;
  } catch (error) {
    console.error('Connection failed:', error);
    return false;
  }
}

testConnection();

