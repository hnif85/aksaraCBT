import { NextResponse } from 'next/server'
import mammoth from 'mammoth'

const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const textInput = formData.get('text') as string | null
    const mataPelajaranId = formData.get('mata_pelajaran_id') as string | null

    if (!mataPelajaranId) {
      return NextResponse.json({ error: 'Mata pelajaran wajib diisi' }, { status: 400 })
    }

    if (!file && !textInput) {
      return NextResponse.json({ error: 'File atau teks kisi-kisi wajib diisi' }, { status: 400 })
    }

    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'DEEPSEEK_API_KEY tidak dikonfigurasi' }, { status: 500 })
    }

    let rawText = ''

    if (textInput) {
      rawText = textInput.trim()
    } else if (file) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const fileName = file.name.toLowerCase()

      if (fileName.endsWith('.txt')) {
        rawText = buffer.toString('utf-8').trim()
      } else if (fileName.endsWith('.docx')) {
        const result = await mammoth.convertToHtml({ buffer })
        rawText = result.value
      } else if (fileName.endsWith('.pdf')) {
        try {
          const { PDFParse } = await import('pdf-parse')
          const pdf = new PDFParse({ data: buffer })
          const result = await pdf.getText()
          rawText = result.text
        } catch {
          return NextResponse.json(
            { error: 'Gagal memproses file PDF. Pastikan file valid.' },
            { status: 400 }
          )
        }
      } else {
        return NextResponse.json(
          { error: 'Format file harus .txt, .docx, atau .pdf' },
          { status: 400 }
        )
      }
    }

    const prompt = `Parse tabel kisi-kisi soal berikut ke JSON array.

Setiap objek harus memiliki field:
- "nomor": number
- "capaian_pembelajaran": string atau null
- "materi": string
- "indikator_soal": string
- "bentuk_soal": "PG", "GK", atau "BS"
- "level_kognitif": string atau null (contoh "C1", "C2")

Keluarkan HANYA JSON array, tanpa teks lain, tanpa markdown.

Teks dokumen:
${rawText.slice(0, 20000)}`

    const response = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content:
              'Anda adalah asisten ekstraktor data tabel kisi-kisi soal. Keluarkan HANYA JSON array valid, tanpa teks lain, tanpa markdown. Jika ada teks lain di luar JSON, hasilnya akan error.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 8000,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      return NextResponse.json(
        { error: `Gagal memproses file: API error (${errText})` },
        { status: 500 }
      )
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return NextResponse.json(
        { error: 'Tidak dapat mengekstrak data kisi-kisi dari file.' },
        { status: 400 }
      )
    }

    const cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
    let rows = tryParseJSON(cleaned)

    if (rows && !Array.isArray(rows) && typeof rows === 'object') {
      const possible = rows.data ?? rows.rows ?? rows.kisi_kisi ?? rows.soal
      if (Array.isArray(possible)) rows = possible
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: 'Tidak dapat mengekstrak data kisi-kisi dari file. Periksa format tabel.' },
        { status: 400 }
      )
    }

    const entries = rows.map((row: any, i: number) => ({
      mata_pelajaran_id: mataPelajaranId,
      nomor: row.nomor || i + 1,
      capaian_pembelajaran: row.capaian_pembelajaran || null,
      materi: row.materi || '',
      indikator_soal: row.indikator_soal || '',
      bentuk_soal: ['PG', 'GK', 'BS', 'Isian', 'Uraian'].includes(row.bentuk_soal) ? row.bentuk_soal : 'PG',
      level_kognitif: row.level_kognitif || null,
    }))

    return NextResponse.json({ data: entries })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function tryParseJSON(text: string): any {
  try {
    return JSON.parse(text)
  } catch {
    // fall through
  }

  for (const char of ['"', '\u201C', '\u201D', '\u2018', '\u2019']) {
    text = text.replace(
      new RegExp(char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
      char === '"' ? '\\"' : "'"
    )
  }

  try {
    return JSON.parse(text)
  } catch {
    const patterns = [/\[[\s\S]*\]/, /\{[\s\S]*\}/]
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (!match) continue
      let json = match[0]
      json = json.replace(/:\s*"([^"]*?)"\s*([,}])/g, (m) => {
        try {
          JSON.parse(`{${m.replace(/^[^:]+:\s*/, '"k": ')}}`)
          return m
        } catch {
          const key = m.match(/("?\w+"?\s*:)/)?.[1] || ''
          const val = m.slice(key.length).trim()
          if (val.startsWith('"')) {
            const end = val.lastIndexOf('"')
            const content = val.slice(1, end)
            const escaped = content.replace(/"/g, '\\"')
            return `${key}"${escaped}"${val.slice(end + 1)}`
          }
          return m
        }
      })
      try {
        return JSON.parse(json)
      } catch {
        continue
      }
    }
    return null
  }
}
