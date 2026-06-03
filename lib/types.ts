export interface Profil {
  id: string
  nama: string
  kelas: string
  created_at: string
}

export interface MataPelajaran {
  id: string
  nama: string
  kelas: string
  created_at: string
}

export interface KisiKisi {
  id: string
  mata_pelajaran_id: string
  nomor: number
  capaian_pembelajaran: string | null
  materi: string
  indikator_soal: string
  bentuk_soal: 'PG' | 'GK' | 'BS'
  level_kognitif: string | null
  created_at: string
}

export interface SetSoal {
  id: string
  mata_pelajaran_id: string
  nama: string
  jumlah_soal: number
  durasi_menit: number
  status: 'draft' | 'ready'
  created_at: string
}

export interface Soal {
  id: string
  set_soal_id: string
  kisi_kisi_id: string | null
  nomor_soal: number
  pertanyaan: string
  pilihan_a: string | null
  pilihan_b: string | null
  pilihan_c: string | null
  pilihan_d: string | null
  pilihan_e: string | null
  jawaban_benar: string
  pembahasan: string | null
  bentuk_soal: 'PG' | 'GK' | 'BS'
  created_at: string
}

export interface HasilUjian {
  id: string
  set_soal_id: string
  profil_id: string
  score: number
  total_benar: number
  total_salah: number
  total_tidak_dijawab: number
  waktu_mulai: string | null
  waktu_selesai: string | null
  status: 'in_progress' | 'selesai'
  created_at: string
}

export interface DetailJawaban {
  id: string
  hasil_ujian_id: string
  soal_id: string
  jawaban_peserta: string | null
  is_benar: boolean | null
  is_ragu: boolean
  created_at: string
}

export interface SoalWithJawaban extends Soal {
  jawaban_peserta?: string | null
  is_benar?: boolean | null
  is_ragu?: boolean
}

export interface RekapMateri {
  materi: string
  total: number
  benar: number
  salah: number
  persentase: number
}
