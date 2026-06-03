-- ============================================================
-- aksaraCBT — Database Migration 00001
-- Create all tables, RLS policies, and seed data
-- ============================================================

-- 1. PROFIL
CREATE TABLE IF NOT EXISTS profil (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  kelas TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profil ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to profil" ON profil FOR ALL USING (true) WITH CHECK (true);

-- 2. MATA PELAJARAN
CREATE TABLE IF NOT EXISTS mata_pelajaran (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  kelas TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE mata_pelajaran ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to mata_pelajaran" ON mata_pelajaran FOR ALL USING (true) WITH CHECK (true);

-- 3. KISI KISI
CREATE TABLE IF NOT EXISTS kisi_kisi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mata_pelajaran_id UUID NOT NULL REFERENCES mata_pelajaran(id) ON DELETE CASCADE,
  nomor INT NOT NULL,
  capaian_pembelajaran TEXT,
  materi TEXT NOT NULL,
  indikator_soal TEXT NOT NULL,
  bentuk_soal TEXT NOT NULL CHECK (bentuk_soal IN ('PG', 'GK', 'BS')),
  level_kognitif TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE kisi_kisi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to kisi_kisi" ON kisi_kisi FOR ALL USING (true) WITH CHECK (true);

-- 4. SET SOAL
CREATE TABLE IF NOT EXISTS set_soal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mata_pelajaran_id UUID NOT NULL REFERENCES mata_pelajaran(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  jumlah_soal INT NOT NULL DEFAULT 0,
  durasi_menit INT NOT NULL DEFAULT 15,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE set_soal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to set_soal" ON set_soal FOR ALL USING (true) WITH CHECK (true);

-- 5. SOAL
CREATE TABLE IF NOT EXISTS soal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_soal_id UUID NOT NULL REFERENCES set_soal(id) ON DELETE CASCADE,
  kisi_kisi_id UUID REFERENCES kisi_kisi(id) ON DELETE SET NULL,
  nomor_soal INT NOT NULL,
  pertanyaan TEXT NOT NULL,
  pilihan_a TEXT,
  pilihan_b TEXT,
  pilihan_c TEXT,
  pilihan_d TEXT,
  pilihan_e TEXT,
  jawaban_benar TEXT NOT NULL,
  pembahasan TEXT,
  bentuk_soal TEXT NOT NULL CHECK (bentuk_soal IN ('PG', 'GK', 'BS')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE soal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to soal" ON soal FOR ALL USING (true) WITH CHECK (true);

-- 6. HASIL UJIAN
CREATE TABLE IF NOT EXISTS hasil_ujian (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_soal_id UUID NOT NULL REFERENCES set_soal(id) ON DELETE CASCADE,
  profil_id UUID NOT NULL REFERENCES profil(id) ON DELETE CASCADE,
  score NUMERIC DEFAULT 0,
  total_benar INT DEFAULT 0,
  total_salah INT DEFAULT 0,
  total_tidak_dijawab INT DEFAULT 0,
  waktu_mulai TIMESTAMPTZ,
  waktu_selesai TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'selesai')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE hasil_ujian ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to hasil_ujian" ON hasil_ujian FOR ALL USING (true) WITH CHECK (true);

-- 7. DETAIL JAWABAN
CREATE TABLE IF NOT EXISTS detail_jawaban (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hasil_ujian_id UUID NOT NULL REFERENCES hasil_ujian(id) ON DELETE CASCADE,
  soal_id UUID NOT NULL REFERENCES soal(id) ON DELETE CASCADE,
  jawaban_peserta TEXT,
  is_benar BOOLEAN,
  is_ragu BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE detail_jawaban ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to detail_jawaban" ON detail_jawaban FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO profil (nama, kelas) VALUES
  ('Zahra', '8 MTS'),
  ('Bita', '4 SD');

INSERT INTO mata_pelajaran (nama, kelas) VALUES
  ('Bahasa Inggris', '8 MTS'),
  ('IPA', '8 MTS'),
  ('PKN', '8 MTS');
