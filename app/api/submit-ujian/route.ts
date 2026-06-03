import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { hasil_ujian_id, jawaban } = await request.json()

    if (!hasil_ujian_id || !jawaban || !Array.isArray(jawaban)) {
      return NextResponse.json(
        { error: 'hasil_ujian_id dan jawaban (array) wajib diisi' },
        { status: 400 }
      )
    }

    const { data: hasilUjian, error: hasilError } = await supabase
      .from('hasil_ujian')
      .select('*')
      .eq('id', hasil_ujian_id)
      .single()

    if (hasilError || !hasilUjian) {
      return NextResponse.json({ error: 'Hasil ujian tidak ditemukan' }, { status: 404 })
    }

    if (hasilUjian.status === 'selesai') {
      return NextResponse.json(
        { error: 'Ujian sudah diselesaikan sebelumnya' },
        { status: 400 }
      )
    }

    const soalIds = jawaban.map((j: any) => j.soal_id)

    const { data: soalList, error: soalError } = await supabase
      .from('soal')
      .select('id, jawaban_benar')
      .in('id', soalIds)

    if (soalError) {
      return NextResponse.json({ error: soalError.message }, { status: 500 })
    }

    const jawabanMap = new Map(soalList.map((s: any) => [s.id, s.jawaban_benar]))
    let totalBenar = 0
    let totalSalah = 0
    let totalTidakDijawab = 0

    const detailEntries = jawaban.map((j: any) => {
      const jawabanBenar = jawabanMap.get(j.soal_id)

      if (!jawabanBenar) {
        totalTidakDijawab++
        return {
          hasil_ujian_id,
          soal_id: j.soal_id,
          jawaban_peserta: j.jawaban_peserta || null,
          is_benar: null,
          is_ragu: false,
        }
      }

      if (!j.jawaban_peserta || j.jawaban_peserta.trim() === '') {
        totalTidakDijawab++
        return {
          hasil_ujian_id,
          soal_id: j.soal_id,
          jawaban_peserta: null,
          is_benar: null,
          is_ragu: false,
        }
      }

      const isBenar = normalizeJawaban(j.jawaban_peserta) === normalizeJawaban(jawabanBenar)
      if (isBenar) {
        totalBenar++
      } else {
        totalSalah++
      }

      return {
        hasil_ujian_id,
        soal_id: j.soal_id,
        jawaban_peserta: j.jawaban_peserta,
        is_benar: isBenar,
        is_ragu: false,
      }
    })

    const totalSoal = soalList.length
    const score = totalSoal > 0 ? Math.round((totalBenar / totalSoal) * 100) : 0

    for (const detail of detailEntries) {
      const { error: detailError } = await supabase
        .from('detail_jawaban')
        .update({
          jawaban_peserta: detail.jawaban_peserta,
          is_benar: detail.is_benar,
          is_ragu: detail.is_ragu,
        })
        .eq('hasil_ujian_id', hasil_ujian_id)
        .eq('soal_id', detail.soal_id)

      if (detailError) {
        return NextResponse.json({ error: detailError.message }, { status: 500 })
      }
    }

    const { data: updated, error: updateError } = await supabase
      .from('hasil_ujian')
      .update({
        total_benar: totalBenar,
        total_salah: totalSalah,
        total_tidak_dijawab: totalTidakDijawab,
        score,
        status: 'selesai',
        waktu_selesai: new Date().toISOString(),
      })
      .eq('id', hasil_ujian_id)
      .select('*')
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ data: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function normalizeJawaban(jawaban: string): string {
  return jawaban.toUpperCase().replace(/\s/g, '').split('').sort().join('')
}
