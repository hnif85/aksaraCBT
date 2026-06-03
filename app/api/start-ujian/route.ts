import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { set_soal_id, profil_id } = await request.json()

  if (!set_soal_id || !profil_id) {
    return NextResponse.json({ error: 'set_soal_id dan profil_id wajib diisi' }, { status: 400 })
  }

  const { data: hasil, error } = await supabase
    .from('hasil_ujian')
    .insert({
      set_soal_id,
      profil_id,
      status: 'in_progress',
      waktu_mulai: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: soalList } = await supabase
    .from('soal')
    .select('id')
    .eq('set_soal_id', set_soal_id)
    .order('nomor_soal')

  if (soalList && soalList.length > 0) {
    const shuffled = [...soalList].sort(() => Math.random() - 0.5)
    const detailJawaban = shuffled.map((soal) => ({
      hasil_ujian_id: hasil.id,
      soal_id: soal.id,
    }))
    await supabase.from('detail_jawaban').insert(detailJawaban)
  }

  return NextResponse.json({ hasil_id: hasil.id })
}
