'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { MataPelajaran, KisiKisi, SetSoal } from '@/lib/types'

export default function GeneratePage() {
  const router = useRouter()
  const [mapelList, setMapelList] = useState<MataPelajaran[]>([])
  const [selectedMapel, setSelectedMapel] = useState('')
  const [kisiList, setKisiList] = useState<KisiKisi[]>([])
  const [existingSets, setExistingSets] = useState<SetSoal[]>([])
  const [selectedKisiIds, setSelectedKisiIds] = useState<Set<string>>(new Set())
  const [setName, setSetName] = useState('')
  const [generating, setGenerating] = useState(false)
  const [genProgress, setGenProgress] = useState<{ processed: number; total: number } | null>(null)
  const [progress, setProgress] = useState('')
  const [generatedSetId, setGeneratedSetId] = useState<string | null>(null)
  const [generationError, setGenerationError] = useState('')

  useEffect(() => {
    supabase.from('mata_pelajaran').select('*').order('nama').then(({ data }) => {
      if (data) setMapelList(data)
    })
  }, [])

  useEffect(() => {
    if (!selectedMapel) {
      setKisiList([])
      setExistingSets([])
      setSelectedKisiIds(new Set())
      return
    }
    Promise.all([
      supabase.from('kisi_kisi').select('*').eq('mata_pelajaran_id', selectedMapel).order('nomor'),
      supabase.from('set_soal').select('*').eq('mata_pelajaran_id', selectedMapel).order('created_at', { ascending: false }),
    ]).then(([kisiRes, setRes]) => {
      setKisiList(kisiRes.data ?? [])
      setExistingSets(setRes.data ?? [])
      setSelectedKisiIds(new Set((kisiRes.data ?? []).map((k) => k.id)))
    })
  }, [selectedMapel])

  function toggleKisi(id: string) {
    setSelectedKisiIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAllKisi() {
    setSelectedKisiIds(new Set(kisiList.map((k) => k.id)))
  }

  function deselectAllKisi() {
    setSelectedKisiIds(new Set())
  }

  async function handleGenerate() {
    if (!selectedMapel || !setName.trim() || selectedKisiIds.size === 0) return
    setGenerating(true)
    setProgress('Membuat set soal...')
    setGenerationError('')
    setGeneratedSetId(null)

    const { data: setData, error: setErr } = await supabase
      .from('set_soal')
      .insert({
        mata_pelajaran_id: selectedMapel,
        nama: setName.trim(),
        jumlah_soal: selectedKisiIds.size,
        durasi_menit: 15,
        status: 'draft',
      })
      .select()
      .single()

    if (setErr || !setData) {
      setGenerationError(setErr?.message ?? 'Gagal membuat set')
      setGenerating(false)
      return
    }

    const setId = setData.id

    try {
      const res = await fetch('/api/generate-soal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          set_soal_id: setId,
          kisi_kisi_ids: Array.from(selectedKisiIds),
        }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Gagal generate soal')
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let currentEvent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() || ''

        for (const part of parts) {
          const lines = part.split('\n')
          let eventType = ''
          let dataText = ''

          for (const line of lines) {
            if (line.startsWith('event: ')) eventType = line.slice(7).trim()
            else if (line.startsWith('data: ')) dataText = line.slice(6)
          }

          if (!eventType || !dataText) continue
          const data = JSON.parse(dataText)

          if (eventType === 'progress') {
            setGenProgress({ processed: data.processed, total: data.total })
            setProgress(`Memproses ${data.processed} dari ${data.total} kisi...`)
          } else if (eventType === 'complete') {
            setGenProgress(null)
            setProgress(
              data.failed > 0
                ? `Selesai! ${data.total} soal berhasil, ${data.failed} gagal.`
                : `Selesai! ${data.total} soal berhasil digenerate.`
            )
            setGeneratedSetId(setId)
            if (data.errors?.length > 0) {
              setGenerationError(data.errors.map((e: any) => `Kisi ${e.nomor}: ${e.message}`).join('\n'))
            }
          } else if (eventType === 'error') {
            throw new Error(data.message)
          }
        }
      }
    } catch (err: unknown) {
      setGenerationError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setGenerating(false)
      setGenProgress(null)
    }
  }

  const bentukColors: Record<string, string> = {
    PG: 'bg-blue-100 text-blue-700',
    GK: 'bg-purple-100 text-purple-700',
    BS: 'bg-amber-100 text-amber-700',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link href="/admin" className="text-sm text-indigo-600 hover:underline">&larr; Dashboard</Link>
          <h1 className="text-xl font-bold text-gray-900">Generate Soal</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
            <select
              value={selectedMapel}
              onChange={(e) => setSelectedMapel(e.target.value)}
              className="w-full sm:w-80 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">Pilih mata pelajaran...</option>
              {mapelList.map((m) => (
                <option key={m.id} value={m.id}>{m.nama}</option>
              ))}
            </select>
          </div>
        </div>

        {existingSets.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Set Soal yang Ada</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {existingSets.map((s) => (
                <div key={s.id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{s.nama}</p>
                    <p className="text-xs text-gray-400">
                      {s.jumlah_soal} soal — {s.status === 'ready' ? 'Aktif' : 'Draft'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/set/${s.id}`}
                      className="text-xs px-3 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedMapel && kisiList.length > 0 && (
          <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
                <h2 className="font-semibold text-gray-900">Pilih Kisi-Kisi ({selectedKisiIds.size} dari {kisiList.length})</h2>
                <div className="flex gap-2">
                  <button onClick={selectAllKisi} className="text-xs px-3 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition">Pilih Semua</button>
                  <button onClick={deselectAllKisi} className="text-xs px-3 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition">Hapus Semua</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="w-10 px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selectedKisiIds.size === kisiList.length}
                          onChange={() => {
                            if (selectedKisiIds.size === kisiList.length) deselectAllKisi()
                            else selectAllKisi()
                          }}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="px-3 py-2 text-left">No</th>
                      <th className="px-3 py-2 text-left">Materi</th>
                      <th className="px-3 py-2 text-left">Indikator</th>
                      <th className="px-3 py-2 text-left">Bentuk</th>
                      <th className="px-3 py-2 text-left">Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {kisiList.map((k) => (
                      <tr
                        key={k.id}
                        className={`hover:bg-gray-50 cursor-pointer ${selectedKisiIds.has(k.id) ? 'bg-indigo-50/50' : ''}`}
                        onClick={() => toggleKisi(k.id)}
                      >
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selectedKisiIds.has(k.id)}
                            onChange={() => toggleKisi(k.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-3 py-2 font-mono text-xs">{k.nomor}</td>
                        <td className="px-3 py-2">{k.materi}</td>
                        <td className="px-3 py-2 text-xs text-gray-500 max-w-xs truncate">{k.indikator_soal}</td>
                        <td className="px-3 py-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${bentukColors[k.bentuk_soal]}`}>
                            {k.bentuk_soal}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500">{k.level_kognitif}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Set Soal</label>
                <input
                  value={setName}
                  onChange={(e) => setSetName(e.target.value)}
                  placeholder="Contoh: Tryout 1, Set A"
                  className="w-full sm:w-80 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating || !setName.trim() || selectedKisiIds.size === 0}
                className="px-6 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition"
              >
                {generating ? 'Menggenerate...' : 'Generate Soal'}
              </button>

              {genProgress && (
                <div className="space-y-2">
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.round((genProgress.processed / genProgress.total) * 100)}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 animate-pulse">
                    {progress || `Memproses ${genProgress.processed} dari ${genProgress.total} kisi...`}
                  </p>
                </div>
              )}

              {!genProgress && progress && (
                <p className="text-sm text-gray-600">{progress}</p>
              )}

              {generationError && (
                <p className="text-sm text-red-600 whitespace-pre-wrap">{generationError}</p>
              )}

              {generatedSetId && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center justify-between">
                  <span>Set soal berhasil digenerate!</span>
                  <Link
                    href={`/admin/set/${generatedSetId}`}
                    className="px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    Review Soal
                  </Link>
                </div>
              )}
            </div>
          </>
        )}

        {selectedMapel && kisiList.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center text-sm text-gray-400">
            Belum ada kisi-kisi untuk mapel ini.{' '}
            <Link href="/admin/upload" className="text-indigo-600 hover:underline">Upload kisi-kisi</Link>
          </div>
        )}
      </main>
    </div>
  )
}
