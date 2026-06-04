import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const supabaseUrl = 'https://hhwaxzzebpfczpbmmxsb.supabase.co'
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhod2F4enplYnBmY3pwYm1teHNiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQ3MDE5NSwiZXhwIjoyMDk2MDQ2MTk1fQ.NOrtoE_qan8aIHGPPCRgJaAkin_TcU2CCQb1flpNfL8'

const supabase = createClient(supabaseUrl, serviceKey)
const API_KEY = 'sk-77be55ccf88540349990ede7c5f25d99'
const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions'

const mapelMap = {
  'PPKn': { nama: 'Pendidikan Pancasila', file: 'Kisi-kisi ASAT PPKn Kelas 4 smtr 2_25-26.docx' },
  'Bahasa Inggris': { nama: 'Bahasa Inggris', file: 'Kisi-kisi ASAT Bahasa Inggris Kelas 4 smtr 2_25-26.docx' },
  'PJOK': { nama: 'PJOK', file: 'Kisi-kisi ASAT PJOK Kelas 4 smtr 2_25-26.docx' },
}

const base = 'D:\\CodinganDong\\myidea\\projects\\sibete\\kisikisi\\sd4'

async function retryUpload(shortName) {
  const info = mapelMap[shortName]
  const filePath = `${base}\\${info.file}`
  const buffer = readFileSync(filePath)

  // Get mapel ID
  const { data: mp } = await supabase.from('mata_pelajaran').select('id').eq('nama', info.nama).eq('kelas', '4 SD').single()
  if (!mp) { console.log(`${info.nama}: mapel not found`); return }

  // Extract text using mammoth
  const mammoth = await import('mammoth')
  const result = await mammoth.default.convertToHtml({ buffer })
  const rawText = result.value

  // Better prompt: specify exactly 40 rows
  const prompt = `Parse tabel kisi-kisi soal berikut ke JSON array. Tabel ini memiliki 40 baris data.

Setiap objek harus memiliki field:
- "nomor": number (1-40)
- "capaian_pembelajaran": string atau null
- "materi": string
- "indikator_soal": string
- "bentuk_soal": "PG", "GK", "BS", "Isian", atau "Uraian"
- "level_kognitif": string atau null

Keluarkan HANYA JSON array dengan 40 objek, tanpa teks lain, tanpa markdown.

Teks dokumen:
${rawText.slice(0, 20000)}`

  const response = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'Anda adalah asisten ekstraktor data tabel kisi-kisi soal. Keluarkan HANYA JSON array valid, tanpa teks lain, tanpa markdown.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 8000,
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    console.log(`${info.nama}: API error: ${errText.slice(0,200)}`)
    return
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) { console.log(`${info.nama}: Empty response`); return }

  const cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
  
  let rows
  try { rows = JSON.parse(cleaned) } catch {
    console.log(`${info.nama}: JSON parse error`)
    return
  }

  if (!Array.isArray(rows)) {
    const possible = rows.data ?? rows.rows ?? rows.kisi_kisi ?? rows.soal
    if (Array.isArray(possible)) rows = possible
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    console.log(`${info.nama}: No data extracted`)
    return
  }

  console.log(`${info.nama}: Parsed ${rows.length} rows`)

  // Delete existing
  await supabase.from('kisi_kisi').delete().eq('mata_pelajaran_id', mp.id)

  // Insert
  const entries = rows.map((row, i) => ({
    mata_pelajaran_id: mp.id,
    nomor: row.nomor || i + 1,
    capaian_pembelajaran: row.capaian_pembelajaran || null,
    materi: row.materi || '',
    indikator_soal: row.indikator_soal || '',
    bentuk_soal: ['PG', 'GK', 'BS'].includes(row.bentuk_soal) ? row.bentuk_soal : 'PG',
    level_kognitif: row.level_kognitif || null,
  }))

  const { error } = await supabase.from('kisi_kisi').insert(entries)
  if (error) {
    console.log(`${info.nama}: SAVE ERROR: ${error.message}`)
    return
  }
  console.log(`${info.nama}: Saved ${entries.length} rows successfully!`)
}

// Retry all three
for (const key of ['PPKn', 'Bahasa Inggris', 'PJOK']) {
  await retryUpload(key)
}

process.exit(0)
