import { useEffect, useRef, useState, type RefObject } from 'react'
import { Volume2 } from 'lucide-react'
import type { DiarizedUtterance, Transcript } from '../../types'
import { API_BASE } from '../../lib/api'

// Playback + interactive transcript for a reviewed interview. The recording (stored as an asset)
// drives an <audio> element shared with the report (so clicking a question can also seek). When the
// transcript is diarized, each turn is a clickable line — click to jump, and the line under the
// playhead highlights as it plays. Without diarization there are no per-line timestamps, so we show
// the plain transcript under the player.

function fmt(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function speakerLabel(speaker: number, candidateSpeaker: number | null | undefined): string {
  if (candidateSpeaker != null) return speaker === candidateSpeaker ? 'You' : 'Interviewer'
  return `Speaker ${speaker + 1}`
}

export default function ReviewTranscript({
  assetId,
  transcript,
  // Reviews saved before diarization existed have no utterances — default so old records don't crash.
  utterances = [],
  candidateSpeaker,
  audioRef,
}: {
  assetId: string | null
  transcript: Transcript
  utterances?: DiarizedUtterance[]
  candidateSpeaker?: number | null
  audioRef: RefObject<HTMLAudioElement>
}) {
  const [currentTime, setCurrentTime] = useState(0)
  const activeRef = useRef<HTMLButtonElement>(null)
  const hasTurns = utterances.length > 0

  // Track the playhead so the active turn can highlight + auto-scroll into view.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => setCurrentTime(audio.currentTime)
    audio.addEventListener('timeupdate', onTime)
    return () => audio.removeEventListener('timeupdate', onTime)
  }, [audioRef])

  const activeIndex = hasTurns
    ? utterances.findIndex((u, i) => {
        const next = utterances[i + 1]
        return currentTime >= u.start && (next ? currentTime < next.start : currentTime <= u.end + 1)
      })
    : -1

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  function seek(sec: number) {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = sec
    void audio.play().catch(() => {})
  }

  return (
    <div className="rounded-xl border border-stone-200/80 bg-[#fcfaf6] p-5 shadow-sm">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-stone-700">
        <Volume2 size={15} aria-hidden /> Recording & transcript
      </h3>

      {assetId ? (
        <audio
          ref={audioRef}
          src={`${API_BASE}/api/assets/${assetId}`}
          controls
          preload="metadata"
          className="mt-3 w-full"
        />
      ) : (
        <p className="mt-3 text-xs text-stone-400">
          The original recording wasn’t stored, so playback isn’t available — transcript only.
        </p>
      )}

      {hasTurns ? (
        <div className="mt-4 max-h-96 space-y-1 overflow-y-auto pr-1">
          {utterances.map((u, i) => {
            const isYou = candidateSpeaker != null && u.speaker === candidateSpeaker
            const active = i === activeIndex
            return (
              <button
                key={i}
                ref={active ? activeRef : undefined}
                type="button"
                onClick={() => seek(u.start)}
                className={`flex w-full gap-3 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                  active ? 'bg-terracotta-100/70' : 'hover:bg-stone-100'
                }`}
              >
                <span className="w-10 shrink-0 pt-0.5 text-right font-mono text-[11px] text-stone-400">
                  {fmt(u.start)}
                </span>
                <span className="min-w-0">
                  <span
                    className={`mr-1.5 text-xs font-semibold ${isYou ? 'text-terracotta-700' : 'text-sky-700'}`}
                  >
                    {speakerLabel(u.speaker, candidateSpeaker)}:
                  </span>
                  <span className="text-stone-700">{u.text}</span>
                </span>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="mt-4 max-h-96 overflow-y-auto whitespace-pre-wrap pr-1 text-sm leading-relaxed text-stone-700">
          {transcript.text?.trim() || '(no transcript)'}
          <p className="mt-3 text-xs text-stone-400">
            Add a Deepgram key for a speaker-separated, click-to-seek transcript.
          </p>
        </div>
      )}
    </div>
  )
}
