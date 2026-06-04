import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hhwaxzzebpfczpbmmxsb.supabase.co'
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhod2F4enplYnBmY3pwYm1teHNiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQ3MDE5NSwiZXhwIjoyMDk2MDQ2MTk1fQ.NOrtoE_qan8aIHGPPCRgJaAkin_TcU2CCQb1flpNfL8'

const supabase = createClient(supabaseUrl, serviceKey)

const { data: mapels } = await supabase.from('mata_pelajaran').select('*').eq('kelas', '4 SD').order('nama')

for (const m of mapels) {
  const { count } = await supabase.from('kisi_kisi').select('*', { count: 'exact', head: true }).eq('mata_pelajaran_id', m.id)
  console.log(`${m.nama.padEnd(45)} ${count} kisi-kisi`)
}

process.exit(0)
