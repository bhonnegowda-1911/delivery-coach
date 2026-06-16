// Transcribe an audio OR video blob via OpenAI Whisper. Whisper extracts audio from
// video server-side, so the same endpoint satisfies "voice or video" with no client work.

const WHISPER_URL = 'https://api.openai.com/v1/audio/transcriptions'
const MAX_BYTES = 25 * 1024 * 1024 // Whisper request limit

export class TranscribeError extends Error {
  constructor(message, { code } = {}) {
    super(message)
    this.name = 'TranscribeError'
    this.code = code
  }
}

function filenameFor(blob) {
  const type = blob.type || ''
  if (type.includes('webm')) return 'answer.webm'
  if (type.includes('mp4')) return 'answer.mp4'
  if (type.includes('mpeg') || type.includes('mp3')) return 'answer.mp3'
  if (type.includes('wav')) return 'answer.wav'
  if (type.includes('ogg')) return 'answer.ogg'
  if (type.startsWith('video/')) return 'answer.mp4'
  return 'answer.webm'
}

/**
 * @param {Blob} blob
 * @param {{ apiKey: string, signal?: AbortSignal, fallbackDurationSec?: number }} opts
 * @returns {Promise<{ text: string, words?: Array, durationSec: number | null }>}
 */
export async function transcribe(blob, { apiKey, signal, fallbackDurationSec } = {}) {
  if (!apiKey) throw new TranscribeError('Missing OpenAI API key.', { code: 'no_key' })
  if (blob.size > MAX_BYTES) {
    throw new TranscribeError(
      'Recording is over the 25 MB transcription limit. Use Audio mode or a shorter take.',
      { code: 'too_large' },
    )
  }

  const form = new FormData()
  form.append('file', blob, filenameFor(blob))
  form.append('model', 'whisper-1')
  form.append('response_format', 'verbose_json')
  form.append('timestamp_granularities[]', 'word')

  let res
  try {
    res = await fetch(WHISPER_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal,
    })
  } catch (e) {
    if (e?.name === 'AbortError') throw e
    throw new TranscribeError('Network error reaching the transcription service.', {
      code: 'network',
    })
  }

  if (!res.ok) {
    if (res.status === 401) throw new TranscribeError('Invalid OpenAI API key.', { code: 'auth' })
    if (res.status === 413)
      throw new TranscribeError('Recording too large for transcription. Try a shorter take.', {
        code: 'too_large',
      })
    if (res.status === 429)
      throw new TranscribeError('Transcription rate limit hit. Wait and retry.', { code: 'rate' })
    throw new TranscribeError(`Transcription failed (${res.status}).`, { code: 'http' })
  }

  const data = await res.json()
  const durationSec =
    typeof data.duration === 'number' && data.duration > 0
      ? data.duration
      : fallbackDurationSec ?? null

  return {
    text: (data.text || '').trim(),
    words: data.words,
    durationSec,
  }
}
