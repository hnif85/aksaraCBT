import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions'
const BATCH_SIZE = 5
const CONCURRENCY = 3

export async function POST(request: Request) {
  try {
    const { set_soal_id, kisi_kisi_ids } = await request.json()

    if (!set_soal_id || !kisi_kisi_ids || !Array.isArray(kisi_kisi_ids) || kisi_kisi_ids.length === 0) {
      return NextResponse.json(
        { error: 'set_soal_id dan kisi_kisi_ids (array) wajib diisi' },
        { status: 400 }
      )
    }

    const { data: setSoal, error: setError } = await supabase
      .from('set_soal')
      .select('*, mata_pelajaran!mata_pelajaran_id(nama)')
      .eq('id', set_soal_id)
      .single()

    if (setError || !setSoal) {
      return NextResponse.json({ error: 'Set soal tidak ditemukan' }, { status: 404 })
    }

    const mapelName = (setSoal as any).mata_pelajaran?.nama || ''

    const { data: kisiList, error: kisiError } = await supabase
      .from('kisi_kisi')
      .select('*')
      .in('id', kisi_kisi_ids)

    if (kisiError || !kisiList || kisiList.length === 0) {
      return NextResponse.json({ error: 'Kisi-kisi tidak ditemukan' }, { status: 404 })
    }

    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'DEEPSEEK_API_KEY tidak dikonfigurasi' },
        { status: 500 }
      )
    }

    const batches: any[][] = []
    for (let i = 0; i < kisiList.length; i += BATCH_SIZE) {
      batches.push(kisiList.slice(i, i + BATCH_SIZE))
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: any) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
        }

        try {
          send('progress', { processed: 0, total: kisiList.length })

          const allEntries: any[] = []
          const allErrors: { nomor: number; message: string }[] = []

          for (let i = 0; i < batches.length; i += CONCURRENCY) {
            const wave = batches.slice(i, i + CONCURRENCY)
            const results = await Promise.all(
              wave.map((batch) => processBatch(batch, mapelName, apiKey))
            )

            for (const result of results) {
              allEntries.push(...result.entries)
              allErrors.push(...result.errors)
            }

            send('progress', {
              processed: allEntries.length,
              total: kisiList.length,
            })
          }

          const currentNomor = await getMaxNomorSoal(set_soal_id)
          const soalsToInsert = allEntries.map((entry, idx) => ({
            ...entry,
            set_soal_id,
            nomor_soal: currentNomor + idx + 1,
          }))

          let savedSoals: any[] = []
          if (soalsToInsert.length > 0) {
            const { data, error: insertError } = await supabase
              .from('soal')
              .insert(soalsToInsert)
              .select()

            if (insertError) {
              send('error', { message: insertError.message })
              return
            }
            savedSoals = data || []

            await supabase
              .from('set_soal')
              .update({ jumlah_soal: currentNomor + soalsToInsert.length })
              .eq('id', set_soal_id)
          }

          send('complete', {
            data: savedSoals,
            errors: allErrors.length > 0 ? allErrors : undefined,
            total: savedSoals.length,
            failed: allErrors.length,
          })
        } catch (err: any) {
          send('error', { message: err.message })
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function processBatch(
  kisiBatch: any[],
  mapelName: string,
  apiKey: string
): Promise<{
  entries: any[]
  errors: { nomor: number; message: string }[]
}> {
  const result = { entries: [] as any[], errors: [] as { nomor: number; message: string }[] }

  for (let retry = 0; retry < 2; retry++) {
    const response = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: buildSystemPrompt(mapelName) },
          { role: 'user', content: buildBatchPrompt(kisiBatch) },
        ],
        temperature: 0.8,
        max_tokens: 5000,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      result.errors = kisiBatch.map((k) => ({
        nomor: k.nomor,
        message: `API error: ${errText}`,
      }))
      return result
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      result.errors = kisiBatch.map((k) => ({
        nomor: k.nomor,
        message: 'Respon kosong dari DeepSeek',
      }))
      return result
    }

    const cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
    let parsed = tryParseJSON(cleaned)

    if (parsed && !Array.isArray(parsed) && parsed.pertanyaan) {
      parsed = [parsed]
    }

    if (Array.isArray(parsed)) {
      for (let i = 0; i < kisiBatch.length; i++) {
        const kisi = kisiBatch[i]
        const raw = parsed[i]

        if (!raw || !raw.pertanyaan || !raw.jawaban_benar) {
          result.errors.push({
            nomor: kisi.nomor,
            message: 'Soal tidak valid atau tidak ada dalam response',
          })
          continue
        }

        const entry: any = {
          kisi_kisi_id: kisi.id,
          pertanyaan: raw.pertanyaan,
          jawaban_benar: raw.jawaban_benar,
          pembahasan: raw.pembahasan || null,
          bentuk_soal: kisi.bentuk_soal,
        }

        if (kisi.bentuk_soal === 'BS') {
          entry.pilihan_a = 'Benar'
          entry.pilihan_b = 'Salah'
          entry.pilihan_c = null
          entry.pilihan_d = null
          entry.pilihan_e = null
        } else {
          entry.pilihan_a = raw.pilihan_a || null
          entry.pilihan_b = raw.pilihan_b || null
          entry.pilihan_c = raw.pilihan_c || null
          entry.pilihan_d = raw.pilihan_d || null
          entry.pilihan_e = raw.pilihan_e || null
        }

        result.entries.push(entry)
      }

      if (result.entries.length > 0) return result
    }
  }

  if (result.entries.length === 0 && result.errors.length === 0) {
    result.errors = kisiBatch.map((k) => ({
      nomor: k.nomor,
      message: 'Gagal parse JSON setelah 2 percobaan',
    }))
  }

  return result
}

