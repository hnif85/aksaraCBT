'use client'

import { use, useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Soal } from '@/lib/types'

interface SoalData extends Soal {
  jawaban_peserta?: string | null
  is_ragu?: boolean
}

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export default function UjianPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [soals, setSoals] = useState<SoalData[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [flagged, setFlagged] = useState<Set<string>>(new Set())
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [showNavigator, setShowNavigator] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const submittedRef = useRef(false)
  const answersRef = useRef(answers)
  answersRef.current = answers
  const soalsRef = useRef(soals)
  soalsRef.current = soals

  useEffect(() => {
    async function init() {
      try {
        const { data: hu, error: huErr } = await supabase
          .from('hasil_ujian')
          .select('*, set_soal:set_soal_id(*)')
          .eq('id', id)
          .single()

        if (huErr || !hu) {
          setError('Hasil ujian tidak ditemukan')
          setLoading(false)
          return
        }

        if (hu.status === 'selesai') {
          router.replace(`/hasil/${id}`)
          return
        }

        const setSoal = hu.set_soal as any

        const { data: details, error: detErr } = await supabase
          .from('detail_jawaban')
          .select('*, soal:soal_id(*)')
          .eq('hasil_ujian_id', id)

        if (detErr) {
          setError(detErr.message)
          setLoading(false)
          return
        }

        const sorted = (details || []).sort(
          (a: any, b: any) => a.soal.nomor_soal - b.soal.nomor_soal
        )

        const initAnswers: Record<string, string> = {}
        const initFlagged = new Set<string>()
        const soalDatas: SoalData[] = sorted.map((d: any) => {
          if (d.jawaban_peserta) initAnswers[d.soal_id] = d.jawaban_peserta
          if (d.is_ragu) initFlagged.add(d.soal_id)
          return { ...d.soal, jawaban_peserta: d.jawaban_peserta, is_ragu: d.is_ragu }
        })

        setSoals(soalDatas)
        setAnswers(initAnswers)
        setFlagged(initFlagged)
        setTimeLeft((setSoal?.durasi_menit || 15) * 60)
        setLoading(false)
      } catch (e: any) {
        setError(e.message)
        setLoading(false)
      }
    }

    init()
  }, [id, router])

  const handleSubmit = useCallback(async () => {
    if (submittedRef.current) return
    submittedRef.current = true
    setSubmitting(true)
    setShowConfirm(false)

    try {
      const jawabanArray = soalsRef.current.map((s) => ({
        soal_id: s.id,
        jawaban_peserta: answersRef.current[s.id] || '',
      }))

      const res = await fetch('/api/submit-ujian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hasil_ujian_id: id,
          jawaban: jawabanArray,
        }),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Gagal mengirim jawaban')
      }

      router.replace(`/hasil/${id}`)
    } catch (e: any) {
      setError(e.message)
      setSubmitting(false)
      submittedRef.current = false
    }
  }, [id, router])

  const handleSubmitRef = useRef(handleSubmit)
  handleSubmitRef.current = handleSubmit

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || loading || submitting) return
    const timer = setInterval(() => {
      setTimeLeft((t) => (t ?? 0) - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft, loading, submitting])

  useEffect(() => {
    if (timeLeft === 0 && !loading && !submitting) {
      handleSubmitRef.current()
    }
  }, [timeLeft, loading, submitting])

  const currentSoal = soals[currentIndex]

  const handleAnswer = useCallback((soalId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [soalId]: value }))
  }, [])

  const handleGkToggle = useCallback((soalId: string, value: string) => {
    setAnswers((prev) => {
      const current = prev[soalId] || ''
      const selected = current ? current.split(',').filter(Boolean) : []
      const idx = selected.indexOf(value)
      if (idx >= 0) {
        selected.splice(idx, 1)
      } else {
        selected.push(value)
      }
      selected.sort()
      const next = selected.join(',')
      if (!next) {
        const { [soalId]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [soalId]: next }
    })
  }, [])

  const toggleFlag = useCallback(() => {
    if (!currentSoal) return
    setFlagged((prev) => {
      const next = new Set(prev)
      if (next.has(currentSoal.id)) next.delete(currentSoal.id)
      else next.add(currentSoal.id)
      return next
    })
  }, [currentSoal])

  const goToQuestion = useCallback((idx: number) => {
    setCurrentIndex(idx)
    setShowNavigator(false)
  }, [])

  const answeredCount = useMemo(
    () => Object.keys(answers).length,
    [answers]
  )

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Memuat soal...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white gap-4 p-4">
        <p className="text-red-600 text-center">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium"
        >
          Coba Lagi
        </button>
      </div>
    )
  }

  if (!currentSoal || soals.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500">Tidak ada soal</p>
      </div>
    )
  }

  const isLast = currentIndex === soals.length - 1

  function renderOptions() {
    const s = currentSoal

    if (s.bentuk_soal === 'BS') {
      const bsOptions = [
        { value: 'A', label: 'Benar' },
        { value: 'B', label: 'Salah' },
      ]
      return (
        <div className="space-y-3">
          {bsOptions.map((opt) => {
            const selected = answers[s.id] === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => handleAnswer(s.id, opt.value)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  selected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <span
                  className={`font-bold mr-2 ${
                    selected ? 'text-blue-600' : 'text-gray-500'
                  }`}
                >
                  {opt.value}.
                </span>
                <span>{opt.label}</span>
              </button>
            )
          })}
        </div>
      )
    }

    const letters = ['A', 'B', 'C', 'D', 'E'] as const
    const labels: Record<string, string | null> = {
      A: s.pilihan_a,
      B: s.pilihan_b,
      C: s.pilihan_c,
      D: s.pilihan_d,
      E: s.pilihan_e,
    }
    const available = letters.filter(
      (l) => labels[l] !== null && labels[l] !== ''
    )

    if (s.bentuk_soal === 'GK') {
      const selectedValues = (answers[s.id] || '').split(',').filter(Boolean)
      return (
        <div className="space-y-3">
          {available.map((l) => {
            const checked = selectedValues.includes(l)
            return (
              <button
                key={l}
                onClick={() => handleGkToggle(s.id, l)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  checked
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 mr-3 rounded border-2 text-sm font-bold ${
                    checked
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-gray-300 bg-white text-gray-500'
                  }`}
                >
                  {l}
                </span>
                <span>{labels[l]}</span>
              </button>
            )
          })}
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {available.map((l) => {
          const selected = answers[s.id] === l
          return (
            <button
              key={l}
              onClick={() => handleAnswer(s.id, l)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                selected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <span
                className={`font-bold mr-2 ${
                  selected ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                {l}.
              </span>
              <span>{labels[l]}</span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className={`font-mono text-lg font-semibold tracking-wider ${
              timeLeft !== null && timeLeft <= 60 ? 'text-red-600' : 'text-gray-900'
            }`}>
              {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNavigator(true)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
            aria-label="Navigasi soal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm text-gray-600 font-medium">
            Soal {currentIndex + 1}/{soals.length}
          </span>
          <button
            onClick={() => setShowConfirm(true)}
            disabled={submitting}
            className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Mengirim...' : 'Submit'}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">
              {currentSoal.nomor_soal}
            </span>
            {flagged.has(currentSoal.id) && (
              <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
                Ditandai
              </span>
            )}
            <span className="text-xs text-gray-400 ml-auto">
              {currentSoal.bentuk_soal === 'PG'
                ? 'Pilihan Ganda'
                : currentSoal.bentuk_soal === 'GK'
                ? 'Ganda Kompleks'
                : 'Benar / Salah'}
            </span>
          </div>

          <p className="text-base leading-relaxed text-gray-900 mb-6 whitespace-pre-wrap">
            {currentSoal.pertanyaan}
          </p>

          {renderOptions()}
        </div>
      </main>

      <footer className="sticky bottom-0 border-t border-gray-200 bg-white px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <button
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="px-5 py-3 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-300 disabled:opacity-30 disabled:hover:border-gray-200 transition-colors"
          >
            Sebelumnya
          </button>

          <button
            onClick={toggleFlag}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
              flagged.has(currentSoal.id)
                ? 'border-amber-400 bg-amber-50 text-amber-700'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {flagged.has(currentSoal.id) && (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
            Tandai Ragu
          </button>

          <button
            onClick={() => {
              if (isLast) {
                setShowConfirm(true)
              } else {
                setCurrentIndex((i) => i + 1)
              }
            }}
            className="px-5 py-3 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            {isLast ? 'Selesai' : 'Selanjutnya'}
          </button>
        </div>
      </footer>

      {showNavigator && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setShowNavigator(false)}
          />
          <div className="fixed inset-0 z-40 hidden md:block" onClick={() => setShowNavigator(false)} />
          <div className="fixed bottom-0 left-0 right-0 md:right-0 md:top-0 md:left-auto md:w-80 bg-white rounded-t-2xl md:rounded-none md:rounded-l-2xl shadow-xl z-50 max-h-[75vh] md:max-h-full overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-1 md:mb-4">
              <div className="md:hidden w-10 h-1 bg-gray-300 rounded-full mx-auto" />
            </div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Navigasi Soal</h3>
              <button
                onClick={() => setShowNavigator(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {soals.map((s, idx) => {
                const isFlagged = flagged.has(s.id)
                const isAnswered = !!answers[s.id]
                const isCurrent = idx === currentIndex

                let btnClass = 'bg-gray-100 text-gray-600'
                if (isFlagged) btnClass = 'bg-amber-400 text-white'
                else if (isAnswered) btnClass = 'bg-blue-600 text-white'

                return (
                  <button
                    key={s.id}
                    onClick={() => goToQuestion(idx)}
                    className={`w-full aspect-square rounded-lg text-sm font-bold transition-transform active:scale-95 ${btnClass} ${
                      isCurrent
                        ? 'ring-2 ring-blue-500 ring-offset-2'
                        : ''
                    }`}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>
            <div className="space-y-2 text-sm text-gray-500 border-t border-gray-100 pt-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-100 border border-gray-200" />
                <span>Belum dijawab</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-600" />
                <span>Sudah dijawab</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-amber-400" />
                <span>Ditandai ragu</span>
              </div>
            </div>
          </div>
        </>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Selesaikan Ujian?
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-2">
              Pastikan semua jawaban sudah diisi. Jawaban yang belum diisi akan dianggap tidak dijawab.
            </p>
            <p className="text-gray-500 text-xs mb-6">
              Terjawab: {answeredCount}/{soals.length}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 font-medium text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl bg-green-600 text-white font-medium text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Mengirim...' : 'Ya, Selesai'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
