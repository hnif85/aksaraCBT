'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { HasilUjian, DetailJawaban, Soal, SetSoal } from '@/lib/types'

interface HasilWithSet extends HasilUjian {
  set_soal?: SetSoal
}

interface DetailWithSoal extends DetailJawaban {
  soal?: Soal
}

function CircularScore({ score }: { score: number }) {
  const r = 60
  const c = 2 * Math.PI * r
  const offset = c - (score / 100) * c

  return (
    <div className="relative flex items-center justify-center">
      <svg width="160" height="160" className="-rotate-90">
        <circle cx="80" cy="80" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle cx="80" cy="80" r={r} fill="none" stroke="#3b82f6" strokeWidth="10" strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="absolute text-4xl font-bold text-blue-600">{score}</span>
    </div>
  )
}

export default function HasilPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [hasil, setHasil] = useState<HasilWithSet | null>(null)
  const [details, setDetails] = useState<DetailWithSoal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const [hasilRes, detailRes] = await Promise.all([
        supabase.from('hasil_ujian').select('*, set_soal(*)').eq('id', params.id).single(),
        supabase.from('detail_jawaban').select('*, soal(*)').eq('hasil_ujian_id', params.id).order('soal_id'),
      ])
      if (hasilRes.data) setHasil(hasilRes.data as HasilWithSet)
      if (detailRes.data) setDetails(detailRes.data as DetailWithSoal[])
      setLoading(false)
    }
    fetchData()
  }, [params.id])

  if (loading) return <div className="py-8 text-center text-gray-500">Memuat...</div>
  if (!hasil) return <div className="py-8 text-center text-gray-500">Data tidak ditemukan.</div>

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-bold">Hasil Ujian</h1>
        <p className="text-sm text-gray-500">{hasil.set_soal?.nama}</p>
      </div>

      <CircularScore score={hasil.score ?? 0} />

      <div className="flex justify-center gap-8 text-center text-sm">
        <div>
          <span className="block text-lg font-bold text-green-600">{hasil.total_benar}</span>
          <span className="text-gray-500">Benar</span>
        </div>
        <div>
          <span className="block text-lg font-bold text-red-600">{hasil.total_salah}</span>
          <span className="text-gray-500">Salah</span>
        </div>
        <div>
          <span className="block text-lg font-bold text-gray-400">{hasil.total_tidak_dijawab}</span>
          <span className="text-gray-500">Tidak Dijawab</span>
        </div>
      </div>

      <div className="space-y-4">
        {details.map((d) => {
          const s = d.soal
          if (!s) return null

          const options = [
            { key: 'A', value: s.pilihan_a },
            { key: 'B', value: s.pilihan_b },
            { key: 'C', value: s.pilihan_c },
            { key: 'D', value: s.pilihan_d },
            { key: 'E', value: s.pilihan_e },
          ].filter((o) => o.value)

          return (
            <div key={d.id} className="rounded-lg border p-4">
              <div className="mb-2 flex items-start justify-between">
                <span className="text-sm text-gray-500">Soal #{s.nomor_soal}</span>
                {d.is_ragu && <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">Ragu</span>}
              </div>
              <p className="mb-3 font-medium">{s.pertanyaan}</p>

              {options.map((opt) => {
                let cls = "mb-1 rounded border p-2 text-sm"
                if (opt.key === s.jawaban_benar) {
                  cls += " border-green-500 bg-green-50 text-green-800"
                } else if (opt.key === d.jawaban_peserta && d.jawaban_peserta !== s.jawaban_benar) {
                  cls += " border-red-500 bg-red-50 text-red-800"
                } else {
                  cls += " border-gray-200"
                }

                return (
                  <div key={opt.key} className={cls}>
                    <span className="font-medium">{opt.key}.</span> {opt.value}
                    {opt.key === d.jawaban_peserta && opt.key !== s.jawaban_benar && (
                      <span className="ml-2 text-xs text-red-600">(Jawabanmu)</span>
                    )}
                  </div>
                )
              })}

              {s.pembahasan && (
                <div className="mt-3 rounded bg-blue-50 p-3 text-sm text-blue-800">
                  <span className="font-medium">Pembahasan: </span>{s.pembahasan}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => router.push('/beranda')}
          className="rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
        >
          Kembali ke Beranda
        </button>
      </div>
    </div>
  )
}
