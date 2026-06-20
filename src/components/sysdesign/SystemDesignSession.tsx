import { useReducer, useRef } from 'react'
import { useApiKeys } from '../../context/ApiKeyContext'
import { getProblem } from '../../data/sysdesign/problems'
import { STAGES } from '../../data/sysdesign/stages'
import {
  runStageTurn,
  candidateDecisions,
  type Coverage,
  type PriorStage,
  type Turn,
} from '../../lib/sysdesign/conversation'
import { generateReport, type SysDesignReport as SysDesignReportData, type StageSessionInput } from '../../lib/sysdesign/report'
import ProblemPicker from './ProblemPicker'
import StageTracker, { type StageStatus } from './StageTracker'
import StageConversation from './StageConversation'
import SysDesignReport from './SysDesignReport'

// Orchestrates a full system-design interview: problem pick → stage-by-stage multi-turn
// conversation → final leveling report. One in-flight session; shaped to drop into history
// later (mirrors App.tsx's session reducer).

type Phase = 'pick' | 'interview' | 'reporting' | 'report' | 'error'
type Completion = 'done' | 'skipped'

interface StageSession {
  transcript: Turn[]
  coverage: Coverage | null
  aligned: boolean
}

interface State {
  phase: Phase
  problemId: string | null
  currentIndex: number
  sessions: Record<string, StageSession>
  completed: Record<string, Completion>
  thinking: boolean
  report: SysDesignReportData | null
  error: string | null
}

type Action =
  | { type: 'START'; problemId: string }
  | { type: 'CANDIDATE_TURN'; stageId: string; text: string }
  | { type: 'INTERVIEWER_TURN'; stageId: string; text: string; coverage: Coverage; aligned: boolean }
  | { type: 'TURN_ERROR'; error: string }
  | { type: 'ADVANCE'; how: Completion }
  | { type: 'REPORTING' }
  | { type: 'REPORT_DONE'; report: SysDesignReportData }
  | { type: 'REPORT_ERROR'; error: string }
  | { type: 'RESET' }

const emptySession = (): StageSession => ({ transcript: [], coverage: null, aligned: false })

