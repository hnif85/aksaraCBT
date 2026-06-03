'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { HasilUjian, DetailJawaban, Soal, KisiKisi, RekapMateri } from '@/lib/types'

interface DetailWithSoal extends DetailJawaban {
  soal?: Soal & { kisi_kisi?: KisiKisi }
}

export default function LaporanPage() {
  const router = useRouter()
  const [riwayat, setRiwayat] = useState<(HasilUjian & { detail_jawaban: DetailWithSoal[] })[]>([])
  const [rekapMateri, setRekapMateri] = useState<RekapMateri[]>([])
  const [totalUjian, setTotalUjian] = useState(0)
  const [rataSkor, setRataSkor] = useState(0)
  const [totalDijawab, setTotalDijawab] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const profilId = localStorage.getItem('profil_id')
    if (!profilId) { router.replace('/'); return }

    async function fetchData() {
      const { data: hasilList } = await supabase
        .from('hasil_ujian')
        .select('*')
        .eq('profil_id', profilId)
        .eq('status', 'selesai')
        .order('created_at', { ascending: false })

      if (!hasilList || hasilList.length === 0) { setLoading(false); return }

      setTotalUjian(hasilList.length)
      setRataSkor(Math.round(hasilList.reduce((sum, h) => sum + (h.score ?? 0), 0) / hasilList.length))
      setTotalDijawab(hasilList.reduce((sum, h) => sum + (h.total_benar ?? 0) + (h.total_salah ?? 0), 0))

      const hasilIds = hasilList.map((h) => h.id)

      const { data: allDetails } = await supabase
        .from('detail_jawaban')
        .select('*, soal(*)')
        .in('hasil_ujian_id', hasilIds)

      const details = (allDetails || []) as DetailWithSoal[]

      const soalIds = [...new Set(details.filter((d) => d.soal?.kisi_kisi_id).map((d) => d.soal!.kisi_kisi_id!))]
      const { data: kisiList } = await supabase
        .from('kisi_kisi')
        .select('*')
        .in('id', soalIds)

      const kisiMap = new Map(kisiList?.map((k: KisiKisi) => [k.id, k]) || [])

      for (const d of details) {
        if (d.soal && d.soal.kisi_kisi_id) {
          d.soal.kisi_kisi = kisiMap.get(d.soal.kisi_kisi_id)
        }
      }

      const hasilWithDetails = hasilList.map((h) => ({
        ...h,
        detail_jawaban: details.filter((d) => d.hasil_ujian_id === h.id),
      }))
      setRiwayat(hasilWithDetails as any)

      const materiMap = new Map<string, { total: number; benar: number; salah: number }>()
      for (const d of details) {
        if (!d.soal) continue
        const materi = d.soal.kisi_kisi?.materi || d.soal.bentuk_soal
        const entry = materiMap.get(materi) || { total: 0, benar: 0, salah: 0 }
        entry.total++
        if (d.is_benar) entry.benar++
        else if (d.jawaban_peserta !== null) entry.salah++
        materiMap.set(materi, entry)
      }

      setRekapMateri(
        Array.from(materiMap.entries()).map(([materi, d]) => ({
          materi,
          total: d.total,
          benar: d.benar,
          salah: d.salah,
          persentase: d.total > 0 ? Math.round((d.benar / d.total) * 100) : 0,
        }))
      )

      setLoading(false)
    }

    fetchData()
  }, [router])

  function warnaPersentase(p: number) {
    if (p > 75) return 'text-green-700 bg-green-50'
    if (p >= 50) return 'text-yellow-700 bg-yellow-50'
    return 'text-red-700 bg-red-50'
  }

  if (loading) return <div className="py-8 text-center text-gray-500">Memuat...</div>
  if (riwayat.length === 0) return <div className="py-8 text-center text-gray-500">Belum ada data ujian selesai.</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Laporan</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border p-4 text-center">
          <span className="block text-2xl font-bold">{totalUjian}</span>
          <span className="text-sm text-gray-500">Total Ujian</span>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <span className="block text-2xl font-bold">{rataSkor}</span>
          <span className="text-sm text-gray-500">Rata-rata Skor</span>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <span className="block text-2xl font-bold">{totalDijawab}</span>
          <span className="text-sm text-gray-500">Soal Dijawab</span>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Rincian per Materi</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-4">Materi</th>
                <th className="py-2 pr-4">Total Soal</th>
                <th className="py-2 pr-4">Benar</th>
                <th className="py-2 pr-4">Salah</th>
                <th className="py-2">Persentase</th>
              </tr>
            </thead>
            <tbody>
              {rekapMateri.map((r) => (
                <tr key={r.materi} className="border-b">
                  <td className="py-2 pr-4 font-medium">{r.materi}</td>
                  <td className="py-2 pr-4">{r.total}</td>
                  <td className="py-2 pr-4 text-green-600">{r.benar}</td>
                  <td className="py-2 pr-4 text-red-600">{r.salah}</td>
                  <td className="py-2">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${warnaPersentase(r.persentase)}`}>
                      {r.persentase}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Riwayat Ujian</h2>
        <div className="space-y-2">
          {riwayat.map((r) => (
            <button
              key={r.id}
              onClick={() => router.push(`/hasil/${r.id}`)}
              className="flex w-full items-center justify-between rounded-lg border p-3 text-left transition hover:border-blue-400"
            >
              <div>
                <div className="font-medium">{new Date(r.created_at).toLocaleDateString('id-ID')}</div>
                <div className="text-sm text-gray-500">Skor: {r.score}</div>
              </div>
              <span className="text-sm text-blue-600">&rarr;</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
