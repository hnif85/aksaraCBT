'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface MapelKisi {
  id: string
  nama: string
  kelas: string
  jumlah_kisi: number
}

interface DashboardData {
  totalMapel: number
  totalSet: number
  totalSoal: number
  mapelKisi: MapelKisi[]
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const [mapelRes, setRes, soalRes] = await Promise.all([
        supabase.from('mata_pelajaran').select('*'),
        supabase.from('set_soal').select('*', { count: 'exact', head: true }),
        supabase.from('soal').select('*', { count: 'exact', head: true }),
      ])

      const mapels = mapelRes.data ?? []
      const mapelKisi: MapelKisi[] = []

      for (const m of mapels) {
        const { count } = await supabase
          .from('kisi_kisi')
          .select('*', { count: 'exact', head: true })
          .eq('mata_pelajaran_id', m.id)
        if (count && count > 0) {
          mapelKisi.push({ id: m.id, nama: m.nama, kelas: m.kelas, jumlah_kisi: count })
        }
      }

      setData({
        totalMapel: mapelKisi.length,
        totalSet: setRes.count ?? 0,
        totalSoal: soalRes.count ?? 0,
        mapelKisi,
      })
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Memuat dashboard...</p>
      </div>
    )
  }

  const stats = [
    { label: 'Mapel dengan Kisi-Kisi', value: data?.totalMapel ?? 0, color: 'bg-blue-500' },
    { label: 'Total Set Soal', value: data?.totalSet ?? 0, color: 'bg-green-500' },
    { label: 'Total Soal Generated', value: data?.totalSoal ?? 0, color: 'bg-purple-500' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Admin aksaraCBT</h1>
          <p className="text-sm text-gray-500">Dashboard</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${s.color}`} />
                <p className="text-sm text-gray-500">{s.label}</p>
              </div>
              <p className="text-3xl font-bold text-gray-900 mt-2">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <Link
            href="/admin/upload"
            className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
          >
            Upload Kisi-Kisi
          </Link>
          <Link
            href="/admin/generate"
            className="inline-flex items-center justify-center px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition"
          >
            Generate Soal
          </Link>
          <Link
            href="/admin/laporan"
            className="inline-flex items-center justify-center px-6 py-3 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition"
          >
            Laporan Nilai
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Daftar Mapel dengan Kisi-Kisi</h2>
            <span className="text-xs text-gray-400">{data?.totalMapel ?? 0} mapel</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left font-medium">Mata Pelajaran</th>
                  <th className="px-6 py-3 text-left font-medium">Kelas</th>
                  <th className="px-6 py-3 text-center font-medium">Jumlah Kisi-Kisi</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.mapelKisi.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-400">
                      Belum ada kisi-kisi. Upload sekarang.
                    </td>
                  </tr>
                )}
                {data?.mapelKisi.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">{m.nama}</td>
                    <td className="px-6 py-3 text-gray-600">{m.kelas}</td>
                    <td className="px-6 py-3 text-center">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full">
                        {m.jumlah_kisi}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Link
                        href={`/admin/upload`}
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        Upload Ulang
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
