'use client'

import { useEffect, useState, use, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { SetSoal, Soal, KisiKisi } from '@/lib/types'

type SoalWithKisi = Soal & { kisi_kisi?: KisiKisi | null }

export default function ReviewSetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [setSoal, setSetSoal] = useState<SetSoal | null>(null)
  const [soalList, setSoalList] = useState<SoalWithKisi[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [saveError, setSaveError] = useState('')
  const [activating, setActivating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [setRes, soalRes] = await Promise.all([
      supabase.from('set_soal').select('*').eq('id', id).single(),
      supabase.from('soal').select('*, kisi_kisi(*)').eq('set_soal_id', id).order('nomor_soal'),
    ])
    if (setRes.data) setSetSoal(setRes.data)
    if (soalRes.data) setSoalList(soalRes.data as SoalWithKisi[])
    setLoading(false)
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  function updateSoal(soalId: string, field: keyof Soal, value: string) {
    setSoalList((prev) =>
      prev.map((s) => (s.id === soalId ? { ...s, [field]: value } : s))
    )
  }

  async function handleSaveSoal(soal: SoalWithKisi) {
    setSavingId(soal.id)
    setSaveError('')
    const { error } = await supabase
      .from('soal')
      .update({
        pertanyaan: soal.pertanyaan,
        pilihan_a: soal.pilihan_a,
        pilihan_b: soal.pilihan_b,
        pilihan_c: soal.pilihan_c,
        pilihan_d: soal.pilihan_d,
        pilihan_e: soal.pilihan_e,
        jawaban_benar: soal.jawaban_benar,
        pembahasan: soal.pembahasan,
      })
      .eq('id', soal.id)
    if (error) setSaveError(error.message)
    setSavingId(null)
  }

  async function handleActivate() {
    setActivating(true)
    const { error } = await supabase
      .from('set_soal')
      .update({ status: 'ready' })
      .eq('id', id)
    if (!error) {
      setSetSoal((prev) => prev ? { ...prev, status: 'ready' } : prev)
    } else {
      setSaveError(error.message)
    }
    setActivating(false)
  }

  async function handleDelete() {
    if (!confirm('Hapus set soal ini beserta semua soalnya?')) return
    setDeleting(true)
    const { error } = await supabase
      .from('set_soal')
      .delete()
      .eq('id', id)
    if (!error) {
      router.push('/admin/generate')
    } else {
      setSaveError(error.message)
      setDeleting(false)
    }
  }

  const bentukColors: Record<string, string> = {
    PG: 'bg-blue-100 text-blue-700',
    GK: 'bg-purple-100 text-purple-700',
    BS: 'bg-amber-100 text-amber-700',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Memuat soal...</p>
      </div>
    )
  }

  if (!setSoal) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">Set soal tidak ditemukan.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin/generate" className="text-sm text-indigo-600 hover:underline">&larr; Generate</Link>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">{setSoal.nama}</h1>
              <p className="text-xs text-gray-400">
                {setSoal.jumlah_soal} soal — Status:{' '}
                <span className={`font-medium ${setSoal.status === 'ready' ? 'text-green-600' : 'text-amber-600'}`}>
                  {setSoal.status === 'ready' ? 'Aktif' : 'Draft'}
                </span>
              </p>
            </div>
            <div className="flex gap-2">
              {setSoal.status === 'draft' && (
                <button
                  onClick={handleActivate}
                  disabled={activating}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                >
                  {activating ? '...' : 'Aktifkan Set'}
                </button>
              )}
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
              >
                {deleting ? '...' : 'Hapus Set'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {saveError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{saveError}</div>
        )}

        {soalList.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center text-sm text-gray-400">
            Belum ada soal. Generate ulang dari halaman generate.
          </div>
        )}

        {soalList.map((soal, idx) => (
          <div key={soal.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-900">Soal #{idx + 1}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${bentukColors[soal.bentuk_soal]}`}>
                  {soal.bentuk_soal}
                </span>
              </div>
              {soal.kisi_kisi && (
                <span className="text-xs text-gray-400 truncate max-w-xs">{soal.kisi_kisi.materi}</span>
              )}
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Pertanyaan</label>
                <textarea
                  value={soal.pertanyaan}
                  onChange={(e) => updateSoal(soal.id, 'pertanyaan', e.target.value)}
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(['a', 'b', 'c', 'd', 'e'] as const).map((key) => {
                  const field = `pilihan_${key}` as keyof Soal
                  return (
                    <div key={key}>
                      <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">Pilihan {key}</label>
                      <input
                        value={(soal[field] as string) ?? ''}
                        onChange={(e) => updateSoal(soal.id, field, e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                  )
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Jawaban Benar</label>
                  <input
                    value={soal.jawaban_benar}
                    onChange={(e) => updateSoal(soal.id, 'jawaban_benar', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Pembahasan</label>
                <textarea
                  value={soal.pembahasan ?? ''}
                  onChange={(e) => updateSoal(soal.id, 'pembahasan', e.target.value)}
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => handleSaveSoal(soal)}
                  disabled={savingId === soal.id}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                  {savingId === soal.id ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
