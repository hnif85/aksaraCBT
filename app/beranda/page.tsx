'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { SetSoal, HasilUjian } from '@/lib/types'

interface SetSoalWithMapel extends SetSoal {
  mata_pelajaran?: { nama: string } | null
}

export default function BerandaPage() {
  const router = useRouter()
  const [nama, setNama] = useState('')
  const [profilId, setProfilId] = useState('')
  const [ujianTersedia, setUjianTersedia] = useState<SetSoalWithMapel[]>([])
  const [riwayat, setRiwayat] = useState<HasilUjian[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = localStorage.getItem('profil_id')
    const storedNama = localStorage.getItem('profil_nama')
    if (!id) { router.replace('/'); return }

    setProfilId(id)
    setNama(storedNama || '')

    async function fetchData() {
      const [setSoalRes, hasilRes] = await Promise.all([
        supabase.from('set_soal').select('*, mata_pelajaran!mata_pelajaran_id(nama)').eq('status', 'ready'),
        supabase.from('hasil_ujian').select('*').eq('profil_id', id).order('created_at', { ascending: false }),
      ])

      if (setSoalRes.data) setUjianTersedia(setSoalRes.data as unknown as SetSoalWithMapel[])
      if (hasilRes.data) setRiwayat(hasilRes.data as HasilUjian[])
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

  if (loading) return <div className="py-8 text-center text-gray-500">Memuat...</div>

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Halo, {nama}!</h1>

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
