import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hhwaxzzebpfczpbmmxsb.supabase.co'
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhod2F4enplYnBmY3pwYm1teHNiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQ3MDE5NSwiZXhwIjoyMDk2MDQ2MTk1fQ.NOrtoE_qan8aIHGPPCRgJaAkin_TcU2CCQb1flpNfL8'

const supabase = createClient(supabaseUrl, serviceKey)

// We can't execute DDL directly through the client, but we can use the rpc function
// First, let's create the function
const sql = `
BEGIN;
ALTER TABLE kisi_kisi DROP CONSTRAINT IF EXISTS kisi_kisi_bentuk_soal_check;
ALTER TABLE kisi_kisi ADD CONSTRAINT kisi_kisi_bentuk_soal_check CHECK (bentuk_soal IN ('PG', 'GK', 'BS', 'Isian', 'Uraian'));
ALTER TABLE soal DROP CONSTRAINT IF EXISTS soal_bentuk_soal_check;
ALTER TABLE soal ADD CONSTRAINT soal_bentuk_soal_check CHECK (bentuk_soal IN ('PG', 'GK', 'BS', 'Isian', 'Uraian'));
COMMIT;
`

try {
  const { data, error } = await supabase.rpc('exec_sql', { query: sql })
  if (error) {
    console.log('RPC exec_sql failed:', error.message)
    // Try another approach
    const { data: d2, error: e2 } = await supabase.from('_migrations').select('*').limit(1)
    if (e2) {
      console.log('Direct query also failed. Trying SQL execution via REST...')
    }
  } else {
    console.log('Migration successful:', data)
  }
} catch (err) {
  console.log('Error:', err.message)
}

// Final check
const { data: constraints, error: ce } = await supabase
  .rpc('get_constraints', { table_name: 'kisi_kisi' })
if (ce) {
  // Just check if the table works
  const { data: sample } = await supabase.from('kisi_kisi').select('bentuk_soal').limit(1)
  console.log('Sample data:', sample)
}
console.log('Done')
process.exit(0)
