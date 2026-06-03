'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface SummaryItem {
  profil_id: string
  profil_nama: string
  mapel_id: string
  mapel_nama: string
  rata_rata: number
  jumlah_ujian: number
}

interface SoalDetail {
  nomor_soal: number
  pertanyaan: string
  jawaban_benar: string
  bentuk_soal: string
  total_jawab: number
  total_benar: number
  total_salah: number
  persentase_salah: number
  jawaban_salah_umum: string | null
}

export default function AdminLaporanPage() {
  const [summary, setSummary] = useState<SummaryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<{ profil: string; mapel: string; profil_id: string; mapel_id: string } | null>(null)
  const [detail, setDetail] = useState<SoalDetail[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [kisiIds, setKisiIds] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)
  const [genProgress, setGenProgress] = useState<{ processed: number; total: number } | null>(null)
  const [genResult, setGenResult] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/laporan')
      .then((r) => r.json())
      .then((res) => {
        if (res.error) throw new Error(res.error)
        setSummary(res.data ?? [])
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const profilList = [...new Set(summary.map((s) => s.profil_nama))]
  const mapelList = [...new Set(summary.map((s) => s.mapel_nama))]

  function getCell(p: string, m: string) {
    return summary.find((s) => s.profil_nama === p && s.mapel_nama === m)
  }

  async function handleClick(p: string, m: string, item: SummaryItem | undefined) {
    if (!item) return
    setSelected({ profil: p, mapel: m, profil_id: item.profil_id, mapel_id: item.mapel_id })
    setDetailLoading(true)
    setDetail([])
    setKisiIds([])
    setGenResult(null)

    try {
      const [detailRes, kisiRes] = await Promise.all([
        fetch(`/api/laporan?profil_id=${item.profil_id}&mapel_id=${item.mapel_id}`),
        supabase.from('kisi_kisi').select('id').eq('mata_pelajaran_id', item.mapel_id),
      ])
      const data = await detailRes.json()
      if (data.error) throw new Error(data.error)
      setDetail(data.data ?? [])
      setKisiIds((kisiRes.data ?? []).map((k: any) => k.id))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setDetailLoading(false)
    }
  }

  async function handleGenerateTryout() {
    if (!selected || kisiIds.length === 0) return
    setGenerating(true)
    setGenProgress(null)
    setGenResult(null)
    setError('')

    try {
      const { count } = await supabase
        .from('set_soal')
        .select('*', { count: 'exact', head: true })
        .eq('mata_pelajaran_id', selected.mapel_id)

      const setNama = `Tryout ${(count ?? 0) + 1}`

      const { data: setData, error: setErr } = await supabase
        .from('set_soal')
        .insert({
          mata_pelajaran_id: selected.mapel_id,
          nama: setNama,
          jumlah_soal: kisiIds.length,
          durasi_menit: 15,
          status: 'draft',
        })
        .select()
        .single()

      if (setErr || !setData) throw new Error(setErr?.message ?? 'Gagal membuat set')

      const res = await fetch('/api/generate-soal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ set_soal_id: setData.id, kisi_kisi_ids: kisiIds }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Gagal generate soal')
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let eventType = ''
      let completeData: any = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() || ''

        for (const part of parts) {
          const lines = part.split('\n')
          for (const line of lines) {
            if (line.startsWith('event: ')) eventType = line.slice(7).trim()
            else if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6))
              if (eventType === 'progress') {
                setGenProgress({ processed: data.processed, total: data.total })
              } else if (eventType === 'complete') {
                completeData = data
              } else if (eventType === 'error') {
                throw new Error(data.message)
              }
            }
          }
        }
      }

      if (!completeData) throw new Error('Gagal generate: tidak ada respon')

      await supabase.from('set_soal').update({ status: 'ready' }).eq('id', setData.id)

      const msg = completeData.failed > 0
        ? `${setNama} berhasil! ${completeData.total} soal, ${completeData.failed} gagal.`
        : `${setNama} berhasil! ${completeData.total} soal siap dikerjakan.`
      setGenResult(msg)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setGenerating(false)
      setGenProgress(null)
    }
  }

  function scoreColor(avg: number) {
    if (avg >= 75) return 'text-green-700 bg-green-50'
    if (avg >= 50) return 'text-yellow-700 bg-yellow-50'
    return 'text-red-700 bg-red-50'
  }

  function pctColor(pct: number) {
    if (pct >= 75) return 'text-red-700 bg-red-50'
    if (pct >= 50) return 'text-yellow-700 bg-yellow-50'
    return 'text-green-700 bg-green-50'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link href="/admin" className="text-sm text-indigo-600 hover:underline">&larr; Dashboard</Link>
          <h1 className="text-xl font-bold text-gray-900">Laporan Nilai</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {loading && <p className="text-sm text-gray-400">Memuat laporan...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && summary.length === 0 && (
          <p className="text-sm text-gray-400">Belum ada hasil ujian yang selesai.</p>
        )}

        {!loading && summary.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Ringkasan per Profil & Mapel</h2>
              <p className="text-xs text-gray-400 mt-0.5">Klik sel untuk lihat detail soal</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Profil</th>
                    {mapelList.map((m) => (
                      <th key={m} className="px-4 py-3 text-center font-medium">{m}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {profilList.map((p) => (
                    <tr key={p} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{p}</td>
                      {mapelList.map((m) => {
                        const item = getCell(p, m)
                        return (
                          <td key={m} className="px-4 py-3 text-center">
                            {item ? (
                              <button
                                onClick={() => handleClick(p, m, item)}
                                className={`inline-block min-w-[4rem] px-3 py-1.5 rounded-lg font-semibold text-sm transition hover:scale-105 ${scoreColor(item.rata_rata)} ${selected?.profil === p && selected?.mapel === m ? 'ring-2 ring-indigo-400' : ''}`}
                              >
                                {item.rata_rata}
                                <span className="block text-[10px] font-normal opacity-60">{item.jumlah_ujian}×</span>
                              </button>
                            ) : (
                              <span className="text-gray-300">&mdash;</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selected && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">
                Detail — {selected.profil} &gt; {selected.mapel}
              </h2>
              <button
                onClick={() => setSelected(null)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Tutup
              </button>
            </div>

            {detailLoading && <p className="px-6 py-4 text-sm text-gray-400">Memuat detail...</p>}

            {!detailLoading && (
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Buat Tryout Baru</p>
                    <p className="text-xs text-gray-400 mt-0.5">{kisiIds.length} kisi tersedia</p>
                  </div>
                  <button
                    onClick={handleGenerateTryout}
                    disabled={generating || kisiIds.length === 0}
                    className="px-4 py-1.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50 transition"
                  >
                    {generating ? 'Menggenerate...' : 'Generate Tryout'}
                  </button>
                </div>

                {genProgress && (
                  <div className="mt-3 space-y-1">
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.round((genProgress.processed / genProgress.total) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">Memproses {genProgress.processed} dari {genProgress.total} kisi...</p>
                  </div>
                )}

                {genResult && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                    {genResult}
                  </div>
                )}
              </div>
            )}

            {!detailLoading && detail.length === 0 && (
              <p className="px-6 py-4 text-sm text-gray-400">Belum ada data jawaban.</p>
            )}

            {!detailLoading && detail.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-3 py-2 text-left w-12">No</th>
                      <th className="px-3 py-2 text-left">Soal</th>
                      <th className="px-3 py-2 text-center w-20">%Salah</th>
                      <th className="px-3 py-2 text-center w-24">Jawaban</th>
                      <th className="px-3 py-2 text-center w-24">Salah Umum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {detail.map((s) => (
                      <tr key={s.nomor_soal} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-mono text-xs text-gray-500">{s.nomor_soal}</td>
                        <td className="px-3 py-2 text-xs text-gray-800 max-w-md truncate">
                          {s.pertanyaan}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${pctColor(s.persentase_salah)}`}>
                            {s.persentase_salah}%
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center font-mono text-xs font-medium text-emerald-600">
                          {s.jawaban_benar}
                        </td>
                        <td className="px-3 py-2 text-center font-mono text-xs text-red-500">
                          {s.jawaban_salah_umum ?? '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
