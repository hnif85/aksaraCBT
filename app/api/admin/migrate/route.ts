import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST() {
  try {
    const { error: e1 } = await supabase.rpc('exec_sql', {
      query: `ALTER TABLE kisi_kisi DROP CONSTRAINT IF EXISTS kisi_kisi_bentuk_soal_check;`
    })
    
    const { error: e2 } = await supabase.rpc('exec_sql', {
      query: `ALTER TABLE kisi_kisi ADD CONSTRAINT kisi_kisi_bentuk_soal_check CHECK (bentuk_soal IN ('PG', 'GK', 'BS', 'Isian', 'Uraian'));`
    })
    
    const { error: e3 } = await supabase.rpc('exec_sql', {
      query: `ALTER TABLE soal DROP CONSTRAINT IF EXISTS soal_bentuk_soal_check;`
    })
    
    const { error: e4 } = await supabase.rpc('exec_sql', {
      query: `ALTER TABLE soal ADD CONSTRAINT soal_bentuk_soal_check CHECK (bentuk_soal IN ('PG', 'GK', 'BS', 'Isian', 'Uraian'));`
    })

    return NextResponse.json({
      results: [
        { step: 'drop kisi_kisi check', error: e1?.message || null },
        { step: 'add kisi_kisi check', error: e2?.message || null },
        { step: 'drop soal check', error: e3?.message || null },
        { step: 'add soal check', error: e4?.message || null },
      ]
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
