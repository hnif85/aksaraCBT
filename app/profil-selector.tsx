'use client'

import { useRouter } from 'next/navigation'
import type { Profil } from '@/lib/types'

export default function ProfilSelector({ profil }: { profil: Profil[] }) {
  const router = useRouter()

  function pilihProfil(p: Profil) {
    localStorage.setItem('profil_id', p.id)
    localStorage.setItem('profil_nama', p.nama)
    localStorage.setItem('profil_kelas', p.kelas)
    router.push('/beranda')
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Pilih Profil</h1>
        <p className="mt-1 text-sm text-gray-500">Pilih profil untuk memulai ujian</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {profil.map((p) => (
          <button
            key={p.id}
            onClick={() => pilihProfil(p)}
            className="flex items-center gap-4 rounded-xl border border-gray-200 p-4 text-left transition hover:border-blue-400 hover:shadow-sm"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-600">
              {p.nama.charAt(0)}
            </div>
            <div>
              <div className="font-semibold">{p.nama}</div>
              <div className="text-sm text-gray-500">{p.kelas}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
