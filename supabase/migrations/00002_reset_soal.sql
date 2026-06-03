-- ============================================================
-- aksaraCBT — Migration 00002
-- Hapus semua soal dan reset set_soal
-- ============================================================

-- Hapus jawaban dulu (FK ke soal)
DELETE FROM detail_jawaban;

-- Hapus semua soal
DELETE FROM soal;

-- Reset jumlah_soal dan kembalikan status ke draft
UPDATE set_soal SET jumlah_soal = 0, status = 'draft';
