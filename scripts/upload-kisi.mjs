import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const supabaseUrl = 'https://hhwaxzzebpfczpbmmxsb.supabase.co'
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhod2F4enplYnBmY3pwYm1teHNiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQ3MDE5NSwiZXhwIjoyMDk2MDQ2MTk1fQ.NOrtoE_qan8aIHGPPCRgJaAkin_TcU2CCQb1flpNfL8'

const supabase = createClient(supabaseUrl, serviceKey)

const API_KEY = 'sk-77be55ccf88540349990ede7c5f25d99'
const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions'

const mapelMap = {
  'PPKn': 'Pendidikan Pancasila',
  'Bahasa Indonesia': 'Bahasa Indonesia',
  'Matematika': 'Matematika',
  'IPAS': 'IPAS',
  'PJOK': 'PJOK',
  'SBdP': 'Seni Budaya dan Prakarya',
  'Bahasa Inggris': 'Bahasa Inggris',
  'PAI': 'Pendidikan Agama Islam dan Budi Pekerti',
}

async function getMapelId(nama) {
  const { data } = await supabase.from('mata_pelajaran').select('id').eq('nama', nama).eq('kelas', '4 SD').single()
  return data?.id
}

async function parseDocx(filePath) {
  const buffer = readFileSync(filePath)
  
  // Use mammoth to extract HTML text
  const mammoth = await import('mammoth')
  const result = await mammoth.default.convertToHtml({ buffer })
  const rawText = result.value

  const prompt = `Parse tabel kisi-kisi soal berikut ke JSON array.

Setiap objek harus memiliki field:
- "nomor": number
- "capaian_pembelajaran": string atau null
- "materi": string
- "indikator_soal": string
- "bentuk_soal": "PG", "Isian", atau "Uraian"
- "level_kognitif": string atau null (contoh "C1", "C2")

Keluarkan HANYA JSON array, tanpa teks lain, tanpa markdown.

Teks dokumen:
${rawText.slice(0, 20000)}`

  const response = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'Anda adalah asisten ekstraktor data tabel kisi-kisi soal. Keluarkan HANYA JSON array valid, tanpa teks lain, tanpa markdown.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 8000,
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`API error: ${errText}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('Empty response')

  const cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
  let rows = JSON.parse(cleaned)
  if (!Array.isArray(rows)) {
    const possible = rows.data ?? rows.rows ?? rows.kisi_kisi ?? rows.soal
    if (Array.isArray(possible)) rows = possible
  }
  return rows
}

async function uploadKisi(mapelKey, filePath) {
  const mapelName = mapelMap[mapelKey]
  const mapelId = await getMapelId(mapelName)
  if (!mapelId) { console.log(`  SKIP: ${mapelName} not found`); return }

  console.log(`\n=== ${mapelName} ===`)
  console.log(`  Parsing: ${filePath}`)

  let rows
  try {
    rows = await parseDocx(filePath)
  } catch (err) {
    console.log(`  PARSE ERROR: ${err.message}`)
    return
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    console.log(`  PARSE ERROR: No data extracted`)
    return
  }

  console.log(`  Parsed ${rows.length} rows`)

  // Delete existing
  await supabase.from('kisi_kisi').delete().eq('mata_pelajaran_id', mapelId)

  // Insert
  const entries = rows.map((row, i) => ({
    mata_pelajaran_id: mapelId,
    nomor: row.nomor || i + 1,
    capaian_pembelajaran: row.capaian_pembelajaran || null,
    materi: row.materi || '',
    indikator_soal: row.indikator_soal || '',
    bentuk_soal: ['PG', 'GK', 'BS'].includes(row.bentuk_soal) ? row.bentuk_soal : 'PG',
    level_kognitif: row.level_kognitif || null,
  }))

  const { error } = await supabase.from('kisi_kisi').insert(entries)
  if (error) {
    console.log(`  SAVE ERROR: ${error.message}`)
    return
  }

  console.log(`  Saved ${entries.length} kisi-kisi successfully!`)
}

const base = 'D:\\CodinganDong\\myidea\\projects\\sibete\\kisikisi\\sd4'

const files = [
  ['PPKn', `${base}\\Kisi-kisi ASAT PPKn Kelas 4 smtr 2_25-26.docx`],
  ['Bahasa Indonesia', `${base}\\Kisi-kisi ASAT Bahasa Indonesia Kelas 4 smtr 2_25-26.docx`],
  ['Matematika', `${base}\\Kisi-kisi ASAT Matematika Kelas 4 smtr 2_25-26.docx`],
  ['IPAS', `${base}\\Kisi-kisi ASAT IPAS Kelas 4 smtr 2_25-26.docx`],
  ['PJOK', `${base}\\Kisi-kisi ASAT PJOK Kelas 4 smtr 2_25-26.docx`],
  ['SBdP', `${base}\\Kisi-kisi ASAT SBdP Kelas 4 smtr 2_25-26.docx`],
  ['Bahasa Inggris', `${base}\\Kisi-kisi ASAT Bahasa Inggris Kelas 4 smtr 2_25-26.docx`],
  ['PAI', `${base}\\Kisi-kisi ASAT PAI Kelas 4 smtr 2_25-26.docx`],
]

for (const [key, path] of files) {
  await uploadKisi(key, path)
}

console.log('\n=== ALL DONE ===')
process.exit(0)