function buildSystemPrompt(mapelName: string): string {
  const isEnglish = mapelName.toLowerCase().includes('bahasa inggris')
  if (isEnglish) {
    return `You are an English language test maker for Indonesian junior high school (SMP/MTs). Write ALL questions, answer choices, and explanations in ENGLISH. Output valid JSON array only, no markdown, no extra text.`
  }
  return `Anda adalah ahli pembuatan soal ${mapelName} untuk tingkat SMP/MTs. Buat SEMUA teks soal, pilihan, dan pembahasan dalam BAHASA INDONESIA. Keluarkan JSON array valid saja, tanpa markdown, tanpa teks lain.`
}

function buildBatchPrompt(kisiBatch: any[]): string {
  const rows = kisiBatch
    .map(
      (k, i) =>
        `| ${i + 1} | ${k.materi} | ${k.indikator_soal} | ${k.bentuk_soal} | ${k.level_kognitif || 'C1'} |`
    )
    .join('\n')

  const bentukInstructions: Record<string, string> = {
    PG: 'Pilihan Ganda — pilihan_a sampai pilihan_e, jawaban_benar 1 huruf (A/B/C/D/E)',
    GK: 'Ganda Kompleks — pilihan_a sampai pilihan_e, jawaban_benar bisa lebih dari 1 huruf (contoh: AB, ACD, BDE)',
    BS: 'Benar-Salah — pilihan_a = "Benar", pilihan_b = "Salah", jawaban_benar = A atau B',
  }

  return `Buat ${kisiBatch.length} soal UNIK berdasarkan data kisi-kisi berikut (satu soal per baris, urut sesuai tabel):

| No | Materi | Indikator Soal | Bentuk | Level |
|----|--------|----------------|--------|-------|
${rows}

Pedoman:
- Setiap soal harus UNIK, tidak ada pengulangan konten antar soal
- Kunci jawaban harus jelas dan tidak ambigu
- Distractor (opsi salah) harus masuk akal dan tidak terlalu mudah ditebak
- JANGAN gunakan tanda kutip ganda (") di dalam teks — gunakan tanda kutip tunggal (') jika perlu mengutip

Bentuk soal:
${kisiBatch.map((k) => `  ${k.bentuk_soal}: ${bentukInstructions[k.bentuk_soal] || ''}`).join('\n')}

Format JSON (array of objects, urut sesuai tabel di atas):
[
  {
    "pertanyaan": "teks pertanyaan",
    "pilihan_a": "opsi A",
    "pilihan_b": "opsi B",
    "pilihan_c": "opsi C",
    "pilihan_d": "opsi D",
    "pilihan_e": "opsi E",
    "jawaban_benar": "huruf jawaban",
    "pembahasan": "penjelasan jawaban"
  }
]

Untuk BS: pilihan_a="Benar", pilihan_b="Salah"
Hanya keluarkan teks JSON array, tanpa teks lain.`
}

async function getMaxNomorSoal(setSoalId: string): Promise<number> {
  const { data } = await supabase
    .from('soal')
    .select('nomor_soal')
    .eq('set_soal_id', setSoalId)
    .order('nomor_soal', { ascending: false })
    .limit(1)

  return (data && data.length > 0 ? data[0].nomor_soal : 0) as number
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
    // try array pattern then object pattern
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
