import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qxgelnapillniiluxzjz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4Z2VsbmFwaWxsbmlpbHV4emp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyNzI0MTUsImV4cCI6MjA2OTg0ODQxNX0.p34_1qSO0_tWQrpJhmwPEWyM9oWXI2ewXtAxDleXe5E';

if (SUPABASE_URL === 'https://<PROJECT-ID>.supabase.co' || SUPABASE_ANON_KEY === '<ANON_KEY>') {
  throw new Error('Missing Supabase variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

export default supabase;