const initialState: State = {
  phase: 'pick',
  problemId: null,
  currentIndex: 0,
  sessions: {},
  completed: {},
  thinking: false,
  report: null,
  error: null,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'START':
      return {
        ...initialState,
        phase: 'interview',
        problemId: action.problemId,
        sessions: { [STAGES[0].id]: emptySession() },
      }
    case 'CANDIDATE_TURN': {
      const s = state.sessions[action.stageId] || emptySession()
      return {
        ...state,
        thinking: true,
        error: null,
        sessions: {
          ...state.sessions,
          [action.stageId]: { ...s, transcript: [...s.transcript, { role: 'candidate', text: action.text }] },
        },
      }
    }
    case 'INTERVIEWER_TURN': {
      const s = state.sessions[action.stageId] || emptySession()
      return {
        ...state,
        thinking: false,
        sessions: {
          ...state.sessions,
          [action.stageId]: {
            ...s,
            transcript: [...s.transcript, { role: 'interviewer', text: action.text }],
            coverage: action.coverage,
            aligned: action.aligned,
          },
        },
      }
    }
    case 'TURN_ERROR':
      return { ...state, thinking: false, error: action.error }
    case 'ADVANCE': {
      const stage = STAGES[state.currentIndex]
      const nextIndex = state.currentIndex + 1
      const next = STAGES[nextIndex]
      return {
        ...state,
        currentIndex: nextIndex,
        completed: { ...state.completed, [stage.id]: action.how },
        sessions: { ...state.sessions, [next.id]: state.sessions[next.id] || emptySession() },
      }
    }
    case 'REPORTING':
      return { ...state, phase: 'reporting', error: null }
    case 'REPORT_DONE':
      return { ...state, phase: 'report', report: action.report }
    case 'REPORT_ERROR':
      return { ...state, phase: 'interview', error: action.error }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

// Interviewer turns carry both the brief reply and the follow-up questions in one message,
// so the transcript is complete both for display and for the next turn's LLM context.
function interviewerText(reply: string, followUps: string[]): string {
  if (!followUps?.length) return reply
  return `${reply}\n\n${followUps.map((q) => `• ${q}`).join('\n')}`
}

export default function SystemDesignSession({ onNeedKeys }: { onNeedKeys?: () => void }) {
  const { anthropicKey, hasAnthropic } = useApiKeys()
  const [state, dispatch] = useReducer(reducer, initialState)
  const abortRef = useRef<AbortController | null>(null)

  const problem = state.problemId ? getProblem(state.problemId) : null
  const stage = STAGES[state.currentIndex]
  const isLastStage = state.currentIndex >= STAGES.length - 1
  const session = stage ? state.sessions[stage.id] || emptySession() : emptySession()

  const statusById = STAGES.reduce<Record<string, StageStatus>>((acc, s) => {
    acc[s.id] = state.completed[s.id] || (s.id === stage?.id ? 'current' : 'upcoming')
    return acc
  }, {})

  async function handleSubmit(text: string) {
    if (!hasAnthropic || !problem) {
      onNeedKeys?.()
      return
    }
    const stageId = stage.id
    const prior = state.sessions[stageId]?.transcript || []
    // Give this stage memory of what the candidate decided in earlier stages.
    const priorStages: PriorStage[] = STAGES.slice(0, state.currentIndex)
      .map((s): PriorStage | null => {
        const sess = state.sessions[s.id]
        if (!sess && state.completed[s.id] !== 'skipped') return null
        return { label: s.label, decisions: candidateDecisions(sess?.transcript || []) }
      })
      .filter((p): p is PriorStage => p !== null)
    dispatch({ type: 'CANDIDATE_TURN', stageId, text })

    const controller = new AbortController()
    abortRef.current = controller
    try {
      const result = await runStageTurn({
        problem,
        stage,
        transcript: prior,
        priorStages,
        message: text,
        anthropicKey,
        signal: controller.signal,
      })
      dispatch({
        type: 'INTERVIEWER_TURN',
        stageId,
        text: interviewerText(result.reply, result.followUps),
        coverage: result.coverage,
        aligned: result.aligned,
      })
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return
      dispatch({ type: 'TURN_ERROR', error: (e as Error)?.message || 'The interviewer could not respond. Try again.' })
    } finally {
      abortRef.current = null
    }
  }

  async function finishAndReport(completed: Record<string, Completion>) {
    if (!problem) return
    dispatch({ type: 'REPORTING' })
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const stageSessions: StageSessionInput[] = STAGES.filter(
        (s) => state.sessions[s.id] || completed[s.id],
      ).map((s) => ({
        stageId: s.id,
        label: s.label,
        transcript: state.sessions[s.id]?.transcript || [],
        coverage: state.sessions[s.id]?.coverage || null,
        skipped: completed[s.id] === 'skipped',
      }))
      const report = await generateReport({ problem, stageSessions, anthropicKey, signal: controller.signal })
      dispatch({ type: 'REPORT_DONE', report })
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return
      dispatch({ type: 'REPORT_ERROR', error: (e as Error)?.message || 'Could not generate the report. Try again.' })
    } finally {
      abortRef.current = null
    }
  }

  function handleAdvance(how: Completion = 'done') {
    if (isLastStage) {
      finishAndReport({ ...state.completed, [stage.id]: how })
    } else {
      dispatch({ type: 'ADVANCE', how })
    }
  }

  function handleReset() {
    if (abortRef.current) abortRef.current.abort()
    dispatch({ type: 'RESET' })
  }

  if (state.phase === 'pick') {
    return <ProblemPicker onStart={(id) => dispatch({ type: 'START', problemId: id })} />
  }

  if (state.phase === 'report' && problem) {
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-slate-400">Interview report</div>
          <div className="text-base font-semibold text-slate-900">{problem.title}</div>
        </div>
        <SysDesignReport report={state.report} onRestart={handleReset} />
      </div>
    )
  }

  if (!problem) return null

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-400">Problem</div>
              <div className="text-sm font-semibold text-slate-900">{problem.title}</div>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="shrink-0 rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              End interview
            </button>
          </div>
          <p className="mt-2 text-sm text-slate-600">{problem.statement}</p>
        </div>

        {state.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{state.error}</div>
        )}

        {state.phase === 'reporting' ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
            <p className="mt-3 text-sm text-slate-600">Grading the full interview…</p>
          </div>
        ) : (
          <StageConversation
            stage={stage}
            transcript={session.transcript}
            aligned={session.aligned}
            thinking={state.thinking}
            onSubmit={handleSubmit}
            onAdvance={() => handleAdvance('done')}
            onSkip={() => handleAdvance('skipped')}
            isLastStage={isLastStage}
          />
        )}
      </div>

      <aside>
        <StageTracker currentStageId={stage.id} statusById={statusById} />
      </aside>
    </div>
  )
}
