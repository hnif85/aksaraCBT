import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hhwaxzzebpfczpbmmxsb.supabase.co'
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhod2F4enplYnBmY3pwYm1teHNiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQ3MDE5NSwiZXhwIjoyMDk2MDQ2MTk1fQ.NOrtoE_qan8aIHGPPCRgJaAkin_TcU2CCQb1flpNfL8'

const supabase = createClient(supabaseUrl, serviceKey)

// Delete existing 4 SD mapel
const { error: delErr } = await supabase.from('mata_pelajaran').delete().eq('kelas', '4 SD')
if (delErr) {
  console.error('Delete error:', delErr.message)
  process.exit(1)
}
console.log('Deleted existing 4 SD mapel')

// Insert fresh
const mapels = [
  'Pendidikan Pancasila',
  'Bahasa Indonesia',
  'Matematika',
  'IPAS',
  'PJOK',
  'Seni Budaya dan Prakarya',
  'Bahasa Inggris',
  'Pendidikan Agama Islam dan Budi Pekerti',
]

for (const nama of mapels) {
  const { data, error } = await supabase.from('mata_pelajaran').insert({ nama, kelas: '4 SD' }).select()
  if (error) console.log(`  ${nama}: ${error.message}`)
  else console.log(`  ${nama}: ${data[0].id}`)
}

process.exit(0)
