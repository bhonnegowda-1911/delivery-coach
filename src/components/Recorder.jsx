import { useEffect, useRef, useState } from 'react'

const MAX_SECONDS = 180 // ~3 min cap keeps recordings under Whisper's 25 MB limit

function formatTime(s) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

// Read a media file's duration (seconds) via a detached element. Returns null if unknown.
function readDuration(blob, isVideo) {
  return new Promise((resolve) => {
    const el = document.createElement(isVideo ? 'video' : 'audio')
    el.preload = 'metadata'
    el.onloadedmetadata = () => {
      const d = el.duration
      URL.revokeObjectURL(el.src)
      resolve(Number.isFinite(d) && d > 0 ? d : null)
    }
    el.onerror = () => {
      URL.revokeObjectURL(el.src)
      resolve(null)
    }
    el.src = URL.createObjectURL(blob)
  })
}

export default function Recorder({ mode, onModeChange, onUseTake, disabled }) {
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [take, setTake] = useState(null) // { blob, url, durationSec, isVideo }
  const [error, setError] = useState(null)

  const recorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const startedAtRef = useRef(0)

  const isVideo = mode === 'video'

  // Clean up object URLs and any live stream on unmount.
  useEffect(() => {
    return () => {
      if (take?.url) URL.revokeObjectURL(take.url)
      stopStream()
      clearInterval(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function stopStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }

  function clearTake() {
    setTake((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url)
      return null
    })
  }

  async function startRecording() {
    setError(null)
    clearTake()
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo,
      })
      streamRef.current = stream
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const elapsedSec = (performance.now() - startedAtRef.current) / 1000
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'video/webm' })
        const url = URL.createObjectURL(blob)
        setTake({ blob, url, durationSec: elapsedSec, isVideo })
        stopStream()
      }
      recorderRef.current = recorder
      startedAtRef.current = performance.now()
      recorder.start()
      setRecording(true)
      setElapsed(0)
      timerRef.current = setInterval(() => {
        const sec = (performance.now() - startedAtRef.current) / 1000
        setElapsed(sec)
        if (sec >= MAX_SECONDS) stopRecording()
      }, 250)
    } catch (e) {
      setError(
        e?.name === 'NotAllowedError'
          ? 'Microphone/camera permission denied.'
          : 'Could not start recording. Check your devices.',
      )
      stopStream()
    }
  }

  function stopRecording() {
    clearInterval(timerRef.current)
    setRecording(false)
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file
    if (!file) return
    setError(null)
    clearTake()
    const fileIsVideo = file.type.startsWith('video/')
    const durationSec = await readDuration(file, fileIsVideo)
    const url = URL.createObjectURL(file)
    setTake({ blob: file, url, durationSec, isVideo: fileIsVideo })
  }

  const Media = take?.isVideo ? 'video' : 'audio'
  const overCap = elapsed >= MAX_SECONDS - 1

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Record your answer</h3>
        <div className="inline-flex rounded-md border border-slate-200 p-0.5 text-sm">
          {['audio', 'video'].map((m) => (
            <button
              key={m}
              type="button"
              disabled={recording || disabled}
              onClick={() => onModeChange(m)}
              className={`rounded px-3 py-1 capitalize disabled:opacity-50 ${
                mode === m ? 'bg-indigo-600 text-white' : 'text-slate-600'
              }`}
            >
              {m === 'audio' ? 'Audio' : 'Camera + mic'}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        {!recording ? (
          <button
            type="button"
            onClick={startRecording}
            disabled={disabled}
            className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-white" /> Record
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="inline-flex items-center gap-2 rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            <span className="h-2.5 w-2.5 bg-white" /> Stop
          </button>
        )}

        {recording && (
          <span className={`font-mono text-sm ${overCap ? 'text-red-600' : 'text-slate-600'}`}>
            ● {formatTime(elapsed)} / {formatTime(MAX_SECONDS)}
          </span>
        )}

        <span className="text-slate-300">|</span>

        <label className="cursor-pointer text-sm font-medium text-indigo-600 hover:text-indigo-500">
          Upload a file
          <input
            type="file"
            accept="audio/*,video/*"
            className="hidden"
            onChange={handleUpload}
            disabled={recording || disabled}
          />
        </label>
      </div>

      {isVideo && !take && (
        <p className="mt-2 text-xs text-slate-400">
          Tip: for takes longer than a minute, Audio keeps the file small (Whisper caps at 25 MB).
        </p>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {take && (
        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          <Media src={take.url} controls className={take.isVideo ? 'w-full rounded-md' : 'w-full'} />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onUseTake(take.blob, { durationSec: take.durationSec, isVideo: take.isVideo })}
              disabled={disabled}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              Use this take →
            </button>
            <button
              type="button"
              onClick={clearTake}
              disabled={disabled}
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              Discard
            </button>
            {take.durationSec != null && (
              <span className="text-xs text-slate-400">{formatTime(take.durationSec)}</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
