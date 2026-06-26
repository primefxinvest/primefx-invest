const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://evjoyubypgjutylekiys.supabase.co';
const supabaseAnonKey = 'sb_publishable_9vR0BEkn1K89IlfykBMQ_Q_KA3hf5Nn';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

(async () => {
  try {
    console.log('[v0] Testing Supabase connection...');
    
    // Test by checking auth status
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('[v0] Session check:', sessionError ? `Error: ${sessionError.message}` : 'OK');
    
    // Try to query users table
    const { data, error } = await supabase.from('users').select('count');
    console.log('[v0] Database query test:', error ? `Error: ${error.message}` : `Success - Connected to database`);
    
  } catch (err) {
    console.log('[v0] Error:', err.message);
  }
})();
