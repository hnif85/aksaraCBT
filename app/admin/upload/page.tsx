'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { MataPelajaran, KisiKisi } from '@/lib/types'

interface ParsedRow {
  nomor: number
  capaian_pembelajaran: string
  materi: string
  indikator_soal: string
  bentuk_soal: KisiKisi['bentuk_soal']
  level_kognitif: string
}

export default function UploadPage() {
  const [mapelList, setMapelList] = useState<MataPelajaran[]>([])
  const [selectedMapel, setSelectedMapel] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [existsData, setExistsData] = useState(false)
  const [replaceMode, setReplaceMode] = useState(false)

  useEffect(() => {
    supabase.from('mata_pelajaran').select('*').order('nama').then(({ data }) => {
      if (data) setMapelList(data)
    })
  }, [])

  const checkExisting = useCallback(async (mapelId: string) => {
    const { count } = await supabase
      .from('kisi_kisi')
      .select('*', { count: 'exact', head: true })
      .eq('mata_pelajaran_id', mapelId)
    setExistsData((count ?? 0) > 0)
  }, [])

  useEffect(() => {
    if (selectedMapel) checkExisting(selectedMapel)
  }, [selectedMapel, checkExisting])

  async function handleFileUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !selectedMapel) return
    setUploading(true)
    setUploadError('')
    setSaveSuccess(false)
    setParsedRows([])

    const formData = new FormData()
    formData.append('file', file)
    formData.append('mata_pelajaran_id', selectedMapel)

    try {
      const res = await fetch('/api/parse-kisi', { method: 'POST', body: formData })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Gagal memproses file')
      setParsedRows(result.data)
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setUploading(false)
    }
  }

  function updateRow(index: number, field: keyof ParsedRow, value: string) {
    setParsedRows((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  async function handleSave() {
    if (!selectedMapel || parsedRows.length === 0) return
    setSaving(true)
    setSaveSuccess(false)

    const rows = parsedRows.map((r) => ({
      mata_pelajaran_id: selectedMapel,
      nomor: r.nomor,
      capaian_pembelajaran: r.capaian_pembelajaran || null,
      materi: r.materi,
      indikator_soal: r.indikator_soal,
      bentuk_soal: r.bentuk_soal,
      level_kognitif: r.level_kognitif || null,
    }))

    if (replaceMode) {
      await supabase.from('kisi_kisi').delete().eq('mata_pelajaran_id', selectedMapel)
    }

    const { error } = await supabase.from('kisi_kisi').insert(rows)
    if (error) {
      setUploadError(error.message)
    } else {
      setSaveSuccess(true)
      setParsedRows([])
      setFile(null)
    }
    setSaving(false)
  }

  const bentukSoalOptions: KisiKisi['bentuk_soal'][] = ['PG', 'GK', 'BS']

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link href="/admin" className="text-sm text-indigo-600 hover:underline">&larr; Dashboard</Link>
          <h1 className="text-xl font-bold text-gray-900">Upload Kisi-Kisi</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {saveSuccess && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            Kisi-kisi berhasil disimpan!
          </div>
        )}

        <form onSubmit={handleFileUpload} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
            <select
              value={selectedMapel}
              onChange={(e) => setSelectedMapel(e.target.value)}
              className="w-full sm:w-80 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            >
              <option value="">Pilih mata pelajaran...</option>
              {mapelList.map((m) => (
                <option key={m.id} value={m.id}>{m.nama}</option>
              ))}
            </select>
          </div>

          {existsData && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
              Kisi-kisi sudah ada untuk mapel ini.{' '}
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={replaceMode}
                  onChange={(e) => setReplaceMode(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Ganti dengan yang baru
              </label>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">File (.docx / .pdf)</label>
            <input
              type="file"
              accept=".docx,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              required
            />
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {uploading ? 'Memproses file...' : 'Upload & Proses'}
          </button>

          {uploadError && (
            <p className="text-sm text-red-600">{uploadError}</p>
          )}
        </form>

        {parsedRows.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Preview Kisi-Kisi ({parsedRows.length} baris)</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-3 py-2 text-left">No</th>
                    <th className="px-3 py-2 text-left">CP</th>
                    <th className="px-3 py-2 text-left">Materi</th>
                    <th className="px-3 py-2 text-left">Indikator</th>
                    <th className="px-3 py-2 text-left">Bentuk</th>
                    <th className="px-3 py-2 text-left">Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {parsedRows.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-mono text-xs">{row.nomor}</td>
                      <td className="px-3 py-2">
                        <textarea
                          value={row.capaian_pembelajaran ?? ''}
                          onChange={(e) => updateRow(i, 'capaian_pembelajaran', e.target.value)}
                          rows={2}
                          className="w-full text-xs border border-gray-200 rounded px-2 py-1 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={row.materi}
                          onChange={(e) => updateRow(i, 'materi', e.target.value)}
                          className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <textarea
                          value={row.indikator_soal}
                          onChange={(e) => updateRow(i, 'indikator_soal', e.target.value)}
                          rows={2}
                          className="w-full text-xs border border-gray-200 rounded px-2 py-1 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={row.bentuk_soal}
                          onChange={(e) => updateRow(i, 'bentuk_soal', e.target.value)}
                          className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        >
                          {bentukSoalOptions.map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={row.level_kognitif}
                          onChange={(e) => updateRow(i, 'level_kognitif', e.target.value)}
                          className="w-20 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition"
              >
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
