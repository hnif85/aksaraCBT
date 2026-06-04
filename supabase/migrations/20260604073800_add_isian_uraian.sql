ALTER TABLE kisi_kisi DROP CONSTRAINT IF EXISTS kisi_kisi_bentuk_soal_check;
ALTER TABLE kisi_kisi ADD CONSTRAINT kisi_kisi_bentuk_soal_check CHECK (bentuk_soal IN ('PG', 'GK', 'BS', 'Isian', 'Uraian'));
ALTER TABLE soal DROP CONSTRAINT IF EXISTS soal_bentuk_soal_check;
ALTER TABLE soal ADD CONSTRAINT soal_bentuk_soal_check CHECK (bentuk_soal IN ('PG', 'GK', 'BS', 'Isian', 'Uraian'));
