'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { SetSoal, HasilUjian } from '@/lib/types'

interface SetSoalWithMapel extends SetSoal {
  mata_pelajaran?: { nama: string } | null
}

interface MapelOption {
  id: string
  nama: string
  total_kisi: number
}

export default function BerandaPage() {
  const router = useRouter()
  const [nama, setNama] = useState('')
  const [profilId, setProfilId] = useState('')
  const [ujianTersedia, setUjianTersedia] = useState<SetSoalWithMapel[]>([])
  const [riwayat, setRiwayat] = useState<HasilUjian[]>([])
  const [loading, setLoading] = useState(true)
  const [mapelList, setMapelList] = useState<MapelOption[]>([])
  const [selectedMapel, setSelectedMapel] = useState('')
  const [generating, setGenerating] = useState(false)
  const [genProgress, setGenProgress] = useState<{ processed: number; total: number } | null>(null)
  const [genResult, setGenResult] = useState<string | null>(null)

  useEffect(() => {
    const id = localStorage.getItem('profil_id')
    const storedNama = localStorage.getItem('profil_nama')
    if (!id) { router.replace('/'); return }

    setProfilId(id)
    setNama(storedNama || '')

    async function fetchData() {
      const [setSoalRes, hasilRes, kisiRes] = await Promise.all([
        supabase.from('set_soal').select('*, mata_pelajaran!mata_pelajaran_id(nama)').eq('status', 'ready'),
        supabase.from('hasil_ujian').select('*').eq('profil_id', id).order('created_at', { ascending: false }),
        supabase.from('kisi_kisi').select('mata_pelajaran_id, mata_pelajaran!mata_pelajaran_id(nama)'),
      ])

      if (setSoalRes.data) setUjianTersedia(setSoalRes.data as unknown as SetSoalWithMapel[])
      if (hasilRes.data) setRiwayat(hasilRes.data as HasilUjian[])

      if (kisiRes.data) {
        const map = new Map<string, MapelOption>()
        for (const k of kisiRes.data as any[]) {
          const mid = k.mata_pelajaran_id
          if (!map.has(mid)) {
            map.set(mid, { id: mid, nama: k.mata_pelajaran?.nama ?? '', total_kisi: 0 })
          }
          map.get(mid)!.total_kisi++
        }
        setMapelList([...map.values()])
      }

      setLoading(false)
    }

    fetchData()
  }, [router])

  async function mulaiUjian(setSoalId: string) {
    const res = await fetch('/api/start-ujian', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ set_soal_id: setSoalId, profil_id: profilId }),
    })
    const { hasil_id } = await res.json()
    router.push(`/ujian/${hasil_id}`)
  }

  async function handleGenerateTryout() {
    if (!selectedMapel) return
    setGenerating(true)
    setGenProgress(null)
    setGenResult(null)

    const mapel = mapelList.find((m) => m.id === selectedMapel)
    if (!mapel) { setGenerating(false); return }

    try {
      const { count } = await supabase
        .from('set_soal')
        .select('*', { count: 'exact', head: true })
        .eq('mata_pelajaran_id', selectedMapel)

      const setNama = `${mapel.nama} - ${(count ?? 0) + 1}`

      const { data: allKisi } = await supabase
        .from('kisi_kisi')
        .select('id')
        .eq('mata_pelajaran_id', selectedMapel)

      const kisiIds = (allKisi ?? []).map((k: any) => k.id)
      if (kisiIds.length === 0) throw new Error('Tidak ada kisi-kisi untuk mapel ini')

      const { data: setData, error: setErr } = await supabase
        .from('set_soal')
        .insert({
          mata_pelajaran_id: selectedMapel,
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

      const [setSoalRes] = await Promise.all([
        supabase.from('set_soal').select('*, mata_pelajaran!mata_pelajaran_id(nama)').eq('status', 'ready'),
      ])
      if (setSoalRes.data) setUjianTersedia(setSoalRes.data as unknown as SetSoalWithMapel[])
      setSelectedMapel('')
    } catch (e: any) {
      setGenResult(`Gagal: ${e.message}`)
    } finally {
      setGenerating(false)
      setGenProgress(null)
    }
  }

  if (loading) return <div className="py-8 text-center text-gray-500">Memuat...</div>

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Halo, {nama}!</h1>

      {mapelList.length > 0 && (
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-3 text-lg font-semibold">Buat Tryout Baru</h2>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Mapel</label>
              <select
                value={selectedMapel}
                onChange={(e) => setSelectedMapel(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">Pilih mata pelajaran...</option>
                {mapelList.map((m) => (
                  <option key={m.id} value={m.id}>{m.nama} ({m.total_kisi} kisi)</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleGenerateTryout}
              disabled={generating || !selectedMapel}
              className="px-6 py-2 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50 transition"
            >
              {generating ? 'Menggenerate...' : 'Generate Tryout'}
            </button>
          </div>

          {genProgress && (
            <div className="mt-4 space-y-1">
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.round((genProgress.processed / genProgress.total) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-400">Memproses {genProgress.processed} dari {genProgress.total} kisi...</p>
            </div>
          )}

          {genResult && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${genResult.startsWith('Gagal') ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
              {genResult}
            </div>
          )}
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Ujian Tersedia</h2>
        {ujianTersedia.length === 0 ? (
          <p className="text-gray-500">Belum ada ujian tersedia.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {ujianTersedia.map((u) => (
              <div key={u.id} className="rounded-lg border p-4">
                <h3 className="font-semibold">{u.nama}</h3>
                <p className="text-sm text-gray-500">{u.mata_pelajaran?.nama || '-'}</p>
                <p className="text-sm text-gray-500">{u.jumlah_soal} soal &middot; {u.durasi_menit} menit</p>
                <button
                  onClick={() => mulaiUjian(u.id)}
                  className="mt-3 rounded bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700"
                >
                  Mulai Ujian
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Riwayat Ujian</h2>
        {riwayat.length === 0 ? (
          <p className="text-gray-500">Belum ada riwayat ujian.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-4">Tanggal</th>
                  <th className="py-2 pr-4">Skor</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {riwayat.map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="py-2 pr-4">{new Date(r.created_at).toLocaleDateString('id-ID')}</td>
                    <td className="py-2 pr-4">{r.score ?? '-'}</td>
                    <td className="py-2 pr-4">
                      <span className={`rounded px-2 py-0.5 text-xs ${r.status === 'selesai' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {r.status === 'selesai' ? 'Selesai' : 'Sedang Berjalan'}
                      </span>
                    </td>
                    <td className="py-2">
                      {r.status === 'selesai' && (
                        <button onClick={() => router.push(`/hasil/${r.id}`)} className="text-blue-600 hover:underline">
                          Lihat
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
