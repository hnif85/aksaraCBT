import { NextResponse } from 'next/server'
import mammoth from 'mammoth'

const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const mataPelajaranId = formData.get('mata_pelajaran_id') as string | null

    if (!file || !mataPelajaranId) {
      return NextResponse.json(
        { error: 'File dan mata_pelajaran_id wajib diisi' },
        { status: 400 }
      )
    }

    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'DEEPSEEK_API_KEY tidak dikonfigurasi' },
        { status: 500 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = file.name.toLowerCase()
    let text = ''

    if (fileName.endsWith('.docx')) {
      const result = await mammoth.convertToHtml({ buffer })
      text = result.value.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
    } else if (fileName.endsWith('.pdf')) {
      try {
        const { PDFParse } = await import('pdf-parse')
        const pdf = new PDFParse({ data: buffer })
        const result = await pdf.getText()
        text = result.text
      } catch {
        return NextResponse.json(
          { error: 'Gagal memproses file PDF. Pastikan file valid.' },
          { status: 400 }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'Format file harus .docx atau .pdf' },
        { status: 400 }
      )
    }

    const prompt = `Berikut adalah teks dari dokumen kisi-kisi soal. Parse tabel kisi-kisi ke JSON array.

Setiap objek harus memiliki field berikut:
- "nomor": number
- "capaian_pembelajaran": string atau null (jika tidak ada kolom ini di dokumen)
- "materi": string
- "indikator_soal": string
- "bentuk_soal": "PG" atau "GK" atau "BS"
- "level_kognitif": string atau null (contoh "C1", "C2", "C3", "C4")

Teks dokumen:
${text.slice(0, 8000)}

Hanya keluarkan JSON array, tanpa teks lain. Jika tidak bisa parse, keluarkan [].`

    const response = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content:
              'Anda adalah asisten yang mengekstrak data tabel kisi-kisi soal dari dokumen pendidikan. Keluarkan JSON array valid saja.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 4000,
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
    let rows: any[]

    try {
      rows = JSON.parse(cleaned)
    } catch {
      return NextResponse.json(
        { error: 'Tidak dapat mengekstrak data kisi-kisi dari file. Periksa format tabel.' },
        { status: 400 }
      )
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
      bentuk_soal: (['PG', 'GK', 'BS'].includes(row.bentuk_soal) ? row.bentuk_soal : 'PG') as 'PG' | 'GK' | 'BS',
      level_kognitif: row.level_kognitif || null,
    }))

    return NextResponse.json({ data: entries })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
