import type { Transcript } from '../types'

// Transcribe an audio OR video blob via the backend gateway (`/api/llm/transcribe`), which
// holds the OpenAI key, stores the original recording in object storage, and returns both the
// transcript and the stored recording's asset id. Whisper extracts audio from video
// server-side, so the same path satisfies "voice or video".

const BASE = import.meta.env.VITE_API_BASE ?? ''
const MAX_BYTES = 25 * 1024 * 1024 // Whisper request limit

export type TranscribeErrorCode = 'no_key' | 'too_large' | 'network' | 'auth' | 'quota' | 'rate' | 'http'

export class TranscribeError extends Error {
  code?: TranscribeErrorCode
  constructor(message: string, { code }: { code?: TranscribeErrorCode } = {}) {
    super(message)
    this.name = 'TranscribeError'
    this.code = code
  }
}

function filenameFor(blob: Blob): string {
  const type = blob.type || ''
  if (type.includes('webm')) return 'answer.webm'
  if (type.includes('mp4')) return 'answer.mp4'
  if (type.includes('mpeg') || type.includes('mp3')) return 'answer.mp3'
  if (type.includes('wav')) return 'answer.wav'
  if (type.includes('ogg')) return 'answer.ogg'
  if (type.startsWith('video/')) return 'answer.mp4'
  return 'answer.webm'
}

export interface TranscribeOptions {
  signal?: AbortSignal
  fallbackDurationSec?: number | null
  /** Optionally link the stored recording to a session. */
  sessionId?: string
}

export interface TranscribeResult {
  transcript: Transcript
  /** Asset id of the stored original recording, or null if storage was unavailable. */
  assetId: string | null
}

export async function transcribe(
  blob: Blob,
  { signal, fallbackDurationSec, sessionId }: TranscribeOptions = {},
): Promise<TranscribeResult> {
  if (blob.size > MAX_BYTES) {
    throw new TranscribeError(
      'Recording is over the 25 MB transcription limit. Use Audio mode or a shorter take.',
      { code: 'too_large' },
    )
  }

  const form = new FormData()
  form.append('file', blob, filenameFor(blob))
  if (fallbackDurationSec != null) form.append('fallbackDurationSec', String(fallbackDurationSec))
  if (sessionId) form.append('sessionId', sessionId)

  let res: Response
  try {
    res = await fetch(`${BASE}/api/llm/transcribe`, { method: 'POST', body: form, signal })
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') throw e
    throw new TranscribeError('Network error reaching the transcription service.', { code: 'network' })
  }

  if (!res.ok) {
    let message = `Transcription failed (${res.status}).`
    try {
      const err = (await res.json()) as { error?: string }
      if (err?.error) message = err.error
    } catch {
      // non-JSON error body
    }
    const code: TranscribeErrorCode =
      res.status === 503 ? 'no_key' : res.status === 401 ? 'auth' : res.status === 429 ? 'rate' : 'http'
    throw new TranscribeError(message, { code })
  }

  const data = (await res.json()) as { transcript: Transcript; assetId: string | null }
  return { transcript: data.transcript, assetId: data.assetId ?? null }
}
