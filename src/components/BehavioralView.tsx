import { useEffect, useReducer, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useApiKeys } from '../context/ApiKeyContext'
import { PROMPTS, DEFAULT_PROMPT } from '../data/prompts'
import { transcribe } from '../lib/transcribe'
import { runPipeline } from '../lib/pipeline'
import { buildFeedback } from '../lib/feedback'
import { saveSession, type SessionRecord } from '../lib/sessionStore'
import { assetUrl } from '../lib/assetStore'
import PromptCard from './PromptCard'
import Recorder, { type RecordMode, type TakeMeta } from './Recorder'
import FeedbackPanel from './FeedbackPanel'
import FollowUps from './FollowUps'
import FocusTargets from './FocusTargets'
import RealismChecklist from './RealismChecklist'
import type { Session } from '../types'

// Behavioral practice: record/upload an answer → transcribe → grade delivery. Completed
// sessions persist to the backend (the recording is stored server-side during transcription),
// and can be reopened read-only from History. One in-flight take at a time.

/** What we store for a behavioral session: the full result + a pointer to the stored recording. */
export interface BehavioralPayload {
  session: Session
  audioAssetId: string | null
}

type Status = 'idle' | 'transcribing' | 'analyzing' | 'done' | 'error'

interface State {
  status: Status
  session: Session | null
  replayUrl: string | null
  isVideo: boolean
  error: string | null
}

type Action =
  | { type: 'START'; replayUrl: string; isVideo: boolean }
  | { type: 'STAGE'; status: Status }
  | { type: 'DONE'; session: Session }
  | { type: 'ERROR'; error: string }
  | { type: 'RESET' }
  | { type: 'HYDRATE'; session: Session; replayUrl: string | null; isVideo: boolean }

const initialState: State = { status: 'idle', session: null, replayUrl: null, isVideo: false, error: null }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'START':
      if (state.replayUrl?.startsWith('blob:')) URL.revokeObjectURL(state.replayUrl)
      return { ...initialState, status: 'transcribing', replayUrl: action.replayUrl, isVideo: action.isVideo }
    case 'STAGE':
      return { ...state, status: action.status }
    case 'DONE':
      return { ...state, status: 'done', session: action.session }
    case 'ERROR':
      return { ...state, status: 'error', error: action.error }
    case 'RESET':
      if (state.replayUrl?.startsWith('blob:')) URL.revokeObjectURL(state.replayUrl)
      return initialState
    case 'HYDRATE':
      if (state.replayUrl?.startsWith('blob:')) URL.revokeObjectURL(state.replayUrl)
      return { status: 'done', session: action.session, replayUrl: action.replayUrl, isVideo: action.isVideo, error: null }
    default:
      return state
  }
}

const STAGE_LABEL: Record<string, string> = {
  transcribing: 'Transcribing your answer…',
  analyzing: 'Analyzing structure & delivery…',
}

