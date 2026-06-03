'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface DashboardData {
  totalKisi: number
  totalSet: number
  totalSoal: number
  recentKisi: { id: string; materi: string; bentuk_soal: string; created_at: string; mata_pelajaran_id: string }[]
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const [kisiRes, setRes, soalRes, recentRes] = await Promise.all([
        supabase.from('kisi_kisi').select('*', { count: 'exact', head: true }),
        supabase.from('set_soal').select('*', { count: 'exact', head: true }),
        supabase.from('soal').select('*', { count: 'exact', head: true }),
        supabase.from('kisi_kisi').select('*').order('created_at', { ascending: false }).limit(5),
      ])

      setData({
        totalKisi: kisiRes.count ?? 0,
        totalSet: setRes.count ?? 0,
        totalSoal: soalRes.count ?? 0,
        recentKisi: recentRes.data ?? [],
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
    { label: 'Total Kisi-Kisi', value: data?.totalKisi ?? 0, color: 'bg-blue-500' },
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
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Kisi-Kisi Terbaru</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {data?.recentKisi.length === 0 && (
              <p className="px-6 py-4 text-sm text-gray-400">Belum ada kisi-kisi.</p>
            )}
            {data?.recentKisi.map((k) => (
              <div key={k.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{k.materi}</p>
                  <p className="text-xs text-gray-400">
                    {k.bentuk_soal} — {new Date(k.created_at).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">{k.bentuk_soal}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
