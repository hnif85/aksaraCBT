import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const profilId = searchParams.get('profil_id')
    const mapelId = searchParams.get('mapel_id')

    const sb = getServiceSupabase()

    if (profilId && mapelId) {
      return await getDetail(sb, profilId, mapelId)
    }

    return await getSummary(sb)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function getSummary(sb: ReturnType<typeof getServiceSupabase>) {
  const { data: hasilList, error } = await sb
    .from('hasil_ujian')
    .select('profil_id, score, status, set_soal!set_soal_id(mata_pelajaran_id)')
    .eq('status', 'selesai')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: profilList } = await sb.from('profil').select('id, nama')
  const { data: mapelList } = await sb.from('mata_pelajaran').select('id, nama')

  const profilMap = new Map((profilList ?? []).map((p: any) => [p.id, p.nama]))
  const mapelMap = new Map((mapelList ?? []).map((m: any) => [m.id, m.nama]))

  const groups = new Map<string, { totalScore: number; count: number }>()

  for (const h of hasilList as any[]) {
    const pid = h.profil_id
    const mid = h.set_soal?.mata_pelajaran_id
    if (!pid || !mid) continue
    const key = `${pid}:${mid}`
    const g = groups.get(key) ?? { totalScore: 0, count: 0 }
    g.totalScore += h.score
    g.count++
    groups.set(key, g)
  }

  const data: any[] = []
  for (const [key, g] of groups) {
    const [pid, mid] = key.split(':')
    data.push({
      profil_id: pid,
      profil_nama: profilMap.get(pid) ?? '?',
      mapel_id: mid,
      mapel_nama: mapelMap.get(mid) ?? '?',
      rata_rata: Math.round(g.totalScore / g.count),
      jumlah_ujian: g.count,
    })
  }

  data.sort((a, b) => a.profil_nama.localeCompare(b.profil_nama))

  return NextResponse.json({ data })
}

async function getDetail(
  sb: ReturnType<typeof getServiceSupabase>,
  profilId: string,
  mapelId: string
) {
  const { data: hasilList, error: hasilErr } = await sb
    .from('hasil_ujian')
    .select('id')
    .eq('profil_id', profilId)
    .eq('status', 'selesai')

  if (hasilErr) {
    return NextResponse.json({ error: hasilErr.message }, { status: 500 })
  }

  const hasilIds = (hasilList ?? []).map((h: any) => h.id)
  if (hasilIds.length === 0) {
    return NextResponse.json({ data: [] })
  }

  const { data: djList, error: djErr } = await sb
    .from('detail_jawaban')
    .select('is_benar, jawaban_peserta, soal!soal_id(nomor_soal, pertanyaan, jawaban_benar, bentuk_soal)')
    .in('hasil_ujian_id', hasilIds)

  if (djErr) {
    return NextResponse.json({ error: djErr.message }, { status: 500 })
  }

  const soalMap = new Map<
    string,
    {
      nomor_soal: number
      pertanyaan: string
      jawaban_benar: string
      bentuk_soal: string
      total: number
      benar: number
      salah: number
      wrongAnswers: Map<string, number>
    }
  >()

  for (const dj of djList as any[]) {
    const soal = dj.soal
    if (!soal) continue
    const sid = (dj as any).soal_id
    if (!soalMap.has(sid)) {
      soalMap.set(sid, {
        nomor_soal: soal.nomor_soal,
        pertanyaan: soal.pertanyaan,
        jawaban_benar: soal.jawaban_benar,
        bentuk_soal: soal.bentuk_soal,
        total: 0,
        benar: 0,
        salah: 0,
        wrongAnswers: new Map(),
      })
    }
    const entry = soalMap.get(sid)!
    entry.total++
    if (dj.is_benar === true) {
      entry.benar++
    } else if (dj.is_benar === false) {
      entry.salah++
      if (dj.jawaban_peserta) {
        entry.wrongAnswers.set(
          dj.jawaban_peserta,
          (entry.wrongAnswers.get(dj.jawaban_peserta) ?? 0) + 1
        )
      }
    }
  }

  const data: any[] = []
  for (const [, s] of soalMap) {
    let jawaban_salah_umum: string | null = null
    let maxCount = 0
    for (const [jawab, count] of s.wrongAnswers) {
      if (count > maxCount) {
        maxCount = count
        jawaban_salah_umum = jawab
      }
    }

    data.push({
      soal_id: s.nomor_soal,
      nomor_soal: s.nomor_soal,
      pertanyaan: s.pertanyaan,
      jawaban_benar: s.jawaban_benar,
      bentuk_soal: s.bentuk_soal,
      total_jawab: s.total,
      total_benar: s.benar,
      total_salah: s.salah,
      persentase_salah: s.total > 0 ? Math.round((s.salah / s.total) * 100) : 0,
      jawaban_salah_umum,
    })
  }

  data.sort((a, b) => b.persentase_salah - a.persentase_salah || a.nomor_soal - b.nomor_soal)

  return NextResponse.json({ data })
}