export default function BehavioralView({ onNeedKeys }: { onNeedKeys?: () => void }) {
  const { hasAllKeys } = useApiKeys()
  const [state, dispatch] = useReducer(reducer, initialState)
  const [mode, setMode] = useState<RecordMode>('audio')
  const [promptId, setPromptId] = useState(DEFAULT_PROMPT.id)
  const [interviewMode, setInterviewMode] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const location = useLocation()

  // Reopen a past session passed from History via router state.
  const resume = (location.state as { session?: SessionRecord<BehavioralPayload> } | null)?.session
  useEffect(() => {
    if (!resume) return
    const { session, audioAssetId } = resume.payload
    setPromptId(session.promptId)
    dispatch({
      type: 'HYDRATE',
      session,
      replayUrl: audioAssetId ? assetUrl(audioAssetId) : null,
      isVideo: session.isVideo,
    })
    // Clear the navigation state so a later in-app reset doesn't re-hydrate.
    window.history.replaceState({}, '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resume?.id])

  const prompt = PROMPTS.find((p) => p.id === promptId) || DEFAULT_PROMPT
  const busy = state.status === 'transcribing' || state.status === 'analyzing'

  function handleSelectPrompt(id: string) {
    setPromptId(id)
    if (state.status !== 'idle') dispatch({ type: 'RESET' })
  }

  async function handleUseTake(blob: Blob, { durationSec, isVideo }: TakeMeta) {
    if (!hasAllKeys) {
      onNeedKeys?.()
      return
    }
    const replayUrl = URL.createObjectURL(blob)
    dispatch({ type: 'START', replayUrl, isVideo })

    const controller = new AbortController()
    abortRef.current = controller
    try {
      const { transcript, assetId } = await transcribe(blob, {
        signal: controller.signal,
        fallbackDurationSec: durationSec,
      })
      if (!transcript.text) throw new Error('No speech was detected in the recording. Try again.')

      const { filler, llm } = await runPipeline({
        question: prompt.text,
        transcript,
        signal: controller.signal,
        onProgress: (stage) => {
          if (stage === 'analyzing') dispatch({ type: 'STAGE', status: 'analyzing' })
        },
      })

      const feedback = buildFeedback({ llm, filler })
      const session: Session = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        promptId: prompt.id,
        transcript,
        filler: filler.raw,
        llm,
        feedback,
        isVideo,
      }
      dispatch({ type: 'DONE', session })
      void saveSession<BehavioralPayload>({
        id: session.id,
        kind: 'behavioral',
        status: 'completed',
        title: prompt.label,
        level: feedback.level?.level ?? null,
        payload: { session, audioAssetId: assetId },
      })
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return
      dispatch({ type: 'ERROR', error: (e as Error)?.message || 'Something went wrong.' })
    } finally {
      abortRef.current = null
    }
  }

  function handleReset() {
    if (abortRef.current) abortRef.current.abort()
    dispatch({ type: 'RESET' })
  }

  const ReplayMedia = state.isVideo ? 'video' : 'audio'

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <PromptCard prompt={prompt} onSelect={handleSelectPrompt} disabled={busy} interviewMode={interviewMode} />
        </div>

        <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={interviewMode}
            onChange={(e) => setInterviewMode(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          Interview mode
        </label>

        {state.status === 'idle' && interviewMode && <RealismChecklist />}

        {state.status === 'idle' && (
          <Recorder mode={mode} onModeChange={setMode} onUseTake={handleUseTake} disabled={busy} />
        )}

        {busy && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
            <p className="mt-3 text-sm text-slate-600">{STAGE_LABEL[state.status]}</p>
            <p className="mt-1 text-xs text-slate-400">
              This sends your audio to OpenAI and Anthropic (via the backend) and usually takes 10–20s.
            </p>
          </div>
        )}

        {state.status === 'error' && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-red-800">{state.error}</p>
            {state.replayUrl && (
              <div className="mt-3">
                <p className="text-xs text-red-600">Your recording is safe — replay below.</p>
                <ReplayMedia src={state.replayUrl} controls className={state.isVideo ? 'mt-2 w-full rounded-md' : 'mt-2 w-full'} />
              </div>
            )}
            <button
              type="button"
              onClick={handleReset}
              className="mt-4 rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
            >
              Try another take
            </button>
          </div>
        )}

        {state.status === 'done' && state.session && (
          <>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">Your recording</h3>
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
                >
                  New take
                </button>
              </div>
              {state.replayUrl && (
                <ReplayMedia src={state.replayUrl} controls className={state.isVideo ? 'mt-3 w-full rounded-md' : 'mt-3 w-full'} />
              )}
              {state.session.transcript?.text && (
                <details className="mt-3 text-sm">
                  <summary className="cursor-pointer text-slate-500">Transcript</summary>
                  <p className="mt-2 leading-relaxed text-slate-600">{state.session.transcript.text}</p>
                </details>
              )}
            </div>
            <FeedbackPanel feedback={state.session.feedback} />
            <FollowUps question={prompt.text} transcript={state.session.transcript} />
          </>
        )}
      </div>

      <aside className="space-y-5">
        <FocusTargets session={state.status === 'done' ? state.session : null} />
      </aside>
    </div>
  )
}
