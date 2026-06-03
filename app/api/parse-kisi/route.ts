import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import mammoth from 'mammoth'

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

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = file.name.toLowerCase()
    let text = ''

    if (fileName.endsWith('.docx')) {
      const result = await mammoth.convertToHtml({ buffer })
      text = result.value
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

    const rows = parseTableRows(text, fileName.endsWith('.pdf'))

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Tidak dapat mengekstrak data kisi-kisi dari file. Periksa format tabel.' },
        { status: 400 }
      )
    }

    const entries = rows.map((row) => ({
      mata_pelajaran_id: mataPelajaranId,
      nomor: row.nomor,
      capaian_pembelajaran: null,
      materi: row.materi,
      indikator_soal: row.indikator_soal,
      bentuk_soal: row.bentuk_soal as 'PG' | 'GK' | 'BS',
      level_kognitif: row.level_kognitif,
    }))

    const { data, error } = await supabase
      .from('kisi_kisi')
      .insert(entries)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function parseTableRows(text: string, isPdf: boolean) {
  const rows: Array<{
    nomor: number
    materi: string
    indikator_soal: string
    bentuk_soal: string
    level_kognitif: string
  }> = []

  if (isPdf) {
    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)
    for (const line of lines) {
      const parts = line.split(/\s{2,}|\t+/)
      if (parts.length < 4) continue
      const nomor = parseInt(parts[0], 10)
      if (isNaN(nomor)) continue
      const bentukSoal = findBentukSoal(parts)
      const levelKognitif = findLevelKognitif(parts)
      const indikatorSoal = findIndikatorSoal(parts, bentukSoal, levelKognitif)
      rows.push({ nomor, materi: '', indikator_soal: indikatorSoal, bentuk_soal: bentukSoal, level_kognitif: levelKognitif })
    }
  } else {
    const tableRegex = /<table[\s\S]*?<\/table>/gi
    const tableMatch = text.match(tableRegex)
    if (!tableMatch) return rows

    for (const table of tableMatch) {
      const rowRegex = /<tr[\s\S]*?<\/tr>/gi
      const rowMatches = table.match(rowRegex)
      if (!rowMatches) continue

      for (const row of rowMatches) {
        const cellRegex = /<td[\s\S]*?<\/td>|<th[\s\S]*?<\/th>/gi
        const cells = row.match(cellRegex)
        if (!cells || cells.length < 4) continue

        const cellTexts = cells.map((cell) =>
          cell.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
        )

        const nomor = parseInt(cellTexts[0], 10)
        if (isNaN(nomor)) continue

        const bentukSoal = findBentukSoal(cellTexts)
        const levelKognitif = findLevelKognitif(cellTexts)
        const materi = cellTexts.length >= 5 ? cellTexts[1] : ''
        const indikatorSoal = findIndikatorSoal(cellTexts, bentukSoal, levelKognitif)

        rows.push({ nomor, materi, indikator_soal: indikatorSoal, bentuk_soal: bentukSoal, level_kognitif: levelKognitif })
      }
    }
  }

  return rows
}

function findBentukSoal(parts: string[]): string {
  for (const p of parts) {
    const upper = p.toUpperCase()
    if (upper === 'PG' || upper === 'GK' || upper === 'BS') return upper
  }
  return 'PG'
}

function findLevelKognitif(parts: string[]): string {
  for (const p of parts) {
    const upper = p.toUpperCase()
    if (/^C[1-4]$/.test(upper)) return upper
  }
  return ''
}

function findIndikatorSoal(parts: string[], bentukSoal: string, levelKognitif: string): string {
  return parts
    .filter((p) => p !== bentukSoal && p.toUpperCase() !== levelKognitif && !/^C[1-4]$/i.test(p) && isNaN(parseInt(p, 10)))
    .join(' ')
    .trim()
}